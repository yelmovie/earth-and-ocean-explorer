// Shared geometry for drawing, touch navigation, collision and independent tests.
// Coordinates refer to the 960 × 540 island. Feet, rather than sprite centres, move.
export const hubMap = { width: 960, height: 540, radius: 6, roadRadius: 20, spawn: { x: 459, y: 242 } };
export const hubDoors = [
  { id: 1, x: 215, y: 139, buildingX: 215, buildingY: 112 },
  { id: 2, x: 664, y: 139, buildingX: 664, buildingY: 112 },
  { id: 3, x: 750, y: 272, buildingX: 750, buildingY: 245 },
  { id: 4, x: 552, y: 402, buildingX: 552, buildingY: 375 },
  { id: 5, x: 276, y: 387, buildingX: 276, buildingY: 360 },
];
export const hubNodes = [
  ...hubDoors.map(({ x, y }) => ({ x, y })),
  { x: 238, y: 164 }, { x: 310, y: 194 }, { x: 365, y: 217 }, { x: 420, y: 232 },
  { x: 621, y: 164 }, { x: 629, y: 185 }, { x: 565, y: 200 }, { x: 511, y: 223 },
  { x: 721, y: 214 }, { x: 686, y: 195 },
  { x: 555, y: 342 }, { x: 522, y: 291 }, { x: 507, y: 270 },
  { x: 314, y: 322 }, { x: 363, y: 286 }, hubMap.spawn,
];
export const hubEdges = [[0,5],[5,6],[6,7],[7,8],[8,20],[1,9],[9,10],[10,11],[11,12],[12,20],[2,13],[13,14],[14,10],[3,15],[15,16],[16,17],[17,20],[4,18],[18,19],[19,20]];
export const hubSegments = hubEdges.map(([a,b]) => [hubNodes[a],hubNodes[b]]);
export const hubDistance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const projection = (p,a,b) => {
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return { x:a.x+dx*t,y:a.y+dy*t };
};
export function nearestHubRoad(point) {
  let best = { point: hubMap.spawn, edge: 0, distance: Infinity };
  hubSegments.forEach(([a,b],edge)=>{const p=projection(point,a,b),distance=hubDistance(point,p);if(distance<best.distance)best={point:p,edge,distance};});
  return best;
}
export function canStandInHub(point) {
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return false;
  return nearestHubRoad(point).distance <= hubMap.roadRadius-hubMap.radius || hubDistance(point,hubMap.spawn)<=43 || hubDoors.some(door=>hubDistance(point,door)<=26);
}
export function moveHubPoint(start,delta) {
  let point={...start};
  const count=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.y)/4));
  for(let i=0;i<count;i++){
    const dx=delta.x/count,dy=delta.y/count,next={x:point.x+dx,y:point.y+dy};
    if(canStandInHub(next))point=next;
    else if(canStandInHub({x:point.x+dx,y:point.y}))point={x:point.x+dx,y:point.y};
    else if(canStandInHub({x:point.x,y:point.y+dy}))point={x:point.x,y:point.y+dy};
  }
  return point;
}
export function findHubPath(from,to) {
  if(!canStandInHub(from))return [];
  const source=nearestHubRoad(from),destination=nearestHubRoad(to);
  if(source.edge===destination.edge)return [source.point,destination.point];
  const nodes=[...hubNodes,source.point,destination.point],start=nodes.length-2,goal=nodes.length-1;
  const edges=[...hubEdges,...hubEdges[source.edge].map(i=>[start,i]),...hubEdges[destination.edge].map(i=>[goal,i])];
  const distances=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set();distances[start]=0;
  while(visited.size<nodes.length){
    let current=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||distances[i]<distances[current]))current=i;
    if(current<0||!Number.isFinite(distances[current])||current===goal)break;visited.add(current);
    for(const [a,b] of edges){const neighbor=a===current?b:b===current?a:-1;if(neighbor<0)continue;
      const d=distances[current]+hubDistance(nodes[current],nodes[neighbor]);if(d<distances[neighbor]){distances[neighbor]=d;previous[neighbor]=current;}}
  }
  if(!Number.isFinite(distances[goal]))return [];
  const path=[];for(let i=goal;i>=0;i=previous[i]){path.unshift({...nodes[i]});if(i===start)break;}
  return path.filter((point,i)=>i===0||hubDistance(point,path[i-1])>.1);
}
export function createHubInput() {
  const held=new Map();
  const bindings={ArrowUp:'up',KeyW:'up',w:'up',W:'up',ArrowDown:'down',KeyS:'down',s:'down',S:'down',ArrowLeft:'left',KeyA:'left',a:'left',A:'left',ArrowRight:'right',KeyD:'right',d:'right',D:'right'};
  return {
    press(key,code=''){const direction=bindings[code]??bindings[key];if(!direction)return false;held.set(code||key,direction);return true;},
    release(key,code=''){return held.delete(code||key);},
    clear(){held.clear();},
    vector(pads=[]){const active=new Set([...held.values(),...pads]),x=Number(active.has('right'))-Number(active.has('left')),y=Number(active.has('down'))-Number(active.has('up')),length=Math.hypot(x,y)||1;return{x:x/length,y:y/length};},
  };
}
