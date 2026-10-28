import os, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GAME_URL','http://127.0.0.1:5173')
print('QA boot',flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 print('Edge launched',flush=True)
 page=browser.new_page(viewport={'width':1280,'height':800},device_scale_factor=1)
 page.set_default_timeout(15000)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append('console: '+m.text) if m.type=='error' else None)
 start=time.perf_counter()
 print('loading home',flush=True)
 page.goto(BASE,wait_until='networkidle')
 print('home loaded',flush=True)
 load=round(time.perf_counter()-start,2)
 def click(action,value=None):
  print('CLICK',action,value,flush=True)
  sel='[data-action="'+action+'"]'+('' if value is None else '[data-value="'+str(value)+'"]')
  if action=='reward-close':
   page.locator('.chapter-reward [data-reward-route="'+str(value)+'"]').click();return
  page.locator(sel).first.click()
 def field(name,value):
  el=page.locator('[data-field="'+name+'"]')
  el.evaluate("el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true}")
  if el.evaluate('el=>el.tagName')=='SELECT':el.select_option(str(value))
  else:el.evaluate("(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}",str(value))
 def choose(name,value):
  page.locator('[data-action="choose"][data-field="'+name+'"][data-value="'+str(value)+'"]').click()
 def route(name):
  page.wait_for_url('**/#'+name)
  assert page.locator('.concept-dialog[open],video').count()==0, 'A stage transition must not force a concept replay'
 def shot(name):
  page.screenshot(path=str(ROOT/'artifacts'/name))
 shot('home-v3-1280.png')
 click('go','hub');route('hub')
 page.locator('#hub-map').wait_for()
 page.wait_for_timeout(600)
 shot('hub-v3-1280.png')
 # Learning-flow test uses the normal hash route; map travel has its own check.
 page.goto(BASE+'/#s1a',wait_until='domcontentloaded');route('s1a')
 page.wait_for_function("document.querySelector('#globe-mode')?.textContent!=='준비 중'")
 for site in ['asia','pacific','africa']:
  click('site',site)
  page.wait_for_function("document.querySelector('#globe-mode')?.textContent!=='준비 중'")
 click('atmosphere')
 click('next');route('s1b')
 field('classifications.asia','육지');field('classifications.pacific','바다');field('classifications.africa','육지')
 choose('conclusion','global');click('complete');route('s1c')
 tasks=page.evaluate("async()=>{const m=await import('/src/challenge-data.js');return m.challenges}")
 def extensions(n):
  for step,startidx in [('c',0),('d',4)]:
   route('s'+str(n)+step)
   for i,task in enumerate(tasks[str(n)][startidx:startidx+4]):
    if i: click('challenge-next')
    if n==1 and step=='c' and i==0:
     assert page.locator('[data-action="challenge-check"]').count()==0
     assert page.locator('.challenge-item.selected').count()==1
    if task['type']=='choice':click('challenge-answer',task['answer'])
    elif task['type']=='multi':
     for answer in task['answer']:click('challenge-answer',answer)
    elif task['type']=='order':
     for answer in task['answer']:click('challenge-order',answer)
    else:
     for j,item in enumerate(task['items']):
      assert page.locator('[data-challenge-item="'+item['id']+'"]').get_attribute('aria-pressed')=='true'
      answer=item['answer']
      if n==1 and step=='c' and i==0 and j==0:answer=next(b['id'] for b in task['bins'] if b['id']!=answer)
      click('challenge-bin',answer)
     if n==1 and step=='c' and i==0:
      assert not page.locator('.challenge-feedback').evaluate("el=>el.classList.contains('good')")
      assert page.locator('.challenge-observation details').get_attribute('open') is not None
      shot('challenge-correction-1280.png')
      first=task['items'][0];click('challenge-pick',first['id']);click('challenge-bin',first['answer'])
    assert '근거를 연결했어요' in page.locator('.challenge-feedback').inner_text()
   if step=='c':click('challenge-continue')
   else:
    click('challenge-finish');page.locator('.chapter-reward[open]').wait_for()
    assert page.locator('.chapter-reward video').count()==0
    if n==1:shot('reward-v3-1280.png')
    destination='s'+str(n+1)+'a' if n<5 else 'report'
    click('reward-close',destination);route(destination)
  print('STAGE',n,'complete',flush=True)
 extensions(1)
 for n in range(2,6):
  route('s'+str(n)+'a')
  if n==2:
   field('sea','40');field('heatSea','1');choose('prediction','same');click('next');route('s2b')
   click('heat');choose('residue','sea');choose('reason','dissolved')
  elif n==3:
   for target in ['sand','cliff','cave','arch']:click('target',target)
   click('next');route('s3b')
   terrain=page.evaluate("async()=>{const m=await import('/src/data.js');return m.terrains}")
   for t in terrain:click('pin',t['id']);field('features.'+t['id'],t['feature'])
   choose('compare','through')
  elif n==4:
   click('tide-save','a')
   page.locator('[data-field="time"]').evaluate("el=>{el.value='3';el.dispatchEvent(new Event('change',{bubbles:true}))}")
   click('tide-save','b');click('next');route('s4b')
   click('marker','pole');click('marker','rock');choose('direction','up');choose('concept','in')
  else:
   animals=page.evaluate("async()=>{const m=await import('/src/data.js');return m.creatures}")
   for a in animals:
    click('creature',a['id'])
    page.locator('[data-action="observe-feature"][data-creature="'+a['id']+'"][data-value="'+a['feature']+'"]').click()
   click('next');route('s5b');choose('value','habitat');choose('action','observe')
  click('complete');route('s'+str(n)+'c');extensions(n)
 route('report');shot('report-v3-1280.png')
 click('go','link');route('link')
 cases=page.evaluate("async()=>{const m=await import('/src/data.js');return m.finalCases}")
 for i,case in enumerate(cases):
  click('case',i);click('link-stage',case['stage']);choose('linkReason',case['answer']);click('check-link',i)
 click('go','ending');route('ending');click('go','certificate');route('certificate')
 assert page.locator('[data-action="print"]').is_enabled()
 shot('certificate-v3-1280.png')
 saved=page.evaluate("JSON.parse(localStorage.getItem('blue-planet-hq:v2'))")
 assert len(saved['completed'])==5 and len(saved['links'])==5
 assert sum(len(r['solved']) for r in saved['research'].values())==40
 page.reload(wait_until='networkidle');route('certificate')
 assert page.locator('[data-action="print"]').is_enabled()
 # Settings: one unlock toggle, evidence unchanged, BGM-only slider, reset cancel.
 click('settings')
 assert page.locator('[data-action="toggle-setting"]').count()==2
 assert page.locator('[data-setting="volume"]').get_attribute('step')=='5'
 page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click()
 click('toggle-unlock')
 assert page.locator('[data-action="toggle-unlock"]').get_attribute('aria-pressed')=='true'
 page.get_by_text('성취기준',exact=True).click()
 shot('settings-v3-1280.png')
 click('reset-ask');assert page.locator('[data-action="reset-cancel"]').evaluate('el=>el===document.activeElement')
 click('reset-cancel');click('close-settings')
 unlocked=page.evaluate("JSON.parse(localStorage.getItem('blue-planet-hq:v2'))")
 assert unlocked['completed']==saved['completed'] and unlocked['evidence']==saved['evidence']
 routes=page.evaluate("async()=>{const m=await import('/src/data.js');return m.routes}")
 if os.environ.get('SKIP_LAYOUT')=='1':routes=[]
 layouts=[]
 for width,height in [(1280,800),(1024,768),(906,755),(873,580),(1920,1080),(375,812)]:
  page.set_viewport_size({'width':width,'height':height})
  for r in routes:
   page.goto(BASE+'/#'+r,wait_until='domcontentloaded')
   page.locator('h1').first.wait_for()
   metrics=page.evaluate("({overflow:document.documentElement.scrollWidth>innerWidth+2, width:innerWidth,scrollWidth:document.documentElement.scrollWidth})")
   if metrics['overflow']:layouts.append({'route':r,'size':[width,height],**metrics})
   if r in ['hub','s1c','s3b','s4b','s5d'] and width in [1024,873,1920]:shot(r+'-'+str(width)+'x'+str(height)+'.png')
 print(json.dumps({'homeLoadSeconds':load,'fullJourney':'PASS','extensionTasks':40,'reload':'PASS','adminRecordIsolation':'PASS','resetCancelFocus':'PASS','layoutFailures':layouts,'errors':errors},ensure_ascii=False),flush=True)
 (ROOT/'artifacts'/'browser-verification.json').write_text(json.dumps({'homeLoadSeconds':load,'fullJourney':'PASS','extensionTasks':40,'layoutFailures':layouts,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
 browser.close()
 assert not errors,errors
 assert not layouts,layouts
