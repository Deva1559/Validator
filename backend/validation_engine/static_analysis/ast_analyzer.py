"""
Python AST Analyzer for ML Notebook Static Inspection.
Extracts calls, assignments, variable definitions, imports, loops, and control flow
without relying on keyword searches or specific variable names.
"""

import ast
from typing import Dict, List, Any, Optional, Set, Tuple

class ASTCall:
    def __init__(
        self,
        func_name: str,
        caller: Optional[str],
        full_call_str: str,
        args: List[str],
        kwargs: Dict[str, str],
        line_no: int,
        cell_index: int
    ):
        self.func_name = func_name # e.g. 'fit', 'predict', 'train_test_split', 'accuracy_score'
        self.caller = caller       # e.g. 'model', 'clf', 'classifier', 'scaler', 'np'
        self.full_call_str = full_call_str # e.g. 'model.fit', 'train_test_split'
        self.args = args           # e.g. ['X_train', 'y_train']
        self.kwargs = kwargs       # e.g. {'test_size': '0.2', 'average': "'macro'"}
        self.line_no = line_no
        self.cell_index = cell_index

    def to_dict(self) -> Dict[str, Any]:
        return {
            "func_name": self.func_name,
            "caller": self.caller,
            "full_call_str": self.full_call_str,
            "args": self.args,
            "kwargs": self.kwargs,
            "line_no": self.line_no,
            "cell_index": self.cell_index
        }

class ASTAssignment:
    def __init__(
        self,
        targets: List[str],
        value_node_type: str,
        value_str: str,
        call: Optional[ASTCall],
        line_no: int,
        cell_index: int,
        is_hardcoded_number: bool = False,
        constant_value: Any = None
    ):
        self.targets = targets # e.g. ['X_train', 'X_test', 'y_train', 'y_test'] or ['accuracy']
        self.value_node_type = value_node_type # 'Call', 'Constant', 'BinOp', 'Subscript'
        self.value_str = value_str
        self.call = call
        self.line_no = line_no
        self.cell_index = cell_index
        self.is_hardcoded_number = is_hardcoded_number
        self.constant_value = constant_value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "targets": self.targets,
            "value_node_type": self.value_node_type,
            "value_str": self.value_str,
            "call": self.call.to_dict() if self.call else None,
            "line_no": self.line_no,
            "cell_index": self.cell_index,
            "is_hardcoded_number": self.is_hardcoded_number,
            "constant_value": self.constant_value
        }

class ASTLoop:
    def __init__(self, target_var: str, iter_expr: str, body_calls: List[str], line_no: int, cell_index: int):
        self.target_var = target_var
        self.iter_expr = iter_expr # e.g. 'range(epochs)'
        self.body_calls = body_calls # e.g. ['backward', 'step', 'zero_grad']
        self.line_no = line_no
        self.cell_index = cell_index

class CellASTAnalysis:
    def __init__(self, cell_index: int, code: str):
        self.cell_index = cell_index
        self.code = code
        self.is_syntax_valid = True
        self.syntax_error = None
        self.imports: Dict[str, str] = {} # alias -> real_name
        self.from_imports: Dict[str, str] = {} # function_name -> module
        self.calls: List[ASTCall] = []
        self.assignments: List[ASTAssignment] = []
        self.loops: List[ASTLoop] = []
        self.defined_functions: List[str] = []
        self.defined_classes: List[str] = []

    def get_calls_by_name(self, func_name: str) -> List[ASTCall]:
        return [c for c in self.calls if c.func_name == func_name]

