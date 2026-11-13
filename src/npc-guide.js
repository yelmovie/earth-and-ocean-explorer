import './npc-button.css';

export function mountNpcGuide(host,options){
  if(!host)return ()=>{};
  const trigger=document.createElement('button');trigger.type='button';trigger.className='npc-stage-button';
  trigger.textContent=options.title??'안내자 목소리 듣기';trigger.setAttribute('aria-haspopup','dialog');host.append(trigger);
  let close=null, loading=false;
  trigger.onclick=async()=>{
    if(loading)return;
    loading=true;
    trigger.setAttribute('aria-busy','true');
    try{
      const { openNpcScene }=await import('./npc-scene.js');
      if(!trigger.isConnected||document.querySelector('dialog[open]'))return;
      close?.();close=openNpcScene({...options,trigger});
    }catch{if(trigger.isConnected&&!document.querySelector('dialog[open]'))options.onError?.();}
    finally{loading=false;trigger.removeAttribute('aria-busy');}
  };
  return ()=>{close?.();trigger.remove();};
}
