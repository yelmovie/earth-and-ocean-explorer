#!/usr/bin/env python3
"""개념 영상 5편에 자막을 입히는 얇은 래퍼 (2026-11-18).

공용 도구 `_shared/caption-motion-20261118/burn.py`를 그대로 쓰되, 큐마다 "bottom"을 따로 줄 수 있게 한다.
(영상 속 이름표·도표가 장면마다 다른 높이에 있어서, 겹치지 않게 큐별로 상자 높이를 고른다.)

  ~/.local/share/uv/tools/earshot/bin/python burn_cues.py make            # src/concept-data.js → chapter-N.json
  ~/.local/share/uv/tools/earshot/bin/python burn_cues.py chapter-N.json [--preview 초 출력.png]
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SHARED = HERE.parents[2] / '_shared' / 'caption-motion-20261118'
sys.path.insert(0, str(SHARED))
import burn  # noqa: E402

SCRATCH = '../../../_scratch/caption-motion-20261118/concepts/10'
# 1080 기준 자막 상자 아래 여백. 숫자가 크면 상자가 위로 올라간다(904 ≈ 화면 위쪽).
BOTTOM = {
    1: [18, 18, 18, 18],      # '내 표본' 이름표(78~85%) 아래
    2: [904, 904, 904, 40],   # 2장면 '같은 양·같은 세기·같은 시간'(83~90%)과 비커를 피해 위쪽, 결론 카드가 위에 뜨는 4장면만 아래
    3: [22, 22, 22, 262],     # 4장면은 '구멍 난 바위'와 '모래사장' 이름표 사이
    4: [166, 166, 166, 166],  # 왼쪽 아래 '관측 모형 · 실제 시각과 달라요'(85~90%) 위
    5: [30, 30, 30, 30],      # '구멍과 발자국'·짱뚱어 아래
}


def mark(text, terms):
    """앱의 emphasize()와 같은 규칙: 가장 앞에 나오는 낱말(같은 자리면 긴 것)을 [ ]로 감싼다."""
    out, rest = '', text
    while rest:
        hits = sorted(((rest.find(t), -len(t), t) for t in terms if rest.find(t) >= 0))
        if not hits:
            return out + rest
        i, _, t = hits[0]
        out += rest[:i] + f'[{t}]'
        rest = rest[i + len(t):]
    return out


def make():
    import subprocess
    repo = HERE.parents[1]
    data = json.loads(subprocess.run(['node', '-e', "import('./src/concept-data.js').then(m=>console.log(JSON.stringify({c:m.conceptCues,t:m.conceptTerms,s:m.CONCEPT_SECONDS})))"],
                                     cwd=repo, capture_output=True, text=True, check=True).stdout)
    for n in range(1, 6):
        cues = data['c'][str(n)]
        film = {
            'src': f'{SCRATCH}/src/chapter-{n}.mp4',
            'out': f'{SCRATCH}/out/chapter-{n}.mp4',
            'out_webm': f'{SCRATCH}/out/chapter-{n}.webm',
            'theme': {'box': '#0d2a22', 'accent': '#ffd35c', 'hot': '#ffd35c'},
            'sweep': False,  # 모아 음성은 영상 밖 mp3이고, 대사가 끝날 때까지 영상이 멈춰 기다린다
            # 한 큐는 다음 큐 시작 -0.1초까지. 마지막 큐는 영상 끝(15.02초)보다 조금 길게 둬서 마지막 프레임(영상이 끝나 멈춘 화면)에도 자막이 또렷이 남게 한다.
            'cues': [{'s': s, 'e': round((cues[i + 1][0] - 0.1) if i + 1 < len(cues) else data['s'] + 0.3, 2),
                      'bottom': BOTTOM[n][i], 'text': mark(t, data['t'][str(n)])} for i, (s, t) in enumerate(cues)],
        }
        (HERE / f'chapter-{n}.json').write_text(json.dumps(film, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(HERE / f'chapter-{n}.json')


_orig = burn.build_ass


def build_ass(film):
    """큐를 bottom 값별로 묶어 공용 build_ass로 만들고 [Events]만 합친다."""
    groups = {}
    for c in film['cues']:
        groups.setdefault(c.get('bottom', film.get('bottom', 64)), []).append(c)
    head, events = None, []
    for b, cs in groups.items():
        h, ev = _orig({**film, 'bottom': b, 'cues': cs}).split('[Events]\n', 1)
        lines = ev.splitlines()
        head = head or h + '[Events]\n' + lines[0] + '\n'
        events += [l for l in lines[1:] if l.strip()]
    return head + '\n'.join(events) + '\n'


burn.build_ass = build_ass

if __name__ == '__main__':
    a = sys.argv[1:]
    if a == ['make']:
        make()
    elif len(a) >= 4 and a[1] == '--preview':
        print(burn.render(a[0], (float(a[2]), a[3])))
    else:
        print(burn.render(a[0]))
