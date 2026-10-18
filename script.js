'use strict';
const $ = id => document.getElementById(id);
const captureBtn=$('captureBtn'), fullBtn=$('fullBtn'), cropBtn=$('cropBtn'), resetBtn=$('resetBtn');
const preview=$('preview'), ctx=preview.getContext('2d'), status=$('status');
let source=null, selection=null, start=null, dragging=false;
function report(message){status.textContent=message}
function buttons(hasImage){fullBtn.disabled=!hasImage;resetBtn.disabled=!hasImage;cropBtn.disabled=!hasImage||!selection}
function paint(){if(!source)return;ctx.clearRect(0,0,preview.width,preview.height);ctx.drawImage(source,0,0);if(selection){const {x,y,w,h}=selection;ctx.fillStyle='rgba(5,15,33,.33)';ctx.fillRect(0,0,preview.width,preview.height);ctx.clearRect(x,y,w,h);ctx.drawImage(source,x,y,w,h,x,y,w,h);ctx.strokeStyle='#65a3ff';ctx.lineWidth=Math.max(2,preview.width/700);ctx.setLineDash([10,5]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([])}}
function point(event){const r=preview.getBoundingClientRect();return {x:Math.round(Math.max(0,Math.min(preview.width,(event.clientX-r.left)*preview.width/r.width))),y:Math.round(Math.max(0,Math.min(preview.height,(event.clientY-r.top)*preview.height/r.height)))}}
preview.addEventListener('pointerdown',e=>{if(!source)return;start=point(e);selection=null;dragging=true;preview.setPointerCapture(e.pointerId);paint();buttons(true)});
preview.addEventListener('pointermove',e=>{if(!dragging||!start)return;const p=point(e);selection={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(start.x-p.x),h:Math.abs(start.y-p.y)};paint()});
function finish(){if(!dragging)return;dragging=false;if(selection&&(selection.w<3||selection.h<3))selection=null;paint();buttons(true);report(selection?`تم تحديد مساحة ${selection.w} × ${selection.h} بكسل. اضغط «حفظ الجزء المحدد».`:'اسحب بالماوس على الصورة لتحديد الجزء المطلوب.')}
preview.addEventListener('pointerup',finish);preview.addEventListener('pointercancel',finish);
resetBtn.addEventListener('click',()=>{selection=null;paint();buttons(!!source);report('اتلغى التحديد. تقدر تختار جزء جديد.')});
function download(crop){if(!source)return;const rect=crop?selection:{x:0,y:0,w:source.width,h:source.height};if(!rect||!rect.w||!rect.h)return;const out=document.createElement('canvas');out.width=rect.w;out.height=rect.h;out.getContext('2d').drawImage(source,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h);out.toBlob(blob=>{if(!blob){report('تعذر إنشاء الصورة. حاول مرة أخرى.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`screenshot-${new Date().toISOString().replace(/[:.]/g,'-')}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);report('تم تجهيز صورة PNG للتحميل. راجع مجلد التنزيلات.')},'image/png')}
fullBtn.addEventListener('click',()=>download(false));cropBtn.addEventListener('click',()=>download(true));
captureBtn.addEventListener('click',async()=>{
 if(!navigator.mediaDevices?.getDisplayMedia){report('المتصفح لا يدعم التقاط الشاشة هنا. افتح الموقع عبر HTTPS باستخدام Chrome أو Edge على الكمبيوتر.');return}
 captureBtn.disabled=true;report('اختار الشاشة أو النافذة من نافذة المتصفح، ثم اضغط مشاركة.');let stream=null;
 try{
   stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:1},audio:false});
   const video=document.createElement('video');video.muted=true;video.playsInline=true;video.srcObject=stream;
   await video.play();
   if(!video.videoWidth||!video.videoHeight){await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('لم تصل صورة من الشاشة')),5000);video.addEventListener('loadeddata',()=>{clearTimeout(timeout);resolve()},{once:true})})}
   if(!video.videoWidth||!video.videoHeight)throw Error('لم تصل صورة من الشاشة');
   const snapshot=document.createElement('canvas');snapshot.width=video.videoWidth;snapshot.height=video.videoHeight;snapshot.getContext('2d').drawImage(video,0,0);
   source=snapshot;selection=null;start=null;preview.width=source.width;preview.height=source.height;paint();preview.hidden=false;$('empty').hidden=true;$('sizeLabel').textContent=`${source.width} × ${source.height}`;buttons(true);report('تم التقاط الصورة. اسحب بالماوس على الصورة لتحديد الجزء الذي تريد حفظه.');
 }catch(err){if(err?.name==='NotAllowedError'){report('تم إلغاء مشاركة الشاشة أو رفض الإذن. اضغط التقاط وحاول مرة أخرى.')}else{report('تعذر التقاط الشاشة: '+(err?.message||'خطأ غير معروف'))}}
 finally{stream?.getTracks().forEach(track=>track.stop());captureBtn.disabled=false}
});
