"""
Quick-start local runner.
Run from the forensix/ root: python run_local.py
"""
import subprocess
import sys
import os
import threading

def run_backend():
    print("\n[ForensiX] Starting Backend on http://localhost:8000 ...\n")
    subprocess.run(
        [sys.executable, "-m", "uvicorn", "backend.main:app",
         "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.dirname(__file__)
    )

def run_frontend():
    print("\n[ForensiX] Starting Frontend on http://localhost:5173 ...\n")
    subprocess.run(
        ["npm", "run", "dev"],
        cwd=os.path.join(os.path.dirname(__file__), "frontend"),
        shell=True
    )

if __name__ == "__main__":
    backend_thread  = threading.Thread(target=run_backend,  daemon=True)
    frontend_thread = threading.Thread(target=run_frontend, daemon=True)

    backend_thread.start()
    frontend_thread.start()

    try:
        backend_thread.join()
        frontend_thread.join()
    except KeyboardInterrupt:
        print("\n[ForensiX] Shutting down…")
