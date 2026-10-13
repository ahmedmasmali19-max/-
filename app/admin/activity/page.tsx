'use client';

import {useEffect,useMemo,useState} from 'react';
import {db} from '../../../lib/db';
import '../../style.css';

type Row=Record<string,any>;
const actionLabel:Record<string,string>={INSERT:'إضافة',UPDATE:'تعديل',DELETE:'حذف'};
const tableLabel:Record<string,string>={beneficiaries:'المستفيدون',beneficiary_report_details:'تقارير المستفيدين',beneficiary_accounts:'حسابات المستفيدين',beneficiary_submissions:'طلبات المستفيدين',vehicles:'المركبات',contracts:'العقود',installments:'الأقساط',documents:'المستندات',maintenance:'الصيانة',accidents:'الحوادث',approvals:'الموافقات',followups:'المتابعات',vehicle_handovers:'التسليم والاستلام',ownership_transfers:'نقل الملكية'};

export default function ActivityPage(){
 const [rows,setRows]=useState<Row[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState('');const [search,setSearch]=useState('');const [table,setTable]=useState('الكل');const [action,setAction]=useState('الكل');
 useEffect(()=>{void boot()},[]);
 async function boot(){if(!db)return;const {data:{session}}=await db.auth.getSession();if(!session){window.location.href='/';return;}const {data:r}=await db.rpc('portal_role');if(!['admin','project_manager','management'].includes(String(r||'').toLowerCase())){setMessage('لا تملك صلاحية فتح سجل النشاط.');setLoading(false);return;}await load();}
 async function load(){if(!db)return;setLoading(true);const {data,error}=await db.from('audit_logs').select('*').order('changed_at',{ascending:false}).limit(500);if(error)setMessage('تعذر تحميل سجل النشاط.');setRows(data??[]);setLoading(false);}
 const filtered=useMemo(()=>rows.filter(r=>(table==='الكل'||r.table_name===table)&&(action==='الكل'||r.action===action)&&(!search.trim()||`${tableLabel[r.table_name]||r.table_name} ${r.record_id||''} ${JSON.stringify(r.new_data||{})}`.toLowerCase().includes(search.trim().toLowerCase()))),[rows,table,action,search]);
 const tables=[...new Set(rows.map(r=>r.table_name))];
 return <main className="main" dir="rtl"><header className="topbar"><div><span className="eyebrow">مشروع وصول • الحوكمة</span><h1>سجل النشاط</h1><p style={{margin:4,color:'#718482'}}>تتبع عمليات الإضافة والتعديل والحذف داخل المنصة.</p></div><div className="top-actions"><a className="primary small" href="/">العودة للمنصة</a></div></header>{message&&<div className="toast">{message}</div>}<section className="panel"><div className="toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث في السجل"/></div><div className="toolbar-actions"><select value={table} onChange={e=>setTable(e.target.value)}><option>الكل</option>{tables.map(t=><option key={t} value={t}>{tableLabel[t]||t}</option>)}</select><select value={action} onChange={e=>setAction(e.target.value)}><option>الكل</option><option value="INSERT">إضافة</option><option value="UPDATE">تعديل</option><option value="DELETE">حذف</option></select><button onClick={()=>void load()}>تحديث</button></div></div>{loading?<div className="empty-state">جارٍ تحميل السجل…</div>:<div className="table-wrap"><table><thead><tr><th>التاريخ والوقت</th><th>القسم</th><th>العملية</th><th>معرّف السجل</th><th>المستخدم</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td>{new Date(r.changed_at).toLocaleString('ar-SA')}</td><td>{tableLabel[r.table_name]||r.table_name}</td><td><span className="chip">{actionLabel[r.action]||r.action}</span></td><td>{r.record_id||'—'}</td><td>{r.user_id?String(r.user_id).slice(0,8):'نظام'}</td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state">لا توجد عمليات مطابقة.</div>}</div>}</section></main>;
}
