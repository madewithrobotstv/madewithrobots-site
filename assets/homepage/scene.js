import * as THREE from 'three/webgpu';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
// Begin independent downloads together, before renderer initialization.
const surfaceLoader=new THREE.TextureLoader();
function loadSurface(path){return surfaceLoader.loadAsync(new URL(path,import.meta.url).href).then(texture=>{texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture})}
const modelReady=new GLTFLoader().loadAsync(new URL('./assets/splash-assets.fd94626321.glb',import.meta.url).href);
const surfacesReady=Promise.all(["./textures/laminate.89adbd2a86.webp", "./textures/plastic-height.219f54427e.webp", "./textures/plastic-color.9d4fe9fd27.webp", "./textures/plastic-roughness.63269a7549.webp", "./textures/enamel.1dc6e8d986.webp", "./textures/work.fd60851d1e.webp", "./textures/pitch-decks.433d926751.webp"].map(loadSurface));
const logo=new Image();logo.src=new URL('./logo.03c8dcdb65.webp',import.meta.url).href;const logoReady=logo.decode();
// One playback rate keeps camera, roll, and logo reveal synchronized.
const PLAYBACK_RATE=1.5;
function signalTime(){return performance.now()*PLAYBACK_RATE}
const canvas=document.querySelector('#scene');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.1,80);
const renderer=new THREE.WebGPURenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const [,loadedModel,surfaces]=await Promise.all([renderer.init(),modelReady,surfacesReady,logoReady]);
const [laminate,plasticHeight,plasticColor,plasticRoughness,steelGrain,workTapeTexture,pitchTapeTexture]=surfaces;
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const orange=mat('#a84929',.9), orangeDark=mat('#87341e',.85), cream=mat('#dfc89e',.5), steel=mat('#90968d',.34,.7), green=mat('#34594a',.39), rubber=mat('#343931'), dark=mat('#262b28');
// Pre-generated maps preserve the approved finish without startup pixel loops.
laminate.repeat.set(4,4);laminate.colorSpace=THREE.SRGBColorSpace;
green.map=laminate;green.color.set('#a9bdad');const laminateHeight=laminate.clone();laminateHeight.colorSpace=THREE.NoColorSpace;green.bumpMap=laminateHeight;green.bumpScale=.017;
plasticColor.colorSpace=THREE.SRGBColorSpace;plasticColor.repeat.set(1/.3,1/.3);
plasticHeight.colorSpace=plasticRoughness.colorSpace=THREE.NoColorSpace;
for(const material of [orange,orangeDark]){material.map=plasticColor;material.bumpMap=plasticHeight;material.roughnessMap=plasticRoughness;material.metalness=0}
orange.bumpScale=.32;orangeDark.bumpScale=.24;
steelGrain.colorSpace=THREE.NoColorSpace;steel.bumpMap=steelGrain;steel.bumpScale=.003;
const originals=new Map();
function mesh(geo,material,parent=scene){let m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(w,h,d,material,x,y,z,parent=scene){let m=mesh(new THREE.BoxGeometry(w,h,d),material,parent);m.position.set(x,y,z);return m}
function rounded(w,h,d,r,material,x,y,z,parent=scene){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:r,bevelThickness:r,curveSegments:12});g.translate(0,0,-(d-2*r)/2);let m=mesh(g,material,parent);m.position.set(x,y,z);return m}
function rod(a,b,r,material,parent=scene){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);let m=mesh(new THREE.CylinderGeometry(r,r,av.distanceTo(bv),12),material,parent);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m}
// Refined Blender 5.2 assets, exported in glTF Y-up coordinates.
// Keep the existing palette and CRT effects independent of the physical model.
const assets=loadedModel.scene;
assets.name='Blender splash assets';scene.add(assets);
const tv=assets.getObjectByName('TV_ROOT');
const table=assets.getObjectByName('TABLE_ROOT');
const screen=assets.getObjectByName('CRT_SCREEN');
if(!tv||!table||!screen)throw new Error('The Blender assets must include TV_ROOT, TABLE_ROOT, and CRT_SCREEN.');
assets.traverse(object=>{
  if(!object.isMesh)return;
  object.castShadow=true;object.receiveShadow=true;
  // Profile meshes from Blender need UVs for the page's procedural surface maps.
  if(!object.geometry.attributes.uv){
    const geometry=object.geometry,positions=geometry.attributes.position,normals=geometry.attributes.normal;
    geometry.computeBoundingBox();const bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3());
    const uv=new Float32Array(positions.count*2);
    for(let i=0;i<positions.count;i++){
      const nx=Math.abs(normals.getX(i)),ny=Math.abs(normals.getY(i)),nz=Math.abs(normals.getZ(i));
      let u,v;
      if(nx>ny&&nx>nz){u=(positions.getZ(i)-bounds.min.z)/(size.z||1);v=(positions.getY(i)-bounds.min.y)/(size.y||1)}
      else if(ny>nz){u=(positions.getX(i)-bounds.min.x)/(size.x||1);v=(positions.getZ(i)-bounds.min.z)/(size.z||1)}
      else{u=(positions.getX(i)-bounds.min.x)/(size.x||1);v=(positions.getY(i)-bounds.min.y)/(size.y||1)}
      uv[i*2]=u;uv[i*2+1]=v;
    }
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  }
  const source=object.material.name;
  if(source.includes('burnt orange'))object.material=orange;
  else if(source.includes('dark case seams'))object.material=orangeDark;
  else if(source.includes('warm ivory'))object.material=cream;
  else if(source.includes('brushed steel'))object.material=steel;
  else if(source.includes('green laminate'))object.material=green;
  else if(source.includes('rubber'))object.material=rubber;
  else if(source.includes('speaker cloth'))object.material=dark;
});
const screenCanvas=document.createElement('canvas');screenCanvas.width=640;screenCanvas.height=480;const ctx=screenCanvas.getContext('2d');

