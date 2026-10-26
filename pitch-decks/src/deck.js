const slides=[...document.querySelectorAll('.slide')];let i=0;const count=document.querySelector('.count'), title=document.querySelector('.navtitle');function show(n){i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,k)=>{s.classList.toggle('active',k===i);s.setAttribute('aria-hidden',k!==i)});count.textContent=`${String(i+1).padStart(2,'0')} / ${slides.length}`;title.textContent=slides[i].getAttribute('aria-label');document.querySelector('.progress').style.width=((i+1)/slides.length*100)+'%';location.hash=i+1;window.scrollTo(0,0);document.querySelector('#prev').disabled=i===0;document.querySelector('#next').disabled=i===slides.length-1;if(i===4&&typeof window.runWorldEntrance==='function')requestAnimationFrame(()=>window.runWorldEntrance());}document.querySelector('#prev').onclick=()=>show(i-1);document.querySelector('#next').onclick=()=>show(i+1);document.querySelector('#print').onclick=()=>window.print();document.addEventListener('keydown',e=>{if(document.querySelector('.cast-lightbox[open]'))return;if(e.target.closest('button,a,input,textarea,select,[contenteditable]'))return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();show(i+1)}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();show(i-1)}if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1);if(e.key.toLowerCase()==='f'){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.()}});let touchX=0;document.addEventListener('touchstart',e=>touchX=e.changedTouches[0].screenX,{passive:true});document.addEventListener('touchend',e=>{let d=e.changedTouches[0].screenX-touchX;if(Math.abs(d)>70)show(i+(d<0?1:-1))},{passive:true});show((parseInt(location.hash.slice(1))||1)-1);
const worldStage=document.querySelector('.world-stage');
let worldTransitionRunning=false;
function setWorld(mode){
 worldStage.dataset.mode=mode;
 document.querySelectorAll('[data-world]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.world===mode)));
 document.querySelector('.human-layer').setAttribute('aria-hidden',String(mode!=='human'));
 document.querySelector('.cyber-layer').setAttribute('aria-hidden',String(mode!=='cyber'));
 document.querySelectorAll('[data-caption]').forEach(c=>c.hidden=c.dataset.caption!==mode);
}
async function transitionWorld(mode,initial=false){
 if(worldTransitionRunning||(!initial&&worldStage.dataset.mode===mode))return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){setWorld(mode);return;}
 worldTransitionRunning=true;worldStage.setAttribute('aria-busy','true');
 const controls=[...document.querySelectorAll('[data-world]')];controls.forEach(b=>b.disabled=true);
 const zoomIn=mode==='cyber';
 const target=worldStage.querySelector(zoomIn?'.cyber-layer':'.human-layer');
 const targetImage=target.querySelector('img');
 try{await targetImage.decode();}catch(e){}
 if(initial)targetImage.style.visibility='hidden';
 const departingCaption=worldStage.querySelector('[data-caption]:not([hidden])');
 const captionExit=departingCaption.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:312,fill:'forwards',easing:'ease'});
 const grid=document.createElement('div');grid.className='world-tile-grid';grid.setAttribute('aria-hidden','true');
 const columns=16,rows=10,width=worldStage.clientWidth,height=worldStage.clientHeight;
 const iw=targetImage.naturalWidth,ih=targetImage.naturalHeight;
 const scale=Math.max(width/iw,height/ih),bw=iw*scale,bh=ih*scale;
 const ox=(width-bw)*.5,oy=(height-bh)*(zoomIn?.48:.57);
 const animations=[];
 const tempo=1.3;
 const maxTileDelay=Math.max(...Array.from({length:rows},(_,row)=>Array.from({length:columns},(_,col)=>(zoomIn?col:columns-1-col)*50+row*35+((row*7+col*11)%6)*26)).flat());
 const flipDuration=480;
 const duration=(maxTileDelay+flipDuration)*tempo;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const tile=document.createElement('div');tile.className='world-tile';
  tile.style.left=(col/columns*100)+'%';tile.style.top=(row/rows*100)+'%';
  tile.style.width='calc('+100/columns+'% + .5px)';tile.style.height='calc('+100/rows+'% + .5px)';
  tile.style.backgroundImage='url("'+targetImage.src+'")';tile.style.backgroundSize=bw+'px '+bh+'px';
  tile.style.backgroundPosition=(ox-col*width/columns)+'px '+(oy-row*height/rows)+'px';
  grid.append(tile);
  const directionalColumn=zoomIn?col:columns-1-col;
  const variation=((row*7+col*11)%6)*26;
  const delay=(directionalColumn*50+row*35+variation)*tempo;
  animations.push(tile.animate([
   {opacity:0,transform:'rotateY('+(zoomIn?-90:90)+'deg)'},
   {opacity:1,transform:'rotateY('+(zoomIn?-72:72)+'deg)',offset:.18},
   {opacity:1,transform:'rotateY(0deg)'}
  ],{duration:flipDuration*tempo,delay,fill:'both',easing:'cubic-bezier(.2,.65,.25,1)'}).finished);
 }
 worldStage.append(grid);
 const destinationZoom=grid.animate([{transform:zoomIn?'scale(.985)':'scale(1.02)'},{transform:'scale(1)'}],{duration,fill:'both',easing:'cubic-bezier(.25,.1,.25,1)'});
 const sourceImage=worldStage.querySelector(zoomIn?'.human-layer img':'.cyber-layer img');
 sourceImage.style.transformOrigin=zoomIn?'58% 58%':'50% 50%';
 const sourceZoom=sourceImage.animate([{transform:'scale(1)'},{transform:zoomIn?'scale(1.14)':'scale(.86)'}],{duration,fill:'both',easing:'cubic-bezier(.25,.1,.25,1)'});
 try{
  await Promise.all([...animations,destinationZoom.finished]);targetImage.style.visibility='';setWorld(mode);
  const caption=worldStage.querySelector('[data-caption="'+mode+'"]');
  [...caption.children].forEach((el,index)=>el.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:676,delay:index*110.5,fill:'both',easing:'cubic-bezier(.2,.65,.3,1)'}));
  // Identical framing and shading allow immediate removal after the final flip.
  grid.remove();
 }finally{
  targetImage.style.visibility='';captionExit.cancel();sourceZoom.cancel();sourceImage.style.transformOrigin='';destinationZoom.cancel();grid.remove();controls.forEach(b=>b.disabled=false);worldStage.setAttribute('aria-busy','false');worldTransitionRunning=false;
 }
}
document.querySelectorAll('[data-world]').forEach(button=>button.addEventListener('click',()=>transitionWorld(button.dataset.world)));
worldStage.setAttribute('role','button');worldStage.setAttribute('tabindex','0');worldStage.setAttribute('aria-label','Switch between Human and Cyber worlds');
const toggleWorld=()=>transitionWorld(worldStage.dataset.mode==='human'?'cyber':'human');
worldStage.addEventListener('click',toggleWorld);
worldStage.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();toggleWorld();}});

