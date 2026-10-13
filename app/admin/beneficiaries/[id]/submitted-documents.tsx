'use client';

import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import {db} from '../../../../lib/db';

type Row=Record<string,any>;

export default function SubmittedDocuments(){
 const params=useParams<{id:string}>();
 const beneficiaryId=String(params?.id||'');
 const [rows,setRows]=useState<Row[]>([]);
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState('');
 useEffect(()=>{void load();},[beneficiaryId]);
 async function load(){if(!db||!beneficiaryId)return;setLoading(true);const {data,error}=await db.from('beneficiary_submissions').select('*').eq('beneficiary_id',beneficiaryId).eq('submission_type','document').order('created_at',{ascending:false});if(error)setMessage('تعذر تحميل مستندات المستفيد المرسلة.');setRows(data??[]);setLoading(false);}
 async function open(row:Row){if(!db||!row.attachment_path)return;const {data,error}=await db.storage.from('beneficiary-uploads').createSignedUrl(row.attachment_path,180);if(error||!data?.signedUrl){setMessage('تعذر فتح المرفق.');return;}window.open(data.signedUrl,'_blank','noopener,noreferrer');}
 if(loading)return null;
 return <section className="sd-wrap" dir="rtl"><div className="sd-head"><div><span>من حساب المستفيد</span><h2>المستندات المرسلة للمراجعة</h2></div><b>{rows.length} مستند</b></div>{message&&<div className="sd-note">{message}</div>}<div className="sd-grid">{rows.length?rows.map(r=><article key={r.id}><div><b>{r.title||'مستند'}</b><span>{new Date(r.created_at).toLocaleDateString('ar-SA')} • {r.status||'قيد المراجعة'}</span>{r.details&&<small>{r.details}</small>}</div>{r.attachment_path?<button onClick={()=>void open(r)}>فتح المرفق</button>:<span>بدون مرفق</span>}</article>):<p>لم يرسل المستفيد مستندات حتى الآن.</p>}</div><Style/></section>
}
function Style(){return <style jsx global>{`.sd-wrap{max-width:1440px;margin:0 auto 24px;padding:0 28px;font-family:Tahoma,Arial,sans-serif;color:#183d39}.sd-head,.sd-grid,.sd-note{background:white;border:1px solid #e1ebe8}.sd-head{padding:18px;border-radius:20px 20px 0 0;display:flex;justify-content:space-between;align-items:center}.sd-head span{color:#48a58a;font-size:12px;font-weight:800}.sd-head h2{margin:4px 0 0}.sd-head>b{background:#eef8f5;color:#0d5f57;padding:8px 10px;border-radius:999px}.sd-grid{border-top:0;border-radius:0 0 20px 20px;padding:12px;display:grid;gap:8px}.sd-grid article{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid #edf2f0;border-radius:12px}.sd-grid article span,.sd-grid article small{display:block;color:#758783;margin-top:4px}.sd-grid button{border:0;background:#0d5f57;color:white;padding:9px 12px;border-radius:9px;font-weight:800;cursor:pointer}.sd-note{margin:10px 0;padding:10px;border-radius:10px}@media(max-width:650px){.sd-wrap{padding:0 12px}.sd-grid article{align-items:flex-start;flex-direction:column}}@media print{.sd-wrap{display:none}}`}</style>}
