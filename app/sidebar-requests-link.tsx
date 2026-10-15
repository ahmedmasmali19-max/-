'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

const workLinks=[
 ['wusool-beneficiary-portal-nav','بوابة المستفيد','#beneficiary-portal','↗'],
 ['wusool-management-nav','لوحة الإدارة','/admin/management','◫'],
 ['wusool-requests-nav','الطلبات الواردة','/admin/requests','⌁'],
 ['wusool-risk-nav','مخاطر المستفيدين','/admin/risk','⚠'],
 ['wusool-finance-nav','اللوحة المالية','/admin/finance','ر.س'],
 ['wusool-operations-nav','الحوادث والصيانة','/admin/operations','⚙'],
 ['wusool-payments-nav','إثباتات السداد','/admin/payments','✓'],
 ['wusool-delinquency-nav','لوحة التعثر','/admin/delinquency','!'],
 ['wusool-documents-nav','لوحة المستندات','/admin/documents','▧'],
 ['wusool-followups-nav','مهام المتابعة','/admin/followups','◎'],
 ['wusool-quality-nav','جودة البيانات','/admin/data-quality','Q'],
 ['wusool-ownership-nav','تجهيز نقل الملكية','/admin/ownership-readiness','◇'],
 ['wusool-weekly-nav','الملخص الأسبوعي','/admin/weekly','7'],
 ['wusool-report-nav','التقرير التنفيذي','/admin/report','▤'],
 ['wusool-ppt-nav','PowerPoint تنفيذي','/admin/powerpoint','P'],
 ['wusool-activity-nav','سجل النشاط','/admin/activity','≡']
] as const;

export default function SidebarRequestsLink(){
 useEffect(()=>{
  if(!db)return;let mounted=true;let channel:any=null;let observer:MutationObserver|null=null;
  async function install(){
   const {data:{session}}=await db!.auth.getSession();if(!session||!mounted)return;
   const {data:role}=await db!.rpc('portal_role');if(!['admin','project_manager','management'].includes(String(role||'').toLowerCase()))return;
   const ensureLinks=()=>{
    const nav=document.querySelector<HTMLElement>('.sidebar nav');if(!nav)return;
    if(!document.getElementById('wusool-work-centers-title')){const title=document.createElement('div');title.id='wusool-work-centers-title';title.className='sidebar-section-title';title.textContent='مراكز العمل';nav.appendChild(title);}
    for(const [id,label,href,icon] of workLinks){
      if(document.getElementById(id))continue;
      const x=document.createElement('button');x.id=id;x.type='button';x.className='sidebar-work-link';
      const i=document.createElement('span');i.className='sidebar-work-icon';i.textContent=icon;
      const t=document.createElement('span');t.className='sidebar-work-label';t.textContent=label;
      x.append(i,t);
      if(id==='wusool-requests-nav'){const b=document.createElement('b');b.id='wusool-requests-count';b.className='sidebar-count-badge';b.textContent='0';b.style.display='none';x.appendChild(b);}
      x.onclick=()=>{if(id==='wusool-beneficiary-portal-nav')document.getElementById('beneficiary-portal-share-trigger')?.click();else window.location.href=href;};nav.appendChild(x);
    }
   };
   const refreshCount=async()=>{const {count}=await db!.from('beneficiary_submissions').select('id',{count:'exact',head:true}).in('status',['جديد','قيد المراجعة','يحتاج استكمال']);const badge=document.getElementById('wusool-requests-count');if(badge){const n=count||0;badge.textContent=String(n);badge.style.display=n>0?'inline-grid':'none';}};
   ensureLinks();observer=new MutationObserver(()=>ensureLinks());observer.observe(document.body,{childList:true,subtree:true});await refreshCount();channel=db!.channel('sidebar-request-count').on('postgres_changes',{event:'*',schema:'public',table:'beneficiary_submissions'},()=>{void refreshCount();}).subscribe();
  }
  void install();return()=>{mounted=false;observer?.disconnect();if(channel)db?.removeChannel(channel);document.getElementById('wusool-work-centers-title')?.remove();workLinks.forEach(([id])=>document.getElementById(id)?.remove());};
 },[]);return null;
}
