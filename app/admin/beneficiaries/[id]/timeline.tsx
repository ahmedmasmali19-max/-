'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {db} from '../../../../lib/db';

type Row=Record<string,any>;
type EventRow={date:string;title:string;meta:string;kind:string};
const fmt=(v:any)=>v?new Date(v).toLocaleString('ar-SA'):'—';

export default function BeneficiaryTimeline(){
 const params=useParams<{id:string}>();const id=String(params?.id||'');
 const [role,setRole]=useState('checking');const [events,setEvents]=useState<EventRow[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{void boot()},[id]);
 async function boot(){if(!db||!id)return;const {data:{session}}=await db.auth.getSession();if(!session)return;const {data:r}=await db.rpc('portal_role');const rr=String(r||'').toLowerCase();setRole(rr);if(!['admin','project_manager','management','finance'].includes(rr)){setLoading(false);return;}
  const [c,s,d,a,m,h,o,f]=await Promise.all([
   db.from('contracts').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('beneficiary_submissions').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('documents').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('accidents').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('maintenance').select('*').order('created_at',{ascending:false}),
   db.from('vehicle_handovers').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('ownership_transfers').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('followups').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false})
  ]);
  const vehicleIds=(await db.from('vehicles').select('id').eq('beneficiary_id',id)).data?.map(x=>x.id)??[];
  const maintRows=(m.data??[]).filter((x:any)=>vehicleIds.includes(x.vehicle_id));
  const contractIds=(c.data??[]).map((x:any)=>x.id);
  const ins=contractIds.length?await db.from('installments').select('*').in('contract_id',contractIds).order('due_date',{ascending:false}):{data:[] as Row[]};
  const out:EventRow[]=[];
  (c.data??[]).forEach((x:any)=>out.push({date:x.created_at,title:'إنشاء/تحديث عقد',meta:`${x.reference||'—'} • ${x.status||'—'}`,kind:'contract'}));
  (ins.data??[]).forEach((x:any)=>out.push({date:x.due_date||x.created_at,title:'قسط',meta:`#${x.installment_no??'—'} • ${x.status||'—'} • ${Number(x.paid_amount||0).toLocaleString('ar-SA')} ر.س مسدد`,kind:'installment'}));
  (s.data??[]).forEach((x:any)=>out.push({date:x.reviewed_at||x.created_at,title:'طلب مستفيد',meta:`${x.title||x.submission_type||'طلب'} • ${x.status||'—'}`,kind:'request'}));
  (d.data??[]).forEach((x:any)=>out.push({date:x.created_at,title:'مستند',meta:`${x.title||x.document_type||'مستند'}${x.expiry_date?` • ينتهي ${x.expiry_date}`:''}`,kind:'document'}));
  (a.data??[]).forEach((x:any)=>out.push({date:x.accident_date||x.created_at,title:'حادث',meta:`${x.claim_number||'بدون رقم مطالبة'} • ${x.repair_status||'—'}`,kind:'accident'}));
  maintRows.forEach((x:any)=>out.push({date:x.due_date||x.created_at,title:'صيانة',meta:`${x.category||'صيانة'} • ${x.status||'—'}`,kind:'maintenance'}));
  (h.data??[]).forEach((x:any)=>out.push({date:x.handover_date||x.created_at,title:'تسليم/استلام',meta:`${x.handover_type||'إجراء'} • العداد ${x.odometer??'—'}`,kind:'handover'}));
  (o.data??[]).forEach((x:any)=>out.push({date:x.transfer_date||x.request_date||x.created_at,title:'نقل ملكية',meta:x.status||'طلب نقل ملكية',kind:'ownership'}));
  (f.data??[]).forEach((x:any)=>out.push({date:x.due_date||x.created_at,title:'متابعة',meta:`${x.subject||'متابعة'} • ${x.status||'—'}`,kind:'followup'}));
  out.sort((x,y)=>new Date(y.date||0).getTime()-new Date(x.date||0).getTime());setEvents(out.slice(0,80));setLoading(false);
 }
 const grouped=useMemo(()=>events,[events]);
 if(loading||!['admin','project_manager','management','finance'].includes(role))return null;
 return <section className="tl-wrap" dir="rtl"><div className="tl-card"><div className="tl-head"><span>360°</span><h2>السجل الزمني للمستفيد</h2></div>{grouped.length===0?<p className="tl-empty">لا توجد أحداث حتى الآن.</p>:<div className="tl-list">{grouped.map((e,i)=><article key={`${e.kind}-${i}`}><div className={`tl-dot ${e.kind}`}/><div><b>{e.title}</b><p>{e.meta}</p><small>{fmt(e.date)}</small></div></article>)}</div>}</div><style jsx global>{`.tl-wrap{max-width:1440px;margin:0 auto 24px;padding:0 28px;font-family:Tahoma,Arial,sans-serif;color:#183d39}.tl-card{background:#fff;border:1px solid #e1ebe8;border-radius:20px;padding:18px}.tl-head span{color:#3d927c;font-size:12px;font-weight:800}.tl-head h2{margin:4px 0 16px}.tl-list{position:relative;display:grid;gap:0}.tl-list:before{content:'';position:absolute;right:8px;top:8px;bottom:8px;width:2px;background:#e4ecea}.tl-list article{position:relative;display:grid;grid-template-columns:24px 1fr;gap:12px;padding:0 0 16px}.tl-dot{width:14px;height:14px;border-radius:50%;background:#0d5f57;border:3px solid #e8f4f1;z-index:1}.tl-list b{display:block}.tl-list p{margin:4px 0;color:#566b67}.tl-list small{color:#8a9996}.tl-empty{text-align:center;color:#81908e;padding:16px}@media(max-width:650px){.tl-wrap{padding:0 12px}}@media print{.tl-wrap{display:none}}`}</style></section>
}
