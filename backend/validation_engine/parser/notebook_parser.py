"""
Notebook and Cell Parser for Jupyter Notebooks (.ipynb).
Handles schema normalization, IPython magics cleanup, output extraction, and exact cell referencing.
"""

from typing import Dict, List, Any, Optional
import json
import re

class ParsedOutput:
    def __init__(self, output_type: str, text: str, data: Optional[Dict[str, Any]] = None):
        self.output_type = output_type
        self.text = text
        self.data = data or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "output_type": self.output_type,
            "text": self.text,
            "data": self.data
        }

class ParsedCell:
    def __init__(
        self,
        cell_index: int,
        cell_id: str,
        cell_type: str,
        source: str,
        clean_code: str,
        outputs: List[ParsedOutput],
        execution_count: Optional[int] = None,
        magics: Optional[List[str]] = None
    ):
        self.cell_index = cell_index
        self.cell_id = cell_id
        self.cell_type = cell_type # 'code', 'markdown', 'raw'
        self.source = source
        self.clean_code = clean_code # Python code with magics commented out for valid AST parsing
        self.outputs = outputs
        self.execution_count = execution_count
        self.magics = magics or []

    @property
    def output_text(self) -> str:
        return "\n".join(o.text for o in self.outputs if o.text.strip())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cell_index": self.cell_index,
            "cell_id": self.cell_id,
            "cell_type": self.cell_type,
            "source": self.source,
            "clean_code": self.clean_code,
            "output_text": self.output_text,
            "execution_count": self.execution_count,
            "magics": self.magics
        }

class ParsedNotebook:
    def __init__(self, cells: List[ParsedCell], metadata: Dict[str, Any]):
        self.cells = cells
        self.metadata = metadata

    @property
    def code_cells(self) -> List[ParsedCell]:
        return [c for c in self.cells if c.cell_type == "code"]

    @property
    def markdown_cells(self) -> List[ParsedCell]:
        return [c for c in self.cells if c.cell_type == "markdown"]

    def get_cell(self, index: int) -> Optional[ParsedCell]:
        for c in self.cells:
            if c.cell_index == index:
                return c
        return None

def clean_ipython_magics(source: str) -> tuple[str, List[str]]:
    """
    Comments out IPython magics (e.g. %matplotlib inline, !pip install)
    so the code is 100% valid Python for AST parsing, while capturing detected magics.
    """
    clean_lines = []
    magics = []
    for line in source.split("\n"):
        stripped = line.strip()
        if stripped.startswith(("%", "!")):
            magics.append(stripped)
            clean_lines.append(f"# [IPython Magic]: {line}")
        elif stripped.startswith(("get_ipython()",)):
            magics.append(stripped)
            clean_lines.append(f"# [IPython Call]: {line}")
        else:
            clean_lines.append(line)
    return "\n".join(clean_lines), magics

def parse_cell_outputs(raw_outputs: List[Dict[str, Any]]) -> List[ParsedOutput]:
    parsed = []
    for out in raw_outputs:
        out_type = out.get("output_type", "unknown")
        text = ""
        
        if "text" in out:
            t = out["text"]
            text = "".join(t) if isinstance(t, list) else str(t)
        elif "data" in out:
            data_dict = out["data"]
            if "text/plain" in data_dict:
                tp = data_dict["text/plain"]
                text = "".join(tp) if isinstance(tp, list) else str(tp)
        elif "ename" in out and "evalue" in out:
            text = f"Error: {out.get('ename')}: {out.get('evalue')}"
            
        parsed.append(ParsedOutput(
            output_type=out_type,
            text=text,
            data=out.get("data", {})
        ))
    return parsed

def parse_notebook(content: bytes | str) -> ParsedNotebook:
    """Parses raw notebook JSON or bytes into a structured ParsedNotebook."""
    if isinstance(content, bytes):
        raw_str = content.decode("utf-8", errors="replace")
    else:
        raw_str = content

    nb_dict = json.loads(raw_str)
    raw_cells = nb_dict.get("cells", [])
    metadata = nb_dict.get("metadata", {})

    parsed_cells: List[ParsedCell] = []
    for idx, cell in enumerate(raw_cells):
        c_type = cell.get("cell_type", "code")
        c_id = cell.get("id", f"cell_{idx}")
        raw_source = cell.get("source", "")
        source_str = "".join(raw_source) if isinstance(raw_source, list) else str(raw_source)
        
        clean_code, magics = clean_ipython_magics(source_str) if c_type == "code" else (source_str, [])
        outputs = parse_cell_outputs(cell.get("outputs", [])) if c_type == "code" else []
        exec_count = cell.get("execution_count")
        
        parsed_cells.append(ParsedCell(
            cell_index=idx,
            cell_id=c_id,
            cell_type=c_type,
            source=source_str,
            clean_code=clean_code,
            outputs=outputs,
            execution_count=exec_count,
            magics=magics
        ))

    return ParsedNotebook(cells=parsed_cells, metadata=metadata)
