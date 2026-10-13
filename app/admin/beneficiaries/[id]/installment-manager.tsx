'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {db} from '../../../../lib/db';

type Row=Record<string,any>;
const money=(v:any)=>`${Number(v||0).toLocaleString('ar-SA')} ر.س`;

export default function InstallmentManager(){
 const params=useParams<{id:string}>();
 const beneficiaryId=String(params?.id||'');
 const [role,setRole]=useState('checking');
 const [rows,setRows]=useState<Row[]>([]);
 const [loading,setLoading]=useState(true);
 const [busyId,setBusyId]=useState('');
 const [message,setMessage]=useState('');
 const [drafts,setDrafts]=useState<Record<string,{paid:string;status:string;notes:string}>>({});

 useEffect(()=>{void boot();},[beneficiaryId]);
 async function boot(){
  if(!db||!beneficiaryId)return;
  const {data:{session}}=await db.auth.getSession();if(!session)return;
  const {data:r}=await db.rpc('portal_role');const rr=String(r||'').toLowerCase();setRole(rr);
  if(!['admin','project_manager','management','finance'].includes(rr)){setLoading(false);return;}
  await load();
 }
 async function load(){
  if(!db)return;setLoading(true);
  const {data:contracts}=await db.from('contracts').select('id').eq('beneficiary_id',beneficiaryId).eq('archived',false);
  const ids=(contracts??[]).map(x=>x.id);
  if(!ids.length){setRows([]);setLoading(false);return;}
  const {data}=await db.from('installments').select('*').in('contract_id',ids).eq('archived',false).order('due_date',{ascending:true});
  const list=data??[];setRows(list);
  const next:Record<string,{paid:string;status:string;notes:string}>={};
  list.forEach(x=>next[x.id]={paid:String(x.paid_amount??0),status:String(x.status??''),notes:String(x.notes??'')});setDrafts(next);setLoading(false);
 }
 const canEdit=['admin','project_manager','finance'].includes(role);
 const totals=useMemo(()=>({due:rows.reduce((s,x)=>s+(Number(x.amount)||0),0),paid:rows.reduce((s,x)=>s+(Number(x.paid_amount)||0),0)}),[rows]);
 async function save(row:Row){
  if(!db||!canEdit)return;const d=drafts[row.id];if(!d)return;setBusyId(row.id);setMessage('');
  const paid=Math.max(0,Number(d.paid)||0);const amount=Math.max(0,Number(row.amount)||0);
  let status=d.status||row.status||'مستحق';
  if(amount>0&&paid>=amount)status='مدفوع';
  else if(paid>0&&row.due_date&&new Date(row.due_date).getTime()<Date.now())status='متأخر';
  else if(paid>0)status='جزئي';
  const {error}=await db.from('installments').update({paid_amount:paid,status,notes:d.notes.trim()||null}).eq('id',row.id);
  if(error){setMessage(`تعذر حفظ القسط: ${error.message}`);setBusyId('');return;}
  setMessage('تم تحديث القسط بنجاح.');await load();setBusyId('');
 }
 if(loading)return <section className="im-wrap" dir="rtl">جارٍ تحميل إدارة الأقساط…<Style/></section>;
 if(!rows.length)return <section className="im-wrap" dir="rtl"><h2>إدارة الأقساط</h2><p className="im-muted">لا توجد أقساط منشأة لهذا المستفيد حتى الآن.</p><Style/></section>;
 return <section className="im-wrap" dir="rtl"><div className="im-head"><div><span>التحصيل</span><h2>إدارة الأقساط</h2></div><div className="im-totals"><b>الإجمالي {money(totals.due)}</b><b>المسدد {money(totals.paid)}</b><b>المتبقي {money(Math.max(0,totals.due-totals.paid))}</b></div></div>{message&&<div className="im-note">{message}</div>}<div className="im-table"><table><thead><tr><th>#</th><th>الاستحقاق</th><th>المبلغ</th><th>المسدد</th><th>الحالة</th><th>ملاحظات</th>{canEdit&&<th>حفظ</th>}</tr></thead><tbody>{rows.map(row=>{const d=drafts[row.id]||{paid:'0',status:'',notes:''};return <tr key={row.id}><td>{row.installment_no??'—'}</td><td>{row.due_date||'—'}</td><td>{money(row.amount)}</td><td>{canEdit?<input type="number" min="0" step="0.01" value={d.paid} onChange={e=>setDrafts(x=>({...x,[row.id]:{...d,paid:e.target.value}}))}/>:money(row.paid_amount)}</td><td>{canEdit?<select value={d.status} onChange={e=>setDrafts(x=>({...x,[row.id]:{...d,status:e.target.value}}))}><option value="مستحق">مستحق</option><option value="مدفوع">مدفوع</option><option value="جزئي">جزئي</option><option value="متأخر">متأخر</option><option value="مؤجل">مؤجل</option></select>:row.status||'—'}</td><td>{canEdit?<input value={d.notes} onChange={e=>setDrafts(x=>({...x,[row.id]:{...d,notes:e.target.value}}))}/>:row.notes||'—'}</td>{canEdit&&<td><button disabled={busyId===row.id} onClick={()=>void save(row)}>{busyId===row.id?'…':'حفظ'}</button></td>}</tr>})}</tbody></table></div>{role==='management'&&<p className="im-muted">حساب الإدارة للعرض فقط.</p>}<Style/></section>
}
function Style(){return <style jsx global>{`.im-wrap{max-width:1440px;margin:0 auto 24px;padding:0 28px;font-family:Tahoma,Arial,sans-serif;color:#183d39}.im-wrap>h2,.im-head h2{margin:4px 0 0}.im-wrap{background:transparent}.im-head,.im-table,.im-note,.im-wrap>p{background:#fff;border:1px solid #e1ebe8}.im-head{border-radius:20px 20px 0 0;padding:18px;display:flex;justify-content:space-between;gap:16px;align-items:center}.im-head span{color:#48a58a;font-size:12px;font-weight:800}.im-totals{display:flex;gap:8px;flex-wrap:wrap}.im-totals b{background:#eef8f5;padding:8px 10px;border-radius:999px;font-size:12px;color:#0d5f57}.im-table{overflow:auto;border-top:0;border-radius:0 0 20px 20px}.im-table table{width:100%;border-collapse:collapse;min-width:900px}.im-table th,.im-table td{padding:10px;border-bottom:1px solid #edf2f0;text-align:right;font-size:12px}.im-table input,.im-table select{width:100%;box-sizing:border-box;padding:8px;border:1px solid #d8e6e3;border-radius:8px}.im-table button{border:0;background:#0d5f57;color:#fff;padding:8px 12px;border-radius:8px;font-weight:800;cursor:pointer}.im-note{margin:10px 0;padding:10px 12px;border-radius:10px;color:#245d53}.im-muted{padding:14px;border-radius:12px;color:#71827f}@media(max-width:650px){.im-wrap{padding:0 12px}.im-head{align-items:flex-start;flex-direction:column}}@media print{.im-wrap{display:none}}`}</style>}