window.runWorldEntrance=()=>{
 if(worldTransitionRunning||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const caption=worldStage.querySelector('[data-caption]:not([hidden])');
 [...caption.children].forEach((el,index)=>{
  el.getAnimations().forEach(a=>a.cancel());
  el.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:676,delay:182+index*110.5,fill:'both',easing:'cubic-bezier(.2,.65,.3,1)'});
 });
};
if(i===4)requestAnimationFrame(()=>window.runWorldEntrance());
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.jump))));

// Animate content groups, never backgrounds or nested children twice.
slides.forEach(slide=>{
 const candidates=[...slide.querySelectorAll('h1,h2,h3,p,figure,.mwr-logo-link,.demo-enter,.world-toggle,.world-stage,.cast-art,.world-artwork figure,.across-art,.split > img.art')];
 const groups=candidates.filter(el=>!el.closest('.world-stage')||el.classList.contains('world-stage'))
  .filter(el=>!candidates.some(parent=>parent!==el&&parent.contains(el)));
 groups.forEach((el,index)=>{el.classList.add('cascade-item');el.style.setProperty('--entrance-delay',Math.min(index*143,1001)+'ms');});
});

const castDialog=document.querySelector('.cast-lightbox');
const castExpand=document.querySelector('.cast-expand');
castExpand.addEventListener('click',()=>{const holder=castDialog.querySelector('.cast-lightbox-art');holder.replaceChildren(castExpand.querySelector('svg').cloneNode(true));castDialog.showModal();});
castDialog.querySelector('.cast-lightbox-close').addEventListener('click',()=>castDialog.close());
castDialog.addEventListener('click',e=>{if(e.target===castDialog){const r=castDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)castDialog.close();}});
castDialog.addEventListener('close',()=>castExpand.focus({preventScroll:true}));

