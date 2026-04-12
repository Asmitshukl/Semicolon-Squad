import sys, subprocess, pathlib

result = subprocess.run(
    [sys.executable, '-m', 'nyayasetu_ml.training.train_indicbert', '--epochs', '1', '--batch_size', '8'],
    cwd=str(pathlib.Path(__file__).parent),
    capture_output=True,
    text=True,
    encoding='utf-8',
    errors='replace',
)
output = (result.stdout + result.stderr)
print(output[-4000:] if len(output) > 4000 else output)
print('Exit code:', result.returncode)
