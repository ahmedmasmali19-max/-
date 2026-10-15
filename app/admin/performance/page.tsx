'use client';
import {useEffect,useMemo,useState} from 'react';
import {db} from '../../../lib/db';
import '../../style.css';
type Row=Record<string,any>;
const money=(v:any)=>`${Number(v||0).toLocaleString('ar-SA')} ر.س`;
export default function PerformancePage(){
 const [data,setData]=useState<Row|null>(null);const [month,setMonth]=useState(new Date().toISOString().slice(0,7));const [loading,setLoading]=useState(true);const [message,setMessage]=useState('');
 useEffect(()=>{void load()},[month]);
 async function load(){if(!db)return;setLoading(true);const {data:{session}}=await db.auth.getSession();if(!session){location.href='/';return;}const {data:r}=await db.rpc('portal_role');if(!['admin','project_manager','management'].includes(String(r||'').toLowerCase())){setMessage('لا تملك صلاحية فتح لوحة الأداء.');setLoading(false);return;}const q=await db.rpc('get_monthly_performance',{p_month:`${month}-01`});if(q.error)setMessage('تعذر تحميل مؤشرات الأداء.');setData((q.data as Row)||{});setLoading(false);}
 const c=data?.current||{},p=data?.previous||{};const rate=(x:Row)=>Number(x?.due||0)>0?Math.round(Number(x.paid||0)/Number(x.due||0)*100):0;const delta=(a:any,b:any)=>Number(a||0)-Number(b||0);const cards=useMemo(()=>[
  ['التحصيل',money(c.paid),`مقارنة بالشهر السابق ${delta(c.paid,p.paid)>=0?'+':''}${money(delta(c.paid,p.paid))}`],
  ['نسبة التحصيل',`${rate(c)}%`,`الشهر السابق ${rate(p)}%`],
  ['الأقساط المتأخرة',c.overdue_count||0,`الشهر السابق ${p.overdue_count||0}`],
  ['طلبات جديدة',c.requests||0,`الشهر السابق ${p.requests||0}`],
  ['طلبات مغلقة',c.requests_closed||0,`الشهر السابق ${p.requests_closed||0}`],
  ['الحوادث',c.accidents||0,`الشهر السابق ${p.accidents||0}`],
  ['الصيانة',c.maintenance||0,`الشهر السابق ${p.maintenance||0}`]
 ],[data]);
 return <main className="main" dir="rtl"><header className="topbar"><div><span className="eyebrow">مشروع وصول • الأداء</span><h1>الأداء الشهري</h1><p>مقارنة مباشرة بين الشهر المختار والشهر السابق.</p></div><div className="top-actions"><input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="searchbox"/><a className="ghost" href="/">الرئيسية</a></div></header>{message&&<div className="toast">{message}</div>}{loading?<div className="panel empty-state">جارٍ إعداد مؤشرات الأداء…</div>:<><section className="kpis four">{cards.slice(0,4).map(([t,v,s])=><div className="kpi" key={String(t)}><span>{t}</span><strong>{v}</strong><small>{s}</small></div>)}</section><section className="kpis four">{cards.slice(4).map(([t,v,s])=><div className="kpi" key={String(t)}><span>{t}</span><strong>{v}</strong><small>{s}</small></div>)}</section><section className="panel" style={{marginTop:16}}><div className="panel-head"><div><span className="eyebrow">مقارنة مالية</span><h3>المستحق مقابل المحصل</h3></div></div><div className="table-wrap"><table><thead><tr><th>الفترة</th><th>المستحق</th><th>المحصل</th><th>نسبة التحصيل</th><th>الأقساط المتأخرة</th></tr></thead><tbody><tr><td>الشهر الحالي</td><td>{money(c.due)}</td><td>{money(c.paid)}</td><td>{rate(c)}%</td><td>{c.overdue_count||0}</td></tr><tr><td>الشهر السابق</td><td>{money(p.due)}</td><td>{money(p.paid)}</td><td>{rate(p)}%</td><td>{p.overdue_count||0}</td></tr></tbody></table></div></section></>}</main>;
}
