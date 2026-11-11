export function moveProbe(position,dx,dy){return {x:Math.max(0,Math.min(5,position.x+dx)),y:Math.max(0,Math.min(5,position.y+dy))};}
export function nearby(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<=1;}
export function normalizeExpeditions(raw){const out={};for(let i=1;i<=5;i++){const r=raw?.[i];if(r&&typeof r==='object')out[i]={found:[...new Set((Array.isArray(r.found)?r.found:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<3))],x:Number.isInteger(r.x)?Math.max(0,Math.min(5,r.x)):0,y:Number.isInteger(r.y)?Math.max(0,Math.min(5,r.y)):3};}return out;}
