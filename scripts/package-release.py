from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
dest=root/'artifacts'/'blue-planet-hq-mvp-20261022.zip'
with ZipFile(dest,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted((root/'dist').rglob('*')):
  if p.is_file() and p.suffix.lower()!='.png':z.write(p,p.relative_to(root/'dist'))
 for relative in ['docs/PRD.md','docs/TRD.md','docs/DESIGN-SYSTEM.md','docs/IMAGE-GENERATION.md','docs/reviews/FINAL-CHECK-20261022.md']:
  p=root/relative
  if p.exists():z.write(p,relative)
 z.writestr('START-HERE.txt','푸른행성 조사본부 MVP 검토용 패키지\nindex.html과 assets를 같은 위치에 두고 정적 웹 서버에서 열어 주세요.\n파일을 더블클릭하는 file:// 실행은 지원하지 않아요.\n예: 압축을 푼 폴더에서 python -m http.server 8080 실행 후 http://localhost:8080 접속.\n원본 PNG는 작업 프로젝트에 보존하며 이 전달용 패키지에서는 제외했어요.\n상업 납품 전 사용권과 실기기 검토는 docs/reviews/FINAL-CHECK-20261022.md를 확인해 주세요.\n')
with ZipFile(dest) as z:
 assert z.testzip() is None
 assert 'index.html' in z.namelist() and 'assets/characters.webp' in z.namelist()
print(str(dest),dest.stat().st_size)
