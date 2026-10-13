'use client';

import {useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {db} from '../../../../lib/db';

type Row=Record<string,any>;
const money=(v:any)=>v===null||v===undefined||v===''?'—':`${Number(v).toLocaleString('ar-SA')} ر.س`;
const date=(v:any)=>v?new Date(v).toLocaleDateString('ar-SA'):'—';
const submissionLabel:Record<string,string>={installment:'إثبات سداد قسط',accident:'بلاغ حادث',request:'طلب عام',maintenance:'طلب صيانة',document:'رفع مستند'};

export default function Beneficiary360Page(){
 const params=useParams<{id:string}>();
 const id=String(params?.id||'');
 const [role,setRole]=useState('checking');
 const [loading,setLoading]=useState(true);
 const [message,setMessage]=useState('');
 const [beneficiary,setBeneficiary]=useState<Row|null>(null);
 const [report,setReport]=useState<Row|null>(null);
 const [vehicles,setVehicles]=useState<Row[]>([]);
 const [contracts,setContracts]=useState<Row[]>([]);
 const [installments,setInstallments]=useState<Row[]>([]);
 const [submissions,setSubmissions]=useState<Row[]>([]);
 const [accidents,setAccidents]=useState<Row[]>([]);
 const [maintenance,setMaintenance]=useState<Row[]>([]);
 const [documents,setDocuments]=useState<Row[]>([]);
 const [handovers,setHandovers]=useState<Row[]>([]);
 const [ownership,setOwnership]=useState<Row[]>([]);
 const [followups,setFollowups]=useState<Row[]>([]);
 const [account,setAccount]=useState<Row|null>(null);

 useEffect(()=>{void boot()},[id]);
 async function boot(){
  if(!db||!id){setMessage('تعذر فتح ملف المستفيد.');setLoading(false);return;}
  const {data:{session}}=await db.auth.getSession();
  if(!session){window.location.href='/';return;}
  const {data:r}=await db.rpc('portal_role');
  const normalized=String(r||'').toLowerCase();
  setRole(normalized);
  if(!['admin','project_manager','management'].includes(normalized)){setMessage('لا تملك صلاحية فتح هذا الملف.');setLoading(false);return;}
  setLoading(true);setMessage('');
  const [b,rep,v,c,s,a,d,h,o,f,ac]=await Promise.all([
   db.from('beneficiaries').select('*').eq('id',id).maybeSingle(),
   db.from('beneficiary_report_details').select('*').eq('beneficiary_id',id).maybeSingle(),
   db.from('vehicles').select('*').eq('beneficiary_id',id),
   db.from('contracts').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('beneficiary_submissions').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('accidents').select('*').eq('beneficiary_id',id).order('accident_date',{ascending:false}),
   db.from('documents').select('*').eq('beneficiary_id',id).order('created_at',{ascending:false}),
   db.from('vehicle_handovers').select('*').eq('beneficiary_id',id).order('handover_date',{ascending:false}),
   db.from('ownership_transfers').select('*').eq('beneficiary_id',id).order('request_date',{ascending:false}),
   db.from('followups').select('*').eq('beneficiary_id',id).order('due_date',{ascending:true}),
   db.from('beneficiary_accounts').select('*').eq('beneficiary_id',id).maybeSingle()
  ]);
  if(b.error||!b.data){setMessage('المستفيد غير موجود أو تعذر قراءة بياناته.');setLoading(false);return;}
  setBeneficiary(b.data);setReport(rep.data??null);setVehicles(v.data??[]);setContracts(c.data??[]);setSubmissions(s.data??[]);setAccidents(a.data??[]);setDocuments(d.data??[]);setHandovers(h.data??[]);setOwnership(o.data??[]);setFollowups(f.data??[]);setAccount(ac.data??null);
  const contractIds=(c.data??[]).map(x=>x.id).filter(Boolean);
  const vehicleIds=(v.data??[]).map(x=>x.id).filter(Boolean);
  const ins=contractIds.length?await db.from('installments').select('*').in('contract_id',contractIds).order('due_date',{ascending:true}):{data:[] as Row[]};
  const maint=vehicleIds.length?await db.from('maintenance').select('*').in('vehicle_id',vehicleIds).order('due_date',{ascending:false}):{data:[] as Row[]};
  setInstallments(ins.data??[]);setMaintenance(maint.data??[]);setLoading(false);
 }

 const paidTotal=useMemo(()=>installments.reduce((s,x)=>s+(Number(x.paid_amount)||0),0),[installments]);
 const dueTotal=useMemo(()=>installments.filter(x=>x.status!=='مسدد'&&x.status!=='مدفوع').reduce((s,x)=>s+(Number(x.amount)||0)-(Number(x.paid_amount)||0),0),[installments]);
 const pendingRequests=submissions.filter(x=>x.status==='قيد المراجعة').length;
 const activeContract=contracts.find(x=>!x.archived&&x.status!=='مكتمل')||contracts[0]||null;
 const primaryVehicle=vehicles[0]||null;

 if(loading)return <div className="profile-page"><div className="center-card">جارٍ تحميل ملف المستفيد 360°…</div><Style/></div>;
 if(message&&!beneficiary)return <div className="profile-page"><div className="center-card"><h2>ملف المستفيد</h2><p>{message}</p><a href="/">العودة للمنصة</a></div><Style/></div>;
 return <div className="profile-page" dir="rtl">
  <div className="top"><div><a href="/">← العودة للمنصة</a><span>ملف المستفيد 360°</span><h1>{beneficiary?.full_name||report?.beneficiary_name||'مستفيد وصول'}</h1><p>جميع بيانات المستفيد التشغيلية في شاشة واحدة.</p></div><div className="top-actions"><span className="role">{role==='management'?'إدارة - قراءة فقط':'مدير المشروع'}</span><button onClick={()=>window.print()}>طباعة الملف</button></div></div>
  <div className="kpis"><Kpi label="حالة الحساب" value={!account?'غير مربوط':account.active?'مفعّل':'معطّل'}/><Kpi label="الطلبات المعلقة" value={pendingRequests}/><Kpi label="إجمالي المسدد" value={money(paidTotal)}/><Kpi label="المتبقي التقريبي" value={money(dueTotal)}/><Kpi label="الحوادث" value={accidents.length}/></div>

  <section className="grid two">
   <Card title="البيانات الأساسية"><Info label="الاسم" value={beneficiary?.full_name}/><Info label="الجوال" value={beneficiary?.phone}/><Info label="الحالة" value={beneficiary?.status}/><Info label="رقم المستفيد" value={report?.beneficiary_number}/><Info label="تصنيف البيانات" value={report?.data_classification}/><Info label="ملاحظات" value={report?.notes}/></Card>
   <Card title="المركبة والعقد"><Info label="المركبة" value={primaryVehicle?.make_model||report?.vehicle_type}/><Info label="اللوحة" value={primaryVehicle?.plate_number}/><Info label="الموديل" value={primaryVehicle?.model_year}/><Info label="مرجع العقد" value={activeContract?.reference}/><Info label="القسط الشهري" value={activeContract?.monthly_amount?money(activeContract.monthly_amount):'—'}/><Info label="حالة العقد" value={activeContract?.status}/></Card>
  </section>

  <Card title={`الطلبات (${submissions.length})`} wide><Table headers={['النوع','العنوان','التاريخ','المبلغ','الحالة','ملاحظة الإدارة']} rows={submissions.map(x=>[submissionLabel[x.submission_type]||x.submission_type,x.title,date(x.created_at),money(x.amount),x.status,x.admin_note||'—'])}/></Card>
  <Card title={`الأقساط (${installments.length})`} wide><Table headers={['#','الاستحقاق','المبلغ','المسدد','الحالة']} rows={installments.map(x=>[x.installment_no??'—',date(x.due_date),money(x.amount),money(x.paid_amount||0),x.status||'—'])}/></Card>

  <section className="grid two">
   <Card title={`الحوادث (${accidents.length})`}><MiniList rows={accidents.map(x=>({title:x.claim_number?`مطالبة ${x.claim_number}`:'حادث',meta:`${date(x.accident_date)} • ${x.repair_status||'—'}`}))}/></Card>
   <Card title={`الصيانة والتأمين (${maintenance.length})`}><MiniList rows={maintenance.map(x=>({title:x.category||'صيانة',meta:`${date(x.due_date)} • ${x.status||'—'}`}))}/></Card>
   <Card title={`المستندات (${documents.length})`}><MiniList rows={documents.map(x=>({title:x.title||x.document_type||'مستند',meta:`${x.document_type||''} ${x.expiry_date?`• ينتهي ${date(x.expiry_date)}`:''}`}))}/></Card>
   <Card title={`المتابعات (${followups.length})`}><MiniList rows={followups.map(x=>({title:x.subject||'متابعة',meta:`${date(x.due_date)} • ${x.priority||'—'} • ${x.status||'—'}`}))}/></Card>
   <Card title={`التسليم والاستلام (${handovers.length})`}><MiniList rows={handovers.map(x=>({title:x.handover_type||'إجراء',meta:`${date(x.handover_date)} • العداد ${x.odometer??'—'}`}))}/></Card>
   <Card title={`نقل الملكية (${ownership.length})`}><MiniList rows={ownership.map(x=>({title:x.status||'طلب نقل ملكية',meta:`${date(x.request_date)}${x.transfer_date?` • تم ${date(x.transfer_date)}`:''}`}))}/></Card>
  </section>
  <Style/>
 </div>
}

function Kpi({label,value}:{label:string,value:any}){return <div className="kpi"><span>{label}</span><strong>{value??'—'}</strong></div>}
function Card({title,children,wide=false}:{title:string,children:any,wide?:boolean}){return <section className={`card ${wide?'wide':''}`}><h2>{title}</h2><div className="card-body">{children}</div></section>}
function Info({label,value}:{label:string,value:any}){return <div className="info"><span>{label}</span><b>{value??'—'}</b></div>}
function Table({headers,rows}:{headers:string[],rows:any[][]}){return <div className="table-wrap">{rows.length===0?<div className="empty">لا توجد بيانات</div>:<table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c??'—'}</td>)}</tr>)}</tbody></table>}</div>}
function MiniList({rows}:{rows:{title:string,meta:string}[]}){return rows.length===0?<div className="empty">لا توجد بيانات</div>:<div className="mini-list">{rows.map((r,i)=><div key={i}><b>{r.title}</b><span>{r.meta}</span></div>)}</div>}
function Style(){return <style jsx global>{`
 body{margin:0;background:#f5f8f7;font-family:Tahoma,Arial,sans-serif;color:#183d39}.profile-page{max-width:1440px;margin:auto;padding:28px}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;background:white;border:1px solid #e1ebe8;border-radius:24px;padding:24px;margin-bottom:16px}.top a{color:#14715f;text-decoration:none;font-weight:800}.top span{display:block;color:#48a58a;font-size:12px;font-weight:800;margin-top:14px}.top h1{margin:5px 0 6px;font-size:32px}.top p{margin:0;color:#748683}.top-actions{display:flex;gap:10px;align-items:center}.top-actions button{border:0;background:#0d5f57;color:white;padding:11px 14px;border-radius:11px;font-weight:800;cursor:pointer}.role{background:#e9f7f2!important;color:#176852!important;padding:8px 10px;border-radius:999px!important;margin:0!important}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}.kpi{background:white;border:1px solid #e1ebe8;border-radius:18px;padding:15px}.kpi span{display:block;color:#788985;font-size:12px}.kpi strong{display:block;color:#0d5f57;font-size:20px;margin-top:7px}.grid.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{background:white;border:1px solid #e1ebe8;border-radius:20px;padding:18px;margin-bottom:14px}.card h2{font-size:17px;margin:0 0 14px}.card-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.wide .card-body{display:block}.info{background:#f8fbfa;border:1px solid #edf2f0;border-radius:12px;padding:11px}.info span{display:block;color:#80908d;font-size:11px}.info b{display:block;margin-top:4px}.table-wrap{overflow:auto}.table-wrap table{width:100%;border-collapse:collapse;min-width:720px}.table-wrap th,.table-wrap td{text-align:right;padding:10px;border-bottom:1px solid #edf2f0;font-size:13px}.table-wrap th{color:#6f817e;font-size:12px}.mini-list{grid-column:1/-1;display:grid;gap:8px}.mini-list>div{background:#f8fbfa;border:1px solid #edf2f0;border-radius:12px;padding:11px}.mini-list b,.mini-list span{display:block}.mini-list span{color:#788985;font-size:12px;margin-top:4px}.empty{color:#81908e;text-align:center;padding:22px;grid-column:1/-1}.center-card{max-width:520px;margin:15vh auto;background:white;border:1px solid #e1ebe8;border-radius:22px;padding:28px;text-align:center}.center-card a{color:#0d5f57;font-weight:800}@media(max-width:1000px){.kpis{grid-template-columns:repeat(2,1fr)}.grid.two{grid-template-columns:1fr}}@media(max-width:650px){.profile-page{padding:12px}.top{flex-direction:column}.top-actions{width:100%;justify-content:space-between}.kpis{grid-template-columns:1fr}.card-body{grid-template-columns:1fr}.top h1{font-size:25px}}@media print{.top-actions,.top a{display:none}.profile-page{padding:0}.card,.top,.kpi{break-inside:avoid}}
 `}</style>}
