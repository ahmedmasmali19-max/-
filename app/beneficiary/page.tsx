'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {db,configured} from '../../lib/db';

type Row=Record<string,any>;
type Mode='installment'|'accident'|'request'|'maintenance'|'document';

const modeTitle:Record<Mode,string>={
  installment:'رفع إثبات سداد قسط',
  accident:'بلاغ حادث',
  request:'طلب عام',
  maintenance:'طلب صيانة',
  document:'رفع مستند'
};

export default function BeneficiaryPortal(){
  const [session,setSession]=useState<Session|null>(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [beneficiary,setBeneficiary]=useState<Row|null>(null);
  const [vehicle,setVehicle]=useState<Row|null>(null);
  const [contract,setContract]=useState<Row|null>(null);
  const [installments,setInstallments]=useState<Row[]>([]);
  const [submissions,setSubmissions]=useState<Row[]>([]);
  const [mode,setMode]=useState<Mode>('installment');
  const [title,setTitle]=useState('');
  const [details,setDetails]=useState('');
  const [amount,setAmount]=useState('');
  const [eventDate,setEventDate]=useState('');
  const [file,setFile]=useState<File|null>(null);

  useEffect(()=>{
    if(!db)return;
    let active=true;
    db.auth.getSession().then(({data})=>{if(active){setSession(data.session);if(data.session)void loadPortal(data.session);}});
    const {data:s}=db.auth.onAuthStateChange((_event,next)=>{setSession(next);if(next)void loadPortal(next);else resetData();});
    return()=>{active=false;s.subscription.unsubscribe();};
  },[]);

  function resetData(){
    setBeneficiary(null);setVehicle(null);setContract(null);setInstallments([]);setSubmissions([]);
  }

  async function loadPortal(current:Session){
    if(!db)return;
    setLoading(true);setMessage('');
    const {data:bid,error:bidError}=await db.rpc('current_beneficiary_id');
    if(bidError||!bid){
      setMessage('لم يتم ربط هذا الحساب بمستفيد في مشروع وصول. تواصل مع إدارة المشروع.');
      setLoading(false);return;
    }
    const [b,v,c,s]=await Promise.all([
      db.from('beneficiaries').select('*').eq('id',bid).maybeSingle(),
      db.from('vehicles').select('*').eq('beneficiary_id',bid).limit(1).maybeSingle(),
      db.from('contracts').select('*').eq('beneficiary_id',bid).eq('archived',false).limit(1).maybeSingle(),
      db.from('beneficiary_submissions').select('*').order('created_at',{ascending:false})
    ]);
    setBeneficiary(b.data??null);setVehicle(v.data??null);setContract(c.data??null);setSubmissions(s.data??[]);
    if(c.data?.id){
      const ins=await db.from('installments').select('*').eq('contract_id',c.data.id).eq('archived',false).order('installment_no',{ascending:true});
      setInstallments(ins.data??[]);
    }else setInstallments([]);
    setLoading(false);
  }

  async function signIn(e:FormEvent){
    e.preventDefault();if(!db||busy)return;
    setBusy(true);setMessage('');
    const {data,error}=await db.auth.signInWithPassword({email:email.trim(),password});
    setPassword('');
    if(error||!data.session){setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.');setBusy(false);return;}
    setSession(data.session);await loadPortal(data.session);setBusy(false);
  }

  async function submit(e:FormEvent){
    e.preventDefault();if(!db||!session||!beneficiary||busy)return;
    setBusy(true);setMessage('');
    let attachmentPath:string|null=null;
    if(file){
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
      attachmentPath=`${session.user.id}/${Date.now()}-${safe}`;
      const up=await db.storage.from('beneficiary-uploads').upload(attachmentPath,file,{upsert:false,contentType:file.type||undefined});
      if(up.error){setMessage('تعذر رفع المرفق. حاول مرة أخرى.');setBusy(false);return;}
    }
    const finalTitle=title.trim()||modeTitle[mode];
    const {error}=await db.from('beneficiary_submissions').insert({
      user_id:session.user.id,
      beneficiary_id:beneficiary.id,
      submission_type:mode,
      title:finalTitle,
      details:details.trim()||null,
      amount:amount?Number(amount):null,
      event_date:eventDate||null,
      attachment_path:attachmentPath,
      status:'قيد المراجعة'
    });
    if(error){setMessage('تعذر إرسال الطلب. حاول مرة أخرى.');setBusy(false);return;}
    setTitle('');setDetails('');setAmount('');setEventDate('');setFile(null);
    setMessage('تم إرسال الطلب بنجاح وهو الآن قيد مراجعة إدارة المشروع.');
    await loadPortal(session);setBusy(false);
  }

  const nextInstallment=useMemo(()=>installments.find(i=>i.status!=='مدفوع')??null,[installments]);
  const paid=useMemo(()=>installments.filter(i=>i.status==='مدفوع'||Number(i.paid_amount)>0).length,[installments]);

  if(!configured)return <div className="login-page"><div className="login-card"><h1>بوابة المستفيد</h1><p>إعدادات الاتصال غير مكتملة.</p></div></div>;

  if(!session)return <div className="login-page"><div className="login-card"><div className="mark">و</div><span className="eyebrow">مشروع وصول</span><h1>بوابة المستفيد</h1><p>سجّل الدخول للوصول إلى بياناتك وطلباتك.</p><form onSubmit={signIn}><label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary" disabled={busy}>{busy?'جارٍ الدخول…':'دخول'}</button></form>{message&&<div className="alert">{message}</div>}</div></div>;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="mark">و</div><div><b>وصول</b><small>بوابة المستفيد</small></div></div><nav><button className="active">الرئيسية</button><a href="#installments">الأقساط</a><a href="#submit">إرسال طلب</a><a href="#history">طلباتي</a></nav><div className="side-note"><b>{beneficiary?.full_name||'مستفيد وصول'}</b><small>{vehicle?.plate_number?`المركبة: ${vehicle.plate_number}`:'بيانات المركبة غير متاحة'}</small></div><button className="signout" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></aside><main className="main"><header className="topbar"><div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>بوابة المستفيد</h1></div><div className="admin-pill">حساب مستفيد</div></header>{message&&<div className="toast">{message}</div>}{loading?<div className="panel center-panel"><div className="loader"/><p>جارٍ تحميل بياناتك…</p></div>:<><section className="hero"><div><span className="hero-label">مرحبًا بك</span><h2>{beneficiary?.full_name||'مستفيد وصول'}</h2><p>من هنا تتابع مركبتك وعقدك وأقساطك وترسل طلباتك مباشرة لإدارة المشروع.</p></div><div className="hero-badge"><strong>{paid}</strong><span>قسط مسدد</span></div></section><div className="kpi-grid"><div className="kpi"><span>المركبة</span><strong>{vehicle?.make_model||'—'}</strong><small>{vehicle?.plate_number||'—'}</small></div><div className="kpi"><span>القسط الشهري</span><strong>{contract?.monthly_amount?Number(contract.monthly_amount).toLocaleString('ar-SA'):'—'}</strong></div><div className="kpi"><span>القسط القادم</span><strong>{nextInstallment?.due_date||'—'}</strong></div><div className="kpi"><span>حالة العقد</span><strong>{contract?.status||'—'}</strong></div></div><section id="installments" className="panel"><div className="panel-head"><h2>الأقساط</h2><span>{installments.length} قسط</span></div><div className="table-wrap"><table><thead><tr><th>رقم القسط</th><th>تاريخ الاستحقاق</th><th>المبلغ</th><th>المدفوع</th><th>الحالة</th></tr></thead><tbody>{installments.map(i=><tr key={i.id}><td>{i.installment_no??'—'}</td><td>{i.due_date??'—'}</td><td>{i.amount??'—'}</td><td>{i.paid_amount??0}</td><td>{i.status??'—'}</td></tr>)}</tbody></table></div></section><section id="submit" className="panel"><div className="panel-head"><h2>إرسال طلب جديد</h2><span>يصل مباشرة لإدارة المشروع</span></div><form onSubmit={submit} className="form-grid"><label>نوع الطلب<select value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="installment">إثبات سداد قسط</option><option value="accident">بلاغ حادث</option><option value="maintenance">طلب صيانة</option><option value="document">رفع مستند</option><option value="request">طلب عام</option></select></label><label>عنوان الطلب<input value={title} onChange={e=>setTitle(e.target.value)} placeholder={modeTitle[mode]}/></label><label>التاريخ<input type="date" value={eventDate} onChange={e=>setEventDate(e.target.value)}/></label><label>المبلغ – إن وجد<input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label className="full">التفاصيل<textarea value={details} onChange={e=>setDetails(e.target.value)} rows={4}/></label><label className="full">المرفق<input type="file" accept="image/*,.pdf" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><div className="full"><button className="primary" disabled={busy}>{busy?'جارٍ الإرسال…':'إرسال الطلب'}</button></div></form></section><section id="history" className="panel"><div className="panel-head"><h2>طلباتي السابقة</h2><span>{submissions.length} طلب</span></div>{submissions.length===0?<p className="muted">لا توجد طلبات حتى الآن.</p>:<div className="table-wrap"><table><thead><tr><th>النوع</th><th>العنوان</th><th>التاريخ</th><th>الحالة</th><th>ملاحظة الإدارة</th></tr></thead><tbody>{submissions.map(s=><tr key={s.id}><td>{modeTitle[s.submission_type as Mode]||s.submission_type}</td><td>{s.title}</td><td>{new Date(s.created_at).toLocaleDateString('ar-SA')}</td><td>{s.status}</td><td>{s.admin_note||'—'}</td></tr>)}</tbody></table></div>}</section></>}</main></div>;
}
