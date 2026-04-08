from fastapi import FastAPI
import subprocess
import os

app = FastAPI()

@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/run/churn")
def run_churn():
    result = subprocess.run(
        ["python3", "jobs/run_churn_inference.py"],
        capture_output=True, text=True,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}

@app.post("/run/readiness")
def run_readiness():
    result = subprocess.run(
        ["python3", "jobs/run_readiness_inference.py"],
        capture_output=True, text=True,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}

@app.post("/run/social")
def run_social():
    result = subprocess.run(
        ["python3", "jobs/run_social_inference.py"],
        capture_output=True, text=True,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
