import importlib.util
from pathlib import Path
import tempfile
import unittest
spec = importlib.util.spec_from_file_location('rom', Path(__file__).resolve().parents[1] / 'scripts' / 'rom.py')
rom = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rom)

class RomTests(unittest.TestCase):
    def test_rejects_wrong_size_before_hashing(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'bad.z64'
            path.write_bytes(b'\x80\x37\x12\x40')
            with self.assertRaisesRegex(ValueError, '8 MiB'):
                rom.validate(path)

    def test_rejects_byte_swapped_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'bad.z64'
            path.write_bytes(b'\x37\x80\x40\x12' + bytes(8 * 1024 * 1024 - 4))
            with self.assertRaisesRegex(ValueError, 'big-endian'):
                rom.validate(path)

    def test_rejects_modified_rom(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'bad.z64'
            path.write_bytes(b'\x80\x37\x12\x40' + bytes(8 * 1024 * 1024 - 4))
            with self.assertRaisesRegex(ValueError, 'hash'):
                rom.validate(path)
