import * as THREE from 'three';
import { sites } from './data.js';
let mapsPromise;
export function surfaceVector(lon,lat){const p=(lon+180)/180*Math.PI,t=(90-lat)/180*Math.PI;return new THREE.Vector3(-Math.cos(p)*Math.sin(t),Math.cos(t),Math.sin(p)*Math.sin(t));}
async function maps(){
  if(!mapsPromise)mapsPromise=fetch(`${import.meta.env.BASE_URL}assets/land.geojson`).then(r=>{if(!r.ok)throw new Error('지리 자료 불러오기 실패');return r.json();}).then(geo=>{
    const mask=document.createElement('canvas');mask.width=2048;mask.height=1024;const m=mask.getContext('2d',{willReadFrequently:true});m.fillStyle='#000';m.fillRect(0,0,2048,1024);m.fillStyle='#fff';
    for(const f of geo.features){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;for(const polygon of polys){m.beginPath();for(const ring of polygon){ring.forEach(([lon,lat],i)=>{const x=(lon+180)/360*2048,y=(90-lat)/180*1024;i?m.lineTo(x,y):m.moveTo(x,y);});m.closePath();}m.fill('evenodd');}}
    const pixels=m.getImageData(0,0,2048,1024);for(let i=0;i<pixels.data.length;i+=4){const v=pixels.data[i]>127?255:0;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;}m.putImageData(pixels,0,0);
    const surface=document.createElement('canvas');surface.width=2048;surface.height=1024;const ctx=surface.getContext('2d');const im=ctx.createImageData(2048,1024);
    for(let y=0;y<1024;y++)for(let x=0;x<2048;x++){const i=(y*2048+x)*4,land=pixels.data[i]===255;const polar=y<65||y>930;const color=land?(polar?[222,232,207]:[136,182,116]):[35,132,167];im.data[i]=color[0];im.data[i+1]=color[1];im.data[i+2]=color[2];im.data[i+3]=255;}
    ctx.putImageData(im,0,0);ctx.strokeStyle='#ffffff15';ctx.lineWidth=1;for(let x=0;x<=2048;x+=2048/12){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}for(let y=0;y<1024;y+=1024/6){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(2048,y);ctx.stroke();}
    return {surface,pixels:ctx.getImageData(0,0,2048,1024).data,mask:pixels.data};
  }).catch(e=>{mapsPromise=null;throw e;});
  return mapsPromise;
}
export async function mountGlobe(el,{flat=false,atmosphere=false,selected='asia',onReady=()=>{}}={}){
  const data=await maps();if(!el.isConnected)return {dispose(){}};
  let renderer,scene,camera,sphere,marker,ring,raf=0,stopped=false,drag=null,cleanup=()=>{};
  const q=new THREE.Quaternion();let point=sites.find(s=>s.id===selected)||sites[0];
  q.setFromUnitVectors(surfaceVector(point.lon,point.lat),new THREE.Vector3(0,0,1));
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','지구 관찰 화면');el.replaceChildren(canvas);
  let isFlat=flat;
  if(!flat){try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,el.clientWidth/el.clientHeight,.1,100);camera.position.z=3.6;
    const texture=new THREE.CanvasTexture(data.surface);texture.colorSpace=THREE.SRGBColorSpace;
    sphere=new THREE.Mesh(new THREE.SphereGeometry(1,64,40),new THREE.MeshStandardMaterial({map:texture,roughness:.85}));scene.add(sphere);
    const ambient=new THREE.AmbientLight('#eaf9ff',2);scene.add(ambient);const sun=new THREE.DirectionalLight('#fff5dc',2.3);sun.position.set(-3,3,5);scene.add(sun);
    marker=new THREE.Mesh(new THREE.SphereGeometry(.028,12,8),new THREE.MeshBasicMaterial({color:'#ffdf86'}));sphere.add(marker);
    ring=new THREE.Mesh(new THREE.SphereGeometry(1.07,48,32),new THREE.MeshBasicMaterial({color:'#7adfeb',transparent:true,opacity:atmosphere?.2:.055,side:THREE.BackSide}));scene.add(ring);
    cleanup=()=>{sphere.geometry.dispose();sphere.material.map.dispose();sphere.material.dispose();marker.geometry.dispose();marker.material.dispose();ring.geometry.dispose();ring.material.dispose();renderer.dispose();};
  }catch{renderer?.dispose();renderer=null;isFlat=true;}}
  let fallbackCtx,buffer;
  if(isFlat){canvas.width=320;canvas.height=320;canvas.style.width='100%';canvas.style.height='100%';canvas.style.objectFit='contain';fallbackCtx=canvas.getContext('2d');if(!fallbackCtx){const next=document.createElement('canvas');next.width=next.height=320;canvas.replaceWith(next);fallbackCtx=next.getContext('2d');}buffer=fallbackCtx.createImageData(320,320);}
  function drawFlat(){
    const inverse=q.clone().invert();buffer.data.fill(0);
    for(let y=0;y<320;y++)for(let x=0;x<320;x++){const nx=(x-160)/139,ny=(160-y)/139,r=nx*nx+ny*ny;if(r>1)continue;const nz=Math.sqrt(1-r),v=new THREE.Vector3(nx,ny,nz).applyQuaternion(inverse),phi=Math.atan2(v.z,-v.x),u=(phi<0?phi+Math.PI*2:phi)/(Math.PI*2),vv=Math.acos(Math.max(-1,Math.min(1,v.y)))/Math.PI;const source=(Math.min(1023,Math.floor(vv*1024))*2048+Math.min(2047,Math.floor(u*2048)))*4,idx=(y*320+x)*4,light=.65+.35*Math.max(0,nz*.8-ny*.2-nx*.2);for(let c=0;c<3;c++)buffer.data[idx+c]=data.pixels[source+c]*light;buffer.data[idx+3]=255;}
    fallbackCtx.putImageData(buffer,0,0);fallbackCtx.strokeStyle=atmosphere?'#a5f1f4':'#4fb1cb';fallbackCtx.lineWidth=atmosphere?8:2;fallbackCtx.beginPath();fallbackCtx.arc(160,160,144,0,Math.PI*2);fallbackCtx.stroke();const p=surfaceVector(point.lon,point.lat).applyQuaternion(q);if(p.z>0){fallbackCtx.fillStyle='#ffdf86';fallbackCtx.beginPath();fallbackCtx.arc(160+p.x*139,160-p.y*139,5,0,Math.PI*2);fallbackCtx.fill();}
  }
  function draw(){if(stopped)return;if(renderer){sphere.quaternion.copy(q);marker.position.copy(surfaceVector(point.lon,point.lat).multiplyScalar(1.015));renderer.render(scene,camera);}else drawFlat();}
  function focus(id){point=sites.find(p=>p.id===id)||point;q.setFromUnitVectors(surfaceVector(point.lon,point.lat),new THREE.Vector3(0,0,1));draw();}
  function rotate(dir){q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),dir*.35));draw();}
  const down=e=>{drag=[e.clientX,e.clientY];el.setPointerCapture(e.pointerId);};
  const move=e=>{if(!drag)return;const dx=e.clientX-drag[0],dy=e.clientY-drag[1];drag=[e.clientX,e.clientY];q.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(dy*.006,dx*.006,0)));cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);};
  const up=()=>{drag=null;};
  const lost=()=>{if(stopped)return;onReady('3D 연결이 중단됐어. 설정에서 2D 지구 대체를 켜 줘.');};
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);canvas.addEventListener('webglcontextlost',lost);
  const observer=new ResizeObserver(()=>{if(renderer){renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();}draw();});observer.observe(el);
  const validated=sites.every(p=>{const x=Math.floor((p.lon+180)/360*2048),y=Math.floor((90-p.lat)/180*1024);return (data.mask[(y*2048+x)*4]===255)===(p.type==='육지');});
  draw();onReady(isFlat?'2D 대체 관찰':'3D 지구 · 드래그 회전');
  return {focus,rotate,validated,dispose(){stopped=true;cancelAnimationFrame(raf);observer.disconnect();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);canvas.removeEventListener('webglcontextlost',lost);cleanup();}};
}
