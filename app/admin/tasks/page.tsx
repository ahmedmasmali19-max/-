'use client';
import {useEffect,useMemo,useState} from 'react';
import {db} from '../../../lib/db';
import '../../style.css';
type Row=Record<string,any>;
const money=(v:any)=>`${Number(v||0).toLocaleString('ar-SA')} ر.س`;
export default function TasksPage(){
 const [data,setData]=useState<Row>({});const [loading,setLoading]=useState(true);const [message,setMessage]=useState('');const [filter,setFilter]=useState('الكل');
 useEffect(()=>{void load()},[]);
 async function load(){if(!db)return;setLoading(true);const {data:{session}}=await db.auth.getSession();if(!session){location.href='/';return;}const {data:r}=await db.rpc('portal_role');if(!['admin','project_manager','management'].includes(String(r||'').toLowerCase())){setMessage('لا تملك صلاحية فتح مركز المهام.');setLoading(false);return;}const q=await db.rpc('get_manager_tasks_today');if(q.error)setMessage('تعذر تحميل مهام اليوم.');setData((q.data as Row)||{});setLoading(false);}
 const sections=useMemo(()=>[
  {k:'followups',t:'المتابعات',rows:data.followups||[],href:'/admin/followups',text:(x:Row)=>`${x.full_name||'مستفيد'} • ${x.subject||'متابعة'} • ${x.priority||'—'}`},
  {k:'requests',t:'طلبات حرجة',rows:data.requests||[],href:'/admin/requests',text:(x:Row)=>`${x.full_name||'مستفيد'} • ${x.title||'طلب'} • ${x.status||'—'}`},
  {k:'overdue_installments',t:'أقساط متأخرة',rows:data.overdue_installments||[],href:'/admin/finance',text:(x:Row)=>`${x.full_name||'مستفيد'} • ${x.overdue_days} يوم • ${money(x.remaining)}`}
 ],[data]);
 const visible=filter==='الكل'?sections:sections.filter(s=>s.k===filter);const total=sections.reduce((s,x)=>s+x.rows.length,0);
 return <main className="main" dir="rtl"><header className="topbar"><div><span className="eyebrow">مشروع وصول • مدير المشروع</span><h1>مهامي اليوم</h1><p>ترتيب تلقائي لما يحتاج تدخلك الآن حسب الأولوية والاستحقاق.</p></div><div className="top-actions"><button className="ghost" onClick={()=>void load()}>تحديث</button><a className="primary small" href="/">الرئيسية</a></div></header>{message&&<div className="toast">{message}</div>}<section className="kpis four"><div className="kpi"><span>إجمالي المهام</span><strong>{total}</strong></div><div className="kpi"><span>متابعات</span><strong>{sections[0].rows.length}</strong></div><div className="kpi"><span>طلبات حرجة</span><strong>{sections[1].rows.length}</strong></div><div className="kpi"><span>أقساط متأخرة</span><strong>{sections[2].rows.length}</strong></div></section><section className="panel" style={{marginTop:16}}><div className="toolbar-actions" style={{marginBottom:14}}><button onClick={()=>setFilter('الكل')}>الكل</button><button onClick={()=>setFilter('followups')}>المتابعات</button><button onClick={()=>setFilter('requests')}>الطلبات</button><button onClick={()=>setFilter('overdue_installments')}>الأقساط</button></div>{loading?<div className="empty-state">جارٍ إعداد مهام اليوم…</div>:<div className="cards">{visible.flatMap(s=>s.rows.map((x:Row,i:number)=><div className="person-card" key={`${s.k}-${x.id}-${i}`}><div className="person-top"><div className="avatar">{s.k==='requests'?'ط':s.k==='followups'?'م':'ق'}</div><div><small>{s.t}</small><h4>{x.full_name||'مستفيد وصول'}</h4></div></div><p>{s.text(x)}</p><div className="actions"><a className="primary small" href={s.href} style={{textDecoration:'none'}}>فتح المركز</a>{x.beneficiary_id&&<a className="mini" href={`/admin/beneficiaries/${x.beneficiary_id}`} style={{textDecoration:'none'}}>ملف 360°</a>}</div></div>))}{total===0&&<div className="empty-state">لا توجد مهام عاجلة الآن.</div>}</div>}</section></main>;
}
