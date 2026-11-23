(() => {
 const reader=document.querySelector('.paper-reader');if(!reader)return;
 const frame=reader.querySelector('.paper-pages');let trigger;
 const pageHeight=1462;
 const paperLayouts=new Map([
  ['sensor-ssl', {count:8, width:1033}],
  ['scamgraph-ai', {count:14, width:1034}],
  ['ai-training-intelligence', {count:10, width:1034}],
 ]);
 function fitPages(){
  const style=getComputedStyle(frame);
  const height=frame.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  if(height>0)frame.style.setProperty('--paper-page-height',height+'px');
 }
 new ResizeObserver(fitPages).observe(frame);
 document.querySelectorAll('[data-paper]').forEach(button=>button.addEventListener('click',()=>{
  const match=/^(?:\.\.\/)+papers\/([a-z0-9-]+)\.pdf(?:\?v=[a-zA-Z0-9-]+)?$/.exec(button.dataset.paper||'');
  const layout=match && paperLayouts.get(match[1]);
  if(!layout)return;
  const pdf=new URL(button.dataset.paper,document.baseURI);
  const directory=new URL(match[1]+'/',new URL('.',pdf));
  trigger=button;reader.querySelector('h2').textContent=button.dataset.title;
  reader.querySelector('.paper-open').href=pdf.href;
  frame.replaceChildren();
  frame.style.setProperty('--paper-page-ratio', String(layout.width/pageHeight));
  for(let page=1;page<=layout.count;page++){
   const img=document.createElement('img');
   img.width=layout.width;
   img.height=pageHeight;
   img.alt=button.dataset.title+' — '+(document.documentElement.lang==='th'?'หน้า ':'Page ')+page;
   img.loading=page===1?'eager':'lazy';
   img.decoding='async';
   img.src=new URL('page-'+String(page).padStart(2,'0')+'.jpg',directory).href;
   frame.append(img);
  }
  frame.scrollTop=0;
  reader.showModal();document.body.classList.add('paper-reading');fitPages();
 }));
 reader.querySelector('.paper-close').addEventListener('click',()=>reader.close());
 reader.addEventListener('close',()=>{frame.replaceChildren();document.body.classList.remove('paper-reading');trigger?.focus();});
})();