const texture=new THREE.CanvasTexture(screenCanvas);texture.colorSpace=THREE.SRGBColorSpace;
// glTF UVs have their origin at the top of the image.
texture.flipY=false;
const screenMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
screen.material=screenMaterial;screen.castShadow=false;screen.receiveShadow=false;
// Handwritten masking-tape labels sit directly on the two physical dial faces.
function addDialTape(lines,y,tilt){
  const tapeTexture=lines[0]==='WORK'?workTapeTexture:pitchTapeTexture;
  tapeTexture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map:tapeTexture,transparent:true,alphaTest:.4,roughness:.97,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const tape=mesh(new THREE.PlaneGeometry(.212,lines.length===1?.085:.108),material,tv);
  tape.name=`Dial tape / ${lines.join(' ')}`;tape.position.set(.91,y-.037,.857);tape.rotation.z=tilt;tape.userData.keepMaterial=true;
  tape.castShadow=false;tape.receiveShadow=true;return tape;
}
const workTape=addDialTape(['WORK'],1.27,-.055);
const pitchTape=addDialTape(['PITCH','DECKS'],.91,.045);
// Rotate each physical knob, its index and its tape together; the trim rings stay fixed.
scene.updateMatrixWorld(true);
function turnDial(number,y,angle,tape){
  const dial=new THREE.Group();dial.name=`Dial ${number} / rotating face`;
  dial.position.set(.91,y,.80);tv.add(dial);scene.updateMatrixWorld(true);
  const moving=[];
  tv.traverse(object=>{
    if(object.isMesh&&object.name.includes(`TV_DIAL_${number}`)&&
       (object.name.includes('index')||object.name.includes('ivory')||object.name.includes('grip')))moving.push(object);
  });
  for(const object of moving){object.visible=true;dial.attach(object)}
  dial.attach(tape);dial.rotation.z=angle;return dial;
}
const workDial=turnDial(0,1.27,.38,workTape);
const pitchDial=turnDial(1,.91,-.55,pitchTape);
workDial.userData.href='/work/';workDial.userData.label='Explore our work';
pitchDial.userData.href='/pitch-decks/';pitchDial.userData.label='View pitch decks';
const dialTargets=[workDial,pitchDial],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function dialAt(event){
  const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(dialTargets,true)[0];
  if(!hit)return null;let object=hit.object;while(object&&!object.userData.href)object=object.parent;return object;
}

