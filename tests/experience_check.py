"""Real browser checks for touch manipulation, concept media and all screens."""
import os,json,math
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GAME_URL','http://127.0.0.1:5173')
OUT=ROOT/'artifacts/experience';OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 page=browser.new_page(viewport={'width':1280,'height':800},has_touch=True)
 page.set_default_timeout(12000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
 page.goto(BASE,wait_until='networkidle')
 page.evaluate("async()=>{const {freshState}=await import('/src/state.js');const s=freshState();s.settings.unlockAll=true;s.settings.muted=true;localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s))}")
 page.reload(wait_until='networkidle')
 def route(r):
  page.goto(BASE+'/#'+r,wait_until='domcontentloaded')
  page.wait_for_function('(r)=>document.querySelector("#app").classList.contains("route-"+r)',arg=r)
  if r=='s1a':page.wait_for_function("document.querySelector('#globe-mode')?.textContent!=='준비 중'")
 def capture(name):
  page.evaluate(r"async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));const urls=[];for(const el of [document.querySelector('#app'),...document.querySelectorAll('.coast-view,.mudflat-view')]){if(!el)continue;for(const m of getComputedStyle(el).backgroundImage.matchAll(/url\([\"']?([^\"')]+)[\"']?\)/g))urls.push(m[1]);}await Promise.all(urls.map(u=>{const i=new Image();i.src=u;return i.decode().catch(()=>{});}));}")
  page.screenshot(path=str(OUT/(name+'.png')))
 # Each concept actually decodes, plays, pauses and releases its source on close.
 media=[]
 for n in range(1,6):
  route('s'+str(n)+'a');page.locator('[data-action="concept"]').click()
  page.wait_for_function("document.querySelector('video').currentTime>.1")
  video=page.locator('video');media.append(video.evaluate('(v)=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,current:v.currentTime})'))
  page.locator('[data-concept="play"]').click();assert video.evaluate('v=>v.paused')
  if n==4:capture('concept-tide')
  page.locator('.concept-dialog .modal-footer [data-concept-close]').click()
  page.locator('video').wait_for(state='detached')
 # Escape/back dismiss without committing a stale continuation; a failed
 # decoder still leaves a readable concept picture and a working exit.
 route('s1a');page.locator('[data-action="concept"]').click();page.keyboard.press('Escape')
 page.locator('video').wait_for(state='detached');assert page.url.endswith('#s1a')
 page.locator('[data-action="concept"]').click();page.goto(BASE+'/#hub',wait_until='domcontentloaded')
 page.locator('video').wait_for(state='detached');assert page.url.endswith('#hub')
 # Use a cold context: previously decoded media can be reused without a
 # network request, even after ordinary request interception is installed.
 failure_context=browser.new_context(viewport={'width':1280,'height':800})
 failure_page=failure_context.new_page();failure_page.set_default_timeout(12000)
 snapshot=page.evaluate("localStorage.getItem('blue-planet-hq:v2')")
 failure_page.add_init_script("localStorage.setItem('blue-planet-hq:v2',"+json.dumps(snapshot)+")")
 blocked_media=[]
 def block_media(request):
  blocked_media.append(request.request.url);request.abort()
 failure_page.route('**/assets/concepts/*.webm',block_media)
 failure_page.route('**/assets/concepts/*.mp4',block_media)
 failure_page.goto(BASE+'/#s2a',wait_until='networkidle')
 failure_page.locator('[data-action="concept"]').click();failure_page.locator('.concept-poster').wait_for(state='visible')
 assert blocked_media and '소금' in failure_page.locator('.concept-caption').inner_text()
 failure_page.locator('.concept-dialog .modal-footer [data-concept-close]').click();failure_page.locator('video').wait_for(state='detached')
 failure_context.close()
 # Live sliders change the model before committing the slider.
 route('s2a');slider=page.locator('[data-field="sea"]')
 slider.evaluate("el=>{el.value='40';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 assert '40 mL' in page.locator('.beaker-mark').last.inner_text()
 slider.dispatch_event('change')
 route('s2b');page.locator('[data-action="heat"]').click();assert page.locator('.is-heating').count()==1
 page.wait_for_function("document.querySelector('.is-heating')===null")
 assert page.locator('.evaporated').count()==2
 route('s4a');page.locator('[data-field="time"]').evaluate("el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 assert page.locator('.timeline output').inner_text()=='09:00'
 page.locator('[data-field="time"]').dispatch_event('change')
 route('s4b');page.locator('[data-compare]').evaluate("el=>{el.value='75';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 assert page.locator('.tide-wipe').evaluate("el=>el.style.getPropertyValue('--wipe')")=='75%'
 # An actual touch PointerEvent drag follows the same commit path as mouse/pen.
 route('s1c');item=page.locator('[data-challenge-item]').first;bin=page.locator('[data-action="challenge-bin"]').first
 source=item.bounding_box();target=bin.bounding_box()
 points={'sx':source['x']+source['width']/2,'sy':source['y']+source['height']/2,'tx':target['x']+target['width']/2,'ty':target['y']+target['height']/2}
 cdp=page.context.new_cdp_session(page)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':points['sx'],'y':points['sy']}]})
 for i in range(1,9):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':points['sx']+(points['tx']-points['sx'])*i/8,'y':points['sy']+(points['ty']-points['sy'])*i/8}]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert page.locator('.challenge-item.assigned').count()==1
 # Empty-scene swipes and the lens are real touch gestures too.
 def touch_drag(sx,sy,tx,ty):
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':sx,'y':sy}]})
  for i in range(1,9):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':sx+(tx-sx)*i/8,'y':sy+(ty-sy)*i/8}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 route('s3a');box=page.locator('.coast-view').bounding_box()
 touch_drag(box['x']+box['width']*.3,box['y']+box['height']*.5,box['x']+box['width']*.1,box['y']+box['height']*.5)
 assert float(page.locator('[data-field="pan"]').input_value())>50
 for name in ['sand','cliff','cave','arch']:
  page.locator('[data-action="target"][data-value="'+name+'"]').click()
 route('s5a');lens=page.locator('.survey-lens').bounding_box();area=page.locator('.mudflat-view').bounding_box()
 touch_drag(lens['x']+lens['width']/2,lens['y']+lens['height']/2,area['x']+area['width']*.24,area['y']+area['height']*.62)
 assert page.locator('.work-panel h2').inner_text()=='게'
 page.locator('.moa-hint summary').click();assert page.locator('.moa-bubble').is_visible()
 page.locator('.moa-hint summary').click()
 route('s5a');print('mudflat CSS',page.locator('.mudflat-view').evaluate('el=>getComputedStyle(el).backgroundImage'),flush=True)
 # Reduced motion requires an explicit play gesture.
 page.emulate_media(reduced_motion='reduce');page.locator('[data-action="concept"]').click()
 assert page.locator('video').evaluate('v=>v.paused')
 page.locator('.concept-dialog .modal-footer [data-concept-close]').click();page.emulate_media(reduced_motion='no-preference')
 layouts=[];routes=['home','hub']+['s'+str(n)+step for n in range(1,6) for step in 'abcd']+['report','link','ending','certificate']
 def measure(r,w,h,task=None):
  metrics=page.evaluate("()=>{const f=document.querySelector('.mission-footer'),b=f?.getBoundingClientRect(),els=[...document.querySelectorAll('.learning button,.learning select,.learning input,.learning summary')].filter(e=>e.getClientRects().length&&!e.closest('details:not([open])>*:not(summary)'));return {scroll:document.documentElement.scrollHeight-innerHeight,horizontal:document.documentElement.scrollWidth-innerWidth,footer:b?Math.round(b.bottom):null,smallTargets:els.filter(e=>{const b=e.getBoundingClientRect();return b.width<47||b.height<47}).map(e=>({text:e.textContent.slice(0,35),h:e.offsetHeight,w:e.offsetWidth})),bodyFont:getComputedStyle(document.body).fontSize}}")
  layouts.append({'route':r,'task':task,'size':[w,h],**metrics})
 for w,h in [(1280,800),(1280,720),(1024,768),(1920,1080)]:
  page.set_viewport_size({'width':w,'height':h})
  for r in routes:
   route(r)
   if r.startswith('s') and r[-1] in 'cd':page.locator('[data-action="challenge-task"][data-value="0"]').click()
   measure(r,w,h,0 if r[-1] in 'cd' else None)
   if w==1280 and h==800 and r.startswith('s'):capture(r)
   if r.startswith('s') and r[-1] in 'cd':
    for task in range(1,4):
     page.locator('[data-action="challenge-task"][data-value="'+str(task)+'"]').click();measure(r,w,h,task)
  print('layout',w,h,'done',flush=True)
  route('s1a');page.locator('[data-action="settings"]').click()
  rect=page.locator('dialog').bounding_box();assert abs((rect['y']+rect['height']/2)-h/2)<3
  assert rect['x']>=0 and rect['y']>=0
  if w in [1280,1920]:capture('settings-'+str(w)+'-'+str(h))
  page.locator('[data-action="close-settings"]').last.click()
 result={'media':media,'touchDrag':'PASS','coastSwipeAndCamera':'PASS','lensDiscovery':'PASS','liveSliders':'PASS','timedHeating':'PASS','tideComparison':'PASS','reducedMotion':'PASS','videoFailureFallback':'PASS','modalEscapeAndBack':'PASS','layouts':layouts,'errors':errors}
 (OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 # Contact sheet is QA evidence, never shipped in the learning app.
 sheet=Image.new('RGB',(4*640,5*425),'#173f4b');draw=ImageDraw.Draw(sheet)
 for i,r in enumerate([r for r in routes if r.startswith('s')]):
  im=Image.open(OUT/(r+'.png')).convert('RGB');im.thumbnail((640,400));x=i%4*640;y=i//4*425;sheet.paste(im,(x,y+25));draw.text((x+12,y+4),r,fill='white')
 sheet.save(OUT/'tablet-contact-sheet.jpg',quality=88)
 print(json.dumps({'pages':len(layouts),'errors':errors,'overflow':[x for x in layouts if x['horizontal']>2],'longScreens':[x for x in layouts if x['route'].startswith('s') and x['scroll']>80]},ensure_ascii=False),flush=True)
 browser.close()
 assert not errors
 assert not [x for x in layouts if x['horizontal']>2]
 assert not [x for x in layouts if x['route'].startswith('s') and x['footer']>x['size'][1]+2]
 assert not [x for x in layouts if x['smallTargets']]
