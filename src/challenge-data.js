// Each activity is a learning decision with observable evidence, not a click counter.
const choice=(id,title,prompt,options,answer,clue,art='')=>({id,type:'choice',title,prompt,options:options.map((label,i)=>({id:String(i),label})),answer:String(answer),clue,art});
const multi=(id,title,prompt,options,answer,clue,art='')=>({...choice(id,title,prompt,options,0,clue,art),type:'multi',answer:answer.map(String)});
const sort=(id,title,prompt,bins,items,clue,art='')=>({id,type:'sort',title,prompt,bins:bins.map(([id,label])=>({id,label})),items:items.map(([id,label,answer])=>({id,label,answer})),clue,art});
const match=(...args)=>({...sort(...args),type:'match'});
const order=(id,title,prompt,items,answer,clue,art='',before=[])=>({id,type:'order',title,prompt,items:items.map(([id,label])=>({id,label})),answer,clue,art,before});
export const challenges={
1:[
multi('air-find','보이지 않아도 있는 공기','대기에 대한 설명을 두 가지 골라요.',['구름이 없는 맑은 날에도 있어요','구름이 없는 곳에는 없어요','지구를 둘러싼 공기예요','바닷속 물만을 말해요'],[0,2],'구름이 보이지 않는 맑은 날에도 숨을 쉴 수 있는 까닭을 생각해요.','atmosphere'),
match('earth-words','관측소 설명판','세 설명을 알맞은 말과 연결해요.',[['land','육지'],['sea','바다'],['air','대기']],[['a','산과 평지처럼 땅으로 이루어진 곳','land'],['b','넓은 바닷물이 이어진 곳','sea'],['c','지구를 둘러싼 공기','air']],'지표를 이루는 육지·바다와 지구를 둘러싼 공기를 나누어 생각해요.','earth-layers'),
choice('island-new','새로운 섬에서','섬에 도착해 흙과 바위를 밟았어요. 이곳 지표는 무엇일까요?',['바다로 둘러싸였으니 바다예요','섬의 땅은 육지예요','작은 섬에는 지표가 없어요'],1,'주위를 둘러싼 물과 지금 발을 딛고 선 땅을 구분해서 보세요.','island'),
choice('sample-new','친구의 표본을 검토해요','친구가 육지 세 곳만 골랐어요. 어떤 설명이 알맞을까요?',['지구에는 바다가 없어요','지구 전체도 육지가 더 넓어요','바다도 관찰하고 전체 면적 자료와 비교해요'],2,'표본은 내가 골라 관찰한 일부예요. 몇 곳을 셌는지와 지구 전체의 넓이를 구분해요.','ratio')],
2:[
order('lab-order','실험 순서 복구','실험 카드를 먼저 할 일부터 눌러요.',[['d','남은 물질을 비교해요'],['b','물의 양과 가열 세기를 맞춰요'],['a','무엇이 남을지 예상해요'],['c','같은 시간 가열하고 함께 끝내요']],['a','b','c','d'],'예상과 조건 맞추기를 모두 가열 전에 마쳐요. 같은 양·세기·시간으로 가열하고 함께 끝낸 뒤 비교해요.','lab',[['a','c'],['b','c'],['c','d']]),
multi('residue-look','남은 흔적을 읽어요','이번 가열 실험의 전후 기록으로 알 수 있는 설명 두 가지를 골라요.',['바닷물 쪽에 흰 물질이 더 뚜렷하게 남아요','맑은 물에는 어떤 물질도 녹지 않아요','가열 전에는 녹아 있던 물질이 잘 안 보여요','가열 장치가 소금을 새로 만들어요'],[0,2],'녹아 있으면 눈에 보이지 않을 수 있어요. 물이 증발한 뒤 보이는 흔적과 연결해요.','residue'),
choice('unknown-water','이름이 지워진 표본','같은 양의 두 물을 같은 조건에서 모두 증발시켰어요. A에 흰 물질이 더 남았다면 어떤 설명이 좋을까요?',['A에는 녹아 있던 물질이 더 많았을 수 있어요','A에서 새 생물이 생겼어요','A는 가열 전부터 불투명했어요'],0,'가열 전에는 보이지 않던 물질도 물이 증발한 뒤 남을 수 있어요.','salt-field'),
choice('heat-fix','이번에는 가열 세기','물의 양은 같지만 바닷물만 더 세게 가열했어요. 어떻게 할까요?',['이번에도 종류만 공정하게 비교한 거예요','가열 세기도 같게 해서 다시 관찰해요','물의 이름만 바꾸어요'],1,'한 번에 물의 종류만 다르게 해야 비교가 공정해져요.','lab')],
3:[
sort('coast-material','무엇으로 이루어졌지?','관찰 특징을 재료에 따라 나누어요.',[['sand','모래'],['rock','바위']],[['a','작은 모래 알갱이가 펼쳐져요','sand'],['b','단단한 면이 가파르게 서 있어요','rock'],['c','큰 바위 안에 빈 공간이 있어요','rock'],['d','손가락 사이로 흩어지는 고운 알갱이예요','sand']],'색이 비슷해도 재료가 달라요. 모래 알갱이와 단단한 바위 면을 구분해요.','coast-material'),
multi('coast-safety','안전한 탐사길','현장에서 지킬 약속 두 가지를 골라요.',['절벽 가장자리로 다가가요','안전한 길에서 모양을 살펴봐요','어두운 동굴 안으로 혼자 들어가요','위험한 곳은 사진 자료로 조사해요'],[1,3],'지형 조사는 위험한 곳에 직접 들어가지 않아도 할 수 있어요. 안전한 곳과 사진 자료를 이용해요.','coast-safety'),
choice('new-cliff','처음 보는 해안','단단한 바위가 높고 가파르게 서 있어요. 어떤 지형일까요?',['동굴','절벽','모래사장'],1,'높고 가파른 바위 면인지, 안쪽 공간인지, 모래인지 비교해요.','cliff-new'),
choice('coast-claim','사진의 설명을 고쳐요','친구가 바닷가는 모두 모래사장이라고 해요. 어떤 기록이 도움이 될까요?',['바닷가를 한 장만 찍은 사진','모래·가파른 바위·빈 공간이 담긴 여러 사진','사진의 색깔만 적은 기록'],1,'해안에는 재료와 모양이 다른 여러 지형이 있어요. 서로 다른 관찰 자료를 비교해요.','coast')],
4:[
order('time-order','관측 기록을 시간순으로','빠른 시각부터 카드를 눌러요.',[['noon','18:00 물이 낮은 장면'],['dawn','06:00 물이 낮은 장면'],['morning','12:00 물이 높은 장면']],['dawn','morning','noon'],'물이 낮은 사진끼리도 시각이 다를 수 있어요. 시간과 물 높이를 따로 살펴봐요.','tide'),
sort('water-scenes','같은 바위의 모습','물 높이가 높을 때와 낮을 때의 모습을 나누어요.',[['high','물 높이가 높을 때'],['low','물 높이가 낮을 때']],[['rock','바위의 드러난 부분이 작아요','high'],['wide','갯벌이 더 넓게 드러나요','low'],['pole','기둥의 더 높은 곳에 물이 닿아요','high'],['path','잠겼던 낮은 길이 드러나요','low']],'주변 지형이 그대로일 때 물이 덮는 부분이 달라지는지 살펴봐요.','tide'),
choice('outgoing-proof','반대 변화도 관측해요','A 12:00보다 B 18:00에 바위가 더 많이 드러났어요. 어떤 변화일까요?',['물이 들어오는 밀물','물이 빠지는 썰물','바위가 사라진 것'],1,'이 모형의 12:00부터 18:00까지 기록을 차례로 보고, 물 높이와 드러난 바위를 비교해요.','outgoing'),
multi('tide-safety','물이 들어오면','갯벌 탐사 중 물이 들어와요. 안전한 행동 두 가지를 골라요.',['안내에 따라 안전한 길로 돌아가요','낮은 바위에서 계속 놀아요','해당 장소·날짜의 공식 물때와 현장 안내를 확인해요','게임 속 시각만 믿고 바다에 가요'],[0,2],'게임의 시간은 설명용이에요. 실제 체험 전에는 어른과 해당 장소·날짜의 국립해양조사원 공식 물때와 현장 안내를 확인해요.','tide-safety')],
5:[
match('life-match','생태 도감의 빈칸','생김새와 움직임을 생물과 연결해요.',[['crab','게'],['skipper','짱뚱어'],['reed','갈대']],[['claw','집게가 있고 옆으로 걸어요','crab'],['eyes','눈이 머리 위로 솟고 지느러미로 움직여요','skipper'],['roots','뿌리를 내리고 줄기와 잎이 자라요','reed']],'확대 관찰에서 본 특징을 근거로 삼아요. 움직이지 않는 식물도 생물이에요.','life'),
sort('protect-sort','관찰자의 선택','갯벌을 지키는 행동과 해치는 행동으로 나누어요.',[['keep','갯벌을 지켜요'],['harm','갯벌을 해쳐요']],[['watch','거리를 두고 생물을 관찰해요','keep'],['trash','내 쓰레기는 되가져가요','keep'],['dig','생물의 구멍을 모두 파헤쳐요','harm'],['catch','보이는 생물을 전부 잡아요','harm']],'갯벌은 살아가는 생물의 집이에요. 관찰 뒤에도 생물과 집이 남아야 해요.','mudflat-protect'),
choice('new-friend','친구를 설득해요','친구가 갯벌을 비어 있는 땅이라고 해요. 어떤 말이 도움이 될까요?',['우리 도감의 생물과 특징을 보여 주어요','무조건 틀렸다고만 말해요','갯벌 사진을 보지 못하게 해요'],0,'설득할 때는 내 생각뿐 아니라 실제로 관찰한 근거를 함께 보여 주어요.','mudflat-life'),
match('poster-build','보호 안내판 만들기','주장·증거·행동에 맞는 문장을 연결해요.',[['claim','우리의 주장'],['proof','관찰한 증거'],['action','함께 할 행동']],[['protect','갯벌을 소중하게 지켜요','claim'],['observed','게·짱뚱어·갈대를 관찰했어요','proof'],['promise','구멍은 그대로 두고 쓰레기를 되가져가요','action']],'왜 지켜야 하는지 관찰한 생물로 설명하고, 실제 할 수 있는 행동을 제안해요.','poster')]
};
// Shown after a correct answer so the key idea stays with the learner.
const why={
'air-find':'대기는 지구를 둘러싼 공기예요. 구름이 없는 맑은 날에도 늘 있어요.',
'earth-words':'지구 표면은 육지와 바다로 이루어지고, 그 둘레를 대기가 감싸요.',
'island-new':'섬은 바다로 둘러싸여 있지만, 발을 딛는 땅은 육지예요.',
'sample-new':'몇 곳의 표본만으로는 알 수 없어요. 지구 전체 자료로 보면 바다가 더 넓어요.',
'lab-order':'예상과 조건 맞추기는 어느 쪽이 먼저여도 돼요. 둘 다 가열 전에 마치고 같은 양·세기·시간으로 가열해 함께 끝낸 뒤 비교해요.',
'residue-look':'물이 증발하면 녹아 있던 물질이 남아요. 바닷물에는 소금 등이 더 많이 녹아 있어요.',
'unknown-water':'염전도 같은 원리예요. 바닷물이 증발하면 녹아 있던 소금이 남아요.',
'heat-fix':'비교하려는 물의 종류만 다르게 하고, 양·가열 세기·시간은 모두 같게 해요.',
'coast-material':'모래사장은 고운 모래로, 절벽과 동굴은 단단한 바위로 이루어져요.',
'coast-safety':'위험한 곳에는 들어가지 않고, 안전한 길과 사진 자료로 지형을 조사해요.',
'new-cliff':'높고 가파르게 선 바위 면은 절벽이에요. 처음 보는 곳도 모양으로 알아봐요.',
'coast-claim':'해안에는 모래사장·절벽·동굴·구멍 난 바위처럼 여러 지형이 있어요.',
'time-order':'시간 순서대로 놓아야 물 높이가 어떻게 변했는지 알 수 있어요.',
'water-scenes':'물이 높으면 바위와 기둥이 더 잠기고, 낮으면 갯벌과 길이 드러나요.',
'outgoing-proof':'물이 빠지며 같은 곳의 물 높이가 낮아지는 변화가 썰물이에요.',
'tide-safety':'물은 들어오면서 빠르게 차오를 수 있어요. 해당 장소·날짜의 공식 물때와 현장 안내를 어른과 확인해요.',
'life-match':'생김새와 움직임이 생물을 구별하는 근거예요. 갈대처럼 식물도 생물이에요.',
'protect-sort':'생물의 집을 그대로 두고 쓰레기를 되가져가는 것이 갯벌을 지키는 행동이에요.',
'new-friend':'갯벌은 비어 있는 땅이 아니라 여러 생물이 함께 살아가는 곳이에요.',
'poster-build':'주장에 관찰한 증거와 실천할 행동을 더하면 설득력 있는 안내판이 돼요.',
};
for(const list of Object.values(challenges))for(const task of list)task.why=why[task.id];
// Each chapter page shows two distinct tasks: 도전(c) then 새 상황 적용(d).
export const PAGE_SIZE=2;
export const CHAPTER_TASKS=PAGE_SIZE*2;
export const pageChallenges=(n,step)=>challenges[n].slice(step==='c'?0:PAGE_SIZE,step==='c'?PAGE_SIZE:CHAPTER_TASKS);
export function correctResponse(task,response){
 if(task.type==='choice')return response===task.answer;
 if(task.type==='multi')return Array.isArray(response)&&response.length===task.answer.length&&task.answer.every(x=>response.includes(x));
 if(task.type==='order'){
  if(!Array.isArray(response)||response.length!==task.items.length||new Set(response).size!==response.length||!task.items.every(item=>response.includes(item.id)))return false;
  return task.before?.length?task.before.every(([first,last])=>response.indexOf(first)<response.indexOf(last)):task.answer.every((id,index)=>response[index]===id);
 }
 return response&&typeof response==='object'&&!Array.isArray(response)&&task.items.every(x=>response[x.id]===x.answer)&&Object.keys(response).length===task.items.length;
}
// Only the learner's draft is shown after a missed judgment.
export function mistakeHint(task,response){
 if(correctResponse(task,response))return null;
 if(['sort','match'].includes(task.type))return {wrong:[],text:'카드를 다시 눌러요. 카드의 특징을 내가 고른 칸의 기준과 비교해요.'};
 if(task.type==='multi'&&Array.isArray(response))return {wrong:[],text:'고른 보기마다 자료에서 관찰한 근거가 있는지 확인해요.'};
 if(task.type==='order'&&task.before?.length&&Array.isArray(response))return {wrong:[],text:'예상과 조건 맞추기가 모두 가열 전인지, 남은 물질은 가열이 끝난 뒤 비교했는지 살펴봐요.'};
 if(task.type==='order'&&Array.isArray(response))return {wrong:[],text:'관찰 자료에서 이웃한 두 장면을 찾아요. 두 카드 사이에서 무엇이 바뀌었는지 비교해요.'};
 if(task.type==='choice'&&response!==undefined)return {wrong:[],text:'고른 답이 관찰 자료와 맞는지 다시 살펴봐요.'};
 return null;
}
// firstTry: 처음 낸 답이 맞은 문제, missed: 한 번이라도 틀린 문제(2026-11-21, 반복 선택과 첫 시도 정답을 구분). 옛 저장에는 없으면 빈 목록.
export const freshResearch=()=>Object.fromEntries([1,2,3,4,5].map(n=>[n,{answers:{},solved:[],firstTry:[],missed:[],c:0,d:0}]));
export const pageReady=(s,n,step)=>pageChallenges(n,step).every(t=>s.research?.[n]?.solved.includes(t.id)&&correctResponse(t,s.research[n].answers[t.id]));
export const researchReady=(s,n)=>pageReady(s,n,'c')&&pageReady(s,n,'d');
export function normalizeResearch(raw){const out=freshResearch();for(let n=1;n<=5;n++){const r=raw?.[n];if(!r||typeof r!=='object')continue;for(const t of challenges[n]){let v=r.answers?.[t.id];if(t.type==='choice'){if(t.options.some(o=>o.id===v))out[n].answers[t.id]=v;}else if(['order','multi'].includes(t.type)&&Array.isArray(v)){const ids=(t.items??t.options).map(i=>i.id);out[n].answers[t.id]=[...new Set(v.filter(x=>ids.includes(x)))].slice(0,ids.length);}else if(['sort','match'].includes(t.type)&&v&&typeof v==='object'&&!Array.isArray(v)){out[n].answers[t.id]=Object.fromEntries(t.items.filter(i=>t.bins.some(b=>b.id===v[i.id])).map(i=>[i.id,v[i.id]]));}if(Array.isArray(r.solved)&&r.solved.includes(t.id)&&correctResponse(t,out[n].answers[t.id]))out[n].solved.push(t.id);if(Array.isArray(r.missed)&&r.missed.includes(t.id))out[n].missed.push(t.id);if(Array.isArray(r.firstTry)&&r.firstTry.includes(t.id)&&!out[n].missed.includes(t.id))out[n].firstTry.push(t.id);}for(const step of ['c','d'])out[n][step]=Number.isInteger(r[step])?Math.max(0,Math.min(PAGE_SIZE-1,r[step])):0;}return out;}
