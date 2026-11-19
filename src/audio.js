// Suno background music (references/suno) + locally hosted Kenney CC0 feedback.
// The main theme loops from the first tap; the final theme plays once on the ending/certificate
// and while the map finale dialog is open, then the main theme carries on at ×0.45 until the learner leaves.
// Effects come in three lanes: UI (one at a time), battle·reward (up to four at once, never cut by UI or steps)
// and footsteps (their own single player).
export function createAudio(getSettings) {
  let context, started = false, videoQuiet = false, voiceDuck = false, uiEffect, stepPlayer, stepTurn = 0;
  let routeTrack = 'main', mapFinale = false, finalDone = false, finalHold = 0, fadeFrom = 0, holdTimer = 0, fadeTimer = 0;
  const effects=new Map(), music=new Map(), steps=new Map(), battle=new Set();
  const musicFiles={main:'main-theme.mp3',final:'final-theme.mp3'};
  const effectNames=['click','scan','camera','drop','hint','success','retry','reward','heat'];
  // Map villain cues (CC0, _shared/sfx-library-20261117): 퐁 → 첨벙 → 풍덩, then the villain bubbles away.
  const mapVolumes={'map-swing':.2,'map-hit-1':.3,'map-hit-2':.36,'map-hit-3':.5,'map-exit':.26,'map-appear':.16,'map-bump':.24,'map-victory':.24};
  // Achievement card cues (map-reward-cards.js, same CC0 library): fly in, reveal (the two rarest cards use the longer jingle), land in the slot, full set.
  Object.assign(mapVolumes,{'card-whoosh':.2,'card-reveal':.3,'card-epic':.3,'card-slot':.3,'card-complete':.3});
  // A new map place opens: a soft latch, then a buoy-bell shimmer 0.12 s later (same CC0 library).
  Object.assign(mapVolumes,{'map-open':.3,'map-open-shine':.22});
  effectNames.push(...Object.keys(mapVolumes));
  // Footsteps (same CC0 library): alternate two files, a little slower on the sandy tidal flat.
  const STEP_VOLUME=.18, stepRates={map:.98,flat:.93};
  const settings = () => getSettings();
  const volume = () => Math.max(0, Math.min(1, Number(settings().volume) || 0));
  const canPlayMusic = () => started && !document.hidden && !settings().muted && settings().bgmEnabled !== false && volume() > 0;
  const effectsOn = () => !videoQuiet && !!context && context.state === 'running' && !document.hidden && !settings().muted && settings().sfxEnabled !== false;
  const halt = player => { player.pause(); player.currentTime = 0; };
  function stopUi(){if(uiEffect){halt(uiEffect);uiEffect=null;}}
  function stopBattle(){for(const player of battle)halt(player);battle.clear();}
  function stopStep(){if(stepPlayer){halt(stepPlayer);stepPlayer=null;}}
  function stopEffect(){stopUi();stopBattle();stopStep();}
  function load(map,name,file){
    let player=map.get(name);
    if(!player){player=new Audio(`${import.meta.env.BASE_URL}assets/audio/${file}.mp3`);player.preload='auto';map.set(name,player);}
    return player;
  }
  function effect(name='click'){
    if(!effectNames.includes(name))name='click';
    const lane=name in mapVolumes?'battle':'ui';
    // A new UI sound only replaces the previous UI sound; battle and reward sounds overlap and are never cut by UI.
    if(lane==='ui')stopUi();
    if(!effectsOn())return;
    const player=load(effects,name,name);
    player.volume=mapVolumes[name]??(name==='reward'?.34:.26);player.currentTime=0;
    if(lane==='ui')uiEffect=player;
    else{
      battle.delete(player);
      if(battle.size>=4){const oldest=battle.values().next().value;halt(oldest);battle.delete(oldest);}
      battle.add(player);
      const done=()=>{battle.delete(player);if(finalHold)syncMusic();};
      player.addEventListener('ended',done,{once:true});
    }
    player.play().catch(()=>{battle.delete(player);});
  }
  // One footstep. kind: 'map' (island paths) or 'flat' (tidal flat walk). Plays beside every other sound, cuts none.
  function step(kind='map'){
    if(!effectsOn())return;
    const file=`step-${stepTurn++%2+1}`,player=load(steps,file,file);
    if(stepPlayer&&stepPlayer!==player)halt(stepPlayer);
    player.preservesPitch=false;player.playbackRate=(stepRates[kind]??1)*(1+(Math.random()*2-1)*.03);
    player.volume=STEP_VOLUME*(voiceDuck?.5:1);player.currentTime=0;stepPlayer=player;player.play().catch(()=>{});
  }
  function track(name){
    let player=music.get(name);
    if(!player){
      player=new Audio(`${import.meta.env.BASE_URL}assets/audio/bgm/${musicFiles[name]}`);
      player.preload='auto';player.loop=name==='main';player.dataset.track=name;
      if(name==='final')player.addEventListener('ended',()=>{finalDone=true;syncMusic();});
      music.set(name,player);
    }
    return player;
  }
  const battlePlaying=()=>[...battle].some(player=>!player.paused&&!player.ended);
  function syncMusic(){
    let name=mapFinale?'final':routeTrack,level=1;
    // After the final theme the main theme carries on quietly while the finale, ending or certificate stays open.
    if(name==='final'&&finalDone){name='main';level=.45;}
    const now=performance.now();
    // The map finale waits for the card set jingle to finish (at most 3 s), then fades the final theme in.
    if(finalHold&&(now>=finalHold||!battlePlaying()||name!=='final')){finalHold=0;clearTimeout(holdTimer);if(name==='final')fadeFrom=now;}
    const silent=!canPlayMusic()||finalHold>0;
    for(const [key,player] of music)if(silent||key!==name)player.pause();
    if(silent)return;
    const player=track(name);
    const fade=fadeFrom?Math.min(1,(now-fadeFrom)/900):1;
    if(fade>=1)fadeFrom=0;else{clearTimeout(fadeTimer);fadeTimer=setTimeout(syncMusic,60);}
    // Ducked under character voices and concept clips instead of stopping.
    player.volume=Math.min(1,volume()*.8)*level*fade*(videoQuiet||voiceDuck?.25:1);
    if(player.paused)player.play().catch(()=>{});
  }
  function restartFinal(){finalDone=false;const player=music.get('final');if(player){player.pause();player.currentTime=0;}}
  function prepare() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      if (!context) context = new Audio();
      return true;
    } catch { return false; }
  }
  function sync() {
    if(document.hidden||settings().muted||settings().sfxEnabled===false)stopEffect();
    syncMusic();
  }
  function start() {
    started = true;
    if (prepare()) context.resume().then(sync).catch(() => {});
    sync();
  }
  function tone(frequency = 520) {
    effect(frequency>=650?'success':frequency<400?'retry':'click');return;
  }
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('pointerdown',start,{once:true});
  document.addEventListener('keydown',start,{once:true});
  // map-finale.js announces its dialog; the video stays muted and the final theme plays instead.
  // The card set jingle (battle lane) is left to finish: the final theme starts after it.
  document.addEventListener('map-finale',event=>{
    mapFinale=!!event.detail?.open;stopUi();stopStep();
    if(mapFinale){restartFinal();if(battlePlaying()){finalHold=performance.now()+3000;clearTimeout(holdTimer);holdTimer=setTimeout(syncMusic,3010);}else fadeFrom=0;}
    else{finalHold=0;fadeFrom=0;}
    sync();
  });
  window.addEventListener('pagehide',()=>{stopEffect();for(const player of music.values())player.pause();context?.suspend().catch(()=>{});});
  return { start, sync, tone, effect, step, stopStep, effectsAllowed:()=>!settings().muted&&settings().sfxEnabled!==false, quiet(value){videoQuiet=value;if(value)stopEffect();sync();},
    // 지도에 새 장소가 열릴 때: 잠금 풀림 + 0.12초 뒤 반짝(전투·보상 갈래라 UI 소리에 끊기지 않는다).
    opened(){effect('map-open');setTimeout(()=>effect('map-open-shine'),120);},
    // 엔딩·인증서는 파이널 곡, 나머지 화면은 메인 테마.
    music(name){name=name==='final'?'final':'main';if(name===routeTrack)return;routeTrack=name;if(name==='final')restartFinal();sync();},
    // 캐릭터 대사가 나오는 동안 배경음만 줄인다(효과음은 그대로, 발자국은 ×0.5).
    duck(value){voiceDuck=!!value;if(stepPlayer)stepPlayer.volume=STEP_VOLUME*(voiceDuck?.5:1);sync();} };
}
