'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

export default function SidebarRequestsLink(){
 useEffect(()=>{
  if(!db)return;
  let mounted=true;
  let channel:any=null;
  let observer:MutationObserver|null=null;

  async function install(){
   const {data:{session}}=await db!.auth.getSession();
   if(!session||!mounted)return;
   const {data:role}=await db!.rpc('portal_role');
   if(!['admin','project_manager','management'].includes(String(role||'').toLowerCase()))return;

   const ensureLinks=()=>{
    const nav=document.querySelector<HTMLElement>('.sidebar nav');
    if(!nav)return;
    if(!document.getElementById('wusool-requests-nav')){
     const button=document.createElement('button');
     button.id='wusool-requests-nav';
     button.type='button';
     button.innerHTML='<span class="nav-dot"></span><span>قائمة الطلبات</span><b id="wusool-requests-count" style="margin-inline-start:auto;background:#e7f6f0;color:#0d5f57;border-radius:999px;padding:2px 7px;font-size:11px;display:none">0</b>';
     button.onclick=()=>{window.location.href='/admin/requests';};
     nav.appendChild(button);
    }
    if(!document.getElementById('wusool-report-nav')){
     const report=document.createElement('button');
     report.id='wusool-report-nav';
     report.type='button';
     report.innerHTML='<span class="nav-dot"></span><span>التقرير التنفيذي</span>';
     report.onclick=()=>{window.location.href='/admin/report';};
     nav.appendChild(report);
    }
    if(!document.getElementById('wusool-activity-nav')){
     const activity=document.createElement('button');
     activity.id='wusool-activity-nav';
     activity.type='button';
     activity.innerHTML='<span class="nav-dot"></span><span>سجل النشاط</span>';
     activity.onclick=()=>{window.location.href='/admin/activity';};
     nav.appendChild(activity);
    }
   };

   const refreshCount=async()=>{
    const {count}=await db!.from('beneficiary_submissions').select('id',{count:'exact',head:true}).eq('status','قيد المراجعة');
    const badge=document.getElementById('wusool-requests-count');
    if(badge){const n=count||0;badge.textContent=String(n);badge.style.display=n>0?'inline-block':'none';}
   };

   ensureLinks();
   observer=new MutationObserver(()=>ensureLinks());
   observer.observe(document.body,{childList:true,subtree:true});
   await refreshCount();
   channel=db!.channel('sidebar-request-count')
    .on('postgres_changes',{event:'*',schema:'public',table:'beneficiary_submissions'},()=>{void refreshCount();})
    .subscribe();
  }

  void install();
  return()=>{mounted=false;observer?.disconnect();if(channel)db?.removeChannel(channel);document.getElementById('wusool-requests-nav')?.remove();document.getElementById('wusool-report-nav')?.remove();document.getElementById('wusool-activity-nav')?.remove();};
 },[]);
 return null;
}
