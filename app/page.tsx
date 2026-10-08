'use client';
import {useEffect,useMemo,useState} from 'react';
import {db,configured,tables} from '../lib/db';
import type {TableName} from '../lib/db';
import type {Session} from '@supabase/supabase-js';

type ReportRow={
 id:string; beneficiary_name:string; beneficiary_number:number|null; vehicle_type:string|null;
 displayed_amount:number|null; completeness:string|null; quarterly_income:number|null;
 total_return:number|null; net_after_return:number|null; freelance_license_status:string|null;
 vehicle_registration_status:string|null; insurance_status:string|null; transport_apps_status:string|null;
 income_month1:number|null; income_month2:number|null; income_month3:number|null;
 return_month1:number|null; return_month2:number|null; return_month3:number|null;
 net_month1:number|null; net_month2:number|null; net_month3:number|null;
 report_period_months:number|null; notes:string|null; data_classification:string|null;
};

const money=(v:number|null|undefined)=>v==null?'—':`${Number(v).toLocaleString('ar-SA')} ريال`;

export default function Home(){
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [section,setSection]=useState<'dashboard'|TableName>('dashboard');
 const [message,setMessage]=useState('');
 const [rows,setRows]=useState<ReportRow[]>([]);
 const [loading,setLoading]=useState(false);
 const [needsConfirmation,setNeedsConfirmation]=useState(false);
 const [recoveryMode,setRecoveryMode]=useState(false);
 const [newPassword,setNewPassword]=useState('');
 const adminEmail=process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
 const allowed=!!session?.user.email&&!!adminEmail&&session.user.email.toLowerCase()===adminEmail;

 useEffect(()=>{
  const client=db;
  if(!client){setReady(true);return}
  client.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});
  const {data:s}=client.auth.onAuthStateChange((event,x)=>{
   setSession(x);
   if(event==='PASSWORD_RECOVERY'){setRecoveryMode(true);setMessage('اكتب كلمة المرور الجديدة ثم احفظها.');}
  });
  return()=>s.subscription.unsubscribe();
 },[]);

 useEffect(()=>{
  const client=db;
  if(!client||!allowed)return;
  setLoading(true);
  client.from('beneficiary_report_details').select('*').order('beneficiary_number',{ascending:true}).then(({data,error})=>{
   if(error)setMessage('تعذر تحميل بيانات التقرير. حدّث الصفحة وحاول مرة أخرى.');
   else setRows((data??[]) as ReportRow[]);
   setLoading(false);
  });
 },[allowed]);

 const totals=useMemo(()=>({
  beneficiaries:rows.length,
  quarterlyIncome:rows.reduce((s,r)=>s+(Number(r.quarterly_income)||0),0),
  returns:rows.reduce((s,r)=>s+(Number(r.total_return)||0),0),
  net:rows.reduce((s,r)=>s+(Number(r.net_after_return)||0),0),
  vehicles:new Set(rows.map(r=>r.vehicle_type).filter(Boolean)).size
 }),[rows]);

 const vehicleGroups=useMemo(()=>{
  const m=new Map<string,ReportRow[]>();
  rows.forEach(r=>{const k=r.vehicle_type||'غير محدد';m.set(k,[...(m.get(k)||[]),r])});
  return [...m.entries()];
 },[rows]);

 async function signIn(e:React.FormEvent){
  e.preventDefault();setMessage('');setNeedsConfirmation(false);const client=db;if(!client)return;
  const loginEmail=(email||adminEmail||'').trim();
  const {error}=await client.auth.signInWithPassword({email:loginEmail,password});
  if(error){
   if(error.message.toLowerCase().includes('email not confirmed')){setNeedsConfirmation(true);setMessage('البريد الإلكتروني غير مؤكد. اضغط إعادة إرسال رسالة التأكيد ثم افتح الرابط في بريدك.');}
   else setMessage('تعذر تسجيل الدخول. تحقق من كلمة المرور.');
  }
  setPassword('');
 }
 async function resendConfirmation(){
  const client=db;if(!client||!adminEmail)return;
  const {error}=await client.auth.resend({type:'signup',email:adminEmail});
  setMessage(error?'تعذر إرسال رسالة التأكيد الآن.':'تم إرسال رسالة تأكيد جديدة.');
 }
 async function sendPasswordReset(){
  const client=db;if(!client||!adminEmail)return;
  const redirectTo=typeof window!=='undefined'?window.location.origin:undefined;
  const {error}=await client.auth.resetPasswordForEmail(adminEmail,{redirectTo});
  if(error)setMessage(error.message.toLowerCase().includes('rate')?'تم تجاوز حد إرسال الرسائل مؤقتًا.':'تعذر إرسال رابط إعادة التعيين الآن.');
  else setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المدير.');
 }
 async function saveNewPassword(e:React.FormEvent){
  e.preventDefault();const client=db;if(!client)return;
  if(newPassword.length<8){setMessage('اختر كلمة مرور من 8 أحرف على الأقل.');return}
  const {error}=await client.auth.updateUser({password:newPassword});
  if(error)setMessage('تعذر حفظ كلمة المرور الجديدة.');
  else{setNewPassword('');setRecoveryMode(false);setMessage('تم تغيير كلمة المرور بنجاح.');}
 }

 if(!ready)return <div className="center">جارٍ تجهيز البوابة…</div>;
 if(!configured)return <div className="center"><div className="card"><div className="logo">و</div><h1>بوابة وصول</h1><p>إعدادات Supabase غير متاحة.</p></div></div>;
 if(recoveryMode)return <div className="center"><div className="card"><div className="logo">و</div><h1>تعيين كلمة مرور جديدة</h1><form onSubmit={saveNewPassword}><input type="password" minLength={8} required placeholder="كلمة المرور الجديدة" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button>حفظ كلمة المرور</button></form>{message&&<p className="err">{message}</p>}</div></div>;
 if(!session||!allowed)return <div className="center"><div className="card"><div className="logo">و</div><span>جمعية الأسر المنتجة بجازان</span><h1>بوابة إدارة وصول</h1>{session&&!allowed?<><p className="err">هذا الحساب غير مخوّل.</p><button onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></>:<><form onSubmit={signIn}><input type="email" required value={email||adminEmail||''} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)}/><button>دخول المدير</button></form>{needsConfirmation&&<button type="button" onClick={resendConfirmation}>إعادة إرسال التأكيد</button>}<button type="button" onClick={sendPasswordReset}>نسيت كلمة المرور</button></>}{message&&<p className="err">{message}</p>}</div></div>;

 const th={padding:'12px',textAlign:'right' as const,borderBottom:'1px solid #e7e7e7',whiteSpace:'nowrap' as const};
 const td={padding:'12px',borderBottom:'1px solid #f0f0f0',whiteSpace:'nowrap' as const};

 return <div className="shell">
  <aside><div className="brand"><div className="logo">و</div><div><b>وصول</b><small>بوابة إدارة المشروع</small></div></div><nav>
   <button className={section==='dashboard'?'active':''} onClick={()=>setSection('dashboard')}>لوحة التحكم</button>
   {Object.entries(tables).map(([k,v])=><button key={k} className={section===k?'active':''} onClick={()=>setSection(k as TableName)}>{v.title}</button>)}
  </nav><button className="logout" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></aside>
  <main><header><div><small>لوحة الإدارة / مشروع وصول</small><h1>{section==='dashboard'?'نظرة عامة':tables[section].title}</h1></div></header>
   {loading?<section className="panel"><p>جارٍ تحميل بيانات وصول…</p></section>:
   section==='dashboard'?<><section className="hero"><div><span>بيانات التقرير</span><h2>مرحبًا بك في بوابة وصول</h2><p>تم تحميل بيانات المستفيدين والمركبات والمؤشرات المالية من عرض وصول.</p></div></section><section className="stats">
    <button onClick={()=>setSection('beneficiaries')}><span>المستفيدون</span><strong>{totals.beneficiaries}</strong><small>سجل</small></button>
    <button onClick={()=>setSection('vehicles')}><span>أنواع المركبات</span><strong>{totals.vehicles}</strong><small>نوع</small></button>
    <button onClick={()=>setSection('installments')}><span>إجمالي الدخل</span><strong>{totals.quarterlyIncome.toLocaleString('ar-SA')}</strong><small>ريال</small></button>
    <button onClick={()=>setSection('installments')}><span>إجمالي العائد</span><strong>{totals.returns.toLocaleString('ar-SA')}</strong><small>ريال</small></button>
    <button onClick={()=>setSection('installments')}><span>إجمالي الصافي</span><strong>{totals.net.toLocaleString('ar-SA')}</strong><small>ريال</small></button>
   </section></>:
   section==='beneficiaries'?<section className="panel"><h2>بيانات المستفيدين كاملة</h2><p>المصدر: عرض وصول الإداري. بعض القيم المالية الواردة في العرض مصنفة كبيانات تقرير.</p><div style={{display:'grid',gap:16}}>{rows.map(r=><div key={r.id} style={{border:'1px solid #e7e7e7',borderRadius:16,padding:18,background:'#fff'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><small>مستفيد رقم {r.beneficiary_number??'—'}</small><h3 style={{margin:'5px 0'}}>{r.beneficiary_name}</h3></div><b>{r.vehicle_type||'مركبة غير محددة'}</b></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginTop:14}}><div><small>المبلغ المعروض</small><div>{money(r.displayed_amount)}</div></div><div><small>الدخل</small><div>{money(r.quarterly_income)}</div></div><div><small>العائد/الأقساط</small><div>{money(r.total_return)}</div></div><div><small>الصافي</small><div>{money(r.net_after_return)}</div></div><div><small>اكتمال البيانات</small><div>{r.completeness||'—'}</div></div><div><small>مدة التقرير</small><div>{r.report_period_months?`${r.report_period_months} أشهر`:'—'}</div></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8,marginTop:14,fontSize:14}}><span>العمل الحر: {r.freelance_license_status||'—'}</span><span>رخصة السير: {r.vehicle_registration_status||'—'}</span><span>التأمين: {r.insurance_status||'—'}</span><span>تطبيقات النقل: {r.transport_apps_status||'—'}</span></div></div>)}</div></section>:
   section==='vehicles'?<section className="panel"><h2>المركبات حسب بيانات التقرير</h2><div style={{display:'grid',gap:16}}>{vehicleGroups.map(([vehicle,list])=><div key={vehicle} style={{border:'1px solid #e7e7e7',borderRadius:16,padding:18,background:'#fff'}}><h3 style={{marginTop:0}}>{vehicle} — {list.length} مستفيد</h3><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={th}>#</th><th style={th}>المستفيد</th><th style={th}>الدخل</th><th style={th}>العائد</th><th style={th}>الصافي</th></tr></thead><tbody>{list.map(r=><tr key={r.id}><td style={td}>{r.beneficiary_number}</td><td style={td}>{r.beneficiary_name}</td><td style={td}>{money(r.quarterly_income)}</td><td style={td}>{money(r.total_return)}</td><td style={td}>{money(r.net_after_return)}</td></tr>)}</tbody></table></div></div>)}</div></section>:
   section==='installments'?<section className="panel"><h2>الأقساط والتحصيل / العائد</h2><p>يعرض القيم الشهرية كما وردت في التقرير.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',background:'#fff'}}><thead><tr><th style={th}>#</th><th style={th}>المستفيد</th><th style={th}>شهر 1 دخل</th><th style={th}>شهر 2 دخل</th><th style={th}>شهر 3 دخل</th><th style={th}>إجمالي الدخل</th><th style={th}>إجمالي العائد</th><th style={th}>الصافي</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td style={td}>{r.beneficiary_number}</td><td style={td}>{r.beneficiary_name}</td><td style={td}>{money(r.income_month1)}</td><td style={td}>{money(r.income_month2)}</td><td style={td}>{money(r.income_month3)}</td><td style={td}>{money(r.quarterly_income)}</td><td style={td}>{money(r.total_return)}</td><td style={td}>{money(r.net_after_return)}</td></tr>)}</tbody></table></div></section>:
   section==='maintenance'?<section className="panel"><h2>التأمين والجاهزية</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',background:'#fff'}}><thead><tr><th style={th}>#</th><th style={th}>المستفيد</th><th style={th}>المركبة</th><th style={th}>رخصة العمل الحر</th><th style={th}>رخصة السير</th><th style={th}>التأمين</th><th style={th}>تطبيقات النقل</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td style={td}>{r.beneficiary_number}</td><td style={td}>{r.beneficiary_name}</td><td style={td}>{r.vehicle_type||'—'}</td><td style={td}>{r.freelance_license_status||'—'}</td><td style={td}>{r.vehicle_registration_status||'—'}</td><td style={td}>{r.insurance_status||'—'}</td><td style={td}>{r.transport_apps_status||'—'}</td></tr>)}</tbody></table></div></section>:
   section==='contracts'?<section className="panel"><h2>العقود</h2><p>لا يحتوي العرض الحالي على أرقام عقود أو مراجع عقود مؤكدة؛ لذلك لم أختلق أرقامًا غير موجودة. بيانات المبالغ المرتبطة بكل مستفيد موجودة في قسم الأقساط والتحصيل.</p></section>:
   <section className="panel"><h2>{tables[section].title}</h2><p>لا توجد بيانات إضافية مؤكدة لهذا القسم في الملف الحالي.</p></section>}
   {message&&<p className="err">{message}</p>}
  </main>
 </div>
}
