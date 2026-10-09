(() => {
 const reader=document.querySelector('.paper-reader');if(!reader)return;
 const frame=reader.querySelector('.paper-pages');let trigger;
 function fitPages(){
  const style=getComputedStyle(frame);
  const height=frame.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  if(height>0)frame.style.setProperty('--paper-page-height',height+'px');
 }
 new ResizeObserver(fitPages).observe(frame);
 document.querySelectorAll('[data-paper]').forEach(button=>button.addEventListener('click',()=>{
  trigger=button;reader.querySelector('h2').textContent=button.dataset.title;
  reader.querySelector('.paper-open').href=button.dataset.paper;
  frame.replaceChildren();
  const scam=button.dataset.paper.includes('scamgraph-ai'),count=scam?13:8;
  const directory=button.dataset.paper.replace(/\.pdf$/,'');
  for(let page=1;page<=count;page++){
   const img=document.createElement('img');img.src=directory+'/page-'+String(page).padStart(scam?2:1,'0')+'.jpg';
   img.alt=button.dataset.title+' — '+(document.documentElement.lang==='th'?'หน้า ':'Page ')+page;
   img.loading=page===1?'eager':'lazy';frame.append(img);
  }
  frame.scrollTop=0;
  reader.showModal();document.body.classList.add('paper-reading');fitPages();
 }));
 reader.querySelector('.paper-close').addEventListener('click',()=>reader.close());
 reader.addEventListener('close',()=>{frame.replaceChildren();document.body.classList.remove('paper-reading');trigger?.focus();});
})();
