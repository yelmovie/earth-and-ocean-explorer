import threading,http.server,functools,json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path('/Volumes/T7 Shield/iscreammedia_sc34');results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless=True)
 for i,folder in enumerate(['10 earthsea','11 sound','12 diseases/invisible-traces']):
  handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root/folder/'dist'))
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler);threading.Thread(target=server.serve_forever,daemon=True).start()
  page=browser.new_page(service_workers='block',viewport={'width':1024,'height':768});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.add_init_script("window.npcAudios=[];const NativeAudio=window.Audio;window.Audio=function(src){const a=new NativeAudio(src);if(src?.includes('npc-welcome'))window.npcAudios.push(a);return a;};")
  page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
  trigger=page.get_by_role('button',name='안내자 목소리 듣기');assert trigger.count()==1
  assert trigger.bounding_box()['height']>=48
  trigger.click();page.get_by_role('button',name='목소리 재생',exact=True).click();page.wait_for_timeout(1000)
  data=page.evaluate('({time:npcAudios.at(-1).currentTime,paused:npcAudios.at(-1).paused,duration:npcAudios.at(-1).duration})');assert data['time']>0 and not data['paused'],data
  page.get_by_role('button',name='목소리 멈추기',exact=True).click();assert page.evaluate('npcAudios.at(-1).paused')
  page.get_by_role('button',name='목소리 재생',exact=True).click();page.get_by_role('button',name='닫기',exact=True).click();assert page.evaluate('npcAudios.at(-1).paused')
  for size in [{'width':768,'height':1024},{'width':390,'height':844}]:
   page.set_viewport_size(size);trigger.click();assert page.locator('dialog[open]').bounding_box()['width']<=size['width'];page.get_by_role('button',name='닫기',exact=True).click()
  # Hidden tab, mute setting and missing-file fallback exercise real lifecycle.
  trigger.click();page.get_by_role('button',name='목소리 재생',exact=True).click();page.wait_for_timeout(100)
  page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
  assert page.evaluate('npcAudios.at(-1).paused')
  page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false})")
  page.get_by_role('button',name='닫기',exact=True).click()
  selector='[data-action="mute"]' if i==1 else '[data-action="sound"]'
  page.locator(selector).first.click();trigger.click();page.get_by_role('button',name='목소리 재생',exact=True).click()
  assert page.get_by_text('설정에서 소리를 켠 뒤 재생해 주세요.').is_visible()
  page.get_by_role('button',name='닫기',exact=True).click();page.locator(selector).first.click()
  page.route('**/npc-welcome.m4a*',lambda route:route.abort())
  trigger.click();page.evaluate("npcAudios.at(-1).src += '?missing-test'")
  page.get_by_role('button',name='목소리 재생',exact=True).click();page.wait_for_timeout(500)
  assert page.get_by_text('음성을 읽지 못했어요. 위 안내 글로 계속할 수 있어요.').is_visible()
  page.get_by_role('button',name='닫기',exact=True).click()
  results.append({'project':folder,'audio':data,'errors':errs,'manual_stop_close_responsive':'PASS'})
  page.close();server.shutdown()
 browser.close()
print(json.dumps(results,ensure_ascii=False,indent=2))
Path('/tmp/npc-browser-result.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
