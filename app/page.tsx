'use client';
import {useEffect,useState} from 'react';
import {db,configured,tables,TableName} from '../lib/db';
import type {Session} from '@supabase/supabase-js';

export default function Home(){
 const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[section,setSection]=useState<'dashboard'|TableName>('dashboard'),[counts,setCounts]=useState<Record<string,number>>({}),[message,setMessage]=useState(''),[setupMode,setSetupMode]=useState(false),[needsConfirmation,setNeedsConfirmation]=useState(false);
 const adminEmail=process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
 const allowed=!!session?.user.email&&!!adminEmail&&session.user.email.toLowerCase()===adminEmail;
 useEffect(()=>{
  const client=db;
  if(!client){setReady(true);return}
  client.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});
  const {data:s}=client.auth.onAuthStateChange((_e,x)=>setSession(x));
  return()=>s.subscription.unsubscribe();
 },[]);
 useEffect(()=>{
  const client=db;
  if(!client||!allowed||section!=='dashboard')return;
  Promise.all(Object.keys(tables).map(k=>client.from(k).select('*',{count:'exact',head:true}))).then(r=>setCounts(Object.fromEntries(Object.keys(tables).map((k,i)=>[k,r[i].count??0]))));
 },[allowed,section]);
 async function signIn(e:React.FormEvent){
  e.preventDefault();setMessage('');setNeedsConfirmation(false);const client=db;if(!client)return;
  const {error}=await client.auth.signInWithPassword({email,password});
  if(error){
   if(error.message.toLowerCase().includes('email not confirmed')){setNeedsConfirmation(true);setMessage('البريد الإلكتروني غير مؤكد. اضغط إعادة إرسال رسالة التأكيد ثم افتح الرابط في بريدك.');}
   else setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.');
  }
  setPassword('');
 }
 async function resendConfirmation(){
  const client=db;if(!client||!adminEmail)return;
  setMessage('');
  const {error}=await client.auth.resend({type:'signup',email:adminEmail});
  if(error)setMessage('تعذر إرسال رسالة التأكيد الآن. حاول مرة أخرى بعد قليل.');
  else setMessage('تم إرسال رسالة تأكيد جديدة إلى بريد المدير. افتح الرسالة واضغط رابط التأكيد ثم ارجع وسجّل الدخول.');
 }
 async function createAdmin(e:React.FormEvent){
  e.preventDefault();setMessage('');setNeedsConfirmation(false);const client=db;
  if(!client||!adminEmail)return;
  if(password.length<8){setMessage('اختر كلمة مرور من 8 أحرف على الأقل.');return;}
  const {data,error}=await client.auth.signUp({email:adminEmail,password});
  if(error){setMessage(error.message.includes('already registered')?'الحساب موجود بالفعل. جرّب تسجيل الدخول.':'تعذر إنشاء الحساب الآن.');setPassword('');return;}
  setPassword('');
  if(data.session){setMessage('تم إنشاء حساب المدير وتسجيل الدخول بنجاح.');}
  else{setNeedsConfirmation(true);setMessage('تم إنشاء حساب المدير. افتح بريدك الإلكتروني وأكّد الحساب، ثم ارجع وسجّل الدخول.');setSetupMode(false);setEmail(adminEmail);}
 }
 if(!ready)return <div className="center">جارٍ تجهيز البوابة…</div>;
 if(!configured)return <div className="center"><div className="card"><div className="logo">و</div><h1>بوابة وصول</h1><p>أضف متغيرات Supabase في Vercel لتفعيل النظام.</p></div></div>;
 if(!session||!allowed)return <div className="center"><div className="card"><div className="logo">و</div><span>جمعية الأسر المنتجة بجازان</span><h1>بوابة إدارة وصول</h1>{session&&!allowed?<><p className="err">هذا الحساب غير مخوّل.</p><button onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></>:setupMode?<><p>إنشاء حساب المدير لأول مرة</p><form onSubmit={createAdmin}><input type="email" value={adminEmail??''} disabled/><input type="password" required minLength={8} placeholder="اختر كلمة مرور قوية" value={password} onChange={e=>setPassword(e.target.value)}/><button>إنشاء حساب المدير</button></form><button type="button" onClick={()=>{setSetupMode(false);setMessage('')}}>لدي حساب بالفعل</button></>:<><form onSubmit={signIn}><input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)}/><button>دخول المدير</button></form>{needsConfirmation&&<button type="button" onClick={resendConfirmation}>إعادة إرسال رسالة التأكيد</button>}<button type="button" onClick={()=>{setSetupMode(true);setMessage('')}}>إنشاء حساب المدير لأول مرة</button></>}{message&&<p className="err">{message}</p>}</div></div>;
 return <div className="shell"><aside><div className="brand"><div className="logo">و</div><div><b>وصول</b><small>بوابة إدارة المشروع</small></div></div><nav><button className={section==='dashboard'?'active':''} onClick={()=>setSection('dashboard')}>لوحة التحكم</button>{Object.entries(tables).map(([k,v])=><button key={k} className={section===k?'active':''} onClick={()=>setSection(k as TableName)}>{v.title}</button>)}</nav><button className="logout" onClick={()=>db?.auth.signOut()}>تسجيل الخروج</button></aside><main><header><div><small>لوحة الإدارة / مشروع وصول</small><h1>{section==='dashboard'?'نظرة عامة':tables[section].title}</h1></div></header>{section==='dashboard'?<><section className="hero"><div><span>إدارة أكثر وضوحًا</span><h2>مرحبًا بك في بوابة وصول</h2><p>نظام مستقل لإدارة المشروع ومتابعة بياناته.</p></div></section><section className="stats">{Object.entries(tables).map(([k,v])=><button key={k} onClick={()=>setSection(k as TableName)}><span>{v.title}</span><strong>{counts[k]??0}</strong><small>إجمالي السجلات</small></button>)}</section></>:<section className="panel"><h2>{tables[section].title}</h2><p>تم تجهيز هذا القسم للربط بقاعدة البيانات. سنضيف شاشة السجلات والإضافة والتعديل في المرحلة التالية.</p></section>}</main></div>
}
