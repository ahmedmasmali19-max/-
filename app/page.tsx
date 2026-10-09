'use client';
import {FormEvent,useEffect,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import QRCode from 'qrcode';
import {db,configured} from '../lib/db';

type Row=Record<string,any>;
type Section='dashboard'|'beneficiaries'|'vehicles'|'contracts'|'installments'|'maintenance'|'accidents'|'followups'|'audit';
type Field={key:string;label:string;type?:'text'|'number'|'date'|'select';options?:string[];required?:boolean};
type Config={fields:Field[];columns:string[]};

const titles:Record<Section,string>={dashboard:'لوحة التحكم',beneficiaries:'المستفيدون',vehicles:'المركبات',contracts:'العقود',installments:'الأقساط والتحصيل',maintenance:'التأمين والصيانة',accidents:'الحوادث والتأمين',followups:'المتابعات',audit:'سجل النشاط'};
const money=(v:any)=>v===null||v===undefined||v===''?'—':`${Number(v).toLocaleString('ar-SA')} ر.س`;
const dateAr=(v:any)=>v?new Date(v).toLocaleDateString('ar-SA'):'—';

const beneficiaryFields:Field[]=[
 {key:'beneficiary_number',label:'رقم المستفيد',type:'number'},
 {key:'beneficiary_name',label:'اسم المستفيد',required:true},
 {key:'vehicle_type',label:'نوع المركبة'},
 {key:'quarterly_income',label:'إجمالي الدخل',type:'number'},
 {key:'total_return',label:'إجمالي العائد / الأقساط',type:'number'},
 {key:'net_after_return',label:'الصافي',type:'number'},
 {key:'freelance_license_status',label:'رخصة العمل الحر',type:'select',options:['مكتمل','غير مكتمل']},
 {key:'vehicle_registration_status',label:'رخصة السير',type:'select',options:['مكتمل','غير مكتمل']},
 {key:'insurance_status',label:'التأمين',type:'select',options:['مكتمل','غير مكتمل']},
 {key:'transport_apps_status',label:'تطبيقات النقل',type:'select',options:['مكتمل','غير مكتمل']},
 {key:'notes',label:'ملاحظات'}
];

const configs:Partial<Record<Section,Config>>={
 vehicles:{fields:[{key:'plate_number',label:'رقم اللوحة',required:true},{key:'make_model',label:'الماركة والموديل'},{key:'model_year',label:'سنة الموديل',type:'number'},{key:'status',label:'الحالة',type:'select',options:['نشطة','صيانة','متوقفة']}],columns:['plate_number','make_model','model_year','status']},
 contracts:{fields:[{key:'reference',label:'مرجع العقد',required:true},{key:'beneficiary_name',label:'المستفيد'},{key:'vehicle_plate',label:'رقم اللوحة'},{key:'monthly_amount',label:'القسط الشهري',type:'number'},{key:'status',label:'الحالة',type:'select',options:['نشط','مكتمل','متأخر','متوقف']}],columns:['reference','beneficiary_name','vehicle_plate','monthly_amount','status']},
 installments:{fields:[{key:'contract_reference',label:'مرجع العقد',required:true},{key:'due_date',label:'تاريخ الاستحقاق',type:'date'},{key:'amount',label:'المبلغ',type:'number'},{key:'paid_amount',label:'المبلغ المسدد',type:'number'},{key:'status',label:'الحالة',type:'select',options:['مسدد','مستحق','متأخر','مؤجل']}],columns:['contract_reference','due_date','amount','paid_amount','status']},
 maintenance:{fields:[{key:'vehicle_plate',label:'رقم اللوحة',required:true},{key:'category',label:'التصنيف'},{key:'due_date',label:'تاريخ الاستحقاق',type:'date'},{key:'status',label:'الحالة',type:'select',options:['سليم','مستحق','قيد التنفيذ','مكتمل']}],columns:['vehicle_plate','category','due_date','status']},
 accidents:{fields:[{key:'beneficiary_name',label:'المستفيد'},{key:'vehicle_plate',label:'رقم اللوحة'},{key:'accident_date',label:'تاريخ الحادث',type:'date'},{key:'fault_percentage',label:'نسبة الخطأ %',type:'number'},{key:'claim_number',label:'رقم المطالبة'},{key:'insurer',label:'شركة التأمين'},{key:'repair_status',label:'حالة الإصلاح',type:'select',options:['جديد','قيد المطالبة','تحت الإصلاح','مكتمل','هلاك كلي']},{key:'installment_effect',label:'أثر الحادث على الأقساط'},{key:'notes',label:'ملاحظات'}],columns:['beneficiary_name','vehicle_plate','accident_date','fault_percentage','claim_number','repair_status']},
 followups:{fields:[{key:'subject',label:'موضوع المتابعة',required:true},{key:'due_date',label:'تاريخ المتابعة',type:'date'},{key:'status',label:'الحالة',type:'select',options:['مفتوح','قيد المتابعة','مكتمل','متأخر']}],columns:['subject','due_date','status']}
};
const labels:Record<string,string>={plate_number:'اللوحة',make_model:'المركبة',model_year:'الموديل',reference:'مرجع العقد',beneficiary_name:'المستفيد',vehicle_plate:'اللوحة',monthly_amount:'القسط',status:'الحالة',contract_reference:'مرجع العقد',due_date:'التاريخ',amount:'المبلغ',paid_amount:'المسدد',category:'التصنيف',subject:'الموضوع',accident_date:'تاريخ الحادث',fault_percentage:'نسبة الخطأ',claim_number:'المطالبة',repair_status:'الإصلاح'};

function FieldInput({field,value,onChange}:{field:Field;value:any;onChange:(v:any)=>void}){
 if(field.type==='select')return <select value={value??''} onChange={e=>onChange(e.target.value)}><option value="">اختر</option>{field.options?.map(o=><option key={o} value={o}>{o}</option>)}</select>;
 return <input type={field.type||'text'} required={field.required} value={value??''} onChange={e=>onChange(field.type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value)}/>;
}

export default function Home(){
 const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[section,setSection]=useState<Section>('dashboard');
 const [reports,setReports]=useState<Row[]>([]),[data,setData]=useState<Record<string,Row[]>>({vehicles:[],contracts:[],installments:[],maintenance:[],accidents:[],followups:[],audit:[]});
 const [loading,setLoading]=useState(false),[message,setMessage]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [showForm,setShowForm]=useState(false),[editing,setEditing]=useState<Row|null>(null),[form,setForm]=useState<Row>({}),[search,setSearch]=useState('');
 const [profile,setProfile]=useState<Row|null>(null),[qr,setQr]=useState<{title:string;src:string}|null>(null);
 const adminEmail=process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
 const allowed=!!session?.user.email&&!!adminEmail&&session.user.email.toLowerCase()===adminEmail;

 useEffect(()=>{if(!db){setReady(true);return;}db.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data:s}=db.auth.onAuthStateChange((_e,x)=>setSession(x));return()=>s.subscription.unsubscribe();},[]);
 useEffect(()=>{if(allowed)void loadAll();},[allowed]);

 async function loadAll(){
  if(!db)return;setLoading(true);setMessage('');
  const [rep,vehicles,contracts,installments,maintenance,accidents,followups,audit]=await Promise.all([
   db.from('beneficiary_report_details').select('*').order('beneficiary_number',{ascending:true}),
   db.from('vehicles').select('*').order('created_at',{ascending:false}),
   db.from('contracts').select('*').order('created_at',{ascending:false}),
   db.from('installments').select('*').order('due_date',{ascending:false}),
   db.from('maintenance').select('*').order('due_date',{ascending:false}),
   db.from('accidents').select('*').order('created_at',{ascending:false}),
   db.from('followups').select('*').order('due_date',{ascending:false}),
   db.from('audit_logs').select('*').order('changed_at',{ascending:false}).limit(100)
  ]);
  const errs=[rep,vehicles,contracts,installments,maintenance,accidents,followups,audit].filter((x:any)=>x.error);
  if(errs.length)setMessage('تم تحميل المنصة مع تعذر قراءة بعض السجلات التشغيلية.');
  setReports(rep.data??[]);setData({vehicles:vehicles.data??[],contracts:contracts.data??[],installments:installments.data??[],maintenance:maintenance.data??[],accidents:accidents.data??[],followups:followups.data??[],audit:audit.data??[]});setLoading(false);
 }

 const totals=useMemo(()=>({count:reports.length,income:reports.reduce((a,r)=>a+(Number(r.quarterly_income)||0),0),returns:reports.reduce((a,r)=>a+(Number(r.total_return)||0),0),net:reports.reduce((a,r)=>a+(Number(r.net_after_return)||0),0),overdue:data.installments.filter(r=>r.status==='متأخر').length,openFollowups:data.followups.filter(r=>r.status!=='مكتمل').length,activeAccidents:data.accidents.filter(r=>!['مكتمل'].includes(r.repair_status)).length}),[reports,data]);
 const vehicleGroups=useMemo(()=>Object.entries(reports.reduce((acc:Record<string,number>,r)=>{const k=r.vehicle_type||'غير محدد';acc[k]=(acc[k]||0)+1;return acc;},{})),[reports]);
 const currentRows=section==='beneficiaries'?reports:(data[section]??[]);
 const filteredRows=useMemo(()=>{const q=search.trim().toLowerCase();if(!q)return currentRows;return currentRows.filter(r=>Object.values(r).some(v=>String(v??'').toLowerCase().includes(q)));},[currentRows,search]);

 async function signIn(e:FormEvent){e.preventDefault();if(!db)return;setMessage('');const {error}=await db.auth.signInWithPassword({email:(email||adminEmail||'').trim(),password});setPassword('');if(error)setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.');}
 function add(){setEditing(null);setForm(section==='beneficiaries'?{data_classification:'بيانات تقرير'}:{});setShowForm(true);}
 function edit(r:Row){setEditing(r);setForm({...r});setShowForm(true);}
 function cancel(){setShowForm(false);setEditing(null);setForm({});}
 async function save(e:FormEvent){e.preventDefault();if(!db)return;const table=section==='beneficiaries'?'beneficiary_report_details':section;const payload={...form};delete payload.id;delete payload.created_at;delete payload.changed_at;Object.keys(payload).forEach(k=>{if(payload[k]==='')payload[k]=null});const result=editing?.id?await db.from(table).update(payload).eq('id',editing.id):await db.from(table).insert(payload);if(result.error){setMessage(`تعذر الحفظ: ${result.error.message}`);return;}cancel();setMessage('تم حفظ البيانات بنجاح.');await loadAll();}
 async function remove(r:Row){if(!db||!confirm('هل تريد حذف هذا السجل؟'))return;const table=section==='beneficiaries'?'beneficiary_report_details':section;const {error}=await db.from(table).delete().eq('id',r.id);if(error)setMessage(`تعذر الحذف: ${error.message}`);else{setMessage('تم حذف السجل.');await loadAll();}}
 async function showQr(r:Row){const text=JSON.stringify({system:'Wusool',plate:r.plate_number,vehicle:r.make_model,status:r.status});const src=await QRCode.toDataURL(text,{width:320,margin:2});setQr({title:`QR المركبة ${r.plate_number}`,src});}
 function exportCsv(){const headers=['رقم المستفيد','اسم المستفيد','المركبة','الدخل','العائد','الصافي'];const lines=reports.map(r=>[r.beneficiary_number,r.beneficiary_name,r.vehicle_type,r.quarterly_income,r.total_return,r.net_after_return].map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(','));const blob=new Blob(['\ufeff'+[headers.join(','),...lines].join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wusool-beneficiaries.csv';a.click();URL.revokeObjectURL(a.href);}

 if(!ready)return <div className="center"><div className="loader"/></div>;
 if(!configured)return <div className="center"><div className="login-card"><div className="mark">و</div><h1>بوابة وصول</h1><p>إعدادات الاتصال بقاعدة البيانات غير مكتملة.</p></div></div>;
 if(!session||!allowed)return <div className="login-page"><div className="login-card"><div className="mark">و</div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>بوابة إدارة وصول</h1><p>دخول مدير المشروع</p>{session&&!allowed?<><div className="alert">هذا الحساب غير مخوّل.</div><button className="primary" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></>:<form onSubmit={signIn}><label>البريد الإلكتروني<input type="email" required value={email||adminEmail||''} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary">دخول المنصة</button></form>}{message&&<div className="alert">{message}</div>}</div></div>;

 const fields=section==='beneficiaries'?beneficiaryFields:(configs[section]?.fields??[]);
 return <div className="app-shell">
  <aside className="sidebar"><div className="brand"><div className="mark">و</div><div><b>وصول</b><small>منصة إدارة المشروع</small></div></div><nav>{(Object.keys(titles) as Section[]).map(s=><button key={s} className={section===s?'active':''} onClick={()=>{setSection(s);setSearch('');cancel();}}><span className="nav-dot"/>{titles[s]}</button>)}</nav><div className="side-note"><b>تمكين • التزام • انضباط</b><small>إدارة موحدة لمستفيدي ومركبات وصول</small></div><button className="signout" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></aside>
  <main className="main"><header className="topbar"><div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>{titles[section]}</h1></div><div className="admin-pill"><span className="status-dot"/>مدير النظام</div></header>{message&&<div className="toast">{message}</div>}
  {loading?<div className="panel center-panel"><div className="loader"/><p>جارٍ تحميل البيانات…</p></div>:section==='dashboard'?<Dashboard totals={totals} groups={vehicleGroups} onCsv={exportCsv}/>:section==='audit'?<Audit rows={data.audit}/>:<section className="panel"><div className="panel-head"><div><span className="eyebrow">{section==='beneficiaries'?'قاعدة المستفيدين':'الإدارة التشغيلية'}</span><h3>{titles[section]} <span className="count-chip">{filteredRows.length}</span></h3></div><div className="toolbar"><input className="searchbox" placeholder="بحث سريع..." value={search} onChange={e=>setSearch(e.target.value)}/>{section!=='audit'&&<button className="primary small" onClick={add}>+ إضافة سجل</button>}</div></div>
   {showForm&&<Editor fields={fields} form={form} setForm={setForm} editing={editing} onSave={save} onCancel={cancel}/>} {section==='beneficiaries'?<Beneficiaries rows={filteredRows} onEdit={edit} onRemove={remove} onProfile={setProfile}/>:<Generic section={section} rows={filteredRows} config={configs[section]!} onEdit={edit} onRemove={remove} onQr={showQr}/>}</section>}
  </main>
  {profile&&<ProfileModal row={profile} data={data} onClose={()=>setProfile(null)}/>} {qr&&<div className="modal-backdrop" onClick={()=>setQr(null)}><div className="modal-card qr-card" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setQr(null)}>×</button><h3>{qr.title}</h3><img src={qr.src} alt="QR"/><p>يعرّف المركبة داخل نظام وصول دون كشف بيانات حساسة.</p></div></div>}
 </div>;
}

function Dashboard({totals,groups,onCsv}:{totals:any;groups:[string,number][];onCsv:()=>void}){return <><section className="hero"><div><span className="hero-label">مشروع وصول</span><h2>مركز التحكم التنفيذي للمشروع</h2><p>متابعة المستفيدين والتحصيل والجاهزية والحوادث والمتابعات من شاشة واحدة.</p><div className="hero-actions"><button onClick={onCsv}>تصدير Excel/CSV</button><button onClick={()=>window.print()}>طباعة التقرير</button></div></div><div className="hero-badge"><strong>{totals.count}</strong><span>مستفيدًا</span></div></section><section className="kpis"><Kpi t="المستفيدون" v={totals.count} s="سجل"/><Kpi t="إجمالي الدخل" v={totals.income.toLocaleString('ar-SA')} s="ريال"/><Kpi t="إجمالي العائد" v={totals.returns.toLocaleString('ar-SA')} s="ريال"/><Kpi t="إجمالي الصافي" v={totals.net.toLocaleString('ar-SA')} s="ريال"/></section><section className="alert-grid"><div className="alert-card danger-soft"><b>{totals.overdue}</b><span>قسط متأخر</span></div><div className="alert-card warning-soft"><b>{totals.openFollowups}</b><span>متابعة مفتوحة</span></div><div className="alert-card info-soft"><b>{totals.activeAccidents}</b><span>حادث تحت الإجراء</span></div></section><section className="panel" style={{marginTop:16}}><div className="panel-head"><div><span className="eyebrow">الأسطول</span><h3>توزيع أنواع المركبات</h3></div></div><div className="vehicle-bars">{groups.map(([name,count])=><div className="bar-row" key={name}><div><b>{name}</b><span>{count} مستفيد</span></div><div className="bar"><i style={{width:`${Math.max(10,(count/Math.max(totals.count,1))*100)}%`}}/></div></div>)}</div></section></>}
function Kpi({t,v,s}:{t:string;v:any;s:string}){return <div className="kpi"><span>{t}</span><strong>{v}</strong><small>{s}</small></div>}
function Beneficiaries({rows,onEdit,onRemove,onProfile}:{rows:Row[];onEdit:(r:Row)=>void;onRemove:(r:Row)=>void;onProfile:(r:Row)=>void}){return <div className="cards">{rows.map(r=><article className="person-card" key={r.id}><div className="person-top"><div className="avatar">{String(r.beneficiary_name||'و').charAt(0)}</div><div><small>مستفيد رقم {r.beneficiary_number??'—'}</small><h4>{r.beneficiary_name}</h4><span className="chip">{r.vehicle_type||'مركبة غير محددة'}</span></div></div><div className="person-stats"><div><span>الدخل</span><b>{money(r.quarterly_income)}</b></div><div><span>العائد</span><b>{money(r.total_return)}</b></div><div><span>الصافي</span><b>{money(r.net_after_return)}</b></div></div><div className="requirements"><span className={r.insurance_status==='مكتمل'?'ok':''}>التأمين</span><span className={r.vehicle_registration_status==='مكتمل'?'ok':''}>رخصة السير</span><span className={r.freelance_license_status==='مكتمل'?'ok':''}>العمل الحر</span><span className={r.transport_apps_status==='مكتمل'?'ok':''}>التطبيقات</span></div><div className="actions"><button onClick={()=>onProfile(r)}>فتح الملف</button><button onClick={()=>onEdit(r)}>تعديل</button><button className="danger" onClick={()=>onRemove(r)}>حذف</button></div></article>)}</div>}
function Editor({fields,form,setForm,editing,onSave,onCancel}:{fields:Field[];form:Row;setForm:(v:any)=>void;editing:Row|null;onSave:(e:FormEvent)=>void;onCancel:()=>void}){return <form className="editor" onSubmit={onSave}><div className="editor-head"><h4>{editing?'تعديل السجل':'إضافة سجل جديد'}</h4><button type="button" onClick={onCancel}>×</button></div><div className="form-grid">{fields.map(f=><label key={f.key}><span>{f.label}</span><FieldInput field={f} value={form[f.key]} onChange={v=>setForm((x:Row)=>({...x,[f.key]:v}))}/></label>)}</div><div className="form-actions"><button className="primary" type="submit">حفظ البيانات</button><button type="button" onClick={onCancel}>إلغاء</button></div></form>}
function Generic({section,rows,config,onEdit,onRemove,onQr}:{section:Section;rows:Row[];config:Config;onEdit:(r:Row)=>void;onRemove:(r:Row)=>void;onQr:(r:Row)=>void}){return <div className="table-wrap"><table><thead><tr>{config.columns.map(c=><th key={c}>{labels[c]||c}</th>)}<th>الإجراءات</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}>{config.columns.map(c=><td key={c}>{['monthly_amount','amount','paid_amount'].includes(c)?money(r[c]):['due_date','accident_date'].includes(c)?dateAr(r[c]):c==='fault_percentage'&&r[c]!=null?`${r[c]}%`:r[c]??'—'}</td>)}<td><div className="table-actions">{section==='vehicles'&&<button onClick={()=>onQr(r)}>QR</button>}<button onClick={()=>onEdit(r)}>تعديل</button><button className="danger" onClick={()=>onRemove(r)}>حذف</button></div></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty-state">لا توجد سجلات بعد. استخدم «إضافة سجل» لبدء الإدخال.</div>}</div>}
function ProfileModal({row,data,onClose}:{row:Row;data:Record<string,Row[]>;onClose:()=>void}){const contracts=data.contracts.filter(x=>x.beneficiary_name===row.beneficiary_name);const accidents=data.accidents.filter(x=>x.beneficiary_name===row.beneficiary_name);return <div className="modal-backdrop" onClick={onClose}><div className="modal-card profile-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><div className="profile-head"><div className="avatar big">{String(row.beneficiary_name||'و').charAt(0)}</div><div><span className="eyebrow">ملف المستفيد الموحد</span><h2>{row.beneficiary_name}</h2><span className="chip">{row.vehicle_type||'مركبة غير محددة'}</span></div></div><div className="profile-grid"><div><span>الدخل</span><b>{money(row.quarterly_income)}</b></div><div><span>العائد</span><b>{money(row.total_return)}</b></div><div><span>الصافي</span><b>{money(row.net_after_return)}</b></div><div><span>التأمين</span><b>{row.insurance_status||'—'}</b></div></div><h3>العقود المرتبطة</h3>{contracts.length?contracts.map(c=><div className="linked-row" key={c.id}><b>{c.reference}</b><span>{money(c.monthly_amount)} • {c.status||'—'}</span></div>):<p className="muted">لا توجد عقود تشغيلية مرتبطة بالاسم حتى الآن.</p>}<h3>الحوادث</h3>{accidents.length?accidents.map(a=><div className="linked-row" key={a.id}><b>{dateAr(a.accident_date)}</b><span>{a.repair_status||'—'} • {a.claim_number||'بدون مطالبة'}</span></div>):<p className="muted">لا توجد حوادث مسجلة.</p>}<h3>ملاحظات</h3><p>{row.notes||'لا توجد ملاحظات.'}</p></div></div>}
function Audit({rows}:{rows:Row[]}){const action=(x:string)=>x==='INSERT'?'إضافة':x==='UPDATE'?'تعديل':x==='DELETE'?'حذف':x;return <section className="panel"><div className="panel-head"><div><span className="eyebrow">الأمان والتدقيق</span><h3>آخر 100 عملية</h3></div></div><div className="table-wrap"><table><thead><tr><th>الوقت</th><th>القسم</th><th>العملية</th><th>رقم السجل</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{new Date(r.changed_at).toLocaleString('ar-SA')}</td><td>{r.table_name}</td><td><span className="status good">{action(r.action)}</span></td><td>{r.record_id||'—'}</td></tr>)}</tbody></table>{rows.length===0&&<div className="empty-state">لا توجد عمليات مسجلة بعد.</div>}</div></section>}
