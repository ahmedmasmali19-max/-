'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

const blocked=['إضافة','تعديل','حذف','أرشفة','إنشاء الأقساط','نسخة احتياطية','تحديث البيانات'];

export default function ManagementReadonlyGuard(){
 useEffect(()=>{
  if(!db)return;
  let observer:MutationObserver|null=null;
  let active=true;
  async function boot(){
   const {data:{session}}=await db!.auth.getSession();
   if(!session||!active)return;
   const {data:role}=await db!.rpc('portal_role');
   if(String(role||'').toLowerCase()!=='management')return;
   document.documentElement.dataset.wusoolReadonly='true';
   const apply=()=>{
    document.querySelectorAll<HTMLButtonElement>('button').forEach(btn=>{
     const text=(btn.textContent||'').trim();
     if(blocked.some(x=>text.includes(x))){btn.style.display='none';btn.disabled=true;}
    });
    document.querySelectorAll<HTMLElement>('.editor,.form-actions').forEach(x=>{if(x.closest('.modal-card'))return;x.style.display='none';});
   };
   apply();
   observer=new MutationObserver(apply);
   observer.observe(document.body,{childList:true,subtree:true});
  }
  void boot();
  return()=>{active=false;observer?.disconnect();delete document.documentElement.dataset.wusoolReadonly;};
 },[]);
 return null;
}
