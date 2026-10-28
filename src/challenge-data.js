// Each activity is a learning decision with observable evidence, not a click counter.
const choice=(id,title,prompt,options,answer,clue,art='')=>({id,type:'choice',title,prompt,options:options.map((label,i)=>({id:String(i),label})),answer:String(answer),clue,art});
const multi=(id,title,prompt,options,answer,clue,art='')=>({...choice(id,title,prompt,options,0,clue,art),type:'multi',answer:answer.map(String)});
const sort=(id,title,prompt,bins,items,clue,art='')=>({id,type:'sort',title,prompt,bins:bins.map(([id,label])=>({id,label})),items:items.map(([id,label,answer])=>({id,label,answer})),clue,art});
const match=(...args)=>({...sort(...args),type:'match'});
const order=(id,title,prompt,items,answer,clue,art='')=>({id,type:'order',title,prompt,items:items.map(([id,label])=>({id,label})),answer,clue,art});
export const challenges={
1:[
sort('earth-sort','지표 표본 정리','표본을 알맞은 보관함에 나누어요.',[['land','육지'],['sea','바다']],[['mountain','높은 산과 평지','land'],['ocean','끝없이 이어진 바닷물','sea'],['island','바다로 둘러싸인 섬의 땅','land'],['bay','해안 안쪽으로 들어온 바닷물','sea']],'섬의 땅도 육지예요. 육지와 바다는 색보다 무엇으로 이루어졌는지 살펴봐요.','earth'),
multi('air-find','보이지 않아도 있는 공기','대기에 대한 설명을 두 가지 골라요.',['지구를 둘러싸고 있어요','구름이 없는 곳에는 없어요','지구를 둘러싼 공기예요','바닷속 물만을 말해요'],[0,2],'대기는 지구를 둘러싼 공기예요. 맑은 날에도 우리 주위에 공기가 있어요.','earth'),
choice('wide-sea','어느 쪽이 더 넓을까?','지구 전체를 펼친 자료에서 더 넓은 부분을 골라요.',['바다','육지','두 부분의 넓이가 같아요'],0,'푸른 칸은 바다, 초록 칸은 육지예요. 칸 수를 정확히 외우기보다 어느 부분이 더 넓은지 비교해요.','ratio'),
sort('data-sort','두 종류의 기록','내가 고른 지점과 지구 전체 자료를 구분해요.',[['sample','내 관찰 표본'],['global','지구 전체 자료']],[['three','내가 스캔한 세 지점','sample'],['whole','지구 전체의 지표 면적 지도','global'],['asia','내가 고른 아시아 안쪽','sample'],['area','전 지표의 육지·바다 넓이 비교','global']],'몇 지점을 고른 기록과 지구 전체의 넓이를 나타낸 기록은 조사한 범위가 달라요.','earth'),
choice('island-new','새로운 섬에서','섬에 도착해 흙과 바위를 밟았어요. 이곳 지표는 무엇일까요?',['바다로 둘러싸였으니 바다예요','섬의 땅은 육지예요','작은 섬에는 지표가 없어요'],1,'주위를 둘러싼 물과 지금 발을 딛고 선 땅을 구분해서 보세요.','earth'),
choice('sample-new','친구의 표본을 검토해요','친구가 육지 세 곳만 골랐어요. 어떤 설명이 알맞을까요?',['지구에는 바다가 없어요','지구 전체도 육지가 더 넓어요','바다도 관찰하고 전체 면적 자료와 비교해요'],2,'표본을 고른 곳이 한쪽에 몰렸다면 다른 곳도 조사해야 해요. 표본 수가 전체 면적은 아니에요.','ratio'),
match('earth-words','관측소 설명판','세 설명을 알맞은 말과 연결해요.',[['land','육지'],['sea','바다'],['air','대기']],[['a','산과 평지처럼 땅으로 이루어진 곳','land'],['b','넓은 바닷물이 이어진 곳','sea'],['c','지구를 둘러싼 공기','air']],'지표를 이루는 육지·바다와 지구를 둘러싼 공기를 나누어 생각해요.','earth'),
choice('earth-claim','복구할 안내문','관찰 자료로 설명한 안내문을 골라요.',['지구에는 육지와 바다가 있고 바다가 더 넓어요','파란 곳만 지구의 표면이에요','구름이 지구의 땅을 이루어요'],0,'육지와 바다 모두 지구 표면을 이루어요. 전체 자료의 넓이도 함께 비교해요.','ratio')],
2:[
sort('fair-sort','공정한 비교 준비','조건 카드를 실험 계획에 나누어 넣어요.',[['same','같게 할 것'],['different','비교할 것']],[['amount','넣는 물의 양','same'],['heat','가열 세기와 시간','same'],['dish','가열하는 그릇','same'],['water','육지의 물과 바닷물','different']],'물의 종류 때문에 생긴 차이를 보려면 다른 조건을 같게 해야 해요.','lab'),
order('lab-order','실험 순서 복구','실험 카드를 먼저 할 일부터 눌러요.',[['d','남은 물질을 비교해요'],['b','두 물을 같은 양 준비해요'],['a','무엇이 남을지 예상해요'],['c','같은 세기와 시간으로 가열해요']],['a','b','c','d'],'예상 → 준비 → 관찰 → 비교 순서로 실험해요. 가열 전후의 변화가 근거예요.','lab'),
choice('unequal-water','어긋난 물의 양','육지의 물 20mL, 바닷물 60mL예요. 먼저 무엇을 바꿀까요?',['물의 양을 같게 해요','바닷물만 더 세게 가열해요','그대로 남는 양만 비교해요'],0,'넣은 물의 양이 다르면 물의 종류 때문에 생긴 차이인지 알기 어려워요.','lab'),
multi('residue-look','남은 흔적을 읽어요','가열 전후 기록으로 알 수 있는 설명 두 가지를 골라요.',['바닷물 쪽에 흰 물질이 더 뚜렷하게 남아요','맑은 물에는 어떤 물질도 녹지 않아요','가열 전에는 녹아 있던 물질이 잘 안 보여요','가열 장치가 소금을 새로 만들어요'],[0,2],'녹아 있으면 눈에 보이지 않을 수 있어요. 물이 사라진 뒤 보이는 흔적과 연결해요.','residue'),
choice('unknown-water','이름이 지워진 표본','같은 조건에서 가열했더니 A에 흰 물질이 더 남았어요. 어떤 설명이 좋을까요?',['A에는 녹아 있던 물질이 더 많았을 수 있어요','A에서 새 생물이 생겼어요','A는 가열 전부터 불투명했어요'],0,'가열 전에는 보이지 않던 물질도 물이 사라진 뒤 남을 수 있어요.','residue'),
choice('heat-fix','이번에는 가열 세기','물의 양은 같지만 바닷물만 더 세게 가열했어요. 어떻게 할까요?',['이번에도 종류만 공정하게 비교한 거예요','가열 세기도 같게 해서 다시 관찰해요','물의 이름만 바꾸어요'],1,'한 번에 물의 종류만 다르게 해야 비교가 공정해져요.','lab'),
match('lab-evidence','관찰과 설명을 연결해요','각 관찰에 맞는 설명을 연결해요.',[['clear','녹은 물질이 보이지 않을 수 있어요'],['remain','녹아 있던 물질이 남았어요'],['fair','물의 종류에 따른 차이를 비교해요']],[['before','가열 전 두 물이 모두 맑아요','clear'],['after','물은 줄고 바닷물 쪽에 흰 흔적이 남아요','remain'],['same','양·그릇·가열 세기·시간을 같게 했어요','fair']],'맑음, 남은 흔적, 같은 실험 조건은 서로 다른 근거예요.','residue'),
multi('safe-lab','실제 실험 약속','안전한 약속 두 가지를 골라요.',['정체 모를 물을 맛보아요','어른의 안내에 따라 가열해요','뜨거운 그릇은 바로 만지지 않아요','물의 양이 달라도 결과를 같다고 해요'],[1,2],'이 화면은 가상 실험이에요. 실제 가열은 어른의 안내를 따르고 뜨거운 도구를 조심해요.','lab')],
3:[
match('coast-match','해안 표지판 복구','사진 속 특징을 지형 이름에 연결해요.',[['sand','모래사장'],['cliff','절벽'],['cave','동굴'],['arch','구멍 난 바위']],[['grain','고운 모래가 넓게 펼쳐져요','sand'],['steep','바위 면이 높고 가파르게 서 있어요','cliff'],['inside','바위 안쪽으로 어두운 빈 공간이 이어져요','cave'],['through','뚫린 바위 너머로 바다가 보여요','arch']],'재료와 모양을 함께 봐요. 빈 공간이 있다고 모두 같은 지형은 아니에요.','coast'),
sort('coast-material','무엇으로 이루어졌지?','관찰 특징을 재료에 따라 나누어요.',[['sand','모래'],['rock','바위']],[['a','작은 모래 알갱이가 펼쳐져요','sand'],['b','단단한 면이 가파르게 서 있어요','rock'],['c','큰 바위 안에 빈 공간이 있어요','rock'],['d','손가락 사이로 흩어지는 고운 알갱이예요','sand']],'색이 비슷해도 재료가 달라요. 모래 알갱이와 단단한 바위 면을 구분해요.','coast'),
choice('cave-arch','비슷한 두 바위','이 장면에서 구멍 난 바위의 특징을 골라요.',['빈 공간 너머 반대편 바다가 보여요','모래 알갱이가 넓게 쌓여 있어요','평평한 땅만 이어져요'],0,'바위가 뚫린 부분을 통해 반대편 풍경이 보이는지 확인해요.','arch'),
order('field-order','사진 조사 순서','안내 지도를 만드는 순서대로 카드를 눌러요.',[['d','사진과 설명을 안내 지도에 넣어요'],['b','지형 사진을 찍어요'],['a','재료와 모양을 살펴봐요'],['c','사진에 보이는 특징을 기록해요']],['a','b','c','d'],'먼저 실제 특징을 살펴봐야 사진과 이름을 근거로 연결할 수 있어요.','coast'),
choice('new-cliff','처음 보는 해안','단단한 바위가 높고 가파르게 서 있어요. 어떤 지형일까요?',['동굴','절벽','모래사장'],1,'높고 가파른 바위 면인지, 안쪽 공간인지, 모래인지 비교해요.','cliff'),
match('wrong-signs','뒤바뀐 안내판','설명을 읽고 알맞은 이름표를 찾아요.',[['sand','모래사장'],['cave','동굴'],['arch','구멍 난 바위'],['cliff','절벽']],[['one','넓게 펼쳐진 고운 모래','sand'],['two','바위 안쪽으로 이어지는 공간','cave'],['three','구멍 너머 하늘과 바다','arch'],['four','높고 가파른 바위 면','cliff']],'이름이 아닌 관찰한 모양이 이름표를 고르는 근거예요.','coast'),
multi('coast-safety','안전한 탐사길','현장에서 지킬 약속 두 가지를 골라요.',['절벽 가장자리로 다가가요','안전한 길에서 모양을 살펴봐요','어두운 동굴 안으로 혼자 들어가요','위험한 곳은 사진 자료로 조사해요'],[1,3],'지형 조사는 위험한 곳에 직접 들어가지 않아도 할 수 있어요. 안전한 곳과 사진 자료를 이용해요.','coast'),
choice('coast-claim','사진의 설명을 고쳐요','친구가 바닷가는 모두 모래사장이라고 해요. 어떤 기록이 도움이 될까요?',['바닷가를 한 장만 찍은 사진','모래·가파른 바위·빈 공간이 담긴 여러 사진','사진의 색깔만 적은 기록'],1,'해안에는 재료와 모양이 다른 여러 지형이 있어요. 서로 다른 관찰 자료를 비교해요.','coast')],
4:[
order('time-order','관측 기록을 시간순으로','빠른 시각부터 카드를 눌러요.',[['noon','12:00 물이 낮은 장면'],['dawn','06:00 물이 낮은 장면'],['morning','09:00 물이 높은 장면']],['dawn','morning','noon'],'물이 낮은 사진끼리도 시각이 다를 수 있어요. 시간과 물 높이를 따로 살펴봐요.','tide'),
match('tide-match','변화 방향을 연결해요','앞선 기록과 나중 기록의 차이를 연결해요.',[['in','밀물 · 물이 들어와요'],['out','썰물 · 물이 빠져요'],['same','이 두 기록은 높이가 같아요']],[['rise','물 높이가 낮음 → 높음','in'],['fall','물 높이가 높음 → 낮음','out'],['level','물 높이가 낮음 → 똑같이 낮음','same']],'물이 들어오는 동안은 높아지고, 빠지는 동안은 낮아져요. 한 장만으로 방향을 알 수 없어요.','tide'),
choice('incoming-proof','같은 기둥을 비교해요','A 06:00보다 B 09:00에 물이 기둥의 더 높은 곳에 닿아요. 어떤 변화일까요?',['물이 들어오는 밀물','물이 빠지는 썰물','기둥이 스스로 자란 것'],0,'같은 기준물에 닿는 수면을 A에서 B 순서로 비교해요.','incoming'),
sort('water-scenes','같은 바위의 모습','물 높이가 높을 때와 낮을 때의 모습을 나누어요.',[['high','물 높이가 높을 때'],['low','물 높이가 낮을 때']],[['rock','바위의 드러난 부분이 작아요','high'],['wide','갯벌이 더 넓게 드러나요','low'],['pole','기둥의 더 높은 곳에 물이 닿아요','high'],['path','잠겼던 낮은 길이 드러나요','low']],'주변 지형이 그대로일 때 물이 덮는 부분이 달라지는지 살펴봐요.','tide'),
choice('outgoing-proof','반대 변화도 관측해요','A 09:00보다 B 12:00에 바위가 더 많이 드러났어요. 어떤 변화일까요?',['물이 들어오는 밀물','물이 빠지는 썰물','바위가 사라진 것'],1,'물에 잠겼던 바위가 더 드러났다면 수면이 어느 쪽으로 움직였는지 생각해요.','outgoing'),
choice('same-level','한 장면만으로 알 수 있을까?','A와 B의 물 높이가 같아요. 어떤 기록이 더 필요할까요?',['그 사이 다른 시각의 기록','바위의 색깔만 적은 기록','사진 제목만 바꾼 기록'],0,'같은 높이여도 그 사이에 들어왔다가 빠졌을 수 있어요. 다른 시각을 더 살펴봐요.','tide'),
multi('tide-safety','물이 들어오면','갯벌 탐사 중 물이 들어와요. 안전한 행동 두 가지를 골라요.',['안내에 따라 안전한 길로 돌아가요','낮은 바위에서 계속 놀아요','현장의 안전 안내와 실제 물때를 확인해요','게임 속 시각만 믿고 바다에 가요'],[0,2],'게임의 시간은 설명용이에요. 실제 바다에서는 현장 안내와 실제 관측 정보를 따라요.','incoming'),
choice('tide-model','관측 장치의 역할','화면의 시간 막대를 움직였어요. 무엇을 한 걸까요?',['실제 바닷물을 움직였어요','기록된 여러 시각의 장면을 살펴봤어요','매일 바다의 정확한 물때를 알아냈어요'],1,'이 화면은 관측 기록을 단순화한 모형이에요. 실제 바다를 조종하거나 물때를 예보하지 않아요.','tide')],
5:[
match('life-match','생태 도감의 빈칸','생김새와 움직임을 생물과 연결해요.',[['crab','게'],['skipper','짱뚱어'],['reed','갈대']],[['claw','집게가 있고 옆으로 걸어요','crab'],['eyes','눈이 머리 위로 솟고 지느러미로 움직여요','skipper'],['roots','뿌리를 내리고 줄기와 잎이 자라요','reed']],'확대 관찰에서 본 특징을 근거로 삼아요. 움직이지 않는 식물도 생물이에요.','life'),
sort('protect-sort','관찰자의 선택','갯벌을 지키는 행동과 해치는 행동으로 나누어요.',[['keep','갯벌을 지켜요'],['harm','갯벌을 해쳐요']],[['watch','거리를 두고 생물을 관찰해요','keep'],['trash','내 쓰레기는 되가져가요','keep'],['dig','생물의 구멍을 모두 파헤쳐요','harm'],['catch','보이는 생물을 전부 잡아요','harm']],'갯벌은 살아가는 생물의 집이에요. 관찰 뒤에도 생물과 집이 남아야 해요.','life'),
multi('mud-value','갯벌이 소중한 까닭','관찰 기록으로 뒷받침할 수 있는 설명 두 가지를 골라요.',['여러 생물이 살아가는 곳이에요','아무것도 없는 빈 땅이에요','동물과 식물이 함께 살아가요','단단한 바닥으로 모두 덮어야 해요'],[0,2],'게·짱뚱어·갈대의 기록을 함께 보세요. 각각 어떤 생물인지 생각해요.','life'),
order('eco-order','생물을 만나는 순서','생물의 집을 지키며 탐사하는 순서로 눌러요.',[['d','집을 그대로 두고 돌아와요'],['b','안전한 거리에서 특징을 관찰해요'],['a','발자국이나 구멍을 찾아요'],['c','관찰한 내용을 기록해요']],['a','b','c','d'],'흔적 찾기 → 관찰 → 기록 → 보전이 이어지도록 해요.','life'),
match('poster-build','보호 안내판 만들기','주장·증거·행동에 맞는 문장을 연결해요.',[['claim','우리의 주장'],['proof','관찰한 증거'],['action','함께 할 행동']],[['protect','갯벌을 소중하게 지켜요','claim'],['observed','게·짱뚱어·갈대를 관찰했어요','proof'],['promise','구멍은 그대로 두고 쓰레기를 되가져가요','action']],'왜 지켜야 하는지 관찰한 생물로 설명하고, 실제 할 수 있는 행동을 제안해요.','poster'),
choice('new-friend','친구를 설득해요','친구가 갯벌을 비어 있는 땅이라고 해요. 어떤 말이 도움이 될까요?',['우리 도감의 생물과 특징을 보여 주어요','무조건 틀렸다고만 말해요','갯벌 사진을 보지 못하게 해요'],0,'설득할 때는 내 생각뿐 아니라 실제로 관찰한 근거를 함께 보여 주어요.','life'),
choice('burrow-house','구멍 속 친구의 집','친구가 생물의 구멍을 전부 파 보자고 해요. 어떤 제안이 좋을까요?',['모두 파면 더 잘 보호할 수 있어요','집이 망가지지 않도록 밖에서 흔적을 관찰해요','구멍을 쓰레기로 채워요'],1,'구멍은 생물의 집일 수 있어요. 집을 해치지 않고 알 수 있는 방법을 찾아봐요.','life'),
multi('promise-new','새 탐사대의 약속','탐사대를 위한 약속 두 가지를 골라 안내판을 완성해요.',['생물을 집으로 모두 데려와요','안전한 탐사길과 현장 안내를 따라요','관찰 흔적과 쓰레기만 남겨요','생물의 집을 건드리지 않고 쓰레기는 되가져가요'],[1,3],'생물이 계속 살아갈 집과 우리의 안전을 함께 생각해요.','poster')]
};
export const pageChallenges=(n,step)=>challenges[n].slice(step==='c'?0:4,step==='c'?4:8);
export function correctResponse(task,response){
 if(task.type==='choice')return response===task.answer;
 if(task.type==='multi')return Array.isArray(response)&&response.length===task.answer.length&&task.answer.every(x=>response.includes(x));
 if(task.type==='order')return Array.isArray(response)&&task.answer.length===response.length&&task.answer.every((x,i)=>response[i]===x);
 return response&&typeof response==='object'&&!Array.isArray(response)&&task.items.every(x=>response[x.id]===x.answer)&&Object.keys(response).length===task.items.length;
}
export const freshResearch=()=>Object.fromEntries([1,2,3,4,5].map(n=>[n,{answers:{},solved:[],c:0,d:0}]));
export const pageReady=(s,n,step)=>pageChallenges(n,step).every(t=>s.research?.[n]?.solved.includes(t.id)&&correctResponse(t,s.research[n].answers[t.id]));
export const researchReady=(s,n)=>pageReady(s,n,'c')&&pageReady(s,n,'d');
export function normalizeResearch(raw){const out=freshResearch();for(let n=1;n<=5;n++){const r=raw?.[n];if(!r||typeof r!=='object')continue;for(const t of challenges[n]){let v=r.answers?.[t.id];if(t.type==='choice'){if(t.options.some(o=>o.id===v))out[n].answers[t.id]=v;}else if(['order','multi'].includes(t.type)&&Array.isArray(v)){const ids=(t.items??t.options).map(i=>i.id);out[n].answers[t.id]=[...new Set(v.filter(x=>ids.includes(x)))].slice(0,ids.length);}else if(v&&typeof v==='object'&&!Array.isArray(v)){out[n].answers[t.id]=Object.fromEntries(t.items.filter(i=>t.bins.some(b=>b.id===v[i.id])).map(i=>[i.id,v[i.id]]));}if(Array.isArray(r.solved)&&r.solved.includes(t.id)&&correctResponse(t,out[n].answers[t.id]))out[n].solved.push(t.id);}for(const step of ['c','d'])out[n][step]=Number.isInteger(r[step])?Math.max(0,Math.min(3,r[step])):0;}return out;}
