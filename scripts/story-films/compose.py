#!/usr/bin/env python3
"""인트로·파이널 이야기 영상 합성 (2026-11-21).

실행(파이썬은 earshot 설치본만 빌림, PIL 필요):
  ~/.local/share/uv/tools/earshot/bin/python scripts/story-films/compose.py scripts/story-films/intro.json
  ~/.local/share/uv/tools/earshot/bin/python scripts/story-films/compose.py scripts/story-films/finale.json

순서: Flow 클립 3편을 이은 원본(소리 버림) → 마지막 장면을 느리게 다가가며 붙잡기(교차 0.4초)
     → 끝 카드 모션(인트로 = 제목 로고, 파이널 = 인증 도장·꽃가루) → 목소리 트랙(앱과 같은 ElevenLabs 목소리)
     → 공용 burn.py로 영상 안 자막 → 웹용 인코딩 + 포스터 + 앱용 자막 큐(src/story-video-cues.js).
배경 음악은 영상에 넣지 않는다. 앱이 주제곡(인트로)·마무리 곡(파이널)을 배경 음악 스위치대로 틀고,
대사 구간에서 낮춘다. 그래서 영상 소리 트랙에는 목소리만 있고, 목소리 스위치를 끄면 영상을 음소거한다.
"""
import json, math, random, subprocess, sys, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SHARED = ROOT.parent / '_shared' / 'caption-motion-20261118'
FONT = SHARED / 'fonts' / 'Jua-Regular.ttf'
W, H, FPS = 1280, 720, 24

def run(cmd):
    subprocess.run(cmd, check=True)

def dur(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                                capture_output=True, text=True, check=True).stdout.strip())

