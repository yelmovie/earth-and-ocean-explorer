// Suno background music (references/suno) + locally hosted Kenney CC0 feedback.
// The main theme loops from the first tap; the final theme plays once on the ending/certificate
// and while the map finale dialog is open, then the main theme resumes.
export function createAudio(getSettings) {
  let context, started = false, videoQuiet = false, voiceDuck = false, currentEffect;
  let routeTrack = 'main', mapFinale = false, finalDone = false;
  const effects=new Map(), music=new Map();
  const musicFiles={main:'main-theme.mp3',final:'final-theme.mp3'};
  const effectNames=['click','scan','camera','drop','hint','success','retry','reward','heat'];
  const settings = () => getSettings();
  const volume = () => Math.max(0, Math.min(1, Number(settings().volume) || 0));
  const canPlayMusic = () => started && !document.hidden && !settings().muted && settings().bgmEnabled !== false && volume() > 0;
  function stopEffect(){if(currentEffect){currentEffect.pause();currentEffect.currentTime=0;currentEffect=null;}}
  function effect(name='click'){
    stopEffect();if(videoQuiet||!context||context.state!=='running'||document.hidden||settings().muted||settings().sfxEnabled===false)return;
    if(!effectNames.includes(name))name='click';
    let player=effects.get(name);if(!player){player=new Audio(`${import.meta.env.BASE_URL}assets/audio/${name}.mp3`);player.preload='auto';effects.set(name,player);}
    player.volume=name==='reward'?.34:.26;currentEffect=player;player.play().catch(()=>{});
  }
  function track(name){
    let player=music.get(name);
    if(!player){
      player=new Audio(`${import.meta.env.BASE_URL}assets/audio/bgm/${musicFiles[name]}`);
      player.preload='auto';player.loop=name==='main';player.dataset.track=name;
      if(name==='final')player.addEventListener('ended',()=>{finalDone=true;});
      music.set(name,player);
    }
    return player;
  }
  function syncMusic(){
    const name=mapFinale?'final':routeTrack;
    const silent=!canPlayMusic()||name==='final'&&finalDone;
    for(const [key,player] of music)if(silent||key!==name)player.pause();
    if(silent)return;
    const player=track(name);
    // Ducked under character voices and concept clips instead of stopping.
    player.volume=Math.min(1,volume()*.8)*(videoQuiet||voiceDuck?.25:1);
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
  document.addEventListener('map-finale',event=>{mapFinale=!!event.detail?.open;if(mapFinale)restartFinal();sync();});
  window.addEventListener('pagehide',()=>{stopEffect();for(const player of music.values())player.pause();context?.suspend().catch(()=>{});});
  return { start, sync, tone, effect, effectsAllowed:()=>!settings().muted&&settings().sfxEnabled!==false, quiet(value){videoQuiet=value;if(value)stopEffect();sync();},
    // 엔딩·인증서는 파이널 곡, 나머지 화면은 메인 테마.
    music(name){name=name==='final'?'final':'main';if(name===routeTrack)return;routeTrack=name;if(name==='final')restartFinal();sync();},
    // 캐릭터 대사가 나오는 동안 배경음만 줄인다(효과음은 그대로).
    duck(value){voiceDuck=!!value;sync();} };
}
