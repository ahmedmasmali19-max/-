'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

export default function SidebarRequestsLink(){
 useEffect(()=>{
  if(!db)return;let mounted=true;let channel:any=null;let observer:MutationObserver|null=null;
  async function install(){
   const {data:{session}}=await db!.auth.getSession();if(!session||!mounted)return;
   const {data:role}=await db!.rpc('portal_role');if(!['admin','project_manager','management'].includes(String(role||'').toLowerCase()))return;
   const add=(id:string,label:string,href:string)=>{const nav=document.querySelector<HTMLElement>('.sidebar nav');if(!nav||document.getElementById(id))return;const x=document.createElement('button');x.id=id;x.type='button';x.innerHTML=`<span class="nav-dot"></span><span>${label}</span>`;x.onclick=()=>{window.location.href=href;};nav.appendChild(x);};
   const ensureLinks=()=>{const nav=document.querySelector<HTMLElement>('.sidebar nav');if(!nav)return;if(!document.getElementById('wusool-requests-nav')){const x=document.createElement('button');x.id='wusool-requests-nav';x.type='button';x.innerHTML='<span class="nav-dot"></span><span>قائمة الطلبات</span><b id="wusool-requests-count" style="margin-inline-start:auto;background:#e7f6f0;color:#0d5f57;border-radius:999px;padding:2px 7px;font-size:11px;display:none">0</b>';x.onclick=()=>{window.location.href='/admin/requests';};nav.appendChild(x);}add('wusool-payments-nav','إثباتات السداد','/admin/payments');add('wusool-delinquency-nav','لوحة التعثر','/admin/delinquency');add('wusool-documents-nav','لوحة المستندات','/admin/documents');add('wusool-followups-nav','مهام المتابعة','/admin/followups');add('wusool-ownership-nav','تجهيز نقل الملكية','/admin/ownership-readiness');add('wusool-report-nav','التقرير التنفيذي','/admin/report');add('wusool-activity-nav','سجل النشاط','/admin/activity');};
   const refreshCount=async()=>{const {count}=await db!.from('beneficiary_submissions').select('id',{count:'exact',head:true}).eq('status','قيد المراجعة');const badge=document.getElementById('wusool-requests-count');if(badge){const n=count||0;badge.textContent=String(n);badge.style.display=n>0?'inline-block':'none';}};
   ensureLinks();observer=new MutationObserver(()=>ensureLinks());observer.observe(document.body,{childList:true,subtree:true});await refreshCount();channel=db!.channel('sidebar-request-count').on('postgres_changes',{event:'*',schema:'public',table:'beneficiary_submissions'},()=>{void refreshCount();}).subscribe();
  }
  void install();return()=>{mounted=false;observer?.disconnect();if(channel)db?.removeChannel(channel);['wusool-requests-nav','wusool-payments-nav','wusool-delinquency-nav','wusool-documents-nav','wusool-followups-nav','wusool-ownership-nav','wusool-report-nav','wusool-activity-nav'].forEach(id=>document.getElementById(id)?.remove());};
 },[]);return null;
}
