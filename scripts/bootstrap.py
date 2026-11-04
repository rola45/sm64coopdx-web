"""Fetch locked sources and install an SDK scoped to this repository."""
import hashlib
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
LOCK = json.loads((ROOT / 'toolchain.lock.json').read_text())

def run(*args, cwd=ROOT):
    subprocess.run([str(a) for a in args], cwd=cwd, check=True)

def checkout(info, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        run('git', 'clone', info['url'], path)
    current = subprocess.check_output(['git', '-C', str(path), 'rev-parse', 'HEAD'], text=True).strip()
    if current != info['commit']:
        dirty = subprocess.check_output(['git', '-C', str(path), 'status', '--porcelain'], text=True)
        if dirty:
            raise SystemExit(f'Refusing to replace changes in {path}')
        run('git', 'fetch', 'origin', info['commit'], cwd=path)
        run('git', 'checkout', '--detach', info['commit'], cwd=path)

if __name__ == '__main__':
    checkout(LOCK['engine'], ROOT / 'vendor/sm64coopdx')
    sdk = ROOT / '.tools/emsdk'
    checkout(LOCK['emsdk'], sdk)
    run(sdk / 'emsdk', 'install', LOCK['emsdk']['version'])
    run(sdk / 'emsdk', 'activate', LOCK['emsdk']['version'])
    lua = ROOT / '.tools' / f"lua-{LOCK['lua']['version']}"
    if not lua.exists():
        with tempfile.TemporaryDirectory() as tmp:
            download = Path(tmp) / 'lua.tar.gz'
            run('curl', '--fail', '--location', '--retry', '2', '--max-time', '120', LOCK['lua']['url'], '-o', download)
            archive = download.read_bytes()
        if hashlib.sha256(archive).hexdigest() != LOCK['lua']['sha256']:
            raise SystemExit('Lua archive checksum mismatch')
        import io
        with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
            tar.extractall(ROOT / '.tools', filter='data')
    print('Locked sources and project-local SDK ready. No shell profile modified.')
