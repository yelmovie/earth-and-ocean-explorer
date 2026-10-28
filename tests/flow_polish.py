"""Interaction regressions for the simplified stage flow, in real Edge."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('GAME_URL','http://127.0.0.1:5173')
OUT=ROOT/'artifacts/flow-polish'
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 page=browser.new_page(viewport={'width':1280,'height':720},has_touch=True)
 page.set_default_timeout(12000)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
 page.goto(BASE,wait_until='networkidle')
 page.evaluate("async()=>{const {freshState}=await import('/src/state.js');const s=freshState();s.settings.unlockAll=true;s.settings.muted=true;localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s))}")
 page.reload(wait_until='networkidle')
 def route(r):
  page.goto(BASE+'/#'+r,wait_until='domcontentloaded')
  page.wait_for_function('(r)=>document.querySelector("#app").classList.contains("route-"+r)',arg=r)
  if r=='s1a':page.wait_for_function("document.querySelector('#globe-mode')?.textContent!=='준비 중'")
 def click(action,value=None):
  page.locator('[data-action="'+action+'"]'+('' if value is None else '[data-value="'+str(value)+'"]')).first.click()
 def saved():return page.evaluate("JSON.parse(localStorage.getItem('blue-planet-hq:v2'))")
 def slider(field,value):
  page.locator('[data-field="'+field+'"]').evaluate("(el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}",str(value))
 # A single destination records evidence, including keyboard input; repeat taps
 # revisit it without duplicating the saved evidence.
 route('s1a')
 page.locator('[data-action="site"][data-value="asia"]').dblclick()
 assert saved()['drafts']['1']['samples']==['asia']
 page.locator('[data-action="site"][data-value="pacific"]').focus();page.keyboard.press('Enter')
 click('site','africa');click('atmosphere')
 assert len(saved()['drafts']['1']['samples'])==3
 page.reload(wait_until='networkidle')
 assert len(saved()['drafts']['1']['samples'])==3
 click('next');page.wait_for_url('**/#s1b')
 assert page.locator('video,.concept-dialog').count()==0
 assert page.locator('[data-sample].selected').get_attribute('data-sample')=='asia'
 # The next unsorted card is selected for each bin press. Previously placed
 # cards remain available to correct an intentional wrong assignment.
 for card,bin_name in [('asia','바다'),('pacific','바다'),('africa','육지')]:
  assert page.locator('[data-sample].selected').get_attribute('data-sample')==card
  page.locator('[data-sample-bin="'+bin_name+'"]').click()
 assert page.locator('[data-sample].selected').count()==0
 page.locator('[data-sample="asia"]').click();page.locator('[data-sample-bin="육지"]').click()
 assert saved()['drafts']['1']['classifications']=={'asia':'육지','pacific':'바다','africa':'육지'}
 page.screenshot(path=str(OUT/'classification-720.png'))
 # Time playback stops at the end and yields control as soon as the child
 # changes the slider, without a stale interval changing the chosen sample.
 route('s4a');click('tide-save','a')
 assert page.locator('[data-action="tide-save"][data-value="a"]').is_disabled()
 page.locator('[data-timelapse]').click()
 page.wait_for_function("JSON.parse(localStorage.getItem('blue-planet-hq:v2')).drafts[4].time>0")
 slider('time',3);page.wait_for_timeout(1150)
 assert page.locator('[data-action="tide-save"][data-value="a"]').is_enabled()
 assert saved()['drafts']['4']['time']==3
 assert page.locator('[data-timelapse]').get_attribute('aria-pressed')=='false'
 slider('time',5);page.locator('[data-timelapse]').click()
 page.wait_for_function("JSON.parse(localStorage.getItem('blue-planet-hq:v2')).drafts[4].time===6")
 page.wait_for_timeout(1100)
 assert saved()['drafts']['4']['time']==6
 assert page.locator('[data-timelapse]').get_attribute('aria-pressed')=='false'
 route('s4b')
 page.locator('[data-compare]').evaluate("el=>{el.value='72';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 click('marker','pole')
 assert page.locator('.tide-wipe').evaluate("el=>el.style.getPropertyValue('--wipe')")=='72%'
 # Leaving during the heat animation cancels the stale operation; returning
 # leaves the activity ready for a fresh, complete observation.
 route('s2a')
 assert '물의 양' in page.locator('[data-lab-status]').inner_text()
 page.locator('[data-field="sea"]').evaluate("el=>{el.value='40';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 assert '가열 세기' in page.locator('[data-lab-status]').inner_text()
 page.locator('[data-field="heatSea"]').evaluate("el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}))}")
 assert page.locator('[data-lab-status]').evaluate("el=>el.classList.contains('ready')")
 route('s2b');click('heat');assert page.locator('.is-heating').count()==1
 click('home');page.wait_for_url('**/#home');page.wait_for_timeout(2500)
 assert not saved()['drafts']['2']['heated']
 route('s2b');click('heat')
 page.wait_for_function("document.querySelector('.is-heating')===null")
 assert page.locator('.evaporated').count()==2
 # Direct photography is idempotent, and all four sites are still required.
 route('s3a')
 page.locator('[data-action="target"][data-value="sand"]').dblclick()
 assert saved()['drafts']['3']['photos']==['sand']
 for name in ['cliff','cave','arch']:click('target',name)
 assert len(saved()['drafts']['3']['photos'])==4
 assert page.locator('[data-action="photograph"]').count()==0
 # A wrong feature receives feedback without earning the creature record;
 # selecting the observed feature records it immediately.
 route('s5a');animals=page.evaluate("async()=>(await import('/src/data.js')).creatures")
 c=animals[0];click('creature',c['id'])
 def feature(value):page.locator('[data-action="observe-feature"][data-creature="'+c['id']+'"][data-value="'+value+'"]').click()
 feature(animals[1]['feature'])
 assert c['id'] not in saved()['drafts']['5']['found']
 feature(c['feature'])
 assert saved()['drafts']['5']['found']==[c['id']]
 feature(c['feature'])
 assert saved()['drafts']['5']['found']==[c['id']]
 # A legacy save may already hold a correct selection before the old
 # separate record button was pressed. The same selection must now commit.
 page.evaluate("()=>{const s=JSON.parse(localStorage.getItem('blue-planet-hq:v2'));s.drafts[5].found=[];localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s))}")
 page.reload(wait_until='networkidle');feature(c['feature'])
 assert saved()['drafts']['5']['found']==[c['id']]
 page.screenshot(path=str(OUT/'creature-feature-720.png'))
 # Repeated choice taps are a single answer and a single correction count.
 tasks=page.evaluate("async()=>(await import('/src/challenge-data.js')).challenges")
 n,next_idx,task=next((n,i,t) for n,ts in tasks.items() for i,t in enumerate(ts) if t['type']=='choice')
 step='c' if next_idx<4 else 'd';route('s'+n+step);click('challenge-task',next_idx%4)
 wrong=next(o['id'] for o in task['options'] if o['id']!=task['answer'])
 revised=saved()['revised']
 page.locator('[data-action="challenge-answer"][data-value="'+wrong+'"]').dblclick()
 assert saved()['revised']==revised+1
 click('challenge-answer',task['answer'])
 page.locator('[data-action="challenge-answer"][data-value="'+task['answer']+'"]').dblclick()
 assert saved()['research'][n]['solved'].count(task['id'])==1
 assert page.locator('.challenge-feedback').evaluate("el=>el.classList.contains('good')")
 result={'singleTapObservation':'PASS','keyboardObservation':'PASS','duplicateEvidence':'PASS','sampleAutoSelectionAndCorrection':'PASS','tidePlaybackCleanup':'PASS','comparisonPosition':'PASS','liveLabReadiness':'PASS','heatExitRecovery':'PASS','instantFeatureRecord':'PASS','legacyFeatureCommit':'PASS','choiceRapidTaps':'PASS','errors':errors}
 (OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False),flush=True)
 browser.close()
 assert not errors,errors
