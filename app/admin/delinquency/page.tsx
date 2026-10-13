'use client';

import {useEffect,useMemo,useState} from 'react';
import {db} from '../../../lib/db';
import '../../style.css';

type Row=Record<string,any>;
const money=(v:any)=>`${Number(v||0).toLocaleString('ar-SA')} ر.س`;

export default function DelinquencyDashboard(){
 const [rows,setRows]=useState<Row[]>([]);
 const [beneficiaries,setBeneficiaries]=useState<Row[]>([]);
 const [contracts,setContracts]=useState<Row[]>([]);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState('');
 const [search,setSearch]=useState('');
 const [role,setRole]=useState('checking');
 useEffect(()=>{void boot()},[]);
 async function boot(){
  if(!db)return;
  const {data:{session}}=await db.auth.getSession();if(!session){window.location.href='/';return;}
  const {data:r}=await db.rpc('portal_role');const rr=String(r||'').toLowerCase();setRole(rr);
  if(!['admin','project_manager','management','finance'].includes(rr)){setMessage('لا تملك صلاحية فتح لوحة التعثر.');setLoading(false);return;}
  const [b,c,i]=await Promise.all([
   db.from('beneficiaries').select('*'),
   db.from('contracts').select('*').eq('archived',false),
   db.from('installments').select('*').eq('archived',false)
  ]);
  if(i.error)setMessage('تعذر تحميل بيانات الأقساط.');
  setBeneficiaries(b.data??[]);setContracts(c.data??[]);setRows(i.data??[]);setLoading(false);
 }
 const data=useMemo(()=>{
  const bmap=new Map(beneficiaries.map(b=>[b.id,b]));
  const cmap=new Map(contracts.map(c=>[c.id,c]));
  const agg=new Map<string,any>();
  rows.forEach(i=>{
   const c=cmap.get(i.contract_id);if(!c?.beneficiary_id)return;
   const amount=Number(i.amount)||0;const paid=Number(i.paid_amount)||0;const remaining=Math.max(0,amount-paid);
   const isOverdue=i.status==='متأخر'||(i.due_date&&new Date(i.due_date).getTime()<Date.now()&&remaining>0);
   if(!isOverdue)return;
   const id=c.beneficiary_id;const current=agg.get(id)||{beneficiary_id:id,name:bmap.get(id)?.full_name||c.beneficiary_name||'مستفيد وصول',phone:bmap.get(id)?.phone||'',overdue_count:0,overdue_amount:0,oldest:null,contract:c.reference||'—'};
   current.overdue_count+=1;current.overdue_amount+=remaining;if(i.due_date&&(!current.oldest||String(i.due_date)<current.oldest))current.oldest=String(i.due_date);agg.set(id,current);
  });
  return [...agg.values()].sort((a,b)=>b.overdue_amount-a.overdue_amount||b.overdue_count-a.overdue_count);
 },[rows,beneficiaries,contracts]);
 const filtered=data.filter(x=>!search.trim()||`${x.name} ${x.phone} ${x.contract}`.toLowerCase().includes(search.trim().toLowerCase()));
 const totalOverdue=data.reduce((s,x)=>s+x.overdue_amount,0);const totalInstallments=data.reduce((s,x)=>s+x.overdue_count,0);
 return <main className="main" dir="rtl"><header className="topbar"><div><span className="eyebrow">مشروع وصول • التحصيل</span><h1>لوحة التعثر</h1><p style={{margin:4,color:'#718482'}}>ترتيب المستفيدين حسب قيمة وعدد الأقساط المتأخرة.</p></div><div className="top-actions"><a className="primary small" href="/">العودة للمنصة</a></div></header>{message&&<div className="toast">{message}</div>}<section className="kpis four"><div className="kpi"><span>المستفيدون المتعثرون</span><strong>{data.length}</strong></div><div className="kpi"><span>الأقساط المتأخرة</span><strong>{totalInstallments}</strong></div><div className="kpi"><span>إجمالي المتأخرات</span><strong>{money(totalOverdue)}</strong></div><div className="kpi"><span>الدور</span><strong>{role==='management'?'عرض':'تشغيل'}</strong></div></section><section className="panel" style={{marginTop:16}}><div className="toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث باسم المستفيد أو الجوال أو العقد"/></div></div>{loading?<div className="empty-state">جارٍ تحميل بيانات التعثر…</div>:<div className="table-wrap"><table><thead><tr><th>الترتيب</th><th>المستفيد</th><th>الجوال</th><th>العقد</th><th>عدد المتأخر</th><th>قيمة المتأخر</th><th>أقدم استحقاق</th><th>الملف</th></tr></thead><tbody>{filtered.map((x,i)=><tr key={x.beneficiary_id}><td>{i+1}</td><td><b>{x.name}</b></td><td>{x.phone||'—'}</td><td>{x.contract}</td><td>{x.overdue_count}</td><td><b style={{color:'#b24242'}}>{money(x.overdue_amount)}</b></td><td>{x.oldest||'—'}</td><td><a className="mini" href={`/admin/beneficiaries/${x.beneficiary_id}`} style={{textDecoration:'none'}}>ملف 360°</a></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state">لا توجد حالات تعثر مطابقة.</div>}</div>}</section></main>;
}
