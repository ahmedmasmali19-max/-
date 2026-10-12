'use client';

import {useEffect,useMemo,useState} from 'react';
import {db} from '../lib/db';

type Row=Record<string,any>;
const labels:Record<string,string>={installment:'إثبات سداد قسط',accident:'بلاغ حادث',request:'طلب عام',maintenance:'طلب صيانة',document:'رفع مستند'};

export default function ManagerRequestsPanel(){
 const [visible,setVisible]=useState(false);
 const [open,setOpen]=useState(false);
 const [rows,setRows]=useState<Row[]>([]);
 const [beneficiaries,setBeneficiaries]=useState<Row[]>([]);
 const [filter,setFilter]=useState('الكل');
 const [loading,setLoading]=useState(false);
 const [liveNotice,setLiveNotice]=useState('');

 useEffect(()=>{
  if(!db)return;
  let active=true;
  let channel:any=null;
  async function boot(){
   const {data:{session}}=await db!.auth.getSession();
   if(!session||!active)return;
   const {data:role}=await db!.rpc('portal_role');
   const r=String(role??'').toLowerCase();
   if(!active||!['admin','project_manager'].includes(r))return;
   setVisible(true);await load();
   if(!channel){
    channel=db!.channel('manager-beneficiary-submissions')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'beneficiary_submissions'},async(payload:any)=>{
        const incoming=payload.new as Row;
        setRows(prev=>prev.some(x=>x.id===incoming.id)?prev:[incoming,...prev]);
        setLiveNotice('وصل طلب جديد من أحد المستفيدين');
        window.setTimeout(()=>setLiveNotice(''),5000);
        const {data:b}=await db!.from('beneficiaries').select('*').eq('id',incoming.beneficiary_id).maybeSingle();
        if(b)setBeneficiaries(prev=>prev.some(x=>x.id===b.id)?prev:[...prev,b]);
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'beneficiary_submissions'},(payload:any)=>{
        const updated=payload.new as Row;
        setRows(prev=>prev.map(x=>x.id===updated.id?updated:x));
      })
      .subscribe();
   }
  }
  void boot();
  const {data:s}=db.auth.onAuthStateChange((_e,session)=>{window.setTimeout(()=>{if(!active)return;if(!session){setVisible(false);setRows([]);}else void boot();},0)});
  return()=>{active=false;s.subscription.unsubscribe();if(channel)db?.removeChannel(channel);};
 },[]);

 async function load(){
  if(!db)return;setLoading(true);
  const [r,b]=await Promise.all([
   db.from('beneficiary_submissions').select('*').order('created_at',{ascending:false}),
   db.from('beneficiaries').select('*')
  ]);
  setRows(r.data??[]);setBeneficiaries(b.data??[]);setLoading(false);
 }
 const names=useMemo(()=>new Map(beneficiaries.map(b=>[b.id,b.full_name||b.beneficiary_name||b.name||'مستفيد وصول'])),[beneficiaries]);
 const pending=rows.filter(r=>r.status==='قيد المراجعة').length;
 const shown=filter==='الكل'?rows:rows.filter(r=>r.status===filter);
 if(!visible)return null;
 return <>
  {liveNotice&&<div className="live-request-toast">{liveNotice}</div>}
  <button className="manager-requests-button" onClick={()=>{setOpen(true);void load()}}><span>طلبات المستفيدين</span>{pending>0&&<b>{pending}</b>}</button>
  {open&&<div className="manager-requests-backdrop" onMouseDown={()=>setOpen(false)}><section className="manager-requests-modal" onMouseDown={e=>e.stopPropagation()} dir="rtl">
   <header><div><small>حساب مدير المشروع</small><h2>قائمة طلبات المستفيدين</h2><p>جميع الطلبات المرسلة من بوابة المستفيد تظهر هنا تلقائيًا وبشكل لحظي.</p></div><button onClick={()=>setOpen(false)}>×</button></header>
   <div className="manager-request-kpis"><div><span>الإجمالي</span><strong>{rows.length}</strong></div><div><span>قيد المراجعة</span><strong>{pending}</strong></div><div><span>معتمد</span><strong>{rows.filter(r=>r.status==='معتمد').length}</strong></div><div><span>مرفوض</span><strong>{rows.filter(r=>r.status==='مرفوض').length}</strong></div></div>
   <div className="manager-request-toolbar"><select value={filter} onChange={e=>setFilter(e.target.value)}><option>الكل</option><option>قيد المراجعة</option><option>معتمد</option><option>يحتاج استكمال</option><option>مرفوض</option></select><a href="/admin/requests">فتح مركز الطلبات الكامل</a></div>
   <div className="manager-request-list">{loading?<div className="request-empty">جارٍ تحميل الطلبات…</div>:shown.length?shown.map(r=><article key={r.id}><div><span className={`status ${r.status==='قيد المراجعة'?'pending':r.status==='معتمد'?'approved':r.status==='مرفوض'?'rejected':'more'}`}>{r.status}</span><h3>{r.title}</h3><p>{names.get(r.beneficiary_id)||'مستفيد وصول'} • {labels[r.submission_type]||r.submission_type}</p></div><div className="request-meta"><b>{r.amount?`${Number(r.amount).toLocaleString('ar-SA')} ر.س`:''}</b><time>{new Date(r.created_at).toLocaleDateString('ar-SA')}</time><a href="/admin/requests">مراجعة</a></div></article>):<div className="request-empty">لا توجد طلبات في هذه الحالة.</div>}</div>
  </section></div>}
  <style jsx>{`
   .live-request-toast{position:fixed;left:22px;bottom:88px;z-index:90;background:#123f39;color:white;padding:12px 16px;border-radius:14px;box-shadow:0 12px 32px rgba(18,63,57,.25);font-weight:800}.manager-requests-button{position:fixed;left:22px;bottom:22px;z-index:70;border:0;border-radius:16px;background:#0d5f57;color:white;padding:13px 18px;font-weight:800;box-shadow:0 10px 30px rgba(13,95,87,.28);display:flex;align-items:center;gap:10px;cursor:pointer}.manager-requests-button b{background:#dff7ee;color:#0d5f57;border-radius:999px;min-width:24px;height:24px;display:grid;place-items:center}.manager-requests-backdrop{position:fixed;inset:0;background:rgba(4,31,29,.48);backdrop-filter:blur(5px);z-index:100;display:grid;place-items:center;padding:18px}.manager-requests-modal{width:min(980px,96vw);max-height:90vh;overflow:auto;background:#f7fbfa;border-radius:24px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.24)}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}header small{color:#319b7c;font-weight:800}header h2{margin:5px 0;font-size:26px;color:#123b37}header p{margin:0;color:#6d817f}header>button{border:0;background:white;width:38px;height:38px;border-radius:12px;font-size:24px;cursor:pointer}.manager-request-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.manager-request-kpis div{background:white;border:1px solid #e1ece9;border-radius:16px;padding:14px}.manager-request-kpis span{display:block;color:#718482;font-size:12px}.manager-request-kpis strong{font-size:24px;color:#0d5f57}.manager-request-toolbar{display:flex;justify-content:space-between;gap:10px;margin-bottom:12px}.manager-request-toolbar select{padding:10px 12px;border:1px solid #d7e5e2;border-radius:11px;background:white}.manager-request-toolbar a,.request-meta a{background:#0d5f57;color:white;text-decoration:none;border-radius:10px;padding:9px 12px;font-weight:700}.manager-request-list{display:grid;gap:9px}.manager-request-list article{display:flex;justify-content:space-between;gap:14px;align-items:center;background:white;border:1px solid #e1ece9;border-radius:16px;padding:14px}.manager-request-list h3{margin:6px 0 3px;font-size:16px;color:#183d39}.manager-request-list p{margin:0;color:#718482;font-size:13px}.status{display:inline-flex;padding:4px 9px;border-radius:999px;font-size:11px;font-weight:800}.status.pending{background:#fff3d9;color:#9d6900}.status.approved{background:#ddf5e9;color:#16704d}.status.rejected{background:#fde4e4;color:#a63838}.status.more{background:#e8f0ff;color:#315f9c}.request-meta{display:grid;justify-items:end;gap:5px;white-space:nowrap}.request-meta time{font-size:12px;color:#80908e}.request-meta a{font-size:12px;padding:6px 9px}.request-empty{text-align:center;padding:34px;color:#7a8e8b;background:white;border-radius:16px}@media(max-width:700px){.live-request-toast{left:12px;bottom:76px}.manager-requests-button{left:12px;bottom:12px}.manager-request-kpis{grid-template-columns:repeat(2,1fr)}.manager-request-toolbar{flex-direction:column}.manager-request-list article{align-items:flex-start;flex-direction:column}.request-meta{justify-items:start}.manager-requests-modal{padding:15px}header h2{font-size:21px}}
  `}</style>
 </>;
}
