'use client';

import {FormEvent,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {configured,db} from '../lib/db';

type Row=Record<string,any>;
type View='dashboard'|'beneficiaries'|'vehicles';

export default function PortalRecovery(){
  const [session,setSession]=useState<Session|null>(null);
  const [email,setEmail]=useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL||'');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [view,setView]=useState<View>('dashboard');
  const [reports,setReports]=useState<Row[]>([]);
  const adminEmail=(process.env.NEXT_PUBLIC_ADMIN_EMAIL||'').toLowerCase().trim();

  async function loadData(){
    if(!db)return;
    setLoading(true);
    const {data,error}=await db.from('beneficiary_report_details').select('*').order('beneficiary_number',{ascending:true});
    if(error)setMessage('تم الدخول لكن تعذر تحميل بيانات المستفيدين.');
    setReports(data??[]);
    setLoading(false);
  }

  async function signIn(e:FormEvent){
    e.preventDefault();
    if(!db||busy)return;
    setBusy(true);setMessage('');
    const {data,error}=await db.auth.signInWithPassword({email:email.trim(),password});
    setPassword('');
    if(error||!data.session){
      setMessage('البريد أو كلمة المرور غير صحيحة.');
      setBusy(false);
      return;
    }
    const signed=(data.session.user.email||'').toLowerCase().trim();
    if(!adminEmail||signed!==adminEmail){
      await db.auth.signOut();
      setMessage('هذا الحساب غير مخوّل لإدارة منصة وصول.');
      setBusy(false);
      return;
    }
    setSession(data.session);
    await loadData();
    setBusy(false);
  }

  async function signOut(){
    if(db)await db.auth.signOut();
    setSession(null);setReports([]);setView('dashboard');setMessage('');
  }

  const totals=useMemo(()=>({
    count:reports.length,
    income:reports.reduce((a,r)=>a+(Number(r.quarterly_income)||0),0),
    returns:reports.reduce((a,r)=>a+(Number(r.total_return)||0),0),
    net:reports.reduce((a,r)=>a+(Number(r.net_after_return)||0),0)
  }),[reports]);

  if(!configured)return <div className="center"><div className="login-card"><h1>بوابة وصول</h1><p>إعدادات الاتصال غير مكتملة.</p></div></div>;

  if(!session)return <div className="login-page"><div className="login-card"><div className="mark">و</div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>بوابة إدارة وصول</h1><p>دخول مدير المشروع</p><form onSubmit={signIn}><label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary" disabled={busy}>{busy?'جارٍ الدخول…':'دخول المنصة'}</button></form>{message&&<div className="alert">{message}</div>}</div></div>;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="mark">و</div><div><b>وصول</b><small>منصة إدارة المشروع</small></div></div><nav><button className={view==='dashboard'?'active':''} onClick={()=>setView('dashboard')}>الرئيسية</button><button className={view==='beneficiaries'?'active':''} onClick={()=>setView('beneficiaries')}>المستفيدون</button><button className={view==='vehicles'?'active':''} onClick={()=>setView('vehicles')}>المركبات</button></nav><button className="signout" onClick={signOut}>تسجيل الخروج</button></aside><main className="main"><header className="topbar"><div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>{view==='dashboard'?'الرئيسية':view==='beneficiaries'?'المستفيدون':'المركبات'}</h1></div><div className="admin-pill">مدير النظام</div></header>{message&&<div className="toast">{message}</div>}{loading?<div className="panel center-panel"><div className="loader"/><p>جارٍ تحميل البيانات…</p></div>:view==='dashboard'?<><section className="hero"><div><span className="hero-label">مرحبًا بك</span><h2>بوابة إدارة وصول</h2><p>تم الدخول بنجاح.</p></div><div className="hero-badge"><strong>{totals.count}</strong><span>مستفيد</span></div></section><div className="kpi-grid"><div className="kpi"><small>المستفيدون</small><strong>{totals.count}</strong></div><div className="kpi"><small>إجمالي الدخل</small><strong>{totals.income.toLocaleString('ar-SA')}</strong></div><div className="kpi"><small>إجمالي العائد</small><strong>{totals.returns.toLocaleString('ar-SA')}</strong></div><div className="kpi"><small>الصافي</small><strong>{totals.net.toLocaleString('ar-SA')}</strong></div></div></>:<section className="panel"><div className="panel-head"><h2>{view==='beneficiaries'?'بيانات المستفيدين':'المركبات'}</h2><span>{reports.length} سجل</span></div><div className="table-wrap"><table><thead><tr><th>الرقم</th><th>المستفيد</th><th>المركبة</th><th>الدخل</th><th>العائد</th><th>الصافي</th></tr></thead><tbody>{reports.map((r,i)=><tr key={r.id||i}><td>{r.beneficiary_number??'—'}</td><td>{r.beneficiary_name??'—'}</td><td>{r.vehicle_type??'—'}</td><td>{r.quarterly_income??'—'}</td><td>{r.total_return??'—'}</td><td>{r.net_after_return??'—'}</td></tr>)}</tbody></table></div></section>}</main></div>;
}
