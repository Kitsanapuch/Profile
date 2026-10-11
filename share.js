(() => {
 const button=document.getElementById('profileShare'),dialog=document.querySelector('.share-dialog');
 if(!button||!dialog)return;
 const input=dialog.querySelector('input'),status=dialog.querySelector('.share-status'),th=document.documentElement.lang==='th';
 button.addEventListener('click',()=>{status.textContent='';dialog.showModal();});
 dialog.querySelector('.share-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>button.focus());
 dialog.querySelector('.share-copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(input.value);status.textContent=th?'คัดลอกลิงก์แล้ว':'Link copied!';}
  catch{input.focus();input.select();status.textContent=th?'เลือกข้อความแล้ว กดคัดลอกเพื่อแชร์ลิงก์':'Link selected. Copy it to share.';}
 });
})();
