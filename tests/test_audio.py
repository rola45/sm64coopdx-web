import importlib.util
from pathlib import Path
import struct
import sys
import unittest
scripts = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(scripts))
spec = importlib.util.spec_from_file_location('prepare_audio', scripts / 'prepare-audio.py')
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)

class AudioHeaderTests(unittest.TestCase):
    def test_narrows_pointer_fields_without_moving_sample_bytes(self):
        data = bytearray(128)
        struct.pack_into('<HH', data, 0, 1, 2)
        struct.pack_into('<QI', data, 8, 64, 16)
        struct.pack_into('<QI', data, 24, 80, 48)
        data[64:] = bytes(range(64))
        result = audio.narrow_header(data)
        self.assertEqual(len(result), len(data))
        self.assertEqual(struct.unpack_from('<II', result, 4), (64, 16))
        self.assertEqual(struct.unpack_from('<II', result, 12), (80, 48))
        self.assertEqual(result[64:], data[64:])

    def test_rejects_header_overlapping_entries(self):
        data = bytearray(64)
        struct.pack_into('<HH', data, 0, 1, 2)
        struct.pack_into('<QI', data, 8, 16, 8)
        struct.pack_into('<QI', data, 24, 32, 8)
        with self.assertRaises(ValueError):
            audio.narrow_header(data)
