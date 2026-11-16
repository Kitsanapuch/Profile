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
  const match=/^(?:\.\.\/)+papers\/(scamgraph-ai|ai-training-intelligence)\.pdf(?:\?v=[a-zA-Z0-9-]+)?$/.exec(button.dataset.paper||'');
  if(!match)return;
  const pdf=new URL(button.dataset.paper,document.baseURI);
  const directory=new URL(match[1]+'/',new URL('.',pdf));
  trigger=button;reader.querySelector('h2').textContent=button.dataset.title;
  reader.querySelector('.paper-open').href=pdf.href;
  frame.replaceChildren();
  const count=match[1]==='scamgraph-ai'?14:10;
  for(let page=1;page<=count;page++){
   const img=document.createElement('img');img.src=new URL('page-'+String(page).padStart(2,'0')+'.jpg',directory).href;
   img.alt=button.dataset.title+' — '+(document.documentElement.lang==='th'?'หน้า ':'Page ')+page;
   img.loading=page===1?'eager':'lazy';frame.append(img);
  }
  frame.scrollTop=0;
  reader.showModal();document.body.classList.add('paper-reading');fitPages();
 }));
 reader.querySelector('.paper-close').addEventListener('click',()=>reader.close());
 reader.addEventListener('close',()=>{frame.replaceChildren();document.body.classList.remove('paper-reading');trigger?.focus();});
})();
