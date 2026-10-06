"""
Data-Flow Graph Analyzer for ML Pipelines.
Tracks variable propagation, aliases, transformations, and relationships between
Dataset -> Split -> Training Features -> Model -> Prediction Features -> Evaluation.
Detects data leakage and training-data evaluation.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from ..static_analysis.ast_analyzer import CellASTAnalysis, ASTAssignment, ASTCall

class DataFlowNode:
    def __init__(self, name: str, cell_defined: int, line_no: int, value_expr: str):
        self.name = name
        self.cell_defined = cell_defined
        self.line_no = line_no
        self.value_expr = value_expr
        self.dependencies: Set[str] = set() # variables used to produce this node
        self.aliases: Set[str] = set()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "cell_defined": self.cell_defined,
            "line_no": self.line_no,
            "value_expr": self.value_expr,
            "dependencies": list(self.dependencies),
            "aliases": list(self.aliases)
        }

class MLDataFlowPipeline:
    def __init__(self):
        self.raw_dataset_vars: Set[str] = set()
        self.train_feature_vars: Set[str] = set()
        self.test_feature_vars: Set[str] = set()
        self.train_label_vars: Set[str] = set()
        self.test_label_vars: Set[str] = set()
        
        self.model_vars: Set[str] = set()
        self.prediction_vars: Set[str] = set()
        
        # Chronological audit records
        self.split_cell_index: Optional[int] = None
        self.train_cell_index: Optional[int] = None
        self.eval_cell_index: Optional[int] = None
        
        self.training_input_var: Optional[str] = None
        self.prediction_input_var: Optional[str] = None
        
        # Leakage flags
        self.has_leakage: bool = False
        self.leakage_reasons: List[str] = []
        self.evaluates_on_training_data: bool = False

class DataFlowGraph:
    def __init__(self):
        self.nodes: Dict[str, DataFlowNode] = {}
        self.pipeline = MLDataFlowPipeline()

    def add_assignment(self, target: str, cell_index: int, line_no: int, value_expr: str, used_vars: List[str]):
        node = DataFlowNode(name=target, cell_defined=cell_index, line_no=line_no, value_expr=value_expr)
        node.dependencies.update(used_vars)
        
        # Alias detection (e.g. X_tr = X_train)
        if len(used_vars) == 1 and used_vars[0] in self.nodes:
            node.aliases.add(used_vars[0])
            self.nodes[used_vars[0]].aliases.add(target)
            
        self.nodes[target] = node

    def resolve_ancestors(self, var_name: str, max_depth: int = 5) -> Set[str]:
        """Traverses the dependency graph backwards to find all ancestor variables."""
        ancestors = set()
        queue = [var_name]
        depth = 0
        while queue and depth < max_depth:
            curr = queue.pop(0)
            if curr in self.nodes:
                deps = self.nodes[curr].dependencies
                for d in deps:
                    if d not in ancestors:
                        ancestors.add(d)
                        queue.append(d)
            depth += 1
        return ancestors

def build_dataflow_graph(cells_ast: List[CellASTAnalysis]) -> Tuple[DataFlowGraph, MLDataFlowPipeline]:
    """Analyzes AST across all cells sequentially to build the complete dataflow graph."""
    graph = DataFlowGraph()
    pipe = graph.pipeline
    preprocessing_fit_calls = []

    for cell in cells_ast:
        c_idx = cell.cell_index

        # Process assignments
        for a in cell.assignments:
            # Detect multi-target split (e.g. X_train, X_test, y_train, y_test = train_test_split(...))
            if a.call and a.call.func_name in ["train_test_split", "random_split"]:
                pipe.split_cell_index = c_idx
                if len(a.targets) >= 4:
                    pipe.train_feature_vars.add(a.targets[0])
                    pipe.test_feature_vars.add(a.targets[1])
                    pipe.train_label_vars.add(a.targets[2])
                    pipe.test_label_vars.add(a.targets[3])
                elif len(a.targets) == 2:
                    pipe.train_feature_vars.add(a.targets[0])
                    pipe.test_feature_vars.add(a.targets[1])

            # Detect manual slicing splits (e.g. X_train = X[:split])
            if "[" in a.value_str and ":" in a.value_str:
                for t in a.targets:
                    t_lower = t.lower()
                    if any(w in t_lower for w in ["train", "tr", "fit"]):
                        pipe.train_feature_vars.add(t)
                        if pipe.split_cell_index is None:
                            pipe.split_cell_index = c_idx
                    elif any(w in t_lower for w in ["test", "val", "te", "holdout"]):
                        pipe.test_feature_vars.add(t)
                        if pipe.split_cell_index is None:
                            pipe.split_cell_index = c_idx

            # Track variable definition in graph
            used_in_expr = []
            if a.call:
                used_in_expr.extend(a.call.args)
                used_in_expr.extend(list(a.call.kwargs.values()))
            for t in a.targets:
                graph.add_assignment(
                    target=t,
                    cell_index=c_idx,
                    line_no=a.line_no,
                    value_expr=a.value_str,
                    used_vars=used_in_expr
                )

        # Process calls
        for call in cell.calls:
            caller = call.caller or ""
            fname = call.func_name

            # Detect Preprocessing fit calls
            if fname in ["fit", "fit_transform"] and any(s.lower() in caller.lower() for s in ["scaler", "encoder", "imputer", "pipe"]):
                preprocessing_fit_calls.append((c_idx, caller, fname))

            # Detect Model Training .fit()
            if fname == "fit" and not any(s.lower() in caller.lower() for s in ["scaler", "encoder", "imputer"]):
                pipe.model_vars.add(caller)
                pipe.train_cell_index = c_idx
                if call.args:
                    pipe.training_input_var = call.args[0]
                    # Check if training on full unpartitioned dataset
                    train_arg_lower = call.args[0].lower()
                    if train_arg_lower in ["x", "df", "data", "dataset"] and not pipe.train_feature_vars:
                        pipe.has_leakage = True
                        pipe.leakage_reasons.append(
                            f"Model fitted on full dataset '{call.args[0]}' in Cell #{c_idx} without prior train-test split partition."
                        )

            # Detect Model Prediction .predict()
            if fname in ["predict", "predict_proba"]:
                pipe.eval_cell_index = c_idx
                if call.args:
                    pred_input = call.args[0]
                    pipe.prediction_input_var = pred_input
                    pred_input_ancestors = graph.resolve_ancestors(pred_input) | {pred_input}

                    # Check if predict is evaluated on training features
                    is_trained_feature = any(
                        t in pred_input_ancestors for t in pipe.train_feature_vars
                    ) or "train" in pred_input.lower()

                    is_test_feature = any(
                        t in pred_input_ancestors for t in pipe.test_feature_vars
                    ) or any(w in pred_input.lower() for w in ["test", "val", "holdout"])

                    if is_trained_feature and not is_test_feature:
                        pipe.evaluates_on_training_data = True

    # Second pass: Check preprocessing leakage against resolved split_cell_index
    for c_idx, caller, fname in preprocessing_fit_calls:
        if pipe.split_cell_index is not None and c_idx < pipe.split_cell_index:
            pipe.has_leakage = True
            pipe.leakage_reasons.append(
                f"Global Preprocessing Leakage: '{caller}.{fname}()' executed in Cell #{c_idx} BEFORE train_test_split in Cell #{pipe.split_cell_index}."
            )

    return graph, pipe
