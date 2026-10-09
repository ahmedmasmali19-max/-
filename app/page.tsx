'use client';
import {FormEvent,useEffect,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {db,configured} from '../lib/db';

type Row=Record<string,any>;
type Section='dashboard'|'beneficiaries'|'vehicles'|'contracts'|'installments'|'maintenance'|'followups';
type Field={key:string;label:string;type?:'text'|'number'|'date'|'select';options?:string[];required?:boolean};

const titles:Record<Section,string>={dashboard:'لوحة التحكم',beneficiaries:'المستفيدون',vehicles:'المركبات',contracts:'العقود',installments:'الأقساط والتحصيل',maintenance:'التأمين والصيانة',followups:'المتابعات'};
const money=(v:any)=>v===null||v===undefined||v===''?'—':`${Number(v).toLocaleString('ar-SA')} ر.س`;
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
const configs:Partial<Record<Section,{fields:Field[];columns:string[]}>>={
 vehicles:{fields:[{key:'plate_number',label:'رقم اللوحة',required:true},{key:'make_model',label:'الماركة والموديل'},{key:'model_year',label:'سنة الموديل',type:'number'},{key:'status',label:'الحالة',type:'select',options:['نشطة','صيانة','متوقفة']}],columns:['plate_number','make_model','model_year','status']},
 contracts:{fields:[{key:'reference',label:'مرجع العقد',required:true},{key:'beneficiary_name',label:'المستفيد'},{key:'vehicle_plate',label:'رقم اللوحة'},{key:'monthly_amount',label:'القسط الشهري',type:'number'},{key:'status',label:'الحالة',type:'select',options:['نشط','مكتمل','متأخر','متوقف']}],columns:['reference','beneficiary_name','vehicle_plate','monthly_amount','status']},
 installments:{fields:[{key:'contract_reference',label:'مرجع العقد',required:true},{key:'due_date',label:'تاريخ الاستحقاق',type:'date'},{key:'amount',label:'المبلغ',type:'number'},{key:'paid_amount',label:'المبلغ المسدد',type:'number'},{key:'status',label:'الحالة',type:'select',options:['مسدد','مستحق','متأخر','مؤجل']}],columns:['contract_reference','due_date','amount','paid_amount','status']},
 maintenance:{fields:[{key:'vehicle_plate',label:'رقم اللوحة',required:true},{key:'category',label:'التصنيف'},{key:'due_date',label:'تاريخ الاستحقاق',type:'date'},{key:'status',label:'الحالة',type:'select',options:['سليم','مستحق','قيد التنفيذ','مكتمل']}],columns:['vehicle_plate','category','due_date','status']},
 followups:{fields:[{key:'subject',label:'موضوع المتابعة',required:true},{key:'due_date',label:'تاريخ المتابعة',type:'date'},{key:'status',label:'الحالة',type:'select',options:['مفتوح','قيد المتابعة','مكتمل','متأخر']}],columns:['subject','due_date','status']}
};
const labels:Record<string,string>={plate_number:'اللوحة',make_model:'المركبة',model_year:'الموديل',reference:'مرجع العقد',beneficiary_name:'المستفيد',vehicle_plate:'اللوحة',monthly_amount:'القسط',status:'الحالة',contract_reference:'مرجع العقد',due_date:'التاريخ',amount:'المبلغ',paid_amount:'المسدد',category:'التصنيف',subject:'الموضوع'};

function FieldInput({field,value,onChange}:{field:Field;value:any;onChange:(v:any)=>void}){
 if(field.type==='select') return <select value={value??''} onChange={e=>onChange(e.target.value)}><option value="">اختر</option>{field.options?.map(o=><option key={o} value={o}>{o}</option>)}</select>;
 return <input type={field.type||'text'} required={field.required} value={value??''} onChange={e=>onChange(field.type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value)}/>;
}

export default function Home(){
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false);
 const [section,setSection]=useState<Section>('dashboard');
 const [reports,setReports]=useState<Row[]>([]);
 const [rows,setRows]=useState<Row[]>([]);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [showForm,setShowForm]=useState(false);
 const [editing,setEditing]=useState<Row|null>(null);
 const [form,setForm]=useState<Row>({});
 const adminEmail=process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
 const allowed=!!session?.user.email&&!!adminEmail&&session.user.email.toLowerCase()===adminEmail;

 useEffect(()=>{if(!db){setReady(true);return;}db.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data}=db.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe();},[]);
 useEffect(()=>{if(allowed) void load(section);},[allowed,section]);

 async function load(s:Section){
  if(!db)return;setLoading(true);setMessage('');
  const rep=await db.from('beneficiary_report_details').select('*').order('beneficiary_number',{ascending:true});
  if(rep.error)setMessage(`تعذر تحميل المستفيدين: ${rep.error.message}`);else setReports(rep.data??[]);
  if(s!=='dashboard'&&s!=='beneficiaries'&&configs[s]){const r=await db.from(s).select('*').order('created_at',{ascending:false});if(r.error)setMessage(`تعذر تحميل القسم: ${r.error.message}`);setRows(r.data??[]);}else setRows([]);
  setLoading(false);
 }

 const totals=useMemo(()=>({count:reports.length,income:reports.reduce((a,r)=>a+(Number(r.quarterly_income)||0),0),returns:reports.reduce((a,r)=>a+(Number(r.total_return)||0),0),net:reports.reduce((a,r)=>a+(Number(r.net_after_return)||0),0)}),[reports]);
 const vehicleGroups=useMemo(()=>Object.entries(reports.reduce((acc:Record<string,number>,r)=>{const k=r.vehicle_type||'غير محدد';acc[k]=(acc[k]||0)+1;return acc;},{})),[reports]);

 async function signIn(e:FormEvent){e.preventDefault();if(!db)return;setMessage('');const {error}=await db.auth.signInWithPassword({email:(email||adminEmail||'').trim(),password});setPassword('');if(error)setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.');}
 function add(){setEditing(null);setForm(section==='beneficiaries'?{data_classification:'بيانات تقرير'}:{});setShowForm(true);}
 function edit(r:Row){setEditing(r);setForm({...r});setShowForm(true);}
 function cancel(){setShowForm(false);setEditing(null);setForm({});}
 async function save(e:FormEvent){
  e.preventDefault();if(!db)return;const table=section==='beneficiaries'?'beneficiary_report_details':section;const payload={...form};delete payload.id;delete payload.created_at;Object.keys(payload).forEach(k=>{if(payload[k]==='')payload[k]=null});
  const result=editing?.id?await db.from(table).update(payload).eq('id',editing.id):await db.from(table).insert(payload);
  if(result.error){setMessage(`تعذر الحفظ: ${result.error.message}`);return;}cancel();setMessage('تم حفظ البيانات بنجاح.');await load(section);
 }
 async function remove(r:Row){if(!db||!confirm('هل تريد حذف هذا السجل؟'))return;const table=section==='beneficiaries'?'beneficiary_report_details':section;const {error}=await db.from(table).delete().eq('id',r.id);if(error)setMessage(`تعذر الحذف: ${error.message}`);else{setMessage('تم حذف السجل.');await load(section);}}

 if(!ready)return <div className="center"><div className="loader"/></div>;
 if(!configured)return <div className="center"><div className="login-card"><div className="mark">و</div><h1>بوابة وصول</h1><p>إعدادات الاتصال بقاعدة البيانات غير مكتملة.</p></div></div>;
 if(!session||!allowed)return <div className="login-page"><div className="login-card"><div className="mark">و</div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>بوابة إدارة وصول</h1><p>دخول مدير المشروع</p>{session&&!allowed?<><div className="alert">هذا الحساب غير مخوّل.</div><button className="primary" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></>:<form onSubmit={signIn}><label>البريد الإلكتروني<input type="email" required value={email||adminEmail||''} onChange={e=>setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary">دخول المنصة</button></form>}{message&&<div className="alert">{message}</div>}</div></div>;

 const fields=section==='beneficiaries'?beneficiaryFields:(configs[section]?.fields??[]);
 return <div className="app-shell">
  <aside className="sidebar"><div className="brand"><div className="mark">و</div><div><b>وصول</b><small>منصة إدارة المشروع</small></div></div><nav>{(Object.keys(titles) as Section[]).map(s=><button key={s} className={section===s?'active':''} onClick={()=>{setSection(s);cancel();}}><span className="nav-dot"/>{titles[s]}</button>)}</nav><div className="side-note"><b>تمكين • التزام • انضباط</b><small>إدارة موحدة لمشروع وصول</small></div><button className="signout" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></aside>
  <main className="main"><header className="topbar"><div><span className="eyebrow">جمعية الأسر المنتجة بجازان</span><h1>{titles[section]}</h1></div><div className="admin-pill"><span className="status-dot"/>مدير النظام</div></header>{message&&<div className="toast">{message}</div>}
  {loading?<div className="panel center-panel"><div className="loader"/><p>جارٍ تحميل البيانات…</p></div>:section==='dashboard'?<Dashboard totals={totals} groups={vehicleGroups}/>:section==='beneficiaries'?<section className="panel"><div className="panel-head"><div><span className="eyebrow">قاعدة المستفيدين</span><h3>{reports.length} مستفيدًا</h3></div><button className="primary small" onClick={add}>+ إضافة مستفيد</button></div>{showForm&&<Editor fields={fields} form={form} setForm={setForm} editing={editing} onSave={save} onCancel={cancel}/>}<div className="cards">{reports.map(r=><article className="person-card" key={r.id}><div className="person-top"><div className="avatar">{String(r.beneficiary_name||'و').charAt(0)}</div><div><small>مستفيد رقم {r.beneficiary_number??'—'}</small><h4>{r.beneficiary_name}</h4><span className="chip">{r.vehicle_type||'مركبة غير محددة'}</span></div></div><div className="person-stats"><div><span>الدخل</span><b>{money(r.quarterly_income)}</b></div><div><span>العائد</span><b>{money(r.total_return)}</b></div><div><span>الصافي</span><b>{money(r.net_after_return)}</b></div></div><div className="actions"><button onClick={()=>edit(r)}>تعديل</button><button className="danger" onClick={()=>remove(r)}>حذف</button></div></article>)}</div></section>:<Generic section={section} rows={rows} config={configs[section]!} showForm={showForm} fields={fields} form={form} setForm={setForm} editing={editing} add={add} edit={edit} remove={remove} save={save} cancel={cancel}/>}</main>
 </div>;
}

function Dashboard({totals,groups}:{totals:{count:number;income:number;returns:number;net:number};groups:[string,number][]}){return <><section className="hero"><div><span className="hero-label">مشروع وصول</span><h2>إدارة المشروع بصورة أوضح وأسرع</h2><p>متابعة المستفيدين والمركبات والتحصيل من شاشة واحدة.</p></div><div className="hero-badge"><strong>{totals.count}</strong><span>مستفيدًا</span></div></section><section className="kpis"><div className="kpi"><span>المستفيدون</span><strong>{totals.count}</strong><small>سجل</small></div><div className="kpi"><span>إجمالي الدخل</span><strong>{totals.income.toLocaleString('ar-SA')}</strong><small>ريال</small></div><div className="kpi"><span>إجمالي العائد</span><strong>{totals.returns.toLocaleString('ar-SA')}</strong><small>ريال</small></div><div className="kpi"><span>إجمالي الصافي</span><strong>{totals.net.toLocaleString('ar-SA')}</strong><small>ريال</small></div></section><section className="panel" style={{marginTop:16}}><div className="panel-head"><div><span className="eyebrow">المركبات</span><h3>توزيع أنواع المركبات</h3></div></div><div className="vehicle-bars">{groups.map(([name,count])=><div className="bar-row" key={name}><div><b>{name}</b><span>{count} مستفيد</span></div><div className="bar"><i style={{width:`${Math.max(10,(count/Math.max(totals.count,1))*100)}%`}}/></div></div>)}</div></section></>}

function Editor({fields,form,setForm,editing,onSave,onCancel}:{fields:Field[];form:Row;setForm:(v:any)=>void;editing:Row|null;onSave:(e:FormEvent)=>void;onCancel:()=>void}){return <form className="editor" onSubmit={onSave}><div className="editor-head"><h4>{editing?'تعديل السجل':'إضافة سجل جديد'}</h4><button type="button" onClick={onCancel}>×</button></div><div className="form-grid">{fields.map(f=><label key={f.key}><span>{f.label}</span><FieldInput field={f} value={form[f.key]} onChange={v=>setForm((x:Row)=>({...x,[f.key]:v}))}/></label>)}</div><div className="form-actions"><button className="primary" type="submit">حفظ البيانات</button><button type="button" onClick={onCancel}>إلغاء</button></div></form>}

function Generic({section,rows,config,showForm,fields,form,setForm,editing,add,edit,remove,save,cancel}:{section:Section;rows:Row[];config:{fields:Field[];columns:string[]};showForm:boolean;fields:Field[];form:Row;setForm:(v:any)=>void;editing:Row|null;add:()=>void;edit:(r:Row)=>void;remove:(r:Row)=>void;save:(e:FormEvent)=>void;cancel:()=>void}){return <section className="panel"><div className="panel-head"><div><span className="eyebrow">إدارة السجلات</span><h3>{titles[section]}</h3></div><button className="primary small" onClick={add}>+ إضافة سجل</button></div>{showForm&&<Editor fields={fields} form={form} setForm={setForm} editing={editing} onSave={save} onCancel={cancel}/>}<div className="table-wrap"><table><thead><tr>{config.columns.map(c=><th key={c}>{labels[c]||c}</th>)}<th>الإجراءات</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}>{config.columns.map(c=><td key={c}>{['monthly_amount','amount','paid_amount'].includes(c)?money(r[c]):r[c]??'—'}</td>)}<td><div className="table-actions"><button onClick={()=>edit(r)}>تعديل</button><button className="danger" onClick={()=>remove(r)}>حذف</button></div></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty-state">لا توجد سجلات بعد. اضغط «إضافة سجل» للبدء.</div>}</div></section>}
