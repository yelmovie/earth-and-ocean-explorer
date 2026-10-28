import { freshResearch, normalizeResearch, researchReady, pageReady } from './challenge-data.js';
import { chapters, sites, terrains, creatures, routes, tideHeight, finalCases } from './data.js';
export const SAVE_KEY = 'blue-planet-hq:v2';
export function freshState() {
  return { version: 2, contentVersion: 3, research: freshResearch(), route: 'home', resume: 'hub', history: [], settings: { muted: false, bgmEnabled: true, sfxEnabled: true, volume: 0.35, unlockAll: false, flatGlobe: false }, drafts: {
    1: { samples: [], atmosphere: false, classifications: {}, conclusion: '' },
    2: { fresh: 40, sea: 60, heatFresh: 1, heatSea: 2, prediction: '', prepared: false, heated: false, seenBefore: false, seenAfter: false, view: 'before', residue: '', reason: '' },
    3: { photos: [], pins: {}, features: {}, compare: '', pan: 50, target: 'sand' },
    4: { time: 0, a: null, b: null, markers: [], direction: '', concept: '' },
    5: { found: [], features: {}, selected: '', value: '', action: '' },
  }, completed: [], evidence: {}, links: {}, finalDraft: { caseIndex: 0, stage: null, reason: null }, issuedAt: null, revised: 0 };
}
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
function sanitizedDraft(n,d) {
  const out=freshState().drafts[n];if(!object(d))return out;
  for(const [key,value] of Object.entries(out)){
    const candidate=d[key];
    if(Array.isArray(value)&&Array.isArray(candidate))out[key]=[...new Set(candidate.filter(v=>typeof v==='string'))].slice(0,20);
    else if(value===null&&(candidate===null||(Number.isInteger(candidate)&&candidate>=0&&candidate<=6)))out[key]=candidate;
    else if(object(value)&&object(candidate))out[key]=Object.fromEntries(Object.entries(candidate).filter(([k,v])=>/^[a-z]+$/.test(k)&&(typeof v==='string'||(object(v)&&Number.isFinite(v.x)&&Number.isFinite(v.y)))).slice(0,20).map(([k,v])=>[k,typeof v==='string'?v.slice(0,180):{x:Math.max(5,Math.min(95,v.x)),y:Math.max(5,Math.min(95,v.y))}]));
    else if(typeof value===typeof candidate&&['string','number','boolean'].includes(typeof value)&&(typeof candidate!=='number'||Number.isFinite(candidate)))out[key]=typeof candidate==='string'?candidate.slice(0,180):candidate;
  }
  if(n===1)out.samples=out.samples.filter(id=>sites.some(s=>s.id===id));
  if(n===2){for(const k of ['fresh','sea'])if(![20,40,60].includes(out[k]))out[k]=40;for(const k of ['heatFresh','heatSea'])if(![1,2].includes(out[k]))out[k]=1;}
  if(n===3){out.photos=out.photos.filter(id=>terrains.some(s=>s.id===id));out.pan=Math.max(0,Math.min(100,out.pan));if(!terrains.some(t=>t.id===out.target))out.target='sand';}
  if(n===4)out.time=Math.max(0,Math.min(6,Math.round(out.time)));
  if(n===5)out.found=out.found.filter(id=>creatures.some(s=>s.id===id));
  return out;
}
export function normalize(raw) {
  const base = freshState();
  if (!object(raw) || raw.version !== 2) throw new Error('지원하지 않는 저장 형식');
  for (const key of ['muted', 'unlockAll', 'flatGlobe']) base.settings[key] = raw.settings?.[key] === true;
  for (const key of ['bgmEnabled','sfxEnabled']) base.settings[key] = typeof raw.settings?.[key]==='boolean'?raw.settings[key]:raw.settings?.muted!==true;
  base.research = normalizeResearch(raw.research);
  if (Number.isFinite(raw.settings?.volume)) base.settings.volume = Math.max(0, Math.min(1, raw.settings.volume));
  for(let n=1;n<=5;n++)base.drafts[n]=sanitizedDraft(n,raw.drafts?.[n]);
  for(let n=1;n<=5;n++)if(Array.isArray(raw.completed)&&raw.completed.includes(n)){
    const candidate={...base,drafts:{...base.drafts,[n]:sanitizedDraft(n,raw.evidence?.[n]?.data)}};
    const legacy=raw.evidence?.[n]?.contentVersion!==3;
    if(baseStageValid(candidate,n)&&(legacy||researchReady({...base,research:normalizeResearch({[n]:raw.evidence?.[n]?.research})},n))){base.completed.push(n);base.evidence[n]=legacy?{title:chapters[n-1].evidence,data:structuredClone(candidate.drafts[n]),contentVersion:2}: {...evidenceFor(candidate,n),research:structuredClone(normalizeResearch({[n]:raw.evidence[n].research})[n])};}
  }
  for (let i = 0; i < finalCases.length; i++) if (object(raw.links?.[i])) {
    const l = raw.links[i]; if (l.stage === finalCases[i].stage && l.reason === finalCases[i].answer && base.completed.includes(l.stage)) base.links[i] = { stage: l.stage, reason: l.reason };
  }
  if(Number.isInteger(raw.finalDraft?.caseIndex)&&raw.finalDraft.caseIndex>=0&&raw.finalDraft.caseIndex<5)base.finalDraft.caseIndex=raw.finalDraft.caseIndex;
  if([1,2,3,4,5].includes(raw.finalDraft?.stage))base.finalDraft.stage=raw.finalDraft.stage;
  if([0,1,2].includes(raw.finalDraft?.reason))base.finalDraft.reason=raw.finalDraft.reason;
  base.issuedAt = allLinked(base) && typeof raw.issuedAt === 'string' && !Number.isNaN(Date.parse(raw.issuedAt)) ? raw.issuedAt : null;
  base.route = routes.includes(raw.route) && canAccess(base, raw.route) ? raw.route : 'home';
  base.resume = routes.includes(raw.resume) && canAccess(base, raw.resume) ? raw.resume : 'hub';
  base.history = Array.isArray(raw.history) ? raw.history.filter(r => routes.includes(r)).slice(-40) : [];
  base.revised = Number.isInteger(raw.revised) ? Math.max(0, raw.revised) : 0;
  return base;
}
export function loadState(storage) {
  try { const raw = storage.getItem(SAVE_KEY); return { state: raw ? normalize(JSON.parse(raw)) : freshState(), warning: '' }; }
  catch { return { state: freshState(), warning: '저장 기록을 읽지 못했어. 이번 탐사는 새 기록으로 시작해. 브라우저 저장 권한을 확인해 줘.' }; }
}
export function saveState(storage, state) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(state)); return ''; }
  catch { return '저장 공간을 사용할 수 없어. 지금은 계속할 수 있지만 창을 닫으면 기록이 사라질 수 있어.'; }
}
export function aReady(s, n) {
  const d = s.drafts[n];
  if (n === 1) return new Set(d.samples).size >= 3 && d.atmosphere && ['육지', '바다'].every(t => d.samples.some(id => sites.find(v => v.id === id)?.type === t));
  if (n === 2) return d.prepared && [20,40,60].includes(d.fresh) && d.fresh === d.sea && [1,2].includes(d.heatFresh) && d.heatFresh === d.heatSea && ['same','different'].includes(d.prediction);
  if (n === 3) return terrains.every(t => d.photos.includes(t.id));
  if (n === 4) return Number.isInteger(d.a) && Number.isInteger(d.b) && d.a < d.b && tideHeight(d.a) !== tideHeight(d.b);
  return creatures.every(c => d.found.includes(c.id) && d.features[c.id] === c.feature);
}
export function baseStageValid(s, n) {
  if (!aReady(s, n)) return false;
  const d = s.drafts[n];
  if (n === 1) return d.samples.every(id => d.classifications[id] === sites.find(v => v.id === id)?.type) && d.conclusion === 'global';
  if (n === 2) return d.heated && d.seenBefore && d.seenAfter && d.residue === 'sea' && d.reason === 'dissolved';
  if (n === 3) return terrains.every(t => d.pins[t.id] && d.features[t.id] === t.feature) && d.compare === 'through';
  if (n === 4) return d.markers.includes('pole') && d.markers.includes('rock') && d.direction === (tideHeight(d.b) > tideHeight(d.a) ? 'up' : 'down') && d.concept === (tideHeight(d.b) > tideHeight(d.a) ? 'in' : 'out');
  return d.value === 'habitat' && d.action === 'observe';
}
export function canAccess(s, route) {
  if (!routes.includes(route)) return false;
  if (route === 'home' || route === 'hub' || s.settings.unlockAll) return true;
  const m = /^s([1-5])([abcd])$/.exec(route);
  if (m) { const n=+m[1]; return (n===1||s.completed.includes(n-1)) && (m[2]==='a'||m[2]==='b'&&aReady(s,n)||m[2]==='c'&&baseStageValid(s,n)||m[2]==='d'&&baseStageValid(s,n)&&pageReady(s,n,'c')); }
  if (route === 'report' || route === 'link') return s.completed.length === 5;
  return allLinked(s);
}
export function stageValid(s,n) { return baseStageValid(s,n)&&researchReady(s,n); }
export function evidenceFor(s, n) { return { title: chapters[n - 1].evidence, data: structuredClone(s.drafts[n]), contentVersion:3, research:structuredClone(s.research[n]) }; }
export function completeStage(s, n) {
  if (!stageValid(s, n)) return false;
  if (!s.completed.includes(n)) s.completed.push(n);
  s.evidence[n] = evidenceFor(s, n); return true;
}
export function allLinked(s) { return s.completed.length === 5 && finalCases.every((c,i) => s.links[i]?.stage === c.stage && s.links[i]?.reason === c.answer); }
export function linkEvidence(s, index, stage, reason) {
  const c = finalCases[index];
  if (!c || stage !== c.stage || reason !== c.answer) return 'wrong';
  if (!s.completed.includes(stage)) return 'practice';
  s.links[index] = { stage, reason };
  if (allLinked(s) && !s.issuedAt) s.issuedAt = new Date().toISOString();
  return 'saved';
}
