'use client';

import {FormEvent,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {db,configured} from '../../../lib/db';

type Row=Record<string,any>;
const statuses=['قيد المراجعة','مطلوب استكمال','معتمد','مرفوض','مكتمل'];

export default function BeneficiaryRequestsAdmin(){
  const [session,setSession]=useState<Session|null>(null);
  const [email,setEmail]=useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL||'');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [rows,setRows]=useState<Row[]>([]);
  const [filter,setFilter]=useState('الكل');
  const adminEmail=(process.env.NEXT_PUBLIC_ADMIN_EMAIL||'').toLowerCase().trim();

  async function load(){
    if(!db)return;
    setLoading(true);setMessage('');
    const {data,error}=await db.from('beneficiary_submissions').select('*, beneficiaries(full_name,phone)').order('created_at',{ascending:false});
    if(error)setMessage('تعذر تحميل طلبات المستفيدين.');
    setRows(data??[]);setLoading(false);
  }

  async function signIn(e:FormEvent){
    e.preventDefault();if(!db||busy)return;
    setBusy(true);setMessage('');
    const {data,error}=await db.auth.signInWithPassword({email:email.trim(),password});
    setPassword('');
    if(error||!data.session){setMessage('تعذر تسجيل الدخول.');setBusy(false);return;}
    const signed=(data.session.user.email||'').toLowerCase().trim();
    if(!adminEmail||signed!==adminEmail){await db.auth.signOut();setMessage('هذا الحساب غير مخوّل.');setBusy(false);return;}
    setSession(data.session);await load();setBusy(false);
  }

  async function updateRequest(id:string,status:string,note:string){
    if(!db)return;
    setBusy(true);setMessage('');
    const {error}=await db.from('beneficiary_submissions').update({status,admin_note:note||null,reviewed_at:new Date().toISOString()}).eq('id',id);
    setMessage(error?'تعذر تحديث الطلب.':'تم تحديث الطلب بنجاح.');
    await load();setBusy(false);
  }

  async function openAttachment(path:string){
    if(!db||!path)return;
    const {data,error}=await db.storage.from('beneficiary-uploads').createSignedUrl(path,120);
    if(error||!data?.signedUrl){setMessage('تعذر فتح المرفق.');return;}
    window.open(data.signedUrl,'_blank','noopener,noreferrer');
  }

  const shown=useMemo(()=>filter==='الكل'?rows:rows.filter(r=>r.status===filter),[rows,filter]);
  const pending=rows.filter(r=>r.status==='قيد المراجعة').length;

  if(!configured)return <div className="login-page"><div className="login-card"><h1>طلبات المستفيدين</h1><p>إعدادات الاتصال غير مكتملة.</p></div></div>;
  if(!session)return <div className="login-page"><div className="login-card"><div className="mark">و</div><span className="eyebrow">إدارة مشروع وصول</span><h1>طلبات المستفيدين</h1><form onSubmit={signIn}><label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary" disabled={busy}>{busy?'جارٍ الدخول…':'دخول الإدارة'}</button></form>{message&&<div className="alert">{message}</div>}</div></div>;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="mark">و</div><div><b>وصول</b><small>مراجعة طلبات المستفيدين</small></div></div><nav><a href="/">المنصة الرئيسية</a><button className="active">طلبات المستفيدين</button></nav><div className="side-note"><b>{pending} طلب جديد</b><small>بانتظار المراجعة</small></div><button className="signout" onClick={()=>{db?.auth.signOut();setSession(null)}}>تسجيل الخروج</button></aside><main className="main"><header className="topbar"><div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>طلبات المستفيدين</h1></div><div className="admin-pill">مدير النظام</div></header>{message&&<div className="toast">{message}</div>}<div className="kpi-grid"><div className="kpi"><span>إجمالي الطلبات</span><strong>{rows.length}</strong></div><div className="kpi"><span>قيد المراجعة</span><strong>{pending}</strong></div><div className="kpi"><span>معتمد</span><strong>{rows.filter(r=>r.status==='معتمد').length}</strong></div><div className="kpi"><span>مطلوب استكمال</span><strong>{rows.filter(r=>r.status==='مطلوب استكمال').length}</strong></div></div><section className="panel"><div className="panel-head"><h2>سجل الطلبات</h2><select value={filter} onChange={e=>setFilter(e.target.value)}><option>الكل</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>{loading?<div className="center-panel"><div className="loader"/></div>:shown.length===0?<p className="muted">لا توجد طلبات بهذه الحالة.</p>:<div className="table-wrap"><table><thead><tr><th>المستفيد</th><th>النوع</th><th>العنوان</th><th>المبلغ</th><th>التاريخ</th><th>المرفق</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{shown.map(r=><RequestRow key={r.id} row={r} busy={busy} onSave={updateRequest} onOpen={openAttachment}/>)}</tbody></table></div>}</section></main></div>;
}

function RequestRow({row,busy,onSave,onOpen}:{row:Row,busy:boolean,onSave:(id:string,status:string,note:string)=>void,onOpen:(path:string)=>void}){
  const [status,setStatus]=useState(row.status||'قيد المراجعة');
  const [note,setNote]=useState(row.admin_note||'');
  return <tr><td>{row.beneficiaries?.full_name||'—'}</td><td>{row.submission_type}</td><td><b>{row.title}</b><br/><small>{row.details||''}</small></td><td>{row.amount??'—'}</td><td>{row.event_date||new Date(row.created_at).toLocaleDateString('ar-SA')}</td><td>{row.attachment_path?<button className="ghost" onClick={()=>onOpen(row.attachment_path)}>فتح</button>:'—'}</td><td><select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td><input value={note} onChange={e=>setNote(e.target.value)} placeholder="ملاحظة الإدارة"/><button className="primary" disabled={busy} onClick={()=>onSave(row.id,status,note)}>حفظ</button></td></tr>;
}
