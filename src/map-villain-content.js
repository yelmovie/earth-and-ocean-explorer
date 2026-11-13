import {hubDoors,hubPointBehind} from './hub-world.js';

export const mapEncounterIds=['1','2','3','4','5'];
const lines=[
 ['이 깃발은 반대로 꽂지!','축척판 위엔 이 표지가 좋겠어!'],
 ['물 표본 이름표는 내가 가져갈게!','라벨 둘을 섞어 볼까?'],
 ['그 길은 이쪽이라고 해 두자!','화살표를 바다로 돌렸어!'],
 ['높이가 잘 안 보이지?','수위 눈금을 더 가려 볼까?'],
 ['갯벌 표찰은 내 쪽이야!','관찰 표지판을 살짝 돌릴까?'],
];
export const mapVillainStages=hubDoors.map((door,i)=>({
 id:mapEncounterIds[i],...hubPointBehind(door,42),name:'물때 교란 부표',
 lines:lines[i],prop:['flag','label','arrow','ruler','wave'][i],
 hit:['앗, 물결에 흔들렸어!','표지판이 돌아가잖아!'],finish:'표지판을 돌려놓고 갈게!',
}));