def extract_node_repr(node: ast.AST) -> str:
    """Helper to convert an AST node to human-readable code representation."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        val = extract_node_repr(node.value)
        return f"{val}.{node.attr}" if val else node.attr
    elif isinstance(node, ast.Constant):
        return repr(node.value)
    elif isinstance(node, ast.Call):
        func_str = extract_node_repr(node.func)
        return f"{func_str}(...)"
    elif isinstance(node, ast.Subscript):
        val = extract_node_repr(node.value)
        sl = extract_node_repr(node.slice)
        return f"{val}[{sl}]"
    elif isinstance(node, ast.Slice):
        lower = extract_node_repr(node.lower) if node.lower else ""
        upper = extract_node_repr(node.upper) if node.upper else ""
        return f"{lower}:{upper}"
    elif isinstance(node, ast.Tuple):
        elts = [extract_node_repr(e) for e in node.elts]
        return f"({', '.join(elts)})"
    elif isinstance(node, ast.BinOp):
        left = extract_node_repr(node.left)
        right = extract_node_repr(node.right)
        return f"{left} op {right}"
    return type(node).__name__

class ASTVisitor(ast.NodeVisitor):
    def __init__(self, cell_index: int):
        self.cell_index = cell_index
        self.calls: List[ASTCall] = []
        self.assignments: List[ASTAssignment] = []
        self.imports: Dict[str, str] = {}
        self.from_imports: Dict[str, str] = {}
        self.loops: List[ASTLoop] = []
        self.defined_functions: List[str] = []
        self.defined_classes: List[str] = []

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            name = alias.name
            asname = alias.asname or name
            self.imports[asname] = name
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        mod = node.module or ""
        for alias in node.names:
            name = alias.name
            asname = alias.asname or name
            self.from_imports[asname] = f"{mod}.{name}" if mod else name
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.defined_functions.append(node.name)
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        self.defined_classes.append(node.name)
        self.generic_visit(node)

    def _parse_call_node(self, node: ast.Call) -> ASTCall:
        caller = None
        func_name = ""
        full_call_str = ""

        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            full_call_str = func_name
        elif isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
            caller = extract_node_repr(node.func.value)
            full_call_str = f"{caller}.{func_name}"

        args = [extract_node_repr(a) for a in node.args]
        kwargs = {}
        for kw in node.keywords:
            if kw.arg:
                kwargs[kw.arg] = extract_node_repr(kw.value)

        return ASTCall(
            func_name=func_name,
            caller=caller,
            full_call_str=full_call_str,
            args=args,
            kwargs=kwargs,
            line_no=node.lineno,
            cell_index=self.cell_index
        )

    def visit_Call(self, node: ast.Call):
        call_obj = self._parse_call_node(node)
        self.calls.append(call_obj)
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        targets = []
        for t in node.targets:
            if isinstance(t, ast.Name):
                targets.append(t.id)
            elif isinstance(t, (ast.Tuple, ast.List)):
                for elt in t.elts:
                    targets.append(extract_node_repr(elt))
            else:
                targets.append(extract_node_repr(t))

        val_type = type(node.value).__name__
        val_str = extract_node_repr(node.value)
        call_obj = None
        if isinstance(node.value, ast.Call):
            call_obj = self._parse_call_node(node.value)

        is_const_num = False
        const_val = None
        if isinstance(node.value, ast.Constant) and isinstance(node.value.value, (int, float)):
            is_const_num = True
            const_val = node.value.value

        self.assignments.append(ASTAssignment(
            targets=targets,
            value_node_type=val_type,
            value_str=val_str,
            call=call_obj,
            line_no=node.lineno,
            cell_index=self.cell_index,
            is_hardcoded_number=is_const_num,
            constant_value=const_val
        ))
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        target_str = extract_node_repr(node.target)
        iter_str = extract_node_repr(node.iter)
        body_calls = []
        for stmt in node.body:
            for subnode in ast.walk(stmt):
                if isinstance(subnode, ast.Call):
                    if isinstance(subnode.func, ast.Attribute):
                        body_calls.append(subnode.func.attr)
                    elif isinstance(subnode.func, ast.Name):
                        body_calls.append(subnode.func.id)

        self.loops.append(ASTLoop(
            target_var=target_str,
            iter_expr=iter_str,
            body_calls=body_calls,
            line_no=node.lineno,
            cell_index=self.cell_index
        ))
        self.generic_visit(node)


def analyze_cell_ast(code: str, cell_index: int) -> CellASTAnalysis:
    """Parses a single cell into AST and extracts static structural elements."""
    result = CellASTAnalysis(cell_index=cell_index, code=code)
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        result.is_syntax_valid = False
        result.syntax_error = str(e)
        return result

    visitor = ASTVisitor(cell_index=cell_index)
    visitor.visit(tree)

    result.calls = visitor.calls
    result.assignments = visitor.assignments
    result.imports = visitor.imports
    result.from_imports = visitor.from_imports
    result.loops = visitor.loops
    result.defined_functions = visitor.defined_functions
    result.defined_classes = visitor.defined_classes
    return result