def ease_out(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3

def back_out(x, s=1.7):
    x = max(0.0, min(1.0, x)); x -= 1; return x * x * ((s + 1) * x + s) + 1

def star(draw, cx, cy, r, color):
    pts = []
    for i in range(8):
        a = math.pi / 4 * i - math.pi / 2; rr = r if i % 2 == 0 else r * 0.28
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    draw.polygon(pts, fill=color)

def text_layer(text, size, fill, stroke, stroke_w):
    f = ImageFont.truetype(str(FONT), size)
    box = f.getbbox(text, stroke_width=stroke_w)
    im = Image.new('RGBA', (box[2] - box[0] + 8, box[3] - box[1] + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - box[0], 4 - box[1]), text, font=f, fill=fill, stroke_width=stroke_w, stroke_fill=stroke)
    return im

def paste_center(frame, im, cx, cy, scale=1.0, alpha=1.0, angle=0.0):
    if alpha <= 0.01 or scale <= 0.01: return
    if scale != 1.0: im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    if angle: im = im.rotate(angle, resample=Image.BICUBIC, expand=True)
    if alpha < 1.0:
        a = im.split()[3].point(lambda v: int(v * alpha)); im = im.copy(); im.putalpha(a)
    frame.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

def shade(alpha, top=True):
    """그림 위 글자가 떠 보이지 않게 위쪽(또는 가운데)을 바다색으로 살짝 어둡게."""
    g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = g.load()
    for y in range(H):
        k = (1 - y / (H * 0.85)) if top else (1 - abs(y - H * 0.45) / (H * 0.55))
        a = int(max(0.0, min(1.0, k)) * alpha * 255)
        for x in range(0, W, 1): px[x, y] = (8, 38, 48, a)
    return g

def endcard_title(n, film):
    logo = Image.open(ROOT / 'public/assets/logo-title.webp').convert('RGBA').crop((55, 12, 947, 503))
    logo = logo.resize((620, int(620 * logo.height / logo.width)), Image.LANCZOS)
    glow = logo.split()[3].filter(ImageFilter.GaussianBlur(14))
    halo = Image.new('RGBA', logo.size, (255, 244, 200, 0)); halo.putalpha(glow.point(lambda v: int(v * .55)))
    line = text_layer(film['endLine'], 40, (255, 255, 255, 255), (12, 52, 64, 255), 5)
    base_shade = shade(0.55, top=True)
    rnd = random.Random(7); sparks = [(rnd.uniform(260, 1020), rnd.uniform(70, 420), rnd.uniform(7, 15), rnd.uniform(0, 6.28)) for _ in range(14)]
    frames = []
    for i in range(n):
        t = i / FPS; fr = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sh = ease_out(t / 0.6)
        if sh > 0:
            s2 = base_shade.copy(); s2.putalpha(base_shade.split()[3].point(lambda v: int(v * sh))); fr.alpha_composite(s2)
        p = (t - 0.25) / 0.55
        if p > 0:
            sc = 0.82 + 0.18 * back_out(p); al = ease_out(p * 1.6)
            paste_center(fr, halo, W / 2, 250, sc * 1.02, al * (0.6 + 0.4 * math.sin(t * 2.2) ** 2))
            paste_center(fr, logo, W / 2, 250, sc, al)
        d = ImageDraw.Draw(fr)
        for (x, y, r, ph) in sparks:
            q = (t - 0.6 - ph / 6.28 * 1.4)
            if q > 0:
                a = int(255 * max(0, math.sin(q * 3.1)) ** 2 * min(1, q * 2))
                star(d, x, y, r * (0.6 + 0.4 * math.sin(q * 3.1)), (255, 246, 205, a))
        p2 = (t - 1.0) / 0.5
        if p2 > 0: paste_center(fr, line, W / 2, 468 - 14 * (1 - ease_out(p2)), 1.0, ease_out(p2))
        frames.append(fr)
    return frames

def endcard_complete(n, film):
    seal = Image.open(ROOT / 'public/assets/illustrations/seal.webp').convert('RGBA')
    seal = seal.resize((int(seal.width * 230 / seal.height), 230), Image.LANCZOS)
    title = text_layer(film['endLine'], 64, (255, 236, 170, 255), (12, 52, 64, 255), 7)
    sub = text_layer(film['endSub'], 34, (255, 255, 255, 255), (12, 52, 64, 255), 5)
    base_shade = shade(0.5, top=False)
    rnd = random.Random(11); cols = [(255, 214, 92), (184, 222, 203), (143, 208, 238), (248, 224, 188), (255, 255, 255), (255, 154, 92)]
    bits = []
    for _ in range(90):
        a = rnd.uniform(0, 6.283); v = rnd.uniform(260, 620)
        bits.append((math.cos(a) * v, math.sin(a) * v - 180, rnd.choice(cols), rnd.uniform(4, 9), rnd.random() < 0.35, rnd.uniform(0, 6.28)))
    frames = []; cx, cy = W / 2, 262; t0 = 0.4
    for i in range(n):
        t = i / FPS; fr = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sh = ease_out(t / 0.6)
        if sh > 0:
            s2 = base_shade.copy(); s2.putalpha(base_shade.split()[3].point(lambda v: int(v * sh))); fr.alpha_composite(s2)
        p = (t - t0) / 0.32
        if p > 0:  # 도장 쾅: 크게 → 살짝 눌림 → 제자리
            sc = 1.9 - 0.95 * ease_out(min(1, p)) if p < 1 else 0.95 + 0.05 * ease_out((t - t0 - 0.32) / 0.25)
            paste_center(fr, seal, cx, cy, sc, ease_out(p * 2), -9 * (1 - ease_out(min(1, p))))
        q = t - t0 - 0.3
        if q > 0:  # 꽃가루: 도장에서 퍼져 나가며 떨어짐
            d = ImageDraw.Draw(fr)
            for (vx, vy, c, r, is_star, ph) in bits:
                x = cx + vx * q; y = cy + vy * q + 330 * q * q; a = int(255 * max(0, 1 - q / 2.6))
                if a <= 0 or y > H + 20: continue
                if is_star: star(d, x, y, r * 1.7, c + (a,))
                else:
                    w = r * (0.5 + 0.5 * abs(math.sin(q * 7 + ph)))
                    d.ellipse((x - w, y - r * .6, x + w, y + r * .6), fill=c + (a,))
        p2 = (t - 0.95) / 0.45
        if p2 > 0: paste_center(fr, title, W / 2, 470 - 16 * (1 - ease_out(p2)), 0.9 + 0.1 * back_out(min(1, p2)), ease_out(p2))
        p3 = (t - 1.5) / 0.45
        if p3 > 0: paste_center(fr, sub, W / 2, 545 - 10 * (1 - ease_out(p3)), 1.0, ease_out(p3))
        frames.append(fr)
    return frames

def main(film_path):
    film_path = Path(film_path).resolve(); film = json.loads(film_path.read_text()); here = film_path.parent
    work = ROOT / '.tmp' / 'films-finish-20261121' / film['name']; shutil.rmtree(work, ignore_errors=True); work.mkdir(parents=True)
    clip = (here / film['clip']).resolve(); D = dur(clip); xf = film.get('xfade', 0.4); hold = film['hold']
    total = round(D - xf + hold, 3)
    # 1) 마지막 장면 붙잡기(느린 다가가기)
    last = work / 'last.png'
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-sseof', '-0.06', '-i', str(clip), '-frames:v', '1', '-update', '1', str(last)])
    # 2) 끝 카드 모션 프레임
    n = int(math.ceil((hold + 0.2) * FPS)); cards = work / 'card'; cards.mkdir()
    for i, fr in enumerate((endcard_title if film['endcard'] == 'title' else endcard_complete)(n, film)):
        fr.save(cards / f'{i:04d}.png')
    t0 = D - xf
    zoom = film.get('zoom', 0.06)
    fc = (f"[0:v]fps={FPS},scale={W}:{H},settb=AVTB,format=yuv420p[a];"
          f"[1:v]scale={W*2}:{H*2},zoompan=z='1+{zoom}*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS},"
          f"trim=duration={hold + xf},setpts=PTS-STARTPTS,settb=AVTB,format=yuv420p[b];"
          f"[a][b]xfade=transition=fade:duration={xf}:offset={t0}[v];"
          f"[2:v]setpts=PTS-STARTPTS+{t0}/TB[c];[v][c]overlay=eof_action=pass:format=auto,format=yuv420p[o]")
    base = work / 'base.mp4'
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(clip), '-loop', '1', '-framerate', str(FPS), '-t', str(hold + xf + 0.5), '-i', str(last),
         '-framerate', str(FPS), '-i', str(cards / '%04d.png'), '-filter_complex', fc, '-map', '[o]', '-t', str(total),
         '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', str(base)])
    # 3) 목소리 트랙(대사만)
    ins, parts = [], []
    for k, v in enumerate(film['voices']):
        ins += ['-i', str((here / v['file']).resolve())]
        ms = int(round(v['at'] * 1000)); parts.append(f'[{k}:a]aresample=48000,adelay={ms}|{ms}[v{k}]')
    mix = ';'.join(parts) + ';' + ''.join(f'[v{k}]' for k in range(len(film['voices']))) + \
          f"amix=inputs={len(film['voices'])}:normalize=0:dropout_transition=0,apad,atrim=0:{total},alimiter=limit=0.89[m]"
    voice = work / 'voice.m4a'
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *ins, '-filter_complex', mix, '-map', '[m]', '-ac', '1', '-c:a', 'aac', '-b:a', '96k', str(voice)])
    # 4) 자막 큐(목소리 길이에서 계산) → burn.py
    cues = []
    vs = film['voices']
    for k, v in enumerate(vs):
        d = dur((here / v['file']).resolve()); s = max(0, v['at'] - 0.15); e = v['at'] + d + 0.2
        if k + 1 < len(vs): e = min(e, vs[k + 1]['at'] - 0.17)
        c = {'s': round(s, 2), 'e': round(e, 2), 'speech': [round(v['at'] + 0.05, 2), round(v['at'] + d - 0.25, 2)], 'text': v['text']}
        if v.get('who'): c['who'] = v['who']
        cues.append(c)
    burn = {'src': str(base), 'out': str(work / 'captioned.mp4'), 'theme': film['theme'], 'speakers': film['speakers'],
            'bottom': film.get('bottom', 64), 'cues': cues}
    bj = work / 'burn.json'; bj.write_text(json.dumps(burn, ensure_ascii=False, indent=1))
    run([sys.executable, str(SHARED / 'burn.py'), str(bj)])
    # 5) 웹용 인코딩(목소리 트랙 붙임) + 포스터
    out = (here / film['out']).resolve(); out.parent.mkdir(parents=True, exist_ok=True)
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(work / 'captioned.mp4'), '-i', str(voice), '-map', '0:v', '-map', '1:a',
         '-c:v', 'libx264', '-crf', str(film.get('crf', 26)), '-preset', 'slower', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest', str(out)])
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', str(film.get('posterAt', 0.3)), '-i', str(base), '-frames:v', '1', '-q:v', '5',
         str(out.with_suffix('.jpg'))])
    shutil.copy(bj, here / f"{film['name']}.burn.json"); shutil.copy(bj.with_suffix('.ass'), here / f"{film['name']}.ass")
    # 6) 앱용 자막 큐(읽기 도구·대체 화면·대사 구간 배경음 낮추기)
    cue_js = ROOT / 'src' / 'story-video-cues.js'
    allc = json.loads(cue_js.read_text().split('=', 1)[1].rstrip().rstrip(';')) if cue_js.exists() else {}
    allc[film['name']] = [{'s': c['s'], 'e': c['e'], 'speech': c['speech'], 'who': c.get('who', ''), 'text': c['text'].replace('[', '').replace(']', '')} for c in cues]
    cue_js.write_text('// scripts/story-films/compose.py가 만든다. 손으로 고치지 말 것.\nexport const STORY_CUES = ' +
                      json.dumps(allc, ensure_ascii=False, indent=1) + ';\n')
    print(json.dumps({'out': str(out), 'duration': dur(out), 'bytes': out.stat().st_size, 'cues': len(cues)}, ensure_ascii=False))

if __name__ == '__main__':
    main(sys.argv[1])
