'use client';
import {useEffect,useMemo,useState} from 'react';
import {db} from '../../../lib/db';
import '../../style.css';
type Row=Record<string,any>;
const money=(v:any)=>`${Number(v||0).toLocaleString('ar-SA')} ر.س`;
export default function ReportsCenter(){
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7));const [data,setData]=useState<Row|null>(null);const [loading,setLoading]=useState(true);const [message,setMessage]=useState('');
 useEffect(()=>{void load()},[month]);
 async function load(){if(!db)return;setLoading(true);const {data:{session}}=await db.auth.getSession();if(!session){location.href='/';return;}const {data:r}=await db.rpc('portal_role');if(!['admin','project_manager','management'].includes(String(r||'').toLowerCase())){setMessage('لا تملك صلاحية فتح مركز التقارير.');setLoading(false);return;}const q=await db.rpc('get_monthly_performance',{p_month:`${month}-01`});if(q.error)setMessage('تعذر تحميل ملخص الفترة.');setData((q.data as Row)||{});setLoading(false);}
 const c=data?.current||{};const rate=Number(c.due||0)>0?Math.round(Number(c.paid||0)/Number(c.due||0)*100):0;
 const reports=useMemo(()=>[
  {title:'التقرير التنفيذي',desc:'ملخص إداري شامل قابل للطباعة وحفظ PDF.',href:'/admin/report',tag:'PDF / Excel'},
  {title:'PowerPoint تنفيذي',desc:'عرض تنفيذي جاهز للاجتماعات والإدارة.',href:'/admin/powerpoint',tag:'PPTX'},
  {title:'اللوحة المالية',desc:'التحصيل والمتأخرات والتفاصيل الشهرية.',href:'/admin/finance',tag:'مالي'},
  {title:'الأداء الشهري',desc:'مقارنة الشهر الحالي بالشهر السابق.',href:'/admin/performance',tag:'KPI'},
  {title:'الملخص الأسبوعي',desc:'التقدم والمخاطر والقرارات والمتابعات.',href:'/admin/weekly',tag:'أسبوعي'},
  {title:'تقييم الأداء',desc:'ترتيب المستفيدين والمركبات حسب الأداء.',href:'/admin/performance-scores',tag:'تقييم'},
  {title:'جودة البيانات',desc:'ملاحظات البيانات الناقصة وغير المكتملة.',href:'/admin/data-quality',tag:'حوكمة'},
  {title:'سجل النشاط',desc:'التغييرات والعمليات المسجلة تاريخيًا.',href:'/admin/activity',tag:'تدقيق'}
 ],[]);
 return <main className="main" dir="rtl"><header className="topbar"><div><span className="eyebrow">مشروع وصول • التقارير</span><h1>مركز التقارير الموحد</h1><p>نقطة واحدة للوصول إلى جميع التقارير والتصدير التنفيذي.</p></div><div className="top-actions"><input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="searchbox"/><a className="ghost" href="/">الرئيسية</a></div></header>{message&&<div className="toast">{message}</div>}{loading?<div className="panel empty-state">جارٍ إعداد ملخص الفترة…</div>:<><section className="kpis four"><div className="kpi"><span>المستحق</span><strong>{money(c.due)}</strong></div><div className="kpi"><span>المحصل</span><strong>{money(c.paid)}</strong></div><div className="kpi"><span>نسبة التحصيل</span><strong>{rate}%</strong></div><div className="kpi"><span>طلبات جديدة</span><strong>{c.requests||0}</strong></div></section><section className="cards" style={{marginTop:16}}>{reports.map(r=><article className="person-card" key={r.href}><div className="person-top"><div className="avatar">{r.tag.slice(0,1)}</div><div><small>{r.tag}</small><h4>{r.title}</h4></div></div><p className="muted">{r.desc}</p><div className="actions"><a className="primary small" href={r.href} style={{textDecoration:'none'}}>فتح التقرير</a></div></article>)}</section></>}</main>;
}
