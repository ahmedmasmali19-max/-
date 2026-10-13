'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {db} from '../lib/db';

type Row=Record<string,any>;
const money=(v:any)=>`${Number(v||0).toLocaleString('ar-SA')} ر.س`;

export default function BeneficiaryPaymentCenter(){
 const [beneficiaryId,setBeneficiaryId]=useState('');
 const [installments,setInstallments]=useState<Row[]>([]);
 const [notifications,setNotifications]=useState<Row[]>([]);
 const [installmentId,setInstallmentId]=useState('');
 const [amount,setAmount]=useState('');
 const [file,setFile]=useState<File|null>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);

 useEffect(()=>{void boot();},[]);
 async function boot(){
  if(!db)return;
  const {data:{session}}=await db.auth.getSession();if(!session)return;
  const {data:bid}=await db.rpc('current_beneficiary_id');if(!bid)return;
  setBeneficiaryId(String(bid));
  const {data:contracts}=await db.from('contracts').select('id').eq('beneficiary_id',bid).eq('archived',false);
  const ids=(contracts??[]).map(x=>x.id);
  const ins=ids.length?await db.from('installments').select('*').in('contract_id',ids).eq('archived',false).order('due_date',{ascending:true}):{data:[] as Row[]};
  const list=(ins.data??[]).filter(x=>Number(x.paid_amount||0)<Number(x.amount||0));
  setInstallments(list);
  if(list[0]){setInstallmentId(list[0].id);setAmount(String(Math.max(0,Number(list[0].amount||0)-Number(list[0].paid_amount||0))))}
  const n=await db.from('beneficiary_notifications').select('*').order('created_at',{ascending:false}).limit(20);
  setNotifications(n.data??[]);setReady(true);
 }
 const selected=useMemo(()=>installments.find(x=>x.id===installmentId)||null,[installments,installmentId]);
 async function submit(e:FormEvent){
  e.preventDefault();if(!db||!beneficiaryId||!selected||!file||busy)return;setBusy(true);setMessage('');
  const {data:{session}}=await db.auth.getSession();if(!session){setBusy(false);return;}
  if(file.size>10*1024*1024){setMessage('الملف أكبر من 10 ميجابايت.');setBusy(false);return;}
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${session.user.id}/${Date.now()}-${safe}`;
  const up=await db.storage.from('beneficiary-uploads').upload(path,file,{upsert:false,contentType:file.type||undefined});
  if(up.error){setMessage('تعذر رفع إثبات السداد.');setBusy(false);return;}
  const {error}=await db.from('beneficiary_submissions').insert({user_id:session.user.id,beneficiary_id:beneficiaryId,submission_type:'installment',title:`إثبات سداد القسط ${selected.installment_no??''}`.trim(),details:`مرتبط بالقسط رقم ${selected.installment_no??'—'} المستحق بتاريخ ${selected.due_date||'—'}`,amount:Number(amount),event_date:new Date().toISOString().slice(0,10),attachment_path:path,installment_id:selected.id,status:'قيد المراجعة'});
  if(error){await db.storage.from('beneficiary-uploads').remove([path]);setMessage('تعذر إرسال إثبات السداد.');setBusy(false);return;}
  setMessage('تم إرسال إثبات السداد للإدارة وهو الآن قيد المراجعة.');setFile(null);setBusy(false);await boot();
 }
 async function markRead(id:string){if(!db)return;await db.from('beneficiary_notifications').update({is_read:true}).eq('id',id);setNotifications(x=>x.map(n=>n.id===id?{...n,is_read:true}:n));}
 if(!ready)return null;
 return <section className="bpc" dir="rtl"><div className="bpc-grid"><div className="bpc-card"><span className="bpc-eyebrow">الأقساط</span><h2>رفع إثبات سداد لقسط محدد</h2>{installments.length===0?<p className="bpc-muted">لا توجد أقساط غير مسددة حاليًا.</p>:<form onSubmit={submit}><label>اختر القسط<select value={installmentId} onChange={e=>{setInstallmentId(e.target.value);const row=installments.find(x=>x.id===e.target.value);if(row)setAmount(String(Math.max(0,Number(row.amount||0)-Number(row.paid_amount||0))))}}>{installments.map(x=><option key={x.id} value={x.id}>قسط {x.installment_no??'—'} • {x.due_date||'—'} • المتبقي {money(Math.max(0,Number(x.amount||0)-Number(x.paid_amount||0)))}</option>)}</select></label><label>المبلغ<input type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>إثبات السداد<input type="file" accept="image/*,.pdf" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button disabled={busy||!file}>{busy?'جارٍ الإرسال…':'إرسال للإدارة'}</button></form>}{message&&<div className="bpc-note">{message}</div>}</div><div className="bpc-card"><span className="bpc-eyebrow">الإشعارات</span><h2>آخر تحديثات طلباتك</h2>{notifications.length===0?<p className="bpc-muted">لا توجد إشعارات جديدة.</p>:<div className="bpc-list">{notifications.map(n=><button key={n.id} className={n.is_read?'read':'unread'} onClick={()=>void markRead(n.id)}><b>{n.title}</b><span>{n.message||'—'}</span><small>{new Date(n.created_at).toLocaleString('ar-SA')}</small></button>)}</div>}</div></div><style jsx global>{`.bpc{max-width:1400px;margin:0 auto 28px;padding:0 28px;font-family:Tahoma,Arial,sans-serif}.bpc-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.bpc-card{background:#fff;border:1px solid #e1ebe8;border-radius:20px;padding:18px}.bpc-eyebrow{color:#3f9b82;font-size:12px;font-weight:800}.bpc h2{margin:5px 0 14px;color:#173d38}.bpc form{display:grid;grid-template-columns:2fr 1fr 1.4fr auto;gap:10px;align-items:end}.bpc label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#31524e}.bpc input,.bpc select{padding:10px;border:1px solid #d8e6e3;border-radius:10px;background:white}.bpc form button{border:0;background:#0d5f57;color:white;padding:11px 14px;border-radius:10px;font-weight:800;cursor:pointer}.bpc-note{margin-top:10px;background:#eef8f5;padding:10px;border-radius:10px;color:#245d53}.bpc-muted{color:#758783}.bpc-list{display:grid;gap:8px}.bpc-list button{text-align:right;border:1px solid #edf2f0;border-radius:12px;padding:11px;background:#f8fbfa;cursor:pointer}.bpc-list button.unread{border-color:#bfe2d8;background:#eef9f5}.bpc-list b,.bpc-list span,.bpc-list small{display:block}.bpc-list span{margin-top:4px;color:#526864}.bpc-list small{margin-top:5px;color:#8b9a97}@media(max-width:900px){.bpc-grid{grid-template-columns:1fr}.bpc form{grid-template-columns:1fr 1fr}}@media(max-width:600px){.bpc{padding:0 12px}.bpc form{grid-template-columns:1fr}}`}</style></section>
}
