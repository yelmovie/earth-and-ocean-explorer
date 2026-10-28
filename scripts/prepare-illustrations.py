"""Package imagegen originals without repainting or replacing their alpha."""
from pathlib import Path
from PIL import Image
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:/Users/user/.codex/generated_images/01a1810f-eb12-7012-bb03-26982ef0446c')
ORIGINALS = ROOT / 'assets/generated/20261028'
OUT = ROOT / 'public/assets/illustrations'
FILES = {
    'buri': 'exec-79659af6-eb18-4947-930b-ef6f8cdc301d.png',
    'jjang': 'exec-16984607-12d0-4ea9-a73e-baee90ada639.png',
    'crab': 'exec-14eb69fe-54c3-43c3-8047-d216439cd1a4.png',
    'skipper': 'exec-338d5d51-3c24-4b61-bfa8-3beb3520c311.png',
    'reed': 'exec-cc91754b-c107-439c-9527-083600b4563e.png',
}
ORIGINALS.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
manifest = {}
for name, filename in FILES.items():
    original = ORIGINALS / f'{name}.png'
    if not original.exists():
        shutil.copy2(SOURCE / filename, original)
    im = Image.open(original).convert('RGBA')
    alpha = im.getchannel('A')
    assert alpha.getextrema()[0] == 0, f'{name}: missing transparency'
    bounds = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
    assert bounds, f'{name}: empty subject'
    im = im.crop(bounds)
    im.thumbnail((640, 720), Image.Resampling.LANCZOS)
    padded = Image.new('RGBA', (im.width + 16, im.height + 16))
    padded.paste(im, (8, 8))
    destination = OUT / f'{name}.webp'
    padded.save(destination, 'WEBP', quality=90, method=4)
    if name == 'buri':
        small = padded.copy()
        small.thumbnail((160, 192), Image.Resampling.LANCZOS)
        small.save(OUT / 'buri-map.webp', 'WEBP', quality=92, method=4)
    manifest[name] = {
        'file': f'illustrations/{name}.webp', 'width': padded.width,
        'height': padded.height, 'bytes': destination.stat().st_size,
        'original': str(original.relative_to(ROOT)).replace('\\', '/'),
        'sourceCrop': bounds, 'sha256': hashlib.sha256(original.read_bytes()).hexdigest(),
        'alphaRange': Image.open(destination).getchannel('A').getextrema(),
    }
    print(name, padded.size, destination.stat().st_size, flush=True)
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
