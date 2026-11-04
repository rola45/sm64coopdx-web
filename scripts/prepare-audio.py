"""Prepare wasm32 audio control data from upstream metadata and a local ROM.

The upstream prepacked control banks contain 64-bit pointers. Sample payloads and
sequence offsets stay at their original addresses; only their headers are narrowed.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import zlib
from rom import validate

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'vendor/sm64coopdx'
STAGE = ROOT / 'private/audio32'
BUILD = ENGINE / 'build/us_pc'

def narrow_header(data):
    data = bytearray(data)
    revision, count = struct.unpack_from('<HH', data)
    entries = [struct.unpack_from('<QI', data, 8 + i * 16) for i in range(count)]
    header_size = min(offset for offset, size in entries if offset)
    if header_size < 8 + count * 16:
        raise ValueError('Unexpected upstream 64-bit audio header')
    data[:header_size] = bytes(header_size)
    struct.pack_into('<HH', data, 0, revision, count)
    for i, (offset, size) in enumerate(entries):
        if offset > 0xffffffff:
            raise ValueError('Audio offset exceeds wasm32')
        struct.pack_into('<II', data, 4 + i * 8, offset, size)
    return bytes(data)

def load_module(path):
    spec = importlib.util.spec_from_file_location('upstream_disassemble_sound', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def prepare(rom):
    info = validate(rom)
    STAGE.mkdir(parents=True, exist_ok=True)
    marker = STAGE / 'manifest.json'
    expected = {'schema': 1, 'romSha256': info['sha256'], 'engineCommit': json.loads((ROOT/'toolchain.lock.json').read_text())['engine']['commit']}
    outputs = [BUILD/'sound'/f'{name}.inc.c' for name in ['sound_data.ctl','sound_data.tbl','sequences.bin']]
    if marker.exists() and json.loads(marker.read_text()) == expected and all(p.exists() for p in outputs):
        print('wasm32 audio data already prepared')
        return
    assets = json.loads((ENGINE/'assets.json').read_text())
    module = load_module(ENGINE/'tools/disassemble_sound.py')
    def write_aifc(entry, filename):
        with open(filename, 'wb') as stream:
            module.write_aifc(entry, stream)
    module.write_aiff = write_aifc
    args = ['disassemble_sound.py', str(rom)]
    for kind in ['ctl','tbl']:
        size, locations = assets[f'@sound {kind} us']
        args += [str(locations['us'][0]), str(size)]
    args.append('--only-samples')
    for name, entry in assets.items():
        if name.startswith('sound/samples/') and 'us' in entry[-1]:
            position = entry[-1]['us']
            if position[0] == '@sound':
                output = BUILD / Path(name).with_suffix('.aifc')
                args.append(f'{output}:{position[-1]}')
    sys.argv = args
    module.main()
    # Encode upstream custom AIFFs with host tools, never the wasm compiler.
    custom = sorted((ENGINE/'sound/samples').rglob('*.aiff'))
    targets = [str(Path('build/us_pc') / f.relative_to(ENGINE).with_suffix('.aifc')) for f in custom]
    if targets:
        subprocess.run(['gmake','-f',str(ROOT/'engine/web.mk'),'-j4',*targets],cwd=ENGINE,check=True)
    import shutil
    extended = BUILD/'sound/samples/extended'
    extended.mkdir(parents=True, exist_ok=True)
    for bank in ['instruments','bowser_organ','course_start','piranha_music_box']:
        for sample in (BUILD/'sound/samples'/bank).glob('*.aifc'):
            shutil.copyfile(sample, extended/sample.name)
    (STAGE/'sound').mkdir(exist_ok=True)
    (STAGE/'inputs').mkdir(exist_ok=True)
    link = STAGE/'inputs/samples'
    if not link.exists(): link.symlink_to(BUILD/'sound/samples', target_is_directory=True)
    subprocess.run([sys.executable,str(ENGINE/'tools/assemble_sound.py'),
        'inputs/samples',str(ENGINE/'sound/sound_banks'),
        'sound_data.ctl','ctl_header','sound_data.tbl','tbl_header',
        '--endian','little','--bitwidth','32','-DVERSION_US'],cwd=STAGE,check=True)
    # Offsets inside each sample bank must remain identical. Top-level header
    # sizes differ, so each generated sample offset must differ by one constant.
    import re
    def macros(path):
        return {name:int(value,16) for name,value in re.findall(r'#define (SAMPLE_\w+) (0x[0-9a-f]+)',path.read_text())}
    old = macros(ENGINE/'sound/samples_offsets.h')
    new = macros(STAGE/'sound/samples_offsets.h')
    if old.keys() != new.keys() or len({new[k]-old[k] for k in old}) != 1:
        raise ValueError('Sample bank layout differs; refusing mismatched control data')
    ctl = zlib.decompress((STAGE/'sound/sound_data_compressed.ctl').read_bytes())
    for name, data in [
        ('sound_data.ctl', ctl),
        ('sound_data.tbl', narrow_header(zlib.decompress((ENGINE/'sound/sound_data_compressed.tbl').read_bytes()))),
        ('sequences.bin', narrow_header(zlib.decompress((ENGINE/'sound/sequences_compressed.bin').read_bytes()))),
    ]:
        output = BUILD/'sound'/name
        output.parent.mkdir(parents=True,exist_ok=True)
        output.write_bytes(data)
        output.with_name(output.name+'.inc.c').write_text(',\n'.join(','.join(f'0x{x:02x}' for x in data[i:i+24]) for i in range(0,len(data),24))+',\n')
    marker.write_text(json.dumps(expected,indent=2)+'\n')
    print('Prepared wasm32 audio controls; original sample/sequence offsets preserved.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('rom',type=Path)
    args = parser.parse_args()
    prepare(args.rom)
