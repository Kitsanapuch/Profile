(() => {
 const th=document.documentElement.lang==='th';
 const layer=document.createElement('div');layer.className='preview-atmosphere';layer.setAttribute('aria-hidden','true');
 layer.innerHTML='<div class="preview-grid"></div><div class="preview-orbit one"></div><div class="preview-orbit two"></div><span class="preview-glyph a">0101 0010\n  &lt; / &gt;\n0010 1101</span><span class="preview-glyph b">+ . . +\n. : : .\n+ . . +</span>';
 for(let i=0;i<12;i++){const dot=document.createElement('i');dot.className='preview-dot';dot.style.left=(5+i*8)%100+'%';dot.style.top=(13+i*19)%100+'%';dot.style.animationDelay=-(i*.7)+'s';layer.append(dot);}
 document.body.prepend(layer);
 const controls=document.createElement('div');controls.className='preview-controls';
 const label=document.createElement('span');label.textContent=th?'เอฟเฟกต์พื้นหลัง':'Background effects';
 const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed','false');
 controls.append(label,button);document.body.append(controls);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches,frame=0;
 function render(){frame=0;if(paused)return;const y=window.scrollY;layer.style.setProperty('--grid-shift',-(y*.045%76)+'px');layer.style.setProperty('--float-shift',(-Math.sin(y*.0009)*65)+'px');layer.style.setProperty('--float-angle',(y*.018)+'deg');}
 function sync(){layer.classList.toggle('preview-paused',paused);button.textContent=paused?(th?'เปิดการเคลื่อนไหว':'Enable motion'):(th?'หยุดการเคลื่อนไหว':'Pause motion');button.setAttribute('aria-pressed',String(paused));render();}
 button.addEventListener('click',()=>{paused=!paused;sync();});
 reduce.addEventListener('change',()=>{paused=reduce.matches;sync();});
 window.addEventListener('scroll',()=>{if(!frame&&!paused)frame=requestAnimationFrame(render);},{passive:true});sync();
})();

(() => {
 const tabs=Array.from(document.querySelectorAll('.intro-monitor-tabs [role="tab"]'));
 function select(tab,focus=false){tabs.forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on;});if(focus)tab.focus();}
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>select(tab));
  tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(tabs[n],true);});
 });
})();

(() => {
 const section=document.querySelector('.code-journey');if(!section)return;
 const media=matchMedia('(min-width:761px) and (min-height:650px) and (prefers-reduced-motion:no-preference)');let frame=0,manual=null;
 const th=document.documentElement.lang==='th';
 const heading=section.querySelector('.journey-heading p');
 heading.textContent=th?'เลื่อนเพื่อเปลี่ยนจากโค้ดเป็นผลงาน หรือเลือกดูด้วยปุ่มด้านล่าง':'Scroll from code to product, or choose a view below.';
 const controls=document.createElement('div');controls.className='journey-view-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label',th?'เลือกเนื้อหาในจอ':'Choose screen content');
 const buttons=['developer.ts','MySchool',th?'ตามการเลื่อน':'Auto scroll'].map((label,i)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{manual=i===2?null:i;render();});controls.append(button);return button;});
 section.querySelector('.journey-monitor').after(controls);
 const clamp=x=>Math.min(1,Math.max(0,x));
 function render(){frame=0;
   controls.hidden=!media.matches;
   if(!media.matches)return;
   const r=section.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,r.height-innerHeight));
   const product=manual===null ? p>.48 : manual===1;
   section.style.setProperty('--zoom-p',p);
   section.style.setProperty('--monitor-scale',.97+p*.03);
   section.style.setProperty('--code-alpha',product?0:1);
   section.style.setProperty('--product-alpha',product?1:0);
   const code=section.querySelector('.journey-code'),work=section.querySelector('.journey-product');
   code.setAttribute('aria-hidden',String(product));work.setAttribute('aria-hidden',String(!product));
   buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===2?manual===null:manual===i)));
 }
 function sync(){section.classList.toggle('is-immersive',media.matches);if(!media.matches){section.querySelector('.journey-code').removeAttribute('aria-hidden');section.querySelector('.journey-product').removeAttribute('aria-hidden');}render();}
 window.addEventListener('scroll',()=>{if(!frame&&media.matches)frame=requestAnimationFrame(render);},{passive:true});window.addEventListener('resize',sync);media.addEventListener('change',sync);sync();
})();

(() => {
 const layer=document.querySelector('.preview-atmosphere');if(!layer)return;
 const canvas=document.createElement('canvas');canvas.className='neural-field';layer.prepend(canvas);const ctx=canvas.getContext('2d');if(!ctx)return;
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');let w=0,h=0,frame=0,t=0,last=0,mx=0,my=0;
 const nodes=Array.from({length:36},(_,i)=>({x:((i*73+17)%997)/997,y:((i*137+53)%991)/991,z:.3+(i%5)*.17}));
 function draw(now=0){frame=0;if(now-last<40&&!document.hidden){frame=requestAnimationFrame(draw);return;}last=now;
 const moving=!reduce.matches&&!layer.classList.contains('preview-paused');if(moving)t+=.012;
 ctx.clearRect(0,0,w,h);
 const points=nodes.map((n,i)=>({x:n.x*w+Math.sin(t+n.y*8)*16*n.z+mx*n.z,y:n.y*h+Math.cos(t*.7+i)*20*n.z+my*n.z,z:n.z}));
 points.forEach((a,i)=>{for(let j=i+1;j<points.length;j++){const b=points[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<155){ctx.strokeStyle=`rgba(96,175,225,${(1-d/155)*.19})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
 ctx.fillStyle=`rgba(134,212,243,${a.z*.5})`;ctx.beginPath();ctx.arc(a.x,a.y,1+a.z,0,Math.PI*2);ctx.fill();});
 if(moving&&!document.hidden)frame=requestAnimationFrame(draw);
 }
 function start(){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);}
 function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);start();}
 window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce.matches)return;mx=(e.clientX/w-.5)*24;my=(e.clientY/h-.5)*24;},{passive:true});
 window.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else start();});reduce.addEventListener('change',start);
 new MutationObserver(start).observe(layer,{attributes:true,attributeFilter:['class']});resize();
})();

// Page-wide decorative light follows a fine pointer without intercepting clicks.
(() => {
 const glow=document.createElement('div');glow.className='page-pointer-glow';glow.setAttribute('aria-hidden','true');document.body.append(glow);
 const allowed=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');let frame=0,x=0,y=0;
 function hide(){cancelAnimationFrame(frame);frame=0;glow.classList.remove('visible');}
 window.addEventListener('pointermove',e=>{
  if(!allowed.matches||e.pointerType==='touch')return;x=e.clientX;y=e.clientY;
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;glow.style.setProperty('--glow-x',x+'px');glow.style.setProperty('--glow-y',y+'px');glow.classList.add('visible');});
 },{passive:true});
 document.documentElement.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);allowed.addEventListener('change',hide);
})();
