(()=>{
// Layout: date -> section -> one primary task area.
const nav=document.querySelector('.viewnav');$('#days').after(nav);
const baseShow=showView;showView=function(v){baseShow(v);document.body.dataset.view=v};document.body.dataset.view=view;
const article=$('#map').closest('article');
function fold(node,title){if(node.parentElement.classList.contains('route-fold'))return node.parentElement;const d=document.createElement('details');d.className='route-fold';const s=document.createElement('summary');s.textContent=title;d.append(s);node.before(d);d.append(node);return d}
fold($('#profile'),'海拔与距离');const cp=fold($('#checkpoints'),'全部检查点');const previous=cp.previousElementSibling;if(previous?.tagName==='H3')previous.remove();fold($('#exits'),'下撤与接驳');
const priorModal=$('#checkpoint-modal');if(priorModal){document.body.append($('#point'));priorModal.remove()}const modal=document.createElement('dialog');modal.id='checkpoint-modal';modal.className='checkpoint-modal';modal.setAttribute('aria-labelledby','checkpoint-modal-title');modal.innerHTML='<div class="modal-top"><h2 id="checkpoint-modal-title">检查点详情</h2><button type="button" aria-label="关闭检查点详情">×</button></div>';
document.body.append(modal);modal.append($('#point'));let returnTo=null;
function close(){modal.close()}
modal.querySelector('button').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
modal.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(returnTo?.isConnected)returnTo.focus({preventScroll:true});else $('#route-play')?.focus({preventScroll:true})});
const basePoint=renderPoint;renderPoint=function(){basePoint();const root=$('#point');const extra=document.createElement('details');extra.className='point-extra';extra.innerHTML='<summary>坐标、路牌与接驳细节</summary>';root.querySelectorAll(':scope > p').forEach(p=>extra.append(p));root.append(extra);const actions=document.createElement('div');actions.className='point-actions';root.querySelectorAll(':scope > button,:scope > a').forEach(el=>actions.append(el));root.append(actions);const arrived=$('#arrived');if(arrived){const handler=arrived.onclick;arrived.onclick=()=>{handler();let msg=root.querySelector('.point-feedback');if(!msg){msg=document.createElement('p');msg.className='point-feedback';msg.setAttribute('role','status');root.append(msg)}msg.textContent='已记录此检查点。关闭后继续查看路线。';arrived.textContent='已打卡 ✓'}}};
window.openCheckpoint=function(id){returnTo=document.activeElement;pick(id);if(!modal.open){modal.showModal();document.body.classList.add('modal-open')}modal.scrollTop=0;modal.querySelector('button').focus({preventScroll:true})};
const basePick=pick; // Existing check-list and elevation handlers resolve pick at click time.
pick=function(id){basePick(id)};
const baseCP=renderCP;renderCP=function(){baseCP();$('#checkpoints').querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>window.openCheckpoint(+b.dataset.cp))};
let camera={x:0,y:0,w:800,h:510,key:''};
function setupMap(){const stage=document.querySelector('.map-stage');if(!stage)return;const svg=stage.querySelector('svg'),key=day+'-'+$('#whole').checked;if(camera.key!==key)camera={x:0,y:0,w:800,h:510,key};
svg.setAttribute('preserveAspectRatio','xMidYMid meet');stage.setAttribute('aria-label','路线地图：拖动平移，双指缩放，也可使用缩放按钮');
const controls=document.createElement('div');controls.className='map-zoom';controls.innerHTML='<button aria-label="放大地图">＋</button><button aria-label="缩小地图">−</button><button aria-label="重置地图视图">复位</button>';stage.append(controls);const help=document.createElement('span');help.className='map-gesture-help';help.textContent='拖动地图 · 双指缩放 · 点标记查看';stage.append(help);
function apply(){const margin=80;camera.w=Math.max(160,Math.min(800,camera.w));camera.h=camera.w*510/800;camera.x=Math.max(-margin,Math.min(800-camera.w+margin,camera.x));camera.y=Math.max(-margin,Math.min(510-camera.h+margin,camera.y));svg.setAttribute('viewBox',`${camera.x} ${camera.y} ${camera.w} ${camera.h}`)}
function point(x,y){const m=svg.getScreenCTM();if(!m)return{x:camera.x+camera.w/2,y:camera.y+camera.h/2};return new DOMPoint(x,y).matrixTransform(m.inverse())}
function zoom(factor,client){const before=client?point(client.x,client.y):{x:camera.x+camera.w/2,y:camera.y+camera.h/2},w=Math.max(160,Math.min(800,camera.w/factor)),ratio=w/camera.w;camera.x=before.x-(before.x-camera.x)*ratio;camera.y=before.y-(before.y-camera.y)*ratio;camera.w=w;apply()}
controls.children[0].onclick=()=>zoom(1.4);controls.children[1].onclick=()=>zoom(1/1.4);controls.children[2].onclick=()=>{camera={x:0,y:0,w:800,h:510,key};apply()};
const pointers=new Map();let gesture=null,dragged=false,suppressUntil=0;
function measure(){const a=[...pointers.values()];if(a.length>1)return{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};return a.length?{...a[0],d:0}:null}
stage.addEventListener('pointerdown',e=>{if(e.target.closest('.map-zoom'))return;if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)dragged=false;if(pointers.size>1)dragged=true;gesture=measure();stage.setPointerCapture(e.pointerId)});
stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=gesture;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=measure();if(!old||!next)return;const delta=Math.hypot(next.x-old.x,next.y-old.y);if(delta>2||pointers.size>1)dragged=true;const a=point(old.x,old.y),b=point(next.x,next.y);camera.x+=a.x-b.x;camera.y+=a.y-b.y;apply();if(old.d>0&&next.d>0)zoom(next.d/old.d,next);gesture=next;e.preventDefault()});
function end(e){if(!pointers.has(e.pointerId))return;const wasDrag=dragged;pointers.delete(e.pointerId);if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);gesture=measure();if(wasDrag)suppressUntil=Date.now()+350;else if(e.type==='pointerup'){// Pointer capture retargets click; resolve the visible pin under the finger.
const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-guide-id]');if(hit&&stage.contains(hit)){suppressUntil=Date.now()+350;hit.onclick?.()}}
}
stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',e=>{dragged=true;end(e)});stage.addEventListener('click',e=>{if(Date.now()<suppressUntil&&!e.target.closest('.map-zoom')){e.preventDefault();e.stopImmediatePropagation()}},true);
stage.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(Math.exp(-e.deltaY*.008),{x:e.clientX,y:e.clientY})}},{passive:false});
$('#profile').querySelectorAll('[data-plot]').forEach(b=>{b.onclick=()=>window.openCheckpoint(+b.dataset.plot);b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.openCheckpoint(+b.dataset.plot)}}});apply()
}
const baseCharts=renderCharts;renderCharts=function(){baseCharts();setupMap()};
renderCharts();renderPoint();renderCP();
})();
