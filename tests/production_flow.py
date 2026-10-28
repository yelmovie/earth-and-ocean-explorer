import os,json,threading
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
os.environ['TEMP']=r'D:\DevTemp';os.environ['TMP']=r'D:\DevTemp'
root=Path(__file__).resolve().parents[1]
prefix='/course/earthsea/'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root/'dist'),**kwargs)
 def do_GET(self):
  if not self.path.startswith(prefix):self.send_error(404);return
  self.path='/'+self.path[len(prefix):];super().do_GET()
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)+prefix
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 page=browser.new_page(viewport={'width':1280,'height':800})
 errors=[];http_errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.on('response',lambda r:http_errors.append([r.status,r.url]) if r.status>=400 else None)
 page.goto(base,wait_until='networkidle')
 urls=page.evaluate(r"""async()=>{const urls=new Set();for(const el of document.querySelectorAll('*'))for(const pseudo of [null,'::before','::after']){for(const m of getComputedStyle(el,pseudo).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g))urls.add(m[1]);}await Promise.all([...urls].map(async url=>{let i=new Image();i.src=url;await i.decode()}));return [...urls]}""")
 assert any('characters.webp' in u for u in urls) and all(u.startswith(base) for u in urls)
 page.locator('[data-action="settings"]').click()
 for name in ['bgmEnabled','sfxEnabled']:page.locator('[data-action="toggle-setting"][data-value="'+name+'"]').click()
 page.locator('[data-action="close-settings"]').first.click()
 sound=page.locator('[data-action="sound"]');assert sound.get_attribute('aria-label')=='소리 켜기';assert sound.get_attribute('aria-pressed')=='true'
 sound.click();page.locator('[data-action="settings"]').click()
 for name in ['bgmEnabled','sfxEnabled']:assert page.locator('[data-action="toggle-setting"][data-value="'+name+'"]').get_attribute('aria-pressed')=='true'
 page.locator('[data-action="replay-story"]').click()
 page.locator('.story-dialog[open]').wait_for()
 story=page.locator('.story-dialog .character').first.evaluate(r"""async el=>{let bg=getComputedStyle(el).backgroundImage;let u=bg.match(/url\(["']?([^"')]+)/)[1];let i=new Image();i.src=u;await i.decode();return i.naturalWidth}""")
 assert story==1672
 page.screenshot(path=str(root/'artifacts/production-story.png'))
 page.locator('[data-action="close-story"]').first.click()
 page.locator('[data-action="settings"]').click()
 page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click()
 page.locator('[data-action="toggle-unlock"]').click();page.locator('[data-action="close-settings"]').first.click()
 page.locator('[data-action="go"][data-value="hub"]').first.click();page.wait_for_url('**/#hub')
 page.locator('[data-action="go"][data-value="report"]').click();page.wait_for_url('**/#report')
 page.locator('[data-action="go"][data-value="link"]').click();page.wait_for_url('**/#link')
 page.locator('[data-action="case"][data-value="4"]').first.click()
 page.locator('[data-action="go"][data-value="ending"]').click();page.wait_for_url('**/#ending')
 page.locator('[data-action="go"][data-value="certificate"]').click();page.wait_for_url('**/#certificate')
 assert page.locator('[data-action="print"]').is_disabled()
 routes=['home','hub']+['s'+str(n)+step for n in range(1,6) for step in ['a','b','c','d']]+['report','link','ending','certificate']
 for route in routes:
  page.goto(base+'?verify='+route+'#'+route,wait_until='networkidle');page.locator('h1').first.wait_for();assert 'route-'+route in page.locator('#app').get_attribute('class').split()
 # Public media and fonts must also resolve under the static subfolder.
 for n in range(1,6):
  page.goto(base+'?concept='+str(n)+'#s'+str(n)+'a',wait_until='networkidle')
  page.locator('[data-action="concept"]').click()
  page.wait_for_function("document.querySelector('video')?.videoWidth===1280")
  assert page.locator('video').evaluate('(v)=>v.currentSrc').startswith(base)
  page.locator('.concept-dialog .modal-footer [data-concept-close]').click()
  page.locator('video').wait_for(state='detached')
 page.goto(base+'#certificate',wait_until='networkidle')
 assert page.locator('[data-action="print"]').is_disabled()
 assert not errors and not http_errors,[errors,http_errors]
 result={'staticSubfolder':'PASS','routes':26,'backgroundsAndCharactersDecoded':'PASS','individualSoundOffHeader':'PASS','quickUnmute':'PASS','storyPortraits':'PASS','adminFinalPreviewFromMapUI':'PASS','adminCertificateRemainsLocked':'PASS','consoleErrors':errors,'httpErrors':http_errors}
 (root/'artifacts/production-flow-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(result,ensure_ascii=False),flush=True)
 browser.close()
server.shutdown()