const castLens=document.createElement('span');castLens.className='cast-lens';castLens.setAttribute('aria-hidden','true');
const lensArtwork=castExpand.querySelector('svg').cloneNode(true);lensArtwork.removeAttribute('class');lensArtwork.removeAttribute('role');lensArtwork.removeAttribute('aria-label');castLens.append(lensArtwork);
const lensMosaic=document.createElement('canvas');lensMosaic.className='cast-lens-mosaic';castLens.append(lensMosaic);
const lensSource=new Image();lensSource.src=castExpand.querySelector('svg image').getAttribute('href');
const lensView=castExpand.querySelector('svg').viewBox.baseVal;
castExpand.append(castLens);
function moveCastLens(event){
 if(event.pointerType==='touch'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
 const image=castExpand.querySelector('svg.cast-art');const bounds=image.getBoundingClientRect();
 if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom){castExpand.classList.remove('cast-lens-visible');return;}
 const box=castExpand.getBoundingClientRect(),x=event.clientX-bounds.left,y=event.clientY-bounds.top,zoom=2.3;
 castExpand.classList.add('cast-lens-visible');
 castLens.style.left=(event.clientX-box.left)+'px';castLens.style.top=(event.clientY-box.top)+'px';
 const lensHalfWidth=castLens.clientWidth/2,lensHalfHeight=castLens.clientHeight/2;
 lensArtwork.style.width=(bounds.width*zoom)+'px';lensArtwork.style.height=(bounds.height*zoom)+'px';
 lensArtwork.style.left=(lensHalfWidth-x*zoom)+'px';lensArtwork.style.top=(lensHalfHeight-y*zoom)+'px';
 // Sample the same magnified region into a low-resolution canvas; CSS exposes only its edge.
 if(lensSource.complete&&lensSource.naturalWidth){
  const lw=castLens.clientWidth,lh=castLens.clientHeight,cell=12;
  const cw=Math.max(1,Math.ceil(lw/cell)),ch=Math.max(1,Math.ceil(lh/cell));
  if(lensMosaic.width!==cw)lensMosaic.width=cw;if(lensMosaic.height!==ch)lensMosaic.height=ch;
  const ctx=lensMosaic.getContext('2d');ctx.fillStyle='#eee4d2';ctx.fillRect(0,0,cw,ch);
  const sx=lensView.x+(x-lensHalfWidth/zoom)/bounds.width*lensView.width;
  const sy=lensView.y+(y-lensHalfHeight/zoom)/bounds.height*lensView.height;
  const sw=lw/(bounds.width*zoom)*lensView.width,sh=lh/(bounds.height*zoom)*lensView.height;
  ctx.drawImage(lensSource,sx,sy,sw,sh,0,0,cw,ch);
 }

}
castExpand.addEventListener('pointermove',moveCastLens);
castExpand.addEventListener('pointerleave',()=>castExpand.classList.remove('cast-lens-visible'));
castExpand.addEventListener('click',()=>castExpand.classList.remove('cast-lens-visible'));
