// Original pentatonic background score + locally hosted Kenney CC0 feedback.
export function createAudio(getSettings) {
  let context, musicGain, timer, nextNote = 0, beat = 0, videoQuiet = false, currentEffect;
  const effects=new Map();
  const effectNames=['click','scan','camera','drop','hint','success','retry','reward','heat'];
  const activeEffects = new Set(), activeMusic = new Set();
  const melody = [60, 67, 69, 64, 67, 72, 69, 67, 62, 67, 64, 69, 67, 64, 62, 60];
  const settings = () => getSettings();
  const canPlayMusic = () => !videoQuiet && !document.hidden && !settings().muted && settings().bgmEnabled !== false;
  function stopEffect(){if(currentEffect){currentEffect.pause();currentEffect.currentTime=0;currentEffect=null;}for(const oscillator of activeEffects){try{oscillator.stop();}catch{}}activeEffects.clear();}
  function effect(name='click'){
    stopEffect();if(document.hidden||settings().muted||settings().sfxEnabled===false)return;
    if(!effectNames.includes(name))name='click';
    let player=effects.get(name);if(!player){player=new Audio(`${import.meta.env.BASE_URL}assets/audio/${name}.mp3`);player.preload='auto';effects.set(name,player);}
    player.volume=name==='reward'?.34:.26;currentEffect=player;player.play().catch(()=>{});
  }
  function prepare() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      if (!context) {
        context = new Audio(); musicGain = context.createGain();
        musicGain.gain.value = 0; musicGain.connect(context.destination);
      }
      return true;
    } catch { return false; }
  }
  function note(midi, when, length, gain) {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(gain, when + 0.06);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + length);
    oscillator.connect(envelope).connect(musicGain); activeMusic.add(oscillator); oscillator.start(when); oscillator.stop(when + length + 0.02);
    oscillator.onended = () => { activeMusic.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
  }
  function schedule() {
    if (!context || context.state !== 'running' || !canPlayMusic()) return;
    nextNote = Math.max(nextNote, context.currentTime + 0.04);
    while (nextNote < context.currentTime + 1.4) {
      note(melody[beat % melody.length], nextNote, 1.1, 0.27);
      if (beat % 4 === 0) note([48, 45, 53, 55][Math.floor(beat / 4) % 4], nextNote, 2.7, 0.18);
      nextNote += 0.72; beat += 1;
    }
  }
  function sync() {
    if(document.hidden||settings().muted||settings().sfxEnabled===false)stopEffect();
    if (!context) return;
    const volume = Math.max(0, Math.min(1, Number(settings().volume) || 0));
    musicGain.gain.cancelScheduledValues(context.currentTime);
    musicGain.gain.setTargetAtTime(canPlayMusic() ? volume * 0.14 : 0, context.currentTime, 0.12);
    if (settings().muted || settings().sfxEnabled === false) {
      for (const oscillator of activeEffects) { try { oscillator.stop(); } catch {} }
    }
    if (canPlayMusic()) { if (!timer) timer = window.setInterval(schedule, 450); schedule(); }
    else { window.clearInterval(timer); timer = null; nextNote = 0; for (const oscillator of activeMusic) { try { oscillator.stop(); } catch {} } activeMusic.clear(); }
  }
  function start() {
    if (!prepare()) return;
    context.resume().then(sync).catch(() => {}); sync();
  }
  function tone(frequency = 520) {
    effect(frequency>=650?'success':frequency<400?'retry':'click');return;
  }
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('pointerdown',start,{once:true});
  return { start, sync, tone, effect, quiet(value){videoQuiet=value;sync();} };
}
