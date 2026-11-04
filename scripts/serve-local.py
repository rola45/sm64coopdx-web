"""Serve a private build with a validated ROM available on loopback."""
import argparse
import hashlib
import io
import subprocess
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from rom import EXPECTED_MD5, validate

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--rom', required=True, type=Path)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--rom-url', help='HTTPS download URL for the local proxy')
    args = parser.parse_args()
    if args.rom_url and not args.rom_url.startswith('https://'):
        parser.error('--rom-url requires HTTPS')
    rom = args.rom.resolve()
    try:
        validate(rom)
    except (OSError, ValueError) as error:
        parser.error(str(error))

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *request, **kwargs):
            super().__init__(*request, directory=ROOT / 'build/web', **kwargs)

        def send_head(self):
            if self.headers.get('Host') not in {f'127.0.0.1:{args.port}', f'localhost:{args.port}'}:
                self.send_error(403)
                return None
            if self.path == '/download-rom.z64' and args.rom_url:
                return self.download_rom()
            if self.path != '/local-rom.z64':
                return super().send_head()
            if self.headers.get('Sec-Fetch-Site') not in {None, 'same-origin'}:
                self.send_error(403)
                return None
            try:
                source = rom.open('rb')
            except OSError:
                self.send_error(503, 'Local game file unavailable')
                return None
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', str(os.fstat(source.fileno()).st_size))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
            self.end_headers()
            return source

        def download_rom(self):
            if self.headers.get('Sec-Fetch-Site') not in {None, 'same-origin'}:
                self.send_error(403)
                return None
            size = 8 * 1024 * 1024
            data = b''
            if self.command == 'GET':
                try:
                    data = subprocess.run(
                        ['curl', '--fail', '--silent', '--location', '--proto', '=https',
                         '--max-time', '20', '--max-filesize', str(size), '--', args.rom_url],
                        capture_output=True, check=True, timeout=22,
                    ).stdout
                except (OSError, subprocess.SubprocessError):
                    self.send_error(502, 'ROM download failed')
                    return None
                if len(data) != size or hashlib.md5(data).hexdigest() != EXPECTED_MD5:
                    self.send_error(502, 'Unexpected ROM')
                    return None
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Content-Length', str(size))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
            self.end_headers()
            return io.BytesIO(data)

    with ThreadingHTTPServer(('127.0.0.1', args.port), Handler) as server:
        print(f'CoopDX privado en http://127.0.0.1:{args.port}/', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    main()
