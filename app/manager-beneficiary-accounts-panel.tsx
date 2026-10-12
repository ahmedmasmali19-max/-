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

 const linkedIds=useMemo(()=>new Set(accounts.filter(a=>a.active).map(a=>a.beneficiary_id)),[accounts]);
 const unlinked=useMemo(()=>beneficiaries.filter(b=>!linkedIds.has(b.id)),[beneficiaries,linkedIds]);
 const selected=beneficiaries.find(b=>b.id===selectedId);
 const nameOf=(b:Row)=>b.full_name||b.beneficiary_name||b.name||`مستفيد ${b.beneficiary_number??''}`;

 async function createAccount(e:FormEvent){
  e.preventDefault();
  if(!db||!selectedId||!email.trim()||password.length<8||busy)return;
  setBusy(true);setMessage('');
  const {data,error}=await db.functions.invoke('manage-beneficiary-account',{body:{beneficiary_id:selectedId,email:email.trim(),password,display_name:selected?nameOf(selected):email.trim()}});
  if(error||!data?.ok){setMessage(data?.message||'تعذر إنشاء الحساب. تأكد أن البريد غير مستخدم وأن كلمة المرور 8 أحرف على الأقل.');setBusy(false);return;}
  setMessage('تم إنشاء حساب المستفيد وربطه بنجاح.');setEmail('');setPassword('');setSelectedId('');await load();setBusy(false);
 }

 if(!visible)return null;
 return <>
  <button className="beneficiary-accounts-button" onClick={()=>{setOpen(true);void load()}}><span>حسابات المستفيدين</span><b>{accounts.filter(a=>a.active).length}/{beneficiaries.length}</b></button>
  {open&&<div className="beneficiary-accounts-backdrop" onMouseDown={()=>setOpen(false)}><section className="beneficiary-accounts-modal" onMouseDown={e=>e.stopPropagation()} dir="rtl">
   <header><div><small>حساب مدير المشروع</small><h2>إدارة حسابات المستفيدين</h2><p>إنشاء وربط حساب دخول لكل مستفيد في مشروع وصول.</p></div><button onClick={()=>setOpen(false)}>×</button></header>
   <div className="account-kpis"><div><span>إجمالي المستفيدين</span><strong>{beneficiaries.length}</strong></div><div><span>حسابات مفعلة</span><strong>{accounts.filter(a=>a.active).length}</strong></div><div><span>غير مربوطين</span><strong>{unlinked.length}</strong></div></div>
   {message&&<div className="account-message">{message}</div>}
   <form onSubmit={createAccount} className="account-form">
    <label>المستفيد<select value={selectedId} onChange={e=>setSelectedId(e.target.value)} required><option value="">اختر المستفيد</option>{unlinked.map(b=><option key={b.id} value={b.id}>{nameOf(b)}</option>)}</select></label>
    <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@example.com"/></label>
    <label>كلمة مرور أولية<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="8 أحرف على الأقل"/></label>
    <button disabled={busy||unlinked.length===0}>{busy?'جارٍ إنشاء الحساب…':'إنشاء وربط الحساب'}</button>
   </form>
   <div className="account-list"><div className="account-list-head"><h3>حالة الربط</h3><span>{accounts.filter(a=>a.active).length} مفعّل</span></div>{beneficiaries.map(b=><article key={b.id}><div><b>{nameOf(b)}</b><small>رقم المستفيد: {b.beneficiary_number??'—'}</small></div><span className={linkedIds.has(b.id)?'linked':'not-linked'}>{linkedIds.has(b.id)?'حساب مفعّل':'غير مربوط'}</span></article>)}</div>
  </section></div>}
  <style jsx>{`
   .beneficiary-accounts-button{position:fixed;left:22px;bottom:78px;z-index:69;border:1px solid #bfe8dc;border-radius:16px;background:#e9f8f2;color:#0d5f57;padding:12px 16px;font-weight:800;box-shadow:0 10px 26px rgba(13,95,87,.15);display:flex;align-items:center;gap:10px;cursor:pointer}.beneficiary-accounts-button b{background:white;border-radius:999px;padding:3px 8px}.beneficiary-accounts-backdrop{position:fixed;inset:0;background:rgba(4,31,29,.48);backdrop-filter:blur(5px);z-index:101;display:grid;place-items:center;padding:18px}.beneficiary-accounts-modal{width:min(920px,96vw);max-height:90vh;overflow:auto;background:#f7fbfa;border-radius:24px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.24)}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}header small{color:#319b7c;font-weight:800}header h2{margin:5px 0;color:#123b37}header p{margin:0;color:#6d817f}header>button{border:0;background:white;width:38px;height:38px;border-radius:12px;font-size:24px;cursor:pointer}.account-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.account-kpis div{background:white;border:1px solid #e1ece9;border-radius:16px;padding:14px}.account-kpis span{display:block;color:#718482;font-size:12px}.account-kpis strong{font-size:24px;color:#0d5f57}.account-message{background:#eef8f5;border:1px solid #cfeae1;color:#225b51;padding:11px 13px;border-radius:12px;margin-bottom:12px}.account-form{display:grid;grid-template-columns:1.1fr 1fr 1fr auto;gap:10px;align-items:end;background:white;border:1px solid #e1ece9;border-radius:16px;padding:14px}.account-form label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#31524e}.account-form input,.account-form select{padding:11px;border:1px solid #d8e6e3;border-radius:10px;background:white}.account-form button{border:0;background:#0d5f57;color:white;border-radius:11px;padding:12px 14px;font-weight:800;cursor:pointer}.account-form button:disabled{opacity:.55}.account-list{margin-top:14px;background:white;border:1px solid #e1ece9;border-radius:16px;overflow:hidden}.account-list-head{display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e8efed}.account-list-head h3{margin:0}.account-list article{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #eef3f1}.account-list article:last-child{border-bottom:0}.account-list b,.account-list small{display:block}.account-list small{color:#7a8e8b;margin-top:3px}.linked,.not-linked{border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800}.linked{background:#ddf5e9;color:#16704d}.not-linked{background:#fff1df;color:#99620b}@media(max-width:760px){.beneficiary-accounts-button{left:12px;bottom:72px}.account-kpis{grid-template-columns:1fr}.account-form{grid-template-columns:1fr}.beneficiary-accounts-modal{padding:15px}}
  `}</style>
 </>;
}