const floor=mesh(new THREE.PlaneGeometry(200,200),mat('#d9d0bb'));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
const curtainGeo=new THREE.PlaneGeometry(30,14,180,1);const curtainPositions=curtainGeo.attributes.position;
for(let i=0;i<curtainPositions.count;i++){const x=curtainPositions.getX(i);curtainPositions.setZ(i,Math.sin(x*4.5)*.14+Math.sin(x*9)*.025)}curtainGeo.computeVertexNormals();
const curtain=mesh(curtainGeo,mat('#171c17',.98));curtain.position.set(0,5,-3.3);
// A loose cable on the table adds scale without obscuring the hero object.
const coilPoints=[];for(let i=0;i<=90;i++){const a=i/90*Math.PI*5;coilPoints.push(new THREE.Vector3(-1.12+Math.cos(a)*(.32-i*.0018),2.58+Math.sin(a*.5)*.009,-.3+Math.sin(a)*.38))}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPoints),110,.014,6,false),dark);
const powerLed=mesh(new THREE.SphereGeometry(.027,12,8),new THREE.MeshBasicMaterial({color:'#ffd66b',toneMapped:false}),tv);powerLed.position.set(.91,.27,.9);
const ambient=new THREE.HemisphereLight('#efe0bd','#756c59',1.15);scene.add(ambient);
const warm=new THREE.PointLight('#ffd49b',95,20,2);warm.position.set(.25,5.1,-.3);warm.castShadow=true;warm.shadow.mapSize.set(2048,2048);warm.shadow.bias=-.001;warm.shadow.normalBias=.035;warm.shadow.radius=5;scene.add(warm);
const fill=new THREE.DirectionalLight('#e6edf2',1);fill.position.set(-4,6,5);scene.add(fill);
const blue=new THREE.PointLight('#598fff',8,4,2);blue.position.set(-.4,3.45,1.1);scene.add(blue);
// Soft additive spill around the glass; the screen itself remains uniformly emissive.
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gc=glowCanvas.getContext('2d');const glow=gc.createRadialGradient(64,64,8,64,64,64);glow.addColorStop(0,'rgba(183,235,235,0.25)');glow.addColorStop(.45,'rgba(122,206,211,0.1)');glow.addColorStop(1,'rgba(90,190,199,0)');gc.fillStyle=glow;gc.fillRect(0,0,128,128);
const glowTex=new THREE.CanvasTexture(glowCanvas);
const screenHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));screenHalo.scale.set(2.7,2.3,1);screenHalo.position.set(-.2,.91,1.01);tv.add(screenHalo);
scene.traverse(o=>{if(o.isMesh)originals.set(o,o.material)});
const clay=mat('#c2b4a0',.85);let look='warm',signal=false,signalStarted=0;
const ROLL_SPEED=.0825,ROLL_TRAVEL=620,ROLL_CYCLE=ROLL_TRAVEL/ROLL_SPEED;
let rollEpoch=signalTime();
function nextRollBoundary(now){return rollEpoch+Math.ceil((now-rollEpoch)/ROLL_CYCLE)*ROLL_CYCLE}
function rollPosition(now){const cycles=(now-rollEpoch)/ROLL_CYCLE;const phase=Math.max(0,cycles-Math.floor(cycles+1e-10));return phase*ROLL_TRAVEL-100}
function setLook(next){
look=next;const cinematic=next==='night',isClay=next==='clay';
scene.background=new THREE.Color(cinematic?'#060909':'#d9d1bf');scene.fog=new THREE.FogExp2(cinematic?'#101a19':'#d9d1bf',cinematic?.045:.012);
document.body.classList.toggle('dark',cinematic);
ambient.intensity=cinematic?.085:isClay?1.7:1.15;fill.intensity=cinematic?.13:isClay?1.4:1;
fill.color.set(cinematic?'#a5c2bf':'#e6edf2');warm.intensity=cinematic?22:95;warm.color.set('#ffc18b');
blue.intensity=cinematic?11:5;blue.color.set('#b7e4e6');
originals.get(floor).color.set(cinematic?'#222720':'#d9d0bb');
cream.color.set(cinematic?'#899182':'#dfc89e');cream.metalness=0;cream.roughness=cinematic?.65:.5;
scene.traverse(o=>{if(o.isMesh&&originals.has(o))o.material=isClay&&o!==screen&&!o.userData.keepMaterial?clay:originals.get(o)});
curtain.visible=cinematic;screenHalo.visible=cinematic;
document.querySelectorAll('[data-look]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.look===next));
}
document.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>setLook(b.dataset.look));setLook('night');
function setSignal(value,boundary){if(value&&!signal)signalStarted=boundary??nextRollBoundary(signalTime());signal=value;const button=document.querySelector('#signal');if(button){button.setAttribute('aria-pressed',signal);button.textContent=signal?'Signal found · Return to static':'Find the signal ↗'}}
document.querySelector('#signal')?.addEventListener('click',()=>{stopShot();setSignal(!signal)});
let shotStart=null,shotEnd=0;
function stopShot(){shotStart=null;document.querySelector('#replay').textContent='Replay intro';document.querySelector('#status').textContent='Explore · Drag to look around'}
let yaw=.10,pitch=.13,distance=7,drag=false,px=0,py=0;
const target=new THREE.Vector3(-.15,3.34,.15);
// Match the reference's close TV framing, then fit safely on wider/narrower screens.
function closeDistance(){
  const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  return .8+Math.max(2.45/(2*halfFov*camera.aspect*.80),1.8/(2*halfFov*.57));
}
function reset(){stopShot();target.set(-.15,3.34,.15);yaw=.10;pitch=.13;distance=closeDistance()}
reset();document.querySelector('#reset')?.addEventListener('click',reset);
let dragDistance=0;
canvas.addEventListener('pointerdown',event=>{stopShot();drag=true;dragDistance=0;px=event.clientX;py=event.clientY;canvas.setPointerCapture(event.pointerId)});
canvas.addEventListener('pointermove',event=>{
  if(!drag){const dial=dialAt(event);canvas.style.cursor=dial?'pointer':'grab';canvas.title=dial?dial.userData.label:'';return}
  const dx=event.clientX-px,dy=event.clientY-py;dragDistance+=Math.abs(dx)+Math.abs(dy);
  if(dragDistance>6){yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.004,-.1,.65)}
  px=event.clientX;py=event.clientY;
});
canvas.addEventListener('pointerup',event=>{const clicked=drag&&dragDistance<=6;drag=false;if(clicked){const dial=dialAt(event);if(dial)location.assign(dial.userData.href)}});
canvas.addEventListener('pointercancel',()=>drag=false);
canvas.addEventListener('wheel',event=>{event.preventDefault();stopShot();distance=THREE.MathUtils.clamp(distance+event.deltaY*.008,Math.max(2.8,closeDistance()*.70),22)},{passive:false});
window.addEventListener('resize',()=>{const previousFit=closeDistance();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(shotStart===null)distance*=closeDistance()/previousFit;renderer.setSize(innerWidth,innerHeight)});
const noiseCanvas=document.createElement('canvas');noiseCanvas.width=160;noiseCanvas.height=120;const nc=noiseCanvas.getContext('2d');const noise=nc.createImageData(160,120);let last=0,blend=0;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fineCanvas=document.createElement('canvas');fineCanvas.width=640;fineCanvas.height=480;const fineCtx=fineCanvas.getContext('2d');const fineGrain=fineCtx.createImageData(640,480);
const crtBuffer=document.createElement('canvas');crtBuffer.width=640;crtBuffer.height=480;const crtBufferCtx=crtBuffer.getContext('2d');
const distortion={nextAt:0,amplitude:0,width:32,frequency:.2,phase:0,skew:0};
// Build a soft displacement field from the actual logo, aligned to its CRT placement.
const fieldCanvas=document.createElement('canvas');fieldCanvas.width=160;fieldCanvas.height=120;
const fieldCtx=fieldCanvas.getContext('2d',{willReadFrequently:true});
const fieldScale=Math.min(540/logo.naturalWidth,420/logo.naturalHeight)/4;
const fieldW=logo.naturalWidth*fieldScale,fieldH=logo.naturalHeight*fieldScale;
fieldCtx.filter='blur(0.65px)';fieldCtx.drawImage(logo,(160-fieldW)/2,(120-fieldH)/2,fieldW,fieldH);
const fieldPixels=fieldCtx.getImageData(0,0,160,120).data;
const logoField=new Float32Array(160*120),fieldX=new Float32Array(160*120),fieldY=new Float32Array(160*120);
for(let i=0;i<logoField.length;i++){const k=i*4;const lum=(fieldPixels[k]*.2126+fieldPixels[k+1]*.7152+fieldPixels[k+2]*.0722)/255;logoField[i]=fieldPixels[k+3]/255*(.12+.88*lum)}
for(let y=1;y<119;y++)for(let x=1;x<159;x++){const i=y*160+x;fieldX[i]=(logoField[i+1]-logoField[i-1])*.5;fieldY[i]=(logoField[i+160]-logoField[i-160])*.5}
const displacedNoise=nc.createImageData(160,120);let logoDisplacement=true;
const displacementButton=document.querySelector('#displacement');if(displacementButton)displacementButton.onclick=()=>{logoDisplacement=!logoDisplacement;document.querySelector('#displacement').setAttribute('aria-pressed',logoDisplacement)};

