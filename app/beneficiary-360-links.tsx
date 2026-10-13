'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

type Row=Record<string,any>;

export default function Beneficiary360Links(){
 useEffect(()=>{
  if(!db)return;
  let mounted=true;
  let observer:MutationObserver|null=null;
  let reportMap=new Map<string,string>();

  async function boot(){
   const {data:{session}}=await db!.auth.getSession();
   if(!session||!mounted)return;
   const {data:role}=await db!.rpc('portal_role');
   const r=String(role||'').toLowerCase();
   if(!['admin','project_manager','management'].includes(r))return;
   const {data}=await db!.from('beneficiary_report_details').select('beneficiary_id,beneficiary_name').not('beneficiary_id','is',null);
   reportMap=new Map((data??[]).filter((x:Row)=>x.beneficiary_id&&x.beneficiary_name).map((x:Row)=>[String(x.beneficiary_name).trim(),String(x.beneficiary_id)]));
   applyLinks();
   observer=new MutationObserver(()=>applyLinks());
   observer.observe(document.body,{childList:true,subtree:true});
  }

  function applyLinks(){
   document.querySelectorAll<HTMLElement>('.person-card').forEach(card=>{
    if(card.querySelector('.beneficiary-360-link'))return;
    const heading=card.querySelector('h4');
    const actions=card.querySelector<HTMLElement>('.actions');
    const name=heading?.textContent?.trim()||'';
    const id=reportMap.get(name);
    if(!id||!actions)return;
    const link=document.createElement('a');
    link.className='beneficiary-360-link';
    link.textContent='ملف 360°';
    link.href=`/admin/beneficiaries/${id}`;
    link.style.cssText='display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#0d5f57;color:white;border-radius:9px;padding:7px 11px;font-weight:800;font-size:12px;';
    actions.prepend(link);
   });
  }

  void boot();
  return()=>{mounted=false;observer?.disconnect();document.querySelectorAll('.beneficiary-360-link').forEach(x=>x.remove());};
 },[]);
 return null;
}
