"""Apply tracked web patches, preserving unrelated upstream edits."""
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[1]
engine = root / 'vendor/sm64coopdx'
for patch in sorted((root / 'engine/patches').glob('*.patch')):
    base = ['git', '-C', str(engine), 'apply']
    done = subprocess.run(base + ['--reverse', '--check', str(patch)], capture_output=True)
    if done.returncode == 0:
        continue
    subprocess.run(base + ['--check', str(patch)], check=True)
    subprocess.run(base + [str(patch)], check=True)