function paint(t){
blend+=(Number(signal)-blend)*.28;
const now=signalTime(),roll=rollPosition(now);
const tracking=signal?THREE.MathUtils.clamp(((now-signalStarted)*ROLL_SPEED-50)/480,0,1):1;
const secondTracking=signal?THREE.MathUtils.clamp(((now-signalStarted-ROLL_CYCLE)*ROLL_SPEED-50)/480,0,1):0;
for(let y=0;y<120;y++)for(let x=0;x<160;x++){
const i=(y*160+x)*4;
// Correlated horizontal interference makes displacement visible through moving grain.
const v=Math.random()*145+80+Math.sin(y*.32+t*.002)*13+Math.sin(y*1.7+t*.004)*7;
noise.data[i]=v*.94;noise.data[i+1]=v;noise.data[i+2]=v*1.02+3;noise.data[i+3]=255;
}
if(logoDisplacement&&signal&&!reduce){
for(let y=0;y<120;y++)for(let x=0;x<160;x++){
const i=y*160+x;
const gate=blend*THREE.MathUtils.clamp((tracking*120-y)/5,0,1);
const strength=gate*(.8+.2*Math.sin(t*.0013));
const dx=(fieldX[i]*8+logoField[i]*Math.sin(y*.1+t*.001)*1.2)*strength;
const dy=(logoField[i]*4+fieldY[i]*7)*strength;
const sx=Math.max(0,Math.min(159,Math.round(x+dx))),sy=Math.max(0,Math.min(119,Math.round(y+dy)));
const source=(sy*160+sx)*4,dest=i*4;
displacedNoise.data[dest]=noise.data[source];displacedNoise.data[dest+1]=noise.data[source+1];displacedNoise.data[dest+2]=noise.data[source+2];displacedNoise.data[dest+3]=255;
}
nc.putImageData(displacedNoise,0,0);
}else nc.putImageData(noise,0,0);
// Three successive halvings leave 12.5% of the original saturation.
ctx.filter='saturate(12.5%)';ctx.fillStyle='#809494';ctx.fillRect(0,0,640,480);
ctx.globalAlpha=.92-blend*.12;ctx.drawImage(noiseCanvas,0,0,640,480);ctx.globalAlpha=1;
const grad=ctx.createLinearGradient(0,roll,0,roll+100);
grad.addColorStop(0,'transparent');grad.addColorStop(.5,'#9dcaff55');grad.addColorStop(1,'transparent');ctx.fillStyle=grad;ctx.fillRect(0,roll,640,100);ctx.filter='none';
// Fine phosphor grain sits over the broader, logo-displaced interference.
for(let i=0;i<fineGrain.data.length;i+=4){const n=70+Math.random()*185;fineGrain.data[i]=n*.96;fineGrain.data[i+1]=n;fineGrain.data[i+2]=n;fineGrain.data[i+3]=255}
fineCtx.putImageData(fineGrain,0,0);
// Logo and displaced static follow the same roll front.
if(blend>.005){
const scale=Math.min(540/logo.naturalWidth,420/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;
ctx.save();ctx.beginPath();ctx.rect(0,0,640,480*tracking);ctx.clip();
ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=blend;ctx.filter='blur(0.85px)';ctx.drawImage(logo,(640-w)/2,(480-h)/2,w,h);ctx.restore();
// The second complete roll reveals an opaque Normal layer over the Soft Light pass.
if(secondTracking>0){
ctx.save();ctx.beginPath();ctx.rect(0,0,640,480*secondTracking);ctx.clip();
ctx.globalCompositeOperation='source-over';ctx.globalAlpha=blend;ctx.filter='none';
ctx.drawImage(logo,(640-w)/2,(480-h)/2,w,h);ctx.restore();
}


}
// Encode the entire picture through one shared interference field, including the logo.
ctx.save();ctx.filter='saturate(12.5%)';ctx.globalAlpha=.28;ctx.globalCompositeOperation='soft-light';ctx.drawImage(noiseCanvas,0,0,640,480);ctx.restore();
// The resolved logo keeps light phosphor grain; do not wash out the opaque second pass.
ctx.save();ctx.globalAlpha=.38-.28*secondTracking;ctx.drawImage(fineCanvas,0,0);ctx.restore();
ctx.fillStyle='#020c202a';for(let y=0;y<480;y+=4)ctx.fillRect(0,y,640,1);
// Shift narrow scanline strips near the tracking band, rather than moving the whole logo.
if(!reduce){
if(now>=distortion.nextAt){
const quiet=Math.random()<.28;
distortion.amplitude=quiet?1:3+Math.random()*13;
distortion.width=16+Math.random()*38;
distortion.frequency=.08+Math.random()*.28;
distortion.phase=Math.random()*Math.PI*2;
distortion.skew=(Math.random()-.5)*8;
distortion.nextAt=now+90+Math.random()*360;
}
crtBufferCtx.drawImage(screenCanvas,0,0);
for(let y=0;y<480;y+=2){
const envelope=Math.exp(-Math.pow((y-(roll+50))/distortion.width,2));
const offset=Math.round(envelope*(Math.sin(y*distortion.frequency+distortion.phase+t*.003)*distortion.amplitude+distortion.skew));
if(offset===0)continue;
ctx.drawImage(crtBuffer,0,y,640,2,offset,y,640,2);
ctx.drawImage(crtBuffer,0,y,640,2,offset+(offset>0?-640:640),y,640,2);
}
}
texture.needsUpdate=true;
}
document.querySelector('#status').textContent=`01 / Geometry + light · ${renderer.backend.isWebGPUBackend?'WebGPU':'WebGL2 fallback'}`;
const eased=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
function playShot(){
  shotStart=signalTime();rollEpoch=shotStart;
  shotEnd=shotStart+2*ROLL_CYCLE;
  setSignal(false);setSignal(true,shotStart);blend=0;
  document.querySelector('#replay').textContent='Restart intro';
}
document.querySelector('#replay').onclick=playShot;
let autoplayPending=!reduce;
if(reduce){setSignal(true,signalTime()-2*ROLL_CYCLE);blend=1}
let firstFrame=true;
// Keep the loading message visible through GPU shader preparation.
camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);
await renderer.compileAsync(scene,camera);
renderer.setAnimationLoop(t=>{
if(autoplayPending){autoplayPending=false;playShot()}
if(shotStart!==null){
const now=signalTime(),elapsed=now-shotStart;
// Resolve the push-in after the second complete vertical roll.
const progress=eased((now-shotStart-350)/(shotEnd-shotStart-350));
yaw=THREE.MathUtils.lerp(.30,.10,progress);pitch=THREE.MathUtils.lerp(.11,.13,progress);
distance=THREE.MathUtils.lerp(closeDistance()*1.24,closeDistance(),progress);
target.set(-.15,THREE.MathUtils.lerp(3.1,3.35,progress),.15*progress);

document.querySelector('#status').textContent=elapsed<ROLL_CYCLE?'Pass / 01 · Push in · Soft Light reveal':elapsed<2*ROLL_CYCLE?'Pass / 02 · Push in · Full logo reveal':'Shot complete';
if(now>=shotEnd)stopShot();
}



camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target);if(last===0||(!reduce&&t-last>65)){paint(t);last=t}renderer.render(scene,camera);if(firstFrame){firstFrame=false;document.body.dataset.sceneReadyMs=String(Math.round(performance.now()));document.body.classList.remove('is-loading');document.querySelector('#replay').disabled=false}});

