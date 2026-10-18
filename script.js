'use strict';
const $=id=>document.getElementById(id);
const captureBtn=$('captureBtn'),selectBtn=$('selectBtn'),fullBtn=$('fullBtn'),cropBtn=$('cropBtn'),resetBtn=$('resetBtn');
const preview=$('preview'),ctx=preview.getContext('2d'),status=$('status');
let source=null,selection=null,start=null,dragging=false,selectMode=false;
function report(message){status.textContent=message}
function buttons(){const has=!!source;selectBtn.disabled=!has;fullBtn.disabled=!has;resetBtn.disabled=!has;cropBtn.disabled=!has||!selection;selectBtn.classList.toggle('active',selectMode);preview.style.cursor=selectMode?'crosshair':'default'}
function paint(){if(!source)return;ctx.clearRect(0,0,preview.width,preview.height);ctx.drawImage(source,0,0);if(selection){const {x,y,w,h}=selection;ctx.fillStyle='rgba(5,15,33,.35)';ctx.fillRect(0,0,preview.width,preview.height);ctx.clearRect(x,y,w,h);ctx.drawImage(source,x,y,w,h,x,y,w,h);ctx.strokeStyle='#75bcff';ctx.lineWidth=Math.max(2,preview.width/700);ctx.setLineDash([10,5]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([])}}
function point(event){const r=preview.getBoundingClientRect();return {x:Math.round(Math.max(0,Math.min(preview.width,(event.clientX-r.left)*preview.width/r.width))),y:Math.round(Math.max(0,Math.min(preview.height,(event.clientY-r.top)*preview.height/r.height)))}}
selectBtn.onclick=()=>{selectMode=true;selection=null;paint();buttons();report('اسحب بالماوس فوق الصورة لتحديد الجزء المطلوب، ثم اضغط حفظ الجزء المحدد.')};
preview.addEventListener('pointerdown',e=>{if(!source||!selectMode)return;start=point(e);selection=null;dragging=true;preview.setPointerCapture(e.pointerId);paint();buttons()});
preview.addEventListener('pointermove',e=>{if(!dragging||!start)return;const p=point(e);selection={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(start.x-p.x),h:Math.abs(start.y-p.y)};paint()});
function finish(){if(!dragging)return;dragging=false;if(selection&&(selection.w<3||selection.h<3))selection=null;paint();buttons();report(selection?`تم تحديد ${selection.w} × ${selection.h} بكسل، اضغط «حفظ الجزء المحدد PNG».`:'جرّب اسحب بالماوس مساحة أكبر.')}
preview.addEventListener('pointerup',finish);preview.addEventListener('pointercancel',finish);
resetBtn.onclick=()=>{selection=null;selectMode=false;paint();buttons();report('تم إلغاء التحديد.')};
function download(crop){if(!source)return;const rect=crop?selection:{x:0,y:0,w:source.width,h:source.height};if(!rect||!rect.w||!rect.h)return;const out=document.createElement('canvas');out.width=rect.w;out.height=rect.h;out.getContext('2d').drawImage(source,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h);out.toBlob(blob=>{if(!blob){report('تعذر إنشاء الصورة');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`loqta-${new Date().toISOString().replace(/[:.]/g,'-')}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000);report('تم تجهيز صورة PNG للتنزيل. راجع مجلد التنزيلات.')},'image/png')}
fullBtn.onclick=()=>download(false);cropBtn.onclick=()=>download(true);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
captureBtn.onclick=async()=>{
 if(!navigator.mediaDevices?.getDisplayMedia){report('افتح رابط الموقع المنشور عبر HTTPS في Chrome أو Edge على الكمبيوتر.');return}
 let stream=null,video=null;captureBtn.disabled=true;
 try{
  report('اختار «الشاشة بالكامل» أو نافذة/تبويب الموقع الآخر، ثم اضغط مشاركة.');
  stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
  video=document.createElement('video');video.muted=true;video.playsInline=true;video.srcObject=stream;
  await video.play();
  const seconds=Number($('delay').value)||5;
  for(let i=seconds;i>0;i--){if(stream.getVideoTracks().every(t=>t.readyState!=='live'))throw Error('تم إيقاف المشاركة قبل التقاط الصورة');report(`جارٍ التقاط الصورة بعد ${i} ثانية... افتح الموقع أو النافذة المطلوب تصويرها.`);await sleep(1000)}
  if(!video.videoWidth||!video.videoHeight)throw Error('لم تصل صورة من الشاشة. حاول مرة أخرى.');
  const shot=document.createElement('canvas');shot.width=video.videoWidth;shot.height=video.videoHeight;shot.getContext('2d').drawImage(video,0,0);
  source=shot;selection=null;selectMode=false;start=null;preview.width=shot.width;preview.height=shot.height;preview.hidden=false;$('empty').hidden=true;$('sizeLabel').textContent=`${shot.width} × ${shot.height}`;paint();buttons();report('تم تصوير الشاشة! ارجع للموقع واضغط «تحديد جزء» ثم اسحب بالماوس وحدد واحفظ.');
 }catch(err){report(err?.name==='NotAllowedError'?'تم إلغاء المشاركة. جرّب تاني واختار الشاشة أو الموقع الآخر.':'تعذر التقاط الصورة: '+(err?.message||'خطأ غير معروف'))}
 finally{stream?.getTracks().forEach(t=>t.stop());if(video){video.pause();video.srcObject=null}captureBtn.disabled=false}
};
buttons();
