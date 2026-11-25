import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
const korea = { lon:127.8, lat:36.5 };
const globeScale = .46;
const fallbackSize = 320;
const fallbackRadius = fallbackSize * globeScale;
const modelUrl = new URL(`${import.meta.env.BASE_URL}assets/models/earth-globe.glb`,document.baseURI).href;

function disposeSurface(mesh){
  if(!mesh)return;
  mesh.geometry.dispose();
  for(const key of ['map','normalMap','roughnessMap','metalnessMap'])mesh.material[key]?.dispose();
  mesh.material.dispose();
}
async function earthSurface(){
  const {scene}=await new GLTFLoader().loadAsync(modelUrl);
  let mesh;
  scene.traverse(object=>{if(object.isMesh)mesh=object;});
  return mesh;
}

export async function mountGlobe(el,{flat=false,atmosphere=false,onReady=()=>{},onExplore=()=>{},onLayout=()=>{}}={}){
  const data=await maps();
  if(!el.isConnected)return {dispose(){}};
  let renderer,scene,camera,sphere,ring,fallbackCtx,buffer,raf=0,stopped=false,drag=null,modelSource;
  const rotation=new THREE.Quaternion();
  const surfacePoint=new THREE.Vector3();
  const dragRotation=new THREE.Quaternion();
  const dragAngles=new THREE.Euler();
  const markers=[...el.parentElement.querySelectorAll('.earth-pin')].map(button=>{
    const site=sites.find(p=>p.id===button.dataset.value);
    return {button,vector:surfaceVector(site.lon,site.lat)};
  });
  const canvas=document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');
  el.replaceChildren(canvas);

  function startFlat(){
    const flatCanvas=document.createElement('canvas');
    flatCanvas.width=flatCanvas.height=fallbackSize;
    flatCanvas.className='globe-flat-canvas';
    flatCanvas.setAttribute('aria-hidden','true');
    fallbackCtx=flatCanvas.getContext('2d');
    if(!fallbackCtx)throw new Error('2D 지구 화면을 시작할 수 없어.');
    buffer=fallbackCtx.createImageData(fallbackSize,fallbackSize);
    el.replaceChildren(flatCanvas);
  }
  if(!flat){try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    scene=new THREE.Scene();
    camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,20);
    camera.position.z=4;
    sphere=await earthSurface().catch(()=>null);
    if(!el.isConnected){freeWebGL();return {dispose(){}};}
    modelSource=sphere?'meshy':'map';
    if(!sphere){
      const texture=new THREE.CanvasTexture(data.surface);
      texture.colorSpace=THREE.SRGBColorSpace;
      sphere=new THREE.Mesh(new THREE.SphereGeometry(1,64,40),new THREE.MeshStandardMaterial({map:texture,roughness:.85}));
    }
    scene.add(sphere,new THREE.AmbientLight('#eaf9ff',2));
    const sun=new THREE.DirectionalLight('#fff5dc',2.3);
    sun.position.set(-3,3,5);
    scene.add(sun);
    ring=new THREE.Mesh(new THREE.SphereGeometry(1.07,48,32),new THREE.MeshBasicMaterial({color:'#7adfeb',transparent:true,opacity:.065,side:THREE.BackSide}));
    scene.add(ring);
  }catch{freeWebGL();}}
  if(!renderer)startFlat();

  function drawFlat(){
    const inverse=rotation.clone().invert(),middle=fallbackSize/2;
    buffer.data.fill(0);
    for(let y=0;y<fallbackSize;y++)for(let x=0;x<fallbackSize;x++){
      const nx=(x-middle)/fallbackRadius,ny=(middle-y)/fallbackRadius,r=nx*nx+ny*ny;
      if(r>1)continue;
      const nz=Math.sqrt(1-r),v=surfacePoint.set(nx,ny,nz).applyQuaternion(inverse),phi=Math.atan2(v.z,-v.x);
      const u=(phi<0?phi+Math.PI*2:phi)/(Math.PI*2),vv=Math.acos(Math.max(-1,Math.min(1,v.y)))/Math.PI;
      const source=(Math.min(1023,Math.floor(vv*1024))*2048+Math.min(2047,Math.floor(u*2048)))*4;
      const idx=(y*fallbackSize+x)*4,light=.65+.35*Math.max(0,nz*.8+ny*.2-nx*.2);
      for(let c=0;c<3;c++)buffer.data[idx+c]=data.pixels[source+c]*light;
      buffer.data[idx+3]=255;
    }
    fallbackCtx.putImageData(buffer,0,0);
    fallbackCtx.strokeStyle=atmosphere?'#a5f1f4':'#4fb1cb';
    fallbackCtx.lineWidth=atmosphere?7:1.5;
    fallbackCtx.beginPath();
    fallbackCtx.arc(middle,middle,fallbackRadius+(atmosphere?4:0),0,Math.PI*2);
    fallbackCtx.stroke();
  }
  function draw(){
    if(stopped)return;
    const width=el.clientWidth,height=el.clientHeight,radius=Math.min(width,height)*globeScale;
    if(!radius)return;
    if(renderer){
      sphere.quaternion.copy(rotation);
      ring.material.opacity=atmosphere?.48:.065;
      renderer.render(scene,camera);
    }else drawFlat();
    for(const {button,vector} of markers){
      surfacePoint.copy(vector).applyQuaternion(rotation);
      const visible=surfacePoint.z>.15;
      if(!visible&&document.activeElement===button)el.focus({preventScroll:true});
      button.hidden=!visible;
      if(!visible)continue;
      button.style.left=`${width/2+surfacePoint.x*radius}px`;
      button.style.top=`${height/2-surfacePoint.y*radius}px`;
    }
    onLayout();
  }
  function face({lon,lat}){
    const front=surfaceVector(lon,lat);
    const up=surfaceVector(lon,lat+1).addScaledVector(front,-Math.cos(Math.PI/180)).normalize();
    const right=new THREE.Vector3().crossVectors(up,front);
    rotation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,front).transpose());
  }
  function focus(id){
    const site=sites.find(p=>p.id===id);
    if(!site)return;
    face(site);
    draw();
  }
  function home(){
    face(korea);
    draw();
  }
  function resize(){
    const width=el.clientWidth,height=el.clientHeight,radius=Math.min(width,height)*globeScale;
    if(!radius)return;
    if(renderer){
      renderer.setSize(width,height);
      camera.right=width/2/radius;
      camera.left=-camera.right;
      camera.top=height/2/radius;
      camera.bottom=-camera.top;
      camera.updateProjectionMatrix();
    }
    draw();
  }
  function turn(x,y){
    rotation.premultiply(dragRotation.setFromEuler(dragAngles.set(x,y,0))).normalize();
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(draw);
  }
  function down(e){
    if(drag||!e.isPrimary||e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    el.setPointerCapture(e.pointerId);
  }
  function move(e){
    if(drag?.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved){
      if(Math.hypot(dx,dy)<5)return;
      drag.moved=true;
      onExplore();
    }
    drag.x=e.clientX;drag.y=e.clientY;
    turn(dy*.006,dx*.006);
  }
  function up(e){if(drag?.id===e.pointerId)drag=null;}
  function key(e){
    const direction={ArrowLeft:[0,-.35],ArrowRight:[0,.35],ArrowUp:[-.35,0],ArrowDown:[.35,0]}[e.key];
    if(!direction)return;
    e.preventDefault();
    onExplore();
    turn(...direction);
  }
  function freeWebGL(){
    if(!renderer)return;
    disposeSurface(sphere);
    ring?.geometry.dispose();
    ring?.material.dispose();
    renderer.dispose();
    renderer=null;
  }
  function lost(e){
    e.preventDefault();
    if(stopped)return;
    freeWebGL();
    startFlat();
    draw();
    onReady('2D 대체 관찰','flat');
  }
  el.addEventListener('pointerdown',down);
  el.addEventListener('pointermove',move);
  el.addEventListener('pointerup',up);
  el.addEventListener('pointercancel',up);
  el.addEventListener('lostpointercapture',up);
  el.addEventListener('keydown',key);
  // Marker focus also accepts arrows. Enter and Space still activate the focused button normally.
  const layer=markers[0]?.button.parentElement;
  layer?.addEventListener('keydown',key);
  canvas.addEventListener('webglcontextlost',lost);
  const observer=new ResizeObserver(resize);
  observer.observe(el);
  const validated=sites.every(p=>{const x=Math.floor((p.lon+180)/360*2048),y=Math.floor((90-p.lat)/180*1024);return (data.mask[(y*2048+x)*4]===255)===(p.type==='육지');});
  face(korea);
  resize();
  onReady(renderer?'3D 지구':'2D 대체 관찰',renderer?modelSource:'flat');
  return {
    focus,home,validated,
    setAtmosphere(){atmosphere=true;draw();},
    dispose(){
      stopped=true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      el.removeEventListener('pointerdown',down);
      el.removeEventListener('pointermove',move);
      el.removeEventListener('pointerup',up);
      el.removeEventListener('pointercancel',up);
      el.removeEventListener('lostpointercapture',up);
      el.removeEventListener('keydown',key);
      layer?.removeEventListener('keydown',key);
      canvas.removeEventListener('webglcontextlost',lost);
      freeWebGL();
    }
  };
}
