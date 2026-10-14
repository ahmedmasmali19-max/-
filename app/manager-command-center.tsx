'use client';

import {useEffect,useMemo,useState} from 'react';
import {db} from '../lib/db';

type Result={kind:string;title:string;subtitle:string;href:string};
type Row=Record<string,any>;

export default function ManagerCommandCenter(){
 const [allowed,setAllowed]=useState(false);
 const [q,setQ]=useState('');
 const [open,setOpen]=useState(false);
 const [notifyOpen,setNotifyOpen]=useState(false);
 const [loading,setLoading]=useState(false);
 const [results,setResults]=useState<Result[]>([]);
 const [notifications,setNotifications]=useState<Row[]>([]);
 const unread=notifications.filter(n=>!n.is_read).length;

 useEffect(()=>{void boot();},[]);
 useEffect(()=>{const t=window.setTimeout(()=>{if(q.trim().length>=2)void search(q.trim());else setResults([]);},250);return()=>window.clearTimeout(t);},[q]);

 async function boot(){
  if(!db)return;
  const {data:{session}}=await db.auth.getSession();if(!session)return;
  const {data:r}=await db.rpc('portal_role');
  const role=String(r||'').toLowerCase();if(!['admin','project_manager','management'].includes(role))return;
  setAllowed(true);await loadNotifications();
 }

 async function loadNotifications(){
  if(!db)return;
  const {data}=await db.from('notifications').select('*').order('created_at',{ascending:false}).limit(30);
  setNotifications(data??[]);
 }

 async function search(term:string){
  if(!db)return;setLoading(true);
  const like=`%${term}%`;
  const [b,v,c]=await Promise.all([
   db.from('beneficiaries').select('id,full_name,phone').or(`full_name.ilike.${like},phone.ilike.${like}`).limit(8),
   db.from('vehicles').select('id,beneficiary_id,plate_number,make_model').or(`plate_number.ilike.${like},make_model.ilike.${like}`).limit(8),
   db.from('contracts').select('id,beneficiary_id,reference,vehicle_plate,status').or(`reference.ilike.${like},vehicle_plate.ilike.${like}`).limit(8)
  ]);
  const out:Result[]=[];
  (b.data??[]).forEach(x=>out.push({kind:'مستفيد',title:x.full_name||'مستفيد وصول',subtitle:x.phone||'ملف المستفيد',href:`/admin/beneficiaries/${x.id}`}));
  (v.data??[]).forEach(x=>out.push({kind:'مركبة',title:x.plate_number||x.make_model||'مركبة',subtitle:x.make_model||'مركبة وصول',href:x.beneficiary_id?`/admin/beneficiaries/${x.beneficiary_id}`:'/?section=vehicles'}));
  (c.data??[]).forEach(x=>out.push({kind:'عقد',title:x.reference||'عقد',subtitle:`${x.vehicle_plate||'بدون لوحة'} • ${x.status||'—'}`,href:x.beneficiary_id?`/admin/beneficiaries/${x.beneficiary_id}`:'/?section=contracts'}));
  setResults(out.slice(0,15));setLoading(false);
 }

 function go(href:string){window.location.href=href;setOpen(false);setQ('');}
 function toggleSidebar(){document.body.classList.toggle('manager-mobile-sidebar-open');}

 const important=useMemo(()=>notifications.filter(n=>!n.is_read||['danger','warning'].includes(String(n.severity||''))).slice(0,12),[notifications]);
 if(!allowed)return null;
 return <>
  <button className="manager-mobile-menu" onClick={toggleSidebar} aria-label="فتح القائمة">☰</button>
  <div className="manager-command-bar">
   <div className="manager-global-search">
    <span>⌕</span><input value={q} onChange={e=>{setQ(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)} placeholder="بحث باسم المستفيد، الجوال، اللوحة أو رقم العقد…"/>
    {q&&<button onClick={()=>{setQ('');setResults([])}}>×</button>}
    {open&&q.trim().length>=2&&<div className="manager-search-results">{loading?<div className="manager-search-empty">جارٍ البحث…</div>:results.length?results.map((r,i)=><button key={`${r.href}-${i}`} onClick={()=>go(r.href)}><span className="manager-search-kind">{r.kind}</span><div><b>{r.title}</b><small>{r.subtitle}</small></div></button>):<div className="manager-search-empty">لا توجد نتائج مطابقة.</div>}</div>}
   </div>
   <button className="manager-notify-button" onClick={()=>{setNotifyOpen(v=>!v);if(!notifyOpen)void loadNotifications()}}>🔔<span>التنبيهات</span>{unread>0&&<b>{unread}</b>}</button>
  </div>
  {notifyOpen&&<div className="manager-notify-panel"><div className="manager-notify-head"><div><span>مركز الإجراءات</span><h3>التنبيهات المهمة</h3></div><button onClick={()=>setNotifyOpen(false)}>×</button></div>{important.length?important.map(n=><div className={`manager-notify-row ${n.severity||''}`} key={n.id}><div><b>{n.title||'تنبيه'}</b><span>{n.details||'—'}</span><small>{n.due_date||new Date(n.created_at).toLocaleDateString('ar-SA')}</small></div><i className={n.is_read?'read':'unread'}/></div>):<div className="manager-search-empty">لا توجد تنبيهات مهمة حاليًا.</div>}<div className="manager-notify-actions"><button onClick={()=>{window.location.href='/admin/requests'}}>الطلبات</button><button onClick={()=>{window.location.href='/admin/payments'}}>السداد</button><button onClick={()=>{window.location.href='/admin/followups'}}>المتابعات</button></div></div>}
  {(open||notifyOpen)&&<button className="manager-command-backdrop" aria-label="إغلاق" onClick={()=>{setOpen(false);setNotifyOpen(false)}}/>}
 </>;
}
