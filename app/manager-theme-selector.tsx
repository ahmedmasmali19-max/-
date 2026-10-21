'use client';
import {useEffect,useState} from 'react';
import {db} from '../lib/db';
const themes=[
 {name:'أخضر وصول',value:'green',w:'#0d5f57',wm:'#3f9b82',wd:'#173d38',mint:'#eef8f5',hero:'#f4f7f6'},
 {name:'أزرق ملكي',value:'blue',w:'#23618f',wm:'#4c91c0',wd:'#163f63',mint:'#ecf5fb',hero:'#f1f7fc'},
 {name:'تركواز',value:'teal',w:'#087f82',wm:'#3aa5a5',wd:'#10545a',mint:'#e7f8f7',hero:'#effafa'},
 {name:'ذهبي هادئ',value:'gold',w:'#80601d',wm:'#b18a37',wd:'#493c23',mint:'#fbf6e9',hero:'#fcf9f0'},
 {name:'بنفسجي',value:'purple',w:'#65529a',wm:'#957dbf',wd:'#40335f',mint:'#f5f1fa',hero:'#f8f6fc'}
];
const key='wusool-manager-theme-v1';
function apply(value:string){const t=themes.find(x=>x.value===value)||themes[0];const root=document.documentElement;root.style.setProperty('--w',t.w);root.style.setProperty('--wm',t.wm);root.style.setProperty('--wd',t.wd);root.style.setProperty('--mint',t.mint);root.style.setProperty('--wusool-hero-bg',t.hero);root.setAttribute('data-wusool-theme',t.value)}
export default function ManagerThemeSelector(){
 const [enabled,E]=useState(false),[theme,T]=useState('green'),[open,O]=useState(false);
 useEffect(()=>{const saved=localStorage.getItem(key)||'green';T(saved);apply(saved);let active=true;void(async()=>{if(!db)return;const {data:{session}}=await db.auth.getSession();if(!session||!active)return;const {data}=await db.rpc('portal_role');if(active)E(['admin','project_manager','management'].includes(String(data||'').toLowerCase()))})();return()=>{active=false}},[]);
 function change(value:string){T(value);apply(value);localStorage.setItem(key,value)}
 if(!enabled)return null;
 return <div className="wusool-manager-theme-picker" dir="rtl" aria-label="تغيير ألوان لوحة المدير"><button type="button" className="wusool-theme-toggle" onClick={()=>O(!open)} aria-expanded={open}>⚙ إعدادات المظهر</button>{open&&<div className="wusool-theme-options"><span>لون اللوحة</span>{themes.map(t=><button key={t.value} type="button" title={t.name} aria-label={t.name} aria-pressed={theme===t.value} onClick={()=>change(t.value)} style={{background:t.w}} />)}</div>}<style jsx>{`.wusool-manager-theme-picker{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px;background:white;border:1px solid #e0ebe8;border-radius:15px;margin:12px 28px 0;width:max-content;max-width:calc(100% - 30px)}.wusool-theme-options{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.wusool-manager-theme-picker .wusool-theme-toggle{height:auto;width:auto;border-radius:10px;padding:8px 13px;background:#f3f7f6;color:#173d38;font-weight:800;white-space:nowrap;box-shadow:none;border:1px solid #e0ebe8}.wusool-manager-theme-picker span{font-size:12px;font-weight:800;color:#4e615e}.wusool-manager-theme-picker button{height:25px;width:25px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px #ccd8d5;cursor:pointer}.wusool-manager-theme-picker button[aria-pressed=true]{box-shadow:0 0 0 3px #173d38}@media(max-width:700px){.wusool-manager-theme-picker{margin:10px 12px 0;padding:8px 10px}.wusool-manager-theme-picker button{width:30px;height:30px}}@media print{.wusool-manager-theme-picker{display:none}}`}</style></div>;
}