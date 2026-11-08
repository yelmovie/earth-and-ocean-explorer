"""Stage layout sweep: wrapped labels, hit targets, clipping and reachable actions.

Run with the existing external-SSD Python Playwright environment. TMPDIR must
point to the external SSD too, so Chromium profiles and captures stay there.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('GAME_URL', 'http://127.0.0.1:5173')
OUT = ROOT / os.environ.get('QA_OUTPUT', 'artifacts/responsive-20261108')
OUT.mkdir(parents=True, exist_ok=True)
SIZES = [(1920, 1080), (1366, 768), (1280, 800), (1024, 768),
         (1024, 600), (915, 412), (830, 515), (768, 1024), (375, 812)]
if os.environ.get('QA_SIZES'):
    SIZES = [tuple(map(int, size.split('x'))) for size in os.environ['QA_SIZES'].split(',')]
AUDIT = r"""() => {
  const issues = [];
  const visible = el => {
    if (!el.getClientRects().length || el.closest('details:not([open]) > :not(summary)')) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
  };
  const rect = el => el.getBoundingClientRect();
  const intersects = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
  const label = el => (el.getAttribute('aria-label') || el.textContent).trim().slice(0,65);
  if (document.documentElement.scrollWidth > innerWidth + 2) issues.push({kind:'horizontal',px:document.documentElement.scrollWidth-innerWidth});
  const controls = [...document.querySelectorAll('.learning button,.learning select,.learning input,.learning summary')].filter(visible);
  const footer=document.querySelector('.mission-footer');
  if(footer && !footer.querySelector('details[open]') && rect(footer).height>300) issues.push({kind:'oversized-footer',height:rect(footer).height});
  for (const el of controls) {
    const r = rect(el);
    if (r.width < 47 || r.height < 47) issues.push({kind:'small-target',label:label(el),width:r.width,height:r.height});
    // Trace names intentionally extend beyond their circular touch target.
    if (!el.matches('select,input,summary,.trace,.survey-lens')) {
      const walker = document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      let node;
      while ((node=walker.nextNode())) {
        if (!node.textContent.trim() || node.parentElement.closest('.sr-only,.challenge-progress')) continue;
        const range = document.createRange();range.selectNodeContents(node);
        const t=range.getBoundingClientRect();
        if (t.width && (t.left<r.left-2||t.right>r.right+2||t.top<r.top-2||t.bottom>r.bottom+2)) {
          issues.push({kind:'control-text-clipped',label:label(el),text:node.textContent.trim()});break;
        }
      }
    }
    if (r.top>=80 && r.bottom<innerHeight && !el.disabled) {
      const hit = document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      if (hit && !el.contains(hit)) issues.push({kind:'covered-control',label:label(el),by:label(hit)});
    }
  }
  for (const el of document.querySelectorAll('.choice,.challenge-option')) {
    if (!visible(el)) continue;
    const mark = el.querySelector('.choice-dot,.option-key');
    if (!mark) continue;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())) {
      if (!node.textContent.trim()||mark.contains(node)) continue;
      const range=document.createRange();range.selectNodeContents(node);
      if ([...range.getClientRects()].some(r=>intersects(r,rect(mark)))) issues.push({kind:'icon-text-overlap',label:label(el)});
    }
  }
  const scale=[...document.querySelectorAll('.beaker-scale i')];
  for (let i=0;i<scale.length;i++) for(let j=i+1;j<scale.length;j++) {
    if(scale[i].parentElement===scale[j].parentElement && intersects(rect(scale[i]),rect(scale[j]))) issues.push({kind:'scale-overlap'});
  }
  const tag=document.querySelector('.mudflat-view .scene-tag');
  for(const figure of document.querySelectorAll('.challenge-creatures figure')) {
    const img=figure.querySelector('img'),caption=figure.querySelector('figcaption');
    if(img && caption && rect(img).bottom>rect(caption).top-2) issues.push({kind:'image-caption-overlap',label:label(caption)});
  }
  const traces=[...document.querySelectorAll('.mudflat-view .trace small')];
  for(let i=0;i<traces.length;i++) {
    if(tag&&intersects(rect(tag),rect(traces[i]))) issues.push({kind:'trace-instruction-overlap',label:label(traces[i])});
    for(let j=i+1;j<traces.length;j++) if(intersects(rect(traces[i]),rect(traces[j]))) issues.push({kind:'trace-label-overlap'});
  }
  return issues;
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('BROWSER_PATH', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless=True)
    page = browser.new_page(viewport={'width':1280,'height':800}, has_touch=True, device_scale_factor=1)
    page.set_default_timeout(15000)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: errors.append(str(r.status)+' '+r.url) if r.status>=400 else None)
    page.goto(BASE, wait_until='networkidle')
    page.evaluate("""async()=>{
      const {freshState}=await import('/src/state.js');
      const {sites,terrains,creatures}=await import('/src/data.js');
      const s=freshState();s.settings.unlockAll=true;s.settings.muted=true;s.settings.flatGlobe=true;
      Object.assign(s.drafts[1],{samples:sites.map(x=>x.id),atmosphere:true,classifications:Object.fromEntries(sites.map(x=>[x.id,x.type]))});
      Object.assign(s.drafts[2],{fresh:40,sea:40,heatFresh:1,heatSea:1,prediction:'different'});
      Object.assign(s.drafts[3],{photos:terrains.map(x=>x.id),pins:Object.fromEntries(terrains.map(x=>[x.id,{x:45,y:45}])),features:Object.fromEntries(terrains.map(x=>[x.id,x.feature]))});
      Object.assign(s.drafts[4],{a:0,b:3,time:3});
      Object.assign(s.drafts[5],{found:creatures.map(x=>x.id),selected:'crab',features:Object.fromEntries(creatures.map(x=>[x.id,x.feature]))});
      localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s));
    }""")
    page.reload(wait_until='networkidle')
    routes = os.environ['QA_ROUTES'].split(',') if os.environ.get('QA_ROUTES') else ['s'+str(n)+step for n in range(1,6) for step in 'abcd']
    records = []
    for w,h in SIZES:
        page.set_viewport_size({'width':w,'height':h})
        for route in routes:
            page.goto(BASE+'/#'+route, wait_until='domcontentloaded')
            page.wait_for_function('(r)=>document.querySelector("#app").classList.contains("route-"+r)',arg=route)
            page.evaluate('async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));}')
            tasks = range(4) if route[-1] in 'cd' else [None]
            for task in tasks:
                if task is not None:
                    page.locator('[data-action="challenge-task"][data-value="'+str(task)+'"]').click()
                page.evaluate('window.scrollTo(0,0)')
                issues = page.evaluate(AUDIT)
                footer = page.locator('.mission-footer .primary').first
                footer.scroll_into_view_if_needed()
                reachable=footer.evaluate('el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el.contains(hit)}')
                if not reachable: issues.append({'kind':'unreachable-next'})
                records.append({'size':[w,h],'route':route,'task':task,'issues':issues})
                if task is None or task == 0:
                    if (w,h) in [(1280,800),(375,812)] or route in ['s2a','s4b','s5a']:
                        page.evaluate('window.scrollTo(0,0)')
                        page.screenshot(path=str(OUT/(str(w)+'x'+str(h)+'-'+route+'.png')),full_page=True)
        print('layout',w,h,'done',flush=True)
    result={'checks':len(records),'failures':[r for r in records if r['issues']],'errors':errors,'records':records}
    (OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({k:v for k,v in result.items() if k!='records'},ensure_ascii=False),flush=True)
    browser.close()
    assert not errors
    assert not result['failures']
