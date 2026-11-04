"""Validate a user-supplied ROM locally; never copy or upload it."""
import argparse
import hashlib
import json
from pathlib import Path

EXPECTED_MD5 = '20b854b239203baf6c961b850a4a51a2'  # upstream rom_checker.cpp

def validate(path):
    path = Path(path)
    if path.stat().st_size != 8 * 1024 * 1024:
        raise ValueError('Expected an unmodified 8 MiB USA ROM.')
    data = path.read_bytes()
    if data[:4] != bytes.fromhex('80371240'):
        raise ValueError('Expected big-endian .z64 input; byte-swapped formats are unsupported.')
    if hashlib.md5(data).hexdigest() != EXPECTED_MD5:
        raise ValueError('ROM hash does not match the upstream USA input.')
    return {'compatible': True, 'region': 'us', 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('rom', type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(validate(args.rom), indent=2))
    except (OSError, ValueError) as error:
        parser.exit(1, f'{error}\n')
