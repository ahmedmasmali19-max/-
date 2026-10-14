'use client';

import {useEffect,useState} from 'react';
import QRCode from 'qrcode';
import {db} from '../lib/db';

const beneficiaryUrl='https://ahmed-571c.vercel.app/beneficiary';

export default function BeneficiaryPortalShare(){
 const [allowed,setAllowed]=useState(false);
 const [open,setOpen]=useState(false);
 const [qr,setQr]=useState('');
 const [copied,setCopied]=useState(false);

 useEffect(()=>{void boot();},[]);
 async function boot(){
  if(!db)return;
  const {data:{session}}=await db.auth.getSession();if(!session)return;
  const {data:r}=await db.rpc('portal_role');
  if(['admin','project_manager','management'].includes(String(r||'').toLowerCase()))setAllowed(true);
 }
 async function show(){setOpen(true);if(!qr)setQr(await QRCode.toDataURL(beneficiaryUrl,{width:320,margin:2}));}
 async function copy(){try{await navigator.clipboard.writeText(beneficiaryUrl);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}catch{}}
 if(!allowed)return null;
 return <>
  <button id="beneficiary-portal-share-trigger" className="beneficiary-share-fab" onClick={()=>void show()} title="رابط بوابة المستفيد">↗ <span>بوابة المستفيد</span></button>
  {open&&<div className="beneficiary-share-backdrop" onMouseDown={()=>setOpen(false)}><div className="beneficiary-share-modal" onMouseDown={e=>e.stopPropagation()} dir="rtl"><button className="beneficiary-share-close" onClick={()=>setOpen(false)}>×</button><span className="eyebrow">مشروع وصول</span><h2>رابط بوابة المستفيد</h2><p>استخدم هذا الرابط لإرساله للمستفيدين عبر واتساب أو طباعته كرمز QR.</p><div className="beneficiary-share-url">{beneficiaryUrl}</div>{qr&&<img src={qr} alt="QR بوابة المستفيد" className="beneficiary-share-qr"/>}<div className="beneficiary-share-actions"><button className="primary" onClick={()=>window.open(beneficiaryUrl,'_blank','noopener,noreferrer')}>فتح البوابة</button><button className="ghost" onClick={()=>void copy()}>{copied?'تم نسخ الرابط ✓':'نسخ الرابط'}</button><button className="ghost" onClick={()=>window.print()}>طباعة QR</button></div><small>بوابة المستفيد تعرض لكل مستخدم بياناته المرتبطة بحسابه فقط.</small></div></div>}
 </>;
}
