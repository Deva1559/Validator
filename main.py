import os
import sys

# Ensure backend directory is in the Python system path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import application and exports from backend.main
from backend.main import *

if __name__ == "__main__":
    import uvicorn
    # Render and hosting providers supply the listening port via the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting ModelValidator AI Web Server on {host}:{port}...")
    uvicorn.run("main:app", host=host, port=port, reload=False)
