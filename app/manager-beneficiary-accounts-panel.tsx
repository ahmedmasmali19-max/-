'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {db} from '../lib/db';

type Row=Record<string,any>;

export default function ManagerBeneficiaryAccountsPanel(){
 const [visible,setVisible]=useState(false);
 const [open,setOpen]=useState(false);
 const [beneficiaries,setBeneficiaries]=useState<Row[]>([]);
 const [accounts,setAccounts]=useState<Row[]>([]);
 const [selectedId,setSelectedId]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [resetFor,setResetFor]=useState<Row|null>(null);
 const [newPassword,setNewPassword]=useState('');

 useEffect(()=>{
  if(!db)return;
  let active=true;
  async function boot(){
   const {data:{session}}=await db!.auth.getSession();
   if(!session||!active)return;
   const {data:role}=await db!.rpc('portal_role');
   const r=String(role??'').toLowerCase();
   if(!active||!['admin','project_manager'].includes(r))return;
   setVisible(true);await load();
  }
  void boot();
  const {data:s}=db.auth.onAuthStateChange((_e,session)=>{window.setTimeout(()=>{if(!active)return;if(!session){setVisible(false);setBeneficiaries([]);setAccounts([]);}else void boot();},0)});
  return()=>{active=false;s.subscription.unsubscribe();};
 },[]);

 async function load(){
  if(!db)return;
  const [b,a]=await Promise.all([
   db.from('beneficiaries').select('*').order('created_at',{ascending:true}),
   db.from('beneficiary_accounts').select('*')
  ]);
  setBeneficiaries(b.data??[]);setAccounts(a.data??[]);
 }

 const accountMap=useMemo(()=>new Map(accounts.map(a=>[a.beneficiary_id,a])),[accounts]);
 const activeCount=accounts.filter(a=>a.active).length;
 const unlinked=useMemo(()=>beneficiaries.filter(b=>!accountMap.has(b.id)),[beneficiaries,accountMap]);
 const selected=beneficiaries.find(b=>b.id===selectedId);
 const nameOf=(b:Row)=>b.full_name||b.beneficiary_name||b.name||`مستفيد ${b.beneficiary_number??''}`;

 async function invoke(body:Row){
  if(!db)return {ok:false,message:'قاعدة البيانات غير متاحة'};
  const {data,error}=await db.functions.invoke('manage-beneficiary-account',{body});
  if(error||!data?.ok)return {ok:false,message:data?.message||'تعذر تنفيذ العملية.'};
  return {ok:true,data};
 }

 async function createAccount(e:FormEvent){
  e.preventDefault();
  if(!selectedId||!email.trim()||password.length<8||busy)return;
  setBusy(true);setMessage('');
  const result=await invoke({action:'create',beneficiary_id:selectedId,email:email.trim(),password,display_name:selected?nameOf(selected):email.trim()});
  if(!result.ok){setMessage(result.message||'تعذر إنشاء الحساب.');setBusy(false);return;}
  setMessage('تم إنشاء حساب المستفيد وربطه بنجاح.');setEmail('');setPassword('');setSelectedId('');await load();setBusy(false);
 }

 async function toggleAccount(b:Row){
  const account=accountMap.get(b.id);if(!account||busy)return;
  const next=!account.active;
  if(!confirm(next?`تفعيل حساب ${nameOf(b)}؟`:`تعطيل حساب ${nameOf(b)}؟`))return;
  setBusy(true);setMessage('');
  const result=await invoke({action:'set_active',beneficiary_id:b.id,active:next});
  setMessage(result.ok?(next?'تم تفعيل الحساب.':'تم تعطيل الحساب.'):result.message||'تعذر تحديث الحساب.');
  await load();setBusy(false);
 }

 async function resetPassword(e:FormEvent){
  e.preventDefault();if(!resetFor||newPassword.length<8||busy)return;
  setBusy(true);setMessage('');
  const result=await invoke({action:'reset_password',beneficiary_id:resetFor.id,password:newPassword});
  if(result.ok){setMessage(`تم تحديث كلمة مرور ${nameOf(resetFor)}.`);setResetFor(null);setNewPassword('');}
  else setMessage(result.message||'تعذر تحديث كلمة المرور.');
  setBusy(false);
 }

 if(!visible)return null;
 return <>
  <button className="beneficiary-accounts-button" onClick={()=>{setOpen(true);void load()}}><span>حسابات المستفيدين</span><b>{activeCount}/{beneficiaries.length}</b></button>
  {open&&<div className="beneficiary-accounts-backdrop" onMouseDown={()=>setOpen(false)}><section className="beneficiary-accounts-modal" onMouseDown={e=>e.stopPropagation()} dir="rtl">
   <header><div><small>حساب مدير المشروع</small><h2>إدارة حسابات المستفيدين</h2><p>إنشاء الحسابات وتفعيلها وتعطيلها وإعادة تعيين كلمة المرور وفتح ملف المستفيد 360°.</p></div><button onClick={()=>setOpen(false)}>×</button></header>
   <div className="account-kpis"><div><span>إجمالي المستفيدين</span><strong>{beneficiaries.length}</strong></div><div><span>حسابات مفعلة</span><strong>{activeCount}</strong></div><div><span>غير مربوطين</span><strong>{unlinked.length}</strong></div></div>
   {message&&<div className="account-message">{message}</div>}
   <form onSubmit={createAccount} className="account-form">
    <label>المستفيد<select value={selectedId} onChange={e=>setSelectedId(e.target.value)} required><option value="">اختر المستفيد</option>{unlinked.map(b=><option key={b.id} value={b.id}>{nameOf(b)}</option>)}</select></label>
    <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@example.com"/></label>
    <label>كلمة مرور أولية<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="8 أحرف على الأقل"/></label>
    <button disabled={busy||unlinked.length===0}>{busy?'جارٍ التنفيذ…':'إنشاء وربط الحساب'}</button>
   </form>
   <div className="account-list"><div className="account-list-head"><h3>حالة الربط</h3><span>{activeCount} مفعّل</span></div>{beneficiaries.map(b=>{const a=accountMap.get(b.id);return <article key={b.id}><div className="beneficiary-main"><b>{nameOf(b)}</b><small>رقم السجل: {String(b.id).slice(0,8)}</small><span className={!a?'not-linked':a.active?'linked':'disabled'}>{!a?'غير مربوط':a.active?'حساب مفعّل':'حساب معطّل'}</span></div><div className="row-actions"><a className="profile-link" href={`/admin/beneficiaries/${b.id}`}>فتح الملف 360°</a>{a&&<><button onClick={()=>{setResetFor(b);setNewPassword('')}}>كلمة المرور</button><button className={a.active?'danger-btn':'enable-btn'} onClick={()=>void toggleAccount(b)}>{a.active?'تعطيل':'تفعيل'}</button></>}</div></article>})}</div>
  </section></div>}
  {resetFor&&<div className="mini-backdrop" onMouseDown={()=>setResetFor(null)}><form className="mini-modal" onSubmit={resetPassword} onMouseDown={e=>e.stopPropagation()} dir="rtl"><button type="button" className="close" onClick={()=>setResetFor(null)}>×</button><small>إعادة تعيين كلمة المرور</small><h3>{nameOf(resetFor)}</h3><label>كلمة المرور الجديدة<input type="password" minLength={8} required value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="8 أحرف على الأقل"/></label><button className="save" disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ كلمة المرور الجديدة'}</button></form></div>}
  <style jsx>{`
   .beneficiary-accounts-button{position:fixed;left:22px;bottom:78px;z-index:69;border:1px solid #bfe8dc;border-radius:16px;background:#e9f8f2;color:#0d5f57;padding:12px 16px;font-weight:800;box-shadow:0 10px 26px rgba(13,95,87,.15);display:flex;align-items:center;gap:10px;cursor:pointer}.beneficiary-accounts-button b{background:white;border-radius:999px;padding:3px 8px}.beneficiary-accounts-backdrop,.mini-backdrop{position:fixed;inset:0;background:rgba(4,31,29,.48);backdrop-filter:blur(5px);z-index:101;display:grid;place-items:center;padding:18px}.mini-backdrop{z-index:120}.beneficiary-accounts-modal{width:min(980px,96vw);max-height:90vh;overflow:auto;background:#f7fbfa;border-radius:24px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.24)}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}header small,.mini-modal small{color:#319b7c;font-weight:800}header h2{margin:5px 0;color:#123b37}header p{margin:0;color:#6d817f}header>button,.close{border:0;background:white;width:38px;height:38px;border-radius:12px;font-size:24px;cursor:pointer}.account-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.account-kpis div{background:white;border:1px solid #e1ece9;border-radius:16px;padding:14px}.account-kpis span{display:block;color:#718482;font-size:12px}.account-kpis strong{font-size:24px;color:#0d5f57}.account-message{background:#eef8f5;border:1px solid #cfeae1;color:#225b51;padding:11px 13px;border-radius:12px;margin-bottom:12px}.account-form{display:grid;grid-template-columns:1.1fr 1fr 1fr auto;gap:10px;align-items:end;background:white;border:1px solid #e1ece9;border-radius:16px;padding:14px}.account-form label,.mini-modal label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#31524e}.account-form input,.account-form select,.mini-modal input{padding:11px;border:1px solid #d8e6e3;border-radius:10px;background:white}.account-form button,.save{border:0;background:#0d5f57;color:white;border-radius:11px;padding:12px 14px;font-weight:800;cursor:pointer}.account-form button:disabled,.save:disabled{opacity:.55}.account-list{margin-top:14px;background:white;border:1px solid #e1ece9;border-radius:16px;overflow:hidden}.account-list-head{display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e8efed}.account-list-head h3{margin:0}.account-list article{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #eef3f1}.account-list article:last-child{border-bottom:0}.beneficiary-main b,.beneficiary-main small{display:block}.beneficiary-main small{color:#7a8e8b;margin:3px 0 7px}.linked,.not-linked,.disabled{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800}.linked{background:#ddf5e9;color:#16704d}.not-linked{background:#fff1df;color:#99620b}.disabled{background:#f0f1f1;color:#6e7775}.row-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;align-items:center}.row-actions button,.profile-link{border:1px solid #d6e5e1;background:white;color:#23554e;border-radius:9px;padding:7px 10px;font-weight:700;cursor:pointer;text-decoration:none;font-size:13px}.profile-link{background:#0d5f57;color:white;border-color:#0d5f57}.row-actions .danger-btn{background:#fff0f0;color:#a63d3d;border-color:#f0cccc}.row-actions .enable-btn{background:#e9f8f2;color:#12694e;border-color:#c7e8dc}.mini-modal{position:relative;width:min(460px,94vw);background:#f8fbfa;border-radius:22px;padding:22px;box-shadow:0 22px 70px rgba(0,0,0,.25)}.mini-modal .close{position:absolute;left:16px;top:16px}.mini-modal h3{margin:7px 0 18px;color:#163f3a}.mini-modal .save{width:100%;margin-top:14px}@media(max-width:760px){.beneficiary-accounts-button{left:12px;bottom:72px}.account-kpis{grid-template-columns:1fr}.account-form{grid-template-columns:1fr}.beneficiary-accounts-modal{padding:15px}.account-list article{align-items:flex-start;flex-direction:column}.row-actions{justify-content:flex-start}}
  `}</style>
 </>;
}
