'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

type Row=Record<string,any>;
const money=(v:number)=>`${Number(v||0).toLocaleString('ar-SA')} ر.س`;

export default function DashboardLiveMetrics(){
 useEffect(()=>{
  if(!db)return;
  let active=true;
  let channels:any[]=[];
  let timer:number|undefined;
  let retryTimer:number|undefined;
  let refreshRunning=false;

  const text=(el:Element|null,value:string)=>{if(el)el.textContent=value;};
  const findKpi=(label:string)=>[...document.querySelectorAll('.exec-kpi')].find(el=>(el.textContent||'').includes(label));

  function renderMonthly(chart:HTMLElement,installments:Row[]){
   const monthMap=new Map<string,number>();
   installments.forEach(x=>{if(!x.due_date)return;const key=String(x.due_date).slice(0,7);monthMap.set(key,(monthMap.get(key)||0)+(Number(x.paid_amount)||0));});
   const months=[...monthMap.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
   chart.replaceChildren();
   if(!months.length||months.every(([,v])=>v===0)){
    const empty=document.createElement('div');empty.className='empty-state';empty.style.gridColumn='1/-1';empty.textContent='لا توجد دفعات محصلة مسجلة بعد في جدول الأقساط.';chart.appendChild(empty);
   }else{
    const max=Math.max(...months.map(([,v])=>v),1);
    months.forEach(([m,v])=>{
     const col=document.createElement('div');col.className='month-col';
     const value=document.createElement('div');value.className='month-value';value.textContent=money(v);
     const track=document.createElement('div');track.className='month-track';
     const bar=document.createElement('i');bar.style.height=`${Math.max(8,(v/max)*100)}%`;track.appendChild(bar);
     const label=document.createElement('span');label.textContent=m;
     col.append(value,track,label);chart.appendChild(col);
    });
   }
   const panel=chart.closest('.exec-panel');const h=panel?.querySelector('h3');if(h)h.textContent='التحصيل الفعلي الشهري';
  }

  function renderVehicles(bars:HTMLElement,vehicles:Row[]){
   const groups=new Map<string,number>();
   vehicles.forEach(v=>{const name=String(v.make_model||'غير محدد');groups.set(name,(groups.get(name)||0)+1);});
   const rows=[...groups.entries()].sort((a,b)=>b[1]-a[1]);const max=Math.max(...rows.map(([,n])=>n),1);
   bars.replaceChildren();
   rows.forEach(([name,count])=>{
    const row=document.createElement('div');row.className='bar-row';
    const head=document.createElement('div');const b=document.createElement('b');b.textContent=name;const s=document.createElement('span');s.textContent=`${count} مركبة`;head.append(b,s);
    const track=document.createElement('div');track.className='bar';const fill=document.createElement('i');fill.style.width=`${Math.max(8,(count/max)*100)}%`;track.appendChild(fill);
    row.append(head,track);bars.appendChild(row);
   });
   const panel=bars.closest('.exec-panel');const badge=panel?.querySelector('.count-badge');if(badge)badge.textContent=String(vehicles.length);
  }

  function apply(k:any,vehicles:Row[],installments:Row[]){
   if(!active)return;
   const map:{[key:string]:string}={
    'إجمالي المستفيدين':String(k.beneficiaries),
    'إجمالي المركبات':String(k.vehicles),
    'العقود النشطة':String(k.contracts),
    'المبالغ المحصلة':money(k.collected),
    'المبالغ المتأخرة':money(k.overdue),
    'الصافي':money(k.collected-k.overdue)
   };
   Object.entries(map).forEach(([label,value])=>{const box=findKpi(label);text(box?.querySelector('strong')||null,value);});
   const chart=document.querySelector<HTMLElement>('.monthly-chart');if(chart)renderMonthly(chart,installments);
   const bars=document.querySelector<HTMLElement>('.vehicle-bars');if(bars)renderVehicles(bars,vehicles);

   let tag=document.getElementById('live-source-badge');
   if(!tag){tag=document.createElement('div');tag.id='live-source-badge';tag.textContent='● مؤشرات تشغيلية مباشرة';tag.style.cssText='position:fixed;right:20px;bottom:18px;z-index:65;background:#e9f8f2;color:#0d5f57;border:1px solid #c8e9de;border-radius:999px;padding:8px 12px;font:700 11px Tahoma,Arial;box-shadow:0 8px 22px rgba(13,95,87,.12)';document.body.appendChild(tag);}
  }

  async function refresh(){
   if(!db||!active||refreshRunning)return;
   refreshRunning=true;
   try{
    const [b,v,c,i]=await Promise.all([
     db.from('beneficiaries').select('id'),
     db.from('vehicles').select('id,beneficiary_id,make_model').not('beneficiary_id','is',null),
     db.from('contracts').select('id,beneficiary_id,status,archived').not('beneficiary_id','is',null).eq('archived',false),
     db.from('installments').select('id,due_date,amount,paid_amount,status,archived').eq('archived',false)
    ]);
    if([b,v,c,i].some(x=>x.error))return;
    const vehicles=v.data??[];const installments=i.data??[];const contracts=(c.data??[]).filter(x=>x.status!=='مكتمل');
    const collected=installments.reduce((s,x)=>s+(Number(x.paid_amount)||0),0);
    const overdue=installments.filter(x=>x.status==='متأخر').reduce((s,x)=>s+Math.max(0,(Number(x.amount)||0)-(Number(x.paid_amount)||0)),0);
    apply({beneficiaries:(b.data??[]).length,vehicles:vehicles.length,contracts:contracts.length,collected,overdue},vehicles,installments);
   }finally{refreshRunning=false;}
  }

  async function boot(){
   const {data:{session}}=await db!.auth.getSession();if(!session||!active)return;
   const {data:role}=await db!.rpc('portal_role');if(!['admin','project_manager','management'].includes(String(role||'').toLowerCase()))return;
   let attempts=0;
   const start=async()=>{if(!active)return;attempts+=1;await refresh();if(!document.querySelector('.exec-kpi')&&attempts<8)retryTimer=window.setTimeout(()=>void start(),350);};
   await start();
   timer=window.setInterval(()=>void refresh(),120000);
   for(const table of ['vehicles','contracts','installments','beneficiaries']){
    const ch=db!.channel(`live-dashboard-${table}`).on('postgres_changes',{event:'*',schema:'public',table},()=>void refresh()).subscribe();channels.push(ch);
   }
  }
  void boot();
  return()=>{active=false;if(timer)window.clearInterval(timer);if(retryTimer)window.clearTimeout(retryTimer);channels.forEach(ch=>db?.removeChannel(ch));document.getElementById('live-source-badge')?.remove();};
 },[]);
 return null;
}
