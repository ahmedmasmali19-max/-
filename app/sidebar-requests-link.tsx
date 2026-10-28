'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

const workLinks=[
 ['wusool-beneficiary-portal-nav','بوابة المستفيد','#beneficiary-portal','↗'],
 ['wusool-management-nav','لوحة الإدارة','/admin/management','◫'],
 ['wusool-command-nav','مركز قيادة المشروع','/admin/command','▦'],
 ['wusool-tasks-nav','مهامي اليوم','/admin/tasks','✓'],
 ['wusool-search-nav','البحث الشامل','/admin/search','⌕'],
 ['wusool-smart-nav','الاقتراحات الذكية','/admin/smart-actions','✦'],
 ['wusool-performance-nav','الأداء الشهري','/admin/performance','↗'],
 ['wusool-scores-nav','تقييم الأداء','/admin/performance-scores','★'],
 ['wusool-decisions-nav','القرارات والاعتمادات','/admin/decisions','◇'],
 ['wusool-requests-nav','الطلبات الواردة','/admin/requests','⌁'],
 ['wusool-bulk-nav','الإجراءات الجماعية','/admin/bulk','◎'],
 ['wusool-broadcast-nav','إشعارات المستفيدين','/admin/broadcast','✦'],
 ['wusool-comms-nav','مراسلات المستفيدين','/admin/communications','✉'],
 ['wusool-chats-nav','محادثات المستفيدين','/admin/conversations','✉'],
 ['wusool-risk-nav','مخاطر المستفيدين','/admin/risk','⚠'],
 ['wusool-finance-nav','اللوحة المالية','/admin/finance','ر.س'],
 ['wusool-costs-nav','تكاليف المركبات','/admin/vehicle-costs','▥'],
 ['wusool-operations-nav','الحوادث والصيانة','/admin/operations','⚙'],
 ['wusool-payments-nav','إثباتات السداد','/admin/payments','✓'],
 ['wusool-delinquency-nav','لوحة التعثر','/admin/delinquency','!'],
 ['wusool-documents-nav','لوحة المستندات','/admin/documents','▧'],
 ['wusool-followups-nav','مهام المتابعة','/admin/followups','◎'],
 ['wusool-quality-nav','جودة البيانات','/admin/data-quality','Q'],
 ['wusool-health-nav','فحص سلامة البيانات','/admin/data-health','✓'],
 ['wusool-ownership-nav','تجهيز نقل الملكية','/admin/ownership-readiness','◇'],
 ['wusool-weekly-nav','الملخص الأسبوعي','/admin/weekly','7'],
 ['wusool-reports-center-nav','مركز التقارير','/admin/reports-center','R'],
 ['wusool-report-nav','التقرير التنفيذي','/admin/report','▤'],
 ['wusool-ppt-nav','PowerPoint تنفيذي','/admin/powerpoint','P'],
 ['wusool-permissions-nav','صلاحيات الموظفين','/admin/permissions','🔒'],
 ['wusool-backups-nav','النسخ الاحتياطي','/admin/backups','⟳'],
 ['wusool-settings-nav','إعدادات المشروع','/admin/settings','⚙'],
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
    // Organize existing and extended navigation into accessible collapsible sections.
    if(!nav.querySelector('.wusool-nav-groups')){
      const original=Array.from(nav.querySelectorAll(':scope > button:not([id^="wusool-"])')) as HTMLButtonElement[];
      const sections=[
        {title:'الأساسية',ids:['wusool-command-nav','wusool-management-nav','wusool-search-nav'],initial:0},
        {title:'التشغيل',ids:['wusool-comms-nav','wusool-chats-nav','wusool-requests-nav','wusool-beneficiary-portal-nav','wusool-operations-nav','wusool-documents-nav','wusool-payments-nav','wusool-broadcast-nav','wusool-ownership-nav'],initial:0},
        {title:'المهام والمعاملات',ids:['wusool-tasks-nav','wusool-followups-nav','wusool-decisions-nav','wusool-bulk-nav'],initial:0},
        {title:'المالية والأداء',ids:['wusool-performance-nav','wusool-scores-nav','wusool-risk-nav','wusool-finance-nav','wusool-costs-nav','wusool-delinquency-nav','wusool-smart-nav'],initial:0},
        {title:'التقارير',ids:['wusool-weekly-nav','wusool-reports-center-nav','wusool-report-nav','wusool-ppt-nav'],initial:0},
        {title:'إعدادات وإدارة النظام',ids:['wusool-permissions-nav','wusool-backups-nav','wusool-settings-nav','wusool-quality-nav','wusool-health-nav','wusool-activity-nav'],initial:0}
      ];
      const wrapper=document.createElement('div');wrapper.className='wusool-nav-groups';
      const boxes=sections.map((part,i)=>{const details=document.createElement('details');details.className='wusool-nav-group';details.open=i===0||i===1||i===2;const summary=document.createElement('summary');summary.textContent=part.title;const items=document.createElement('div');items.className='wusool-nav-items';details.append(summary,items);wrapper.appendChild(details);return items;});
      original.forEach((button,i)=>boxes[i<3?0:2].appendChild(button));
      for(const [id] of workLinks){
        const button=document.getElementById(id);if(!button)continue;
        let group=sections.findIndex(x=>x.ids.includes(id));if(group<0)group=3;
        boxes[group].appendChild(button);
      }
      nav.appendChild(wrapper);
    }
   };
   const refreshCount=async()=>{const {count}=await db!.from('beneficiary_submissions').select('id',{count:'exact',head:true}).in('status',['جديد','قيد المراجعة','يحتاج استكمال']);const badge=document.getElementById('wusool-requests-count');if(badge){const n=count||0;badge.textContent=String(n);badge.style.display=n>0?'inline-grid':'none';}};
   ensureLinks();observer=new MutationObserver(()=>ensureLinks());observer.observe(document.body,{childList:true,subtree:true});await refreshCount();channel=db!.channel('sidebar-request-count').on('postgres_changes',{event:'*',schema:'public',table:'beneficiary_submissions'},()=>{void refreshCount();}).subscribe();
  }
  void install();return()=>{mounted=false;observer?.disconnect();if(channel)db?.removeChannel(channel);document.getElementById('wusool-work-centers-title')?.remove();workLinks.forEach(([id])=>document.getElementById(id)?.remove());const nav=document.querySelector<HTMLElement>('.sidebar nav');const grouped=nav?.querySelector('.wusool-nav-groups');if(grouped&&nav){grouped.querySelectorAll<HTMLButtonElement>('.wusool-nav-items>button:not([id^="wusool-"])').forEach(b=>nav.insertBefore(b,grouped));grouped.remove();}};
 },[]);return null;
}
