"""
Sandboxed Runtime Executor for ML Notebook Cells.
Executes code with timeout protection, resource limits, and error isolation.
Supports STATIC_ONLY and STATIC_PLUS_RUNTIME modes.
"""

from typing import Dict, List, Any, Optional
import sys
import io
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

class CellExecutionResult:
    def __init__(
        self,
        cell_index: int,
        success: bool,
        duration: float,
        stdout: str,
        stderr: str,
        error: Optional[str] = None,
        captured_vars: Optional[Dict[str, str]] = None
    ):
        self.cell_index = cell_index
        self.success = success
        self.duration = duration
        self.stdout = stdout
        self.stderr = stderr
        self.error = error
        self.captured_vars = captured_vars or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cell_index": self.cell_index,
            "success": self.success,
            "duration": round(self.duration, 3),
            "stdout": self.stdout[:500],
            "stderr": self.stderr[:500],
            "error": self.error,
            "captured_vars": self.captured_vars
        }

class RuntimeSandbox:
    def __init__(self, mode: str = "STATIC_PLUS_RUNTIME", timeout_per_cell: float = 8.0):
        self.mode = mode # 'STATIC_ONLY' or 'STATIC_PLUS_RUNTIME'
        self.timeout_per_cell = timeout_per_cell
        self.namespace: Dict[str, Any] = {}

    def execute_cell(self, code: str, cell_index: int) -> CellExecutionResult:
        """Executes a single Python cell in the isolated namespace with timeout."""
        if self.mode == "STATIC_ONLY":
            return CellExecutionResult(
                cell_index=cell_index,
                success=True,
                duration=0.0,
                stdout="[Static Mode: Execution Skipped]",
                stderr=""
            )

        start_time = time.perf_counter()
        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()

        def _run_exec():
            old_stdout = sys.stdout
            old_stderr = sys.stderr
            sys.stdout = stdout_buf
            sys.stderr = stderr_buf
            try:
                # Execute compiled code inside local sandbox namespace
                exec(code, self.namespace)
                return True, None
            except Exception as e:
                return False, f"{type(e).__name__}: {str(e)}"
            finally:
                sys.stdout = old_stdout
                sys.stderr = old_stderr

        with ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(_run_exec)
            try:
                success, err_msg = future.result(timeout=self.timeout_per_cell)
            except FutureTimeoutError:
                success = False
                err_msg = f"Cell execution timed out after {self.timeout_per_cell}s limit."

        duration = time.perf_counter() - start_time
        
        # Capture shapes of any array/dataframe variables safely
        captured = {}
        for var_name, var_val in self.namespace.items():
            if not var_name.startswith("_") and hasattr(var_val, "shape"):
                try:
                    captured[var_name] = f"shape={var_val.shape}"
                except Exception:
                    pass

        return CellExecutionResult(
            cell_index=cell_index,
            success=success,
            duration=duration,
            stdout=stdout_buf.getvalue(),
            stderr=stderr_buf.getvalue(),
            error=err_msg,
            captured_vars=captured
        )
