import {createRewardCards} from './reward-cards.js';
import {chapters} from './data.js';

// One achievement card per map villain, in facility order (map-villain-content.js mapEncounterIds '1'-'5' are the chapter ids).
// The star count rises with the chapter number.
const TITLES=['지구 표면 발견왕','바닷물 소금 탐정','해안 지형 탐험가','밀물 썰물 눈금 박사','푸른행성 수호 영웅'];
const base=`${import.meta.env?.BASE_URL??'/'}assets/reward-cards/`;
export const REWARD_CARDS=chapters.map((chapter,index)=>{
  const id=String(chapter.id),file=`${index+1}-${id}.webp`;
  return {id,title:TITLES[index],stage:chapter.title,art:`${base}card-${file}`,thumb:`${base}thumb-${file}`};
});
const HITS=3;
// A card is owned once its villain has taken all three hits (state.mapHits). Nothing extra is saved.
export const ownedRewardCards=hits=>REWARD_CARDS.map(({id})=>hits?.[id]===HITS);
// Card indexes won by this save patch: only the hit that takes a villain from under three to three.
export const newRewardCards=(before,patch)=>REWARD_CARDS.flatMap(({id},index)=>before?.[id]!==HITS&&patch?.[id]===HITS?[index]:[]);

// Effect names in audio.js (public/assets/audio/card-*.mp3).
const SOUNDS={whoosh:'card-whoosh',reveal:'card-reveal',epic:'card-epic',slot:'card-slot',complete:'card-complete'};
let cue=()=>{};
// main.js hands over its effect call, so the cards follow the sound switch, the effects setting and the volume.
export function bindRewardSound(play){cue=play;}

// Built on first use: tests load this module without a browser.
let instance;
function rewards(){
  return instance??=createRewardCards({
    setName:'푸른행성 성취 카드',
    cards:REWARD_CARDS,
    theme:{accent:'#f3c98d',accent2:'#086c6b',glow:'#ffeaa6',ink:'#173f4b'},
    particles:['drop','bubble','star','spark'],
    colors:['#f3c98d','#ffeaa6','#7ddfd0','#b8decb','#086c6b','#ffffff'],
    // The blue planet of the app icon (public/favicon.svg).
    emblem:'<svg viewBox="8 8 48 48" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#36bfd7"/><path d="m18 17 14-6 6 12-10 5 2 13-12-5-5-11zm22 19 11-3-5 15-9 4z" fill="#b5e5a1"/></svg>',
    sound:name=>cue(SOUNDS[name]),
    inertRoot:()=>document.querySelector('#app'),
  });
}

// A card on its way to a slot stays empty in the header until it lands, even if the header is redrawn in between.
const flying=new Set();
// True from the third hit until the card sits in its slot. main.js uses it to leave the all-villains jingle to the card.
export const rewardCardPending=()=>flying.size>0;
export const rewardSlotsHtml=hits=>rewards().slotsHtml(ownedRewardCards(hits).map((owned,index)=>owned&&!flying.has(index)));
// Shows the cards won by a villain save (hub.js onSave) once the villain's exit has played: 760ms, 520ms with reduced motion.
// The card flies in from the villain while it is still on screen. hits() returns the saved hit record at that moment;
// open() says whether the map is still the screen in view. talking() is true while the villain's exit line still plays:
// the card waits for it (at most 6 s), so the line and the card sounds take turns.
export function awardRewardCards(before,patch,hits,open,talking=()=>false){
  const won=newRewardCards(before,patch);
  if(!won.length)return;
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const index of won){
    flying.add(index);
    const since=Date.now();
    const show=()=>{
      if(!open()||!ownedRewardCards(hits())[index]){flying.delete(index);return;}
      // A dialog opened in the meantime (settings) sits above the card layer: wait until it is closed.
      if(document.querySelector('dialog[open]')){setTimeout(show,300);return;}
      if(talking()&&Date.now()-since<6000){setTimeout(show,150);return;}
      const foe=document.querySelector(`.map-encounter-foe[data-encounter="${REWARD_CARDS[index].id}"]`),box=foe?.getClientRects().length?foe.getBoundingClientRect():null;
      rewards().reveal(index,box?{x:box.left,y:box.top-28}:undefined,ownedRewardCards(hits())).finally(()=>flying.delete(index));
    };
    setTimeout(show,reduced?520:760);
  }
}
