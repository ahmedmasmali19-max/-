'use client';

import {FormEvent,useEffect,useMemo,useState} from 'react';
import {useParams} from 'next/navigation';
import {db} from '../../../../lib/db';

type Row=Record<string,any>;
const money=(v:any)=>v===null||v===undefined||v===''?'—':`${Number(v).toLocaleString('ar-SA')} ر.س`;
const date=(v:any)=>v?new Date(v).toLocaleDateString('ar-SA'):'—';
const submissionLabel:Record<string,string>={installment:'إثبات سداد قسط',accident:'بلاغ حادث',request:'طلب عام',maintenance:'طلب صيانة',document:'رفع مستند'};
const documentTypes=['عقد','هوية','رخصة','تأمين','استمارة','حادث','خطاب','أخرى'];

export default function Beneficiary360Page(){
 const params=useParams<{id:string}>();
 const id=String(params?.id||'');
 const [role,setRole]=useState('checking');
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
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
 const [editOpen,setEditOpen]=useState(false);
 const [editForm,setEditForm]=useState<Row>({});
 const [docType,setDocType]=useState('عقد');
 const [docTitle,setDocTitle]=useState('');
 const [docExpiry,setDocExpiry]=useState('');
 const [docFile,setDocFile]=useState<File|null>(null);

 useEffect(()=>{void boot()},[id]);
 async function boot(){
  if(!db||!id){setMessage('تعذر فتح ملف المستفيد.');setLoading(false);return;}
  const {data:{session}}=await db.auth.getSession();
  if(!session){window.location.href='/';return;}
  const {data:r}=await db.rpc('portal_role');
  const normalized=String(r||'').toLowerCase();
  setRole(normalized);
  if(!['admin','project_manager','management'].includes(normalized)){setMessage('لا تملك صلاحية فتح هذا الملف.');setLoading(false);return;}
  await loadData();
 }

 async function loadData(){
  if(!db)return;setLoading(true);
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

 const canEdit=['admin','project_manager'].includes(role);
 const paidTotal=useMemo(()=>installments.reduce((s,x)=>s+(Number(x.paid_amount)||0),0),[installments]);
 const dueTotal=useMemo(()=>installments.filter(x=>x.status!=='مسدد'&&x.status!=='مدفوع').reduce((s,x)=>s+(Number(x.amount)||0)-(Number(x.paid_amount)||0),0),[installments]);
 const pendingRequests=submissions.filter(x=>x.status==='قيد المراجعة').length;
 const activeContract=contracts.find(x=>!x.archived&&x.status!=='مكتمل')||contracts[0]||null;
 const primaryVehicle=vehicles[0]||null;

 function openEdit(){
  if(!canEdit)return;
  setEditForm({full_name:beneficiary?.full_name||'',phone:beneficiary?.phone||'',beneficiary_status:beneficiary?.status||'نشط',notes:report?.notes||'',make_model:primaryVehicle?.make_model||report?.vehicle_type||'',plate_number:primaryVehicle?.plate_number||'',model_year:primaryVehicle?.model_year||'',vehicle_status:primaryVehicle?.status||'نشطة',reference:activeContract?.reference||'',monthly_amount:activeContract?.monthly_amount||'',start_date:activeContract?.start_date||'',duration_months:activeContract?.duration_months||'',due_day:activeContract?.due_day||27,total_amount:activeContract?.total_amount||'',contract_status:activeContract?.status||'نشط'});
  setEditOpen(true);
 }

 async function saveEdit(e:FormEvent){
  e.preventDefault();if(!db||!canEdit||busy)return;setBusy(true);setMessage('');
  const results=[] as any[];
  results.push(await db.from('beneficiaries').update({full_name:editForm.full_name,phone:editForm.phone||null,status:editForm.beneficiary_status||null}).eq('id',id));
  if(report?.id)results.push(await db.from('beneficiary_report_details').update({beneficiary_name:editForm.full_name,vehicle_type:editForm.make_model||null,notes:editForm.notes||null}).eq('id',report.id));
  if(primaryVehicle?.id)results.push(await db.from('vehicles').update({plate_number:editForm.plate_number,make_model:editForm.make_model||null,model_year:editForm.model_year?Number(editForm.model_year):null,status:editForm.vehicle_status||null}).eq('id',primaryVehicle.id));
  if(activeContract?.id)results.push(await db.from('contracts').update({reference:editForm.reference,beneficiary_name:editForm.full_name,vehicle_plate:editForm.plate_number||null,monthly_amount:editForm.monthly_amount?Number(editForm.monthly_amount):null,start_date:editForm.start_date||null,duration_months:editForm.duration_months?Number(editForm.duration_months):null,due_day:editForm.due_day?Number(editForm.due_day):null,total_amount:editForm.total_amount?Number(editForm.total_amount):null,status:editForm.contract_status||null}).eq('id',activeContract.id));
  const err=results.find(x=>x.error)?.error;
  if(err){setMessage(`تعذر حفظ بعض التعديلات: ${err.message}`);setBusy(false);return;}
  setMessage('تم حفظ بيانات المستفيد والمركبة والعقد بنجاح.');setEditOpen(false);await loadData();setBusy(false);
 }

 async function uploadDocument(e:FormEvent){
  e.preventDefault();if(!db||!canEdit||!docFile||busy)return;setBusy(true);setMessage('');
  if(docFile.size>10*1024*1024){setMessage('حجم الملف أكبر من 10 ميجابايت.');setBusy(false);return;}
  const safeName=docFile.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`beneficiaries/${id}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName}`;
  const {error:uploadError}=await db.storage.from('wusool-documents').upload(path,docFile,{upsert:false,contentType:docFile.type||undefined});
  if(uploadError){setMessage(`تعذر رفع الملف: ${uploadError.message}`);setBusy(false);return;}
  const {error}=await db.from('documents').insert({beneficiary_id:id,vehicle_id:primaryVehicle?.id||null,contract_id:activeContract?.id||null,beneficiary_name:beneficiary?.full_name||null,vehicle_plate:primaryVehicle?.plate_number||null,document_type:docType,title:docTitle.trim()||docType,file_url:path,expiry_date:docExpiry||null,status:'نشط'});
  if(error){await db.storage.from('wusool-documents').remove([path]);setMessage(`تعذر حفظ بيانات المستند: ${error.message}`);setBusy(false);return;}
  setDocFile(null);setDocTitle('');setDocExpiry('');setMessage('تم رفع المستند وربطه بالمستفيد بنجاح.');await loadData();setBusy(false);
 }

 async function openDocument(doc:Row){
  if(!db||!doc.file_url)return;const {data,error}=await db.storage.from('wusool-documents').createSignedUrl(doc.file_url,180);if(error||!data?.signedUrl){setMessage('تعذر فتح المستند.');return;}window.open(data.signedUrl,'_blank','noopener,noreferrer');
 }

 if(loading)return <div className="profile-page"><div className="center-card">جارٍ تحميل ملف المستفيد 360°…</div><Style/></div>;
 if(message&&!beneficiary)return <div className="profile-page"><div className="center-card"><h2>ملف المستفيد</h2><p>{message}</p><a href="/">العودة للمنصة</a></div><Style/></div>;
 return <div className="profile-page" dir="rtl">
  <div className="top"><div><a href="/">← العودة للمنصة</a><span>ملف المستفيد 360°</span><h1>{beneficiary?.full_name||report?.beneficiary_name||'مستفيد وصول'}</h1><p>بيانات المستفيد والمركبة والعقد والمرفقات في شاشة واحدة.</p></div><div className="top-actions"><span className="role">{role==='management'?'إدارة - قراءة فقط':'مدير المشروع'}</span>{canEdit&&<button onClick={openEdit}>تعديل البيانات</button>}<button onClick={()=>window.print()}>طباعة الملف</button></div></div>
  {message&&<div className="notice">{message}</div>}
  <div className="kpis"><Kpi label="حالة الحساب" value={!account?'غير مربوط':account.active?'مفعّل':'معطّل'}/><Kpi label="القسط الشهري" value={activeContract?.monthly_amount?money(activeContract.monthly_amount):'—'}/><Kpi label="الطلبات المعلقة" value={pendingRequests}/><Kpi label="إجمالي المسدد" value={money(paidTotal)}/><Kpi label="الحوادث" value={accidents.length}/></div>

  <section className="grid two">
   <Card title="البيانات الأساسية"><Info label="الاسم" value={beneficiary?.full_name}/><Info label="الجوال" value={beneficiary?.phone}/><Info label="الحالة" value={beneficiary?.status}/><Info label="رقم المستفيد" value={report?.beneficiary_number}/><Info label="تصنيف البيانات" value={report?.data_classification}/><Info label="ملاحظات" value={report?.notes}/></Card>
   <Card title="المركبة والعقد"><Info label="المركبة" value={primaryVehicle?.make_model||report?.vehicle_type}/><Info label="اللوحة" value={primaryVehicle?.plate_number}/><Info label="الموديل" value={primaryVehicle?.model_year}/><Info label="مرجع العقد" value={activeContract?.reference}/><Info label="القسط الشهري" value={activeContract?.monthly_amount?money(activeContract.monthly_amount):'—'}/><Info label="يوم الاستحقاق" value={activeContract?.due_day}/><Info label="بداية العقد" value={date(activeContract?.start_date)}/><Info label="مدة العقد" value={activeContract?.duration_months?`${activeContract.duration_months} شهر`:'—'}/><Info label="إجمالي العقد" value={activeContract?.total_amount?money(activeContract.total_amount):'—'}/><Info label="حالة العقد" value={activeContract?.status}/></Card>
  </section>

  <Card title={`مرفقات المستفيد (${documents.length})`} wide>
   {canEdit&&<form className="upload-form" onSubmit={uploadDocument}><label>نوع المستند<select value={docType} onChange={e=>setDocType(e.target.value)}>{documentTypes.map(x=><option key={x}>{x}</option>)}</select></label><label>العنوان<input value={docTitle} onChange={e=>setDocTitle(e.target.value)} placeholder="مثال: عقد المركبة"/></label><label>تاريخ الانتهاء<input type="date" value={docExpiry} onChange={e=>setDocExpiry(e.target.value)}/></label><label>الملف<input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e=>setDocFile(e.target.files?.[0]||null)} required/></label><button disabled={busy||!docFile}>{busy?'جارٍ الرفع…':'رفع وربط المستند'}</button></form>}
   <div className="document-grid">{documents.length?documents.map(doc=><article key={doc.id}><div><b>{doc.title||doc.document_type}</b><span>{doc.document_type} {doc.expiry_date?`• ينتهي ${date(doc.expiry_date)}`:''}</span></div>{doc.file_url?<button onClick={()=>void openDocument(doc)}>فتح المستند</button>:<span>بدون ملف</span>}</article>):<div className="empty">لا توجد مستندات مرفوعة بعد.</div>}</div>
  </Card>

  <Card title={`الطلبات (${submissions.length})`} wide><Table headers={['النوع','العنوان','التاريخ','المبلغ','الحالة','ملاحظة الإدارة']} rows={submissions.map(x=>[submissionLabel[x.submission_type]||x.submission_type,x.title,date(x.created_at),money(x.amount),x.status,x.admin_note||'—'])}/></Card>
  <Card title={`الأقساط (${installments.length})`} wide><Table headers={['#','الاستحقاق','المبلغ','المسدد','الحالة']} rows={installments.map(x=>[x.installment_no??'—',date(x.due_date),money(x.amount),money(x.paid_amount||0),x.status||'—'])}/></Card>

  <section className="grid two"><Card title={`الحوادث (${accidents.length})`}><MiniList rows={accidents.map(x=>({title:x.claim_number?`مطالبة ${x.claim_number}`:'حادث',meta:`${date(x.accident_date)} • ${x.repair_status||'—'}`}))}/></Card><Card title={`الصيانة والتأمين (${maintenance.length})`}><MiniList rows={maintenance.map(x=>({title:x.category||'صيانة',meta:`${date(x.due_date)} • ${x.status||'—'}`}))}/></Card><Card title={`المتابعات (${followups.length})`}><MiniList rows={followups.map(x=>({title:x.subject||'متابعة',meta:`${date(x.due_date)} • ${x.priority||'—'} • ${x.status||'—'}`}))}/></Card><Card title={`التسليم والاستلام (${handovers.length})`}><MiniList rows={handovers.map(x=>({title:x.handover_type||'إجراء',meta:`${date(x.handover_date)} • العداد ${x.odometer??'—'}`}))}/></Card><Card title={`نقل الملكية (${ownership.length})`}><MiniList rows={ownership.map(x=>({title:x.status||'طلب نقل ملكية',meta:`${date(x.request_date)}${x.transfer_date?` • تم ${date(x.transfer_date)}`:''}`}))}/></Card></section>

  {editOpen&&<div className="modal-backdrop" onMouseDown={()=>setEditOpen(false)}><form className="edit-modal" onSubmit={saveEdit} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><span>تعديل ملف المستفيد</span><h2>{beneficiary?.full_name}</h2></div><button type="button" onClick={()=>setEditOpen(false)}>×</button></div><div className="edit-grid"><Edit label="اسم المستفيد" value={editForm.full_name} onChange={v=>setEditForm(x=>({...x,full_name:v}))}/><Edit label="الجوال" value={editForm.phone} onChange={v=>setEditForm(x=>({...x,phone:v}))}/><Edit label="نوع المركبة" value={editForm.make_model} onChange={v=>setEditForm(x=>({...x,make_model:v}))}/><Edit label="رقم اللوحة" value={editForm.plate_number} onChange={v=>setEditForm(x=>({...x,plate_number:v}))}/><Edit label="سنة الموديل" type="number" value={editForm.model_year} onChange={v=>setEditForm(x=>({...x,model_year:v}))}/><Edit label="مرجع العقد" value={editForm.reference} onChange={v=>setEditForm(x=>({...x,reference:v}))}/><Edit label="القسط الشهري" type="number" value={editForm.monthly_amount} onChange={v=>setEditForm(x=>({...x,monthly_amount:v}))}/><Edit label="يوم الاستحقاق" type="number" value={editForm.due_day} onChange={v=>setEditForm(x=>({...x,due_day:v}))}/><Edit label="بداية العقد" type="date" value={editForm.start_date} onChange={v=>setEditForm(x=>({...x,start_date:v}))}/><Edit label="مدة العقد بالأشهر" type="number" value={editForm.duration_months} onChange={v=>setEditForm(x=>({...x,duration_months:v}))}/><Edit label="إجمالي قيمة العقد" type="number" value={editForm.total_amount} onChange={v=>setEditForm(x=>({...x,total_amount:v}))}/><label>حالة العقد<select value={editForm.contract_status||''} onChange={e=>setEditForm(x=>({...x,contract_status:e.target.value}))}><option>نشط</option><option>مكتمل</option><option>متأخر</option><option>متوقف</option></select></label><label>حالة المركبة<select value={editForm.vehicle_status||''} onChange={e=>setEditForm(x=>({...x,vehicle_status:e.target.value}))}><option>نشطة</option><option>صيانة</option><option>متوقفة</option></select></label><label className="full">ملاحظات<textarea rows={3} value={editForm.notes||''} onChange={e=>setEditForm(x=>({...x,notes:e.target.value}))}/></label></div><div className="edit-actions"><button type="submit" disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ جميع التعديلات'}</button><button type="button" onClick={()=>setEditOpen(false)}>إلغاء</button></div></form></div>}
  <Style/>
 </div>
}

function Kpi({label,value}:{label:string,value:any}){return <div className="kpi"><span>{label}</span><strong>{value??'—'}</strong></div>}
function Card({title,children,wide=false}:{title:string,children:any,wide?:boolean}){return <section className={`card ${wide?'wide':''}`}><h2>{title}</h2><div className="card-body">{children}</div></section>}
function Info({label,value}:{label:string,value:any}){return <div className="info"><span>{label}</span><b>{value??'—'}</b></div>}
function Edit({label,value,onChange,type='text'}:{label:string,value:any,onChange:(v:string)=>void,type?:string}){return <label>{label}<input type={type} value={value??''} onChange={e=>onChange(e.target.value)}/></label>}
function Table({headers,rows}:{headers:string[],rows:any[][]}){return <div className="table-wrap">{rows.length===0?<div className="empty">لا توجد بيانات</div>:<table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c??'—'}</td>)}</tr>)}</tbody></table>}</div>}
function MiniList({rows}:{rows:{title:string,meta:string}[]}){return rows.length===0?<div className="empty">لا توجد بيانات</div>:<div className="mini-list">{rows.map((r,i)=><div key={i}><b>{r.title}</b><span>{r.meta}</span></div>)}</div>}
function Style(){return <style jsx global>{`
 body{margin:0;background:#f5f8f7;font-family:Tahoma,Arial,sans-serif;color:#183d39}.profile-page{max-width:1440px;margin:auto;padding:28px}.top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;background:white;border:1px solid #e1ebe8;border-radius:24px;padding:24px;margin-bottom:16px}.top a{color:#14715f;text-decoration:none;font-weight:800}.top span{display:block;color:#48a58a;font-size:12px;font-weight:800;margin-top:14px}.top h1{margin:5px 0 6px;font-size:32px}.top p{margin:0;color:#748683}.top-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.top-actions button,.upload-form button,.document-grid button,.edit-actions button:first-child{border:0;background:#0d5f57;color:white;padding:11px 14px;border-radius:11px;font-weight:800;cursor:pointer}.role{background:#e9f7f2!important;color:#176852!important;padding:8px 10px;border-radius:999px!important;margin:0!important}.notice{background:#eef8f5;border:1px solid #cfe9e0;color:#245d53;padding:11px 14px;border-radius:12px;margin-bottom:14px}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}.kpi{background:white;border:1px solid #e1ebe8;border-radius:18px;padding:15px}.kpi span{display:block;color:#788985;font-size:12px}.kpi strong{display:block;color:#0d5f57;font-size:20px;margin-top:7px}.grid.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{background:white;border:1px solid #e1ebe8;border-radius:20px;padding:18px;margin-bottom:14px}.card h2{font-size:17px;margin:0 0 14px}.card-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.wide .card-body{display:block}.info{background:#f8fbfa;border:1px solid #edf2f0;border-radius:12px;padding:11px}.info span{display:block;color:#80908d;font-size:11px}.info b{display:block;margin-top:4px}.upload-form{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:10px;align-items:end;margin-bottom:14px;padding:14px;background:#f8fbfa;border:1px solid #edf2f0;border-radius:14px}.upload-form label,.edit-grid label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#31524e}.upload-form input,.upload-form select,.edit-grid input,.edit-grid select,.edit-grid textarea{padding:10px;border:1px solid #d8e6e3;border-radius:10px;background:white}.document-grid{display:grid;gap:8px}.document-grid article{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;border:1px solid #edf2f0;border-radius:12px}.document-grid b,.document-grid span{display:block}.document-grid span{color:#788985;font-size:12px;margin-top:4px}.table-wrap{overflow:auto}.table-wrap table{width:100%;border-collapse:collapse;min-width:720px}.table-wrap th,.table-wrap td{text-align:right;padding:10px;border-bottom:1px solid #edf2f0;font-size:13px}.table-wrap th{color:#6f817e;font-size:12px}.mini-list{grid-column:1/-1;display:grid;gap:8px}.mini-list>div{background:#f8fbfa;border:1px solid #edf2f0;border-radius:12px;padding:11px}.mini-list b,.mini-list span{display:block}.mini-list span{color:#788985;font-size:12px;margin-top:4px}.empty{color:#81908e;text-align:center;padding:22px;grid-column:1/-1}.center-card{max-width:520px;margin:15vh auto;background:white;border:1px solid #e1ebe8;border-radius:22px;padding:28px;text-align:center}.modal-backdrop{position:fixed;inset:0;background:rgba(5,35,32,.48);z-index:200;display:grid;place-items:center;padding:18px}.edit-modal{width:min(900px,96vw);max-height:90vh;overflow:auto;background:#f8fbfa;border-radius:22px;padding:20px}.modal-head{display:flex;justify-content:space-between;align-items:flex-start}.modal-head span{color:#3b927a;font-size:12px;font-weight:800}.modal-head h2{margin:4px 0 14px}.modal-head button{border:0;background:white;border-radius:10px;width:38px;height:38px;font-size:22px}.edit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.edit-grid .full{grid-column:1/-1}.edit-actions{display:flex;gap:10px;margin-top:16px}.edit-actions button{padding:11px 14px;border-radius:10px;border:1px solid #d6e3e0;font-weight:800;cursor:pointer}@media(max-width:1000px){.kpis{grid-template-columns:repeat(2,1fr)}.grid.two{grid-template-columns:1fr}.upload-form{grid-template-columns:1fr 1fr}.edit-grid{grid-template-columns:1fr 1fr}}@media(max-width:650px){.profile-page{padding:12px}.top{flex-direction:column}.top-actions{width:100%}.kpis,.upload-form,.edit-grid{grid-template-columns:1fr}.card-body{grid-template-columns:1fr}.top h1{font-size:25px}.document-grid article{align-items:flex-start;flex-direction:column}}@media print{.top-actions,.top a,.upload-form,.modal-backdrop{display:none!important}.profile-page{padding:0}.card,.top,.kpi{break-inside:avoid}}
 `}</style>}
