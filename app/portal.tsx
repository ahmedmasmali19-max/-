'use client';
import {useEffect,useMemo,useState} from 'react';
import type {FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import QRCode from 'qrcode';
import {db,configured} from '../lib/db';
import {beneficiaryFields,configs,titles} from './portal-config';
import type {Row,Section} from './portal-config';
import {Audit,Beneficiaries,Dashboard,Generic,Modal,ProfileModal} from './portal-components';

export default function Portal(){
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false);
 const [section,setSection]=useState<Section>('dashboard');
 const [reports,setReports]=useState<Row[]>([]);
 const [data,setData]=useState<Record<string,Row[]>>({});
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [showForm,setShowForm]=useState(false);
 const [editing,setEditing]=useState<Row|null>(null);
 const [form,setForm]=useState<Row>({});
 const [search,setSearch]=useState('');
 const [profile,setProfile]=useState<Row|null>(null);
 const [qr,setQr]=useState<{title:string;src:string}|null>(null);
 const [criticalOnly,setCriticalOnly]=useState(false);
 const adminEmail=process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
 const allowed=!!session?.user.email&&!!adminEmail&&session.user.email.toLowerCase()===adminEmail;

 useEffect(()=>{
  if(!db){setReady(true);return;}
  db.auth.getSession().then(({data})=>{setSession(data.session);setReady(true);});
  const {data:s}=db.auth.onAuthStateChange((_e,x)=>setSession(x));
  return()=>s.subscription.unsubscribe();
 },[]);
 useEffect(()=>{if(allowed)void loadAll();},[allowed]);

 async function loadAll(){
  if(!db)return;
  setLoading(true);setMessage('');
  const [rep,vehicles,contracts,installments,maintenance,accidents,documents,approvals,handovers,ownership,followups,audit]=await Promise.all([
   db.from('beneficiary_report_details').select('*').order('beneficiary_number',{ascending:true}),
   db.from('vehicles').select('*'),
   db.from('contracts').select('*'),
   db.from('installments').select('*').order('due_date',{ascending:false}),
   db.from('maintenance').select('*').order('due_date',{ascending:false}),
   db.from('accidents').select('*').order('accident_date',{ascending:false}),
   db.from('documents').select('*').order('created_at',{ascending:false}),
   db.from('approvals').select('*').order('requested_at',{ascending:false}),
   db.from('vehicle_handovers').select('*').order('handover_date',{ascending:false}),
   db.from('ownership_transfers').select('*').order('request_date',{ascending:false}),
   db.from('followups').select('*').order('due_date',{ascending:true}),
   db.from('audit_logs').select('*').order('changed_at',{ascending:false}).limit(150)
  ]);
  const all=[rep,vehicles,contracts,installments,maintenance,accidents,documents,approvals,handovers,ownership,followups,audit];
  if(all.some((x:any)=>x.error))setMessage('تم تحميل المنصة مع تعذر قراءة بعض السجلات التشغيلية.');
  setReports(rep.data??[]);
  setData({vehicles:vehicles.data??[],contracts:contracts.data??[],installments:installments.data??[],maintenance:maintenance.data??[],accidents:accidents.data??[],documents:documents.data??[],approvals:approvals.data??[],handovers:handovers.data??[],ownership:ownership.data??[],followups:followups.data??[],audit:audit.data??[]});
  setLoading(false);
 }

 const active=(name:string)=>(data[name]??[]).filter(r=>!r.archived);
 const totals=useMemo(()=>({
  count:reports.length,
  income:reports.reduce((a,r)=>a+(Number(r.quarterly_income)||0),0),
  returns:reports.reduce((a,r)=>a+(Number(r.total_return)||0),0),
  net:reports.reduce((a,r)=>a+(Number(r.net_after_return)||0),0),
  overdue:active('installments').filter(r=>r.status==='متأخر').length,
  openTasks:active('followups').filter(r=>r.status!=='مكتمل').length,
  urgent:active('followups').filter(r=>['عاجلة','عالية'].includes(r.priority)&&r.status!=='مكتمل').length,
  activeAccidents:active('accidents').filter(r=>r.repair_status!=='مكتمل').length,
  pendingApprovals:active('approvals').filter(r=>r.status==='قيد المراجعة').length,
  expiringDocs:active('documents').filter(r=>r.expiry_date&&new Date(r.expiry_date).getTime()>=Date.now()&&new Date(r.expiry_date).getTime()-Date.now()<30*86400000).length
 }),[reports,data]);

 const vehicleGroups=useMemo(()=>Object.entries(reports.reduce((acc:Record<string,number>,r)=>{const k=r.vehicle_type||'غير محدد';acc[k]=(acc[k]||0)+1;return acc;},{})),[reports]);
 const critical=useMemo(()=>[
  ...active('installments').filter(r=>r.status==='متأخر').map(r=>({type:'قسط متأخر',title:r.contract_reference||'قسط',date:r.due_date,level:'danger'})),
  ...active('followups').filter(r=>r.status==='متأخر'||r.priority==='عاجلة').map(r=>({type:'مهمة عاجلة',title:r.subject,date:r.due_date,level:'warn'})),
  ...active('documents').filter(r=>r.expiry_date&&new Date(r.expiry_date).getTime()>=Date.now()&&new Date(r.expiry_date).getTime()-Date.now()<30*86400000).map(r=>({type:'مستند قريب الانتهاء',title:r.title,date:r.expiry_date,level:'warn'})),
  ...active('accidents').filter(r=>r.repair_status!=='مكتمل').map(r=>({type:'حادث مفتوح',title:r.beneficiary_name||r.vehicle_plate||'حادث',date:r.accident_date,level:'danger'})),
  ...active('approvals').filter(r=>r.status==='قيد المراجعة').map(r=>({type:'موافقة معلقة',title:r.subject,date:r.requested_at,level:'info'}))
 ],[data]);

 const currentRows=section==='beneficiaries'?reports:(data[section]??[]).filter(r=>section==='audit'||!r.archived);
 const filteredRows=useMemo(()=>{
  const q=search.trim().toLowerCase();
  let rows=currentRows;
  if(criticalOnly&&section==='followups')rows=rows.filter(r=>r.status==='متأخر'||['عاجلة','عالية'].includes(r.priority));
  if(!q)return rows;
  return rows.filter(r=>Object.values(r).some(v=>String(v??'').toLowerCase().includes(q)));
 },[currentRows,search,criticalOnly,section]);

 async function signIn(e:FormEvent){
  e.preventDefault();if(!db)return;setMessage('');
  const {error}=await db.auth.signInWithPassword({email:(email||adminEmail||'').trim(),password});
  setPassword('');if(error)setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.');
 }
 function add(){setEditing(null);setForm(section==='beneficiaries'?{data_classification:'بيانات تقرير'}:section==='approvals'?{status:'قيد المراجعة'}:section==='followups'?{priority:'متوسطة',status:'مفتوح'}:{});setShowForm(true);}
 function edit(r:Row){setEditing(r);setForm({...r});setShowForm(true);}
 function cancel(){setShowForm(false);setEditing(null);setForm({});}

 async function save(e:FormEvent){
  e.preventDefault();if(!db)return;
  const table=section==='beneficiaries'?'beneficiary_report_details':configs[section]?.table;
  if(!table)return;
  const payload={...form};
  const documentFile=payload.document_file as File|null|undefined;
  delete payload.document_file;
  ['id','created_at','changed_at','requested_at'].forEach(k=>delete payload[k]);
  Object.keys(payload).forEach(k=>{if(payload[k]==='')payload[k]=null});
  if(section==='documents'&&documentFile instanceof File){
   const safeName=documentFile.name.replace(/[^a-zA-Z0-9._-]/g,'_');
   const path=`${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName}`;
   const {error:uploadError}=await db.storage.from('wusool-documents').upload(path,documentFile,{upsert:false,contentType:documentFile.type||undefined});
   if(uploadError){setMessage(`تعذر رفع الملف: ${uploadError.message}`);return;}
   payload.file_url=path;
  }
  const result=editing?.id?await db.from(table).update(payload).eq('id',editing.id):await db.from(table).insert(payload);
  if(result.error){setMessage(`تعذر الحفظ: ${result.error.message}`);return;}
  cancel();setMessage(section==='documents'&&documentFile?'تم رفع المستند وحفظ بياناته بنجاح.':'تم حفظ البيانات بنجاح.');await loadAll();
 }

 async function remove(r:Row){
  if(!db)return;
  const cfg=configs[section];
  const table=section==='beneficiaries'?'beneficiary_report_details':cfg?.table;
  if(!table)return;
  if(cfg?.archive){
   if(!confirm('هل تريد أرشفة هذا السجل؟ سيبقى محفوظًا في قاعدة البيانات.'))return;
   const {error}=await db.from(table).update({archived:true}).eq('id',r.id);
   setMessage(error?`تعذر الأرشفة: ${error.message}`:'تمت أرشفة السجل.');
  }else{
   if(!confirm('هل تريد حذف هذا السجل؟'))return;
   const {error}=await db.from(table).delete().eq('id',r.id);
   setMessage(error?`تعذر الحذف: ${error.message}`:'تم حذف السجل.');
  }
  await loadAll();
 }

 async function showQr(r:Row){
  const text=JSON.stringify({system:'Wusool',plate:r.plate_number,vehicle:r.make_model,status:r.status});
  const src=await QRCode.toDataURL(text,{width:320,margin:2});
  setQr({title:`QR المركبة ${r.plate_number}`,src});
 }
 async function openDocument(r:Row){
  if(!db||!r.file_url)return;
  const {data:signed,error}=await db.storage.from('wusool-documents').createSignedUrl(r.file_url,120);
  if(error||!signed?.signedUrl){setMessage(`تعذر فتح الملف: ${error?.message||'الرابط غير متاح'}`);return;}
  window.open(signed.signedUrl,'_blank','noopener,noreferrer');
 }
 function exportCsv(){
  const headers=['رقم المستفيد','اسم المستفيد','المركبة','الدخل','العائد','الصافي'];
  const lines=reports.map(r=>[r.beneficiary_number,r.beneficiary_name,r.vehicle_type,r.quarterly_income,r.total_return,r.net_after_return].map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(','));
  const blob=new Blob(['\ufeff'+[headers.join(','),...lines].join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wusool-beneficiaries.csv';a.click();URL.revokeObjectURL(a.href);
 }

 if(!ready)return <div className="center"><div className="loader"/></div>;
 if(!configured)return <div className="center"><div className="login-card"><div className="mark">و</div><h1>بوابة وصول</h1><p>إعدادات الاتصال بقاعدة البيانات غير مكتملة.</p></div></div>;
 if(!session||!allowed)return <div className="login-page"><div className="login-card"><div className="mark">و</div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>بوابة إدارة وصول</h1><p>دخول مدير المشروع</p>{session&&!allowed?<><div className="alert">هذا الحساب غير مخوّل.</div><button className="primary" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></>:<form onSubmit={signIn}><label>البريد الإلكتروني<input type="email" required value={email||adminEmail||''} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary">دخول المنصة</button></form>}{message&&<div className="alert">{message}</div>}</div></div>;

 const fields=section==='beneficiaries'?beneficiaryFields:(configs[section]?.fields??[]);
 return <div className="app-shell">
  <aside className="sidebar"><div className="brand"><div className="mark">و</div><div><b>وصول</b><small>منصة إدارة المشروع</small></div></div><nav>{(Object.keys(titles) as Section[]).map(s=><button key={s} className={section===s?'active':''} onClick={()=>{setSection(s);cancel();setSearch('');}}><span className="nav-dot"/>{titles[s]}</button>)}</nav><div className="side-note"><b>تمكين • التزام • انضباط</b><small>نظام تشغيلي متكامل لمشروع وصول</small></div><button className="signout" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></aside>
  <main className="main"><header className="topbar"><div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>{titles[section]}</h1></div><div className="top-actions"><button className="ghost" onClick={()=>window.print()}>طباعة</button><div className="admin-pill"><span className="status-dot"/>مدير النظام</div></div></header>{message&&<div className="toast">{message}</div>}
  {loading?<div className="panel center-panel"><div className="loader"/><p>جارٍ تحميل البيانات…</p></div>:section==='dashboard'?<Dashboard totals={totals} groups={vehicleGroups as [string,number][]} critical={critical}/>:section==='beneficiaries'?<Beneficiaries rows={filteredRows} reports={reports} fields={fields} showForm={showForm} form={form} setForm={setForm} editing={editing} add={add} edit={edit} remove={remove} save={save} cancel={cancel} search={search} setSearch={setSearch} setProfile={setProfile} exportCsv={exportCsv}/>:section==='audit'?<Audit rows={filteredRows} search={search} setSearch={setSearch}/>:<Generic section={section} rows={filteredRows} config={configs[section]!} showForm={showForm} fields={fields} form={form} setForm={setForm} editing={editing} add={add} edit={edit} remove={remove} save={save} cancel={cancel} search={search} setSearch={setSearch} showQr={showQr} openDocument={openDocument} criticalOnly={criticalOnly} setCriticalOnly={setCriticalOnly}/>}</main>
  {profile&&<ProfileModal person={profile} data={data} onClose={()=>setProfile(null)}/>} {qr&&<Modal title={qr.title} onClose={()=>setQr(null)}><img className="qr-image" src={qr.src} alt="QR"/><p className="muted center-text">يعرض بيانات تعريف المركبة فقط دون معلومات حساسة.</p></Modal>}
 </div>;
}
