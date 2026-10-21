'use client';

import {useEffect} from 'react';

const managerName='أحمد علي أحمد مسملي';
const managerTitle='مدير المشروع';

const dailyAdhkar=[
  'الحياء لا يأتي إلا بخير',
  'لا حول ولا قوة إلا بالله',
  'سبحان الله وبحمده، سبحان الله العظيم',
  'أستغفر الله العظيم وأتوب إليه',
  'حسبنا الله ونعم الوكيل',
  'اللهم أعني على ذكرك وشكرك وحسن عبادتك',
  'اللهم صل وسلم على نبينا محمد',
  'سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر',
  'لا إله إلا أنت سبحانك إني كنت من الظالمين',
  'رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد ﷺ نبيًا'
];

function dayIndex(){
  const now=new Date();
  const start=new Date(now.getFullYear(),0,1);
  return Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()-start.getTime())/86400000);
}

function greeting(){
  const h=new Date().getHours();
  return h<12?'صباح الخير':'مساء الخير';
}

export default function DashboardPersonalizer(){
  useEffect(()=>{
    const styleId='wusool-personal-home-style';
    if(!document.getElementById(styleId)){
      const style=document.createElement('style');
      style.id=styleId;
      style.textContent=`
        .hero.wusool-personal-home{
          background:var(--wusool-hero-bg,#f4f7f6)!important;
          color:#173737!important;
          border:1px solid #e1e9e7!important;
          box-shadow:none!important;
          border-radius:22px!important;
          padding:24px 28px!important;
          display:grid!important;
          grid-template-columns:minmax(0,1.4fr) minmax(0,.8fr)!important;
          gap:20px!important;
          align-items:center!important;
          overflow:hidden!important;
        }
        .hero.wusool-personal-home:before,.hero.wusool-personal-home:after{display:none!important}
        .hero.wusool-personal-home>div:first-child{min-width:0}
        .hero.wusool-personal-home .hero-label{color:#176f62!important;font-size:14px!important;font-weight:800!important;display:block!important;margin-bottom:8px!important}
        .hero.wusool-personal-home h2{color:#0d3031!important;font-size:clamp(22px,2.65vw,35px)!important;line-height:1.38!important;margin:0!important;letter-spacing:-1px!important;font-weight:800!important}
        .hero.wusool-personal-home p{color:#6f817f!important;font-size:16px!important;margin:12px 0 0!important;font-weight:600!important}
        .hero.wusool-personal-home .hero-actions{margin-top:22px!important}
        .hero.wusool-personal-home .hero-actions button{background:#fff!important;color:#195e57!important;border:1px solid #dbe6e3!important;box-shadow:none!important}
        .hero.wusool-personal-home .hero-badge{
          width:auto!important;min-width:0!important;aspect-ratio:auto!important;height:auto!important;
          background:transparent!important;border:0!important;border-radius:0!important;
          border-inline-start:1px solid #d9e2e0!important;padding:8px 0 8px 28px!important;
          display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;
          text-align:right!important;color:#304847!important;
        }
        .hero.wusool-personal-home .hero-badge strong{font-size:clamp(18px,2vw,28px)!important;line-height:1.55!important;color:#304847!important;font-weight:500!important}
        .hero.wusool-personal-home .hero-badge span{font-size:15px!important;color:#98a5a2!important;margin-top:10px!important}
        @media(max-width:850px){
          .hero.wusool-personal-home{grid-template-columns:1fr!important;padding:24px 20px!important}
          .hero.wusool-personal-home .hero-badge{border-inline-start:0!important;border-top:1px solid #d9e2e0!important;padding:20px 0 0!important}
          .hero.wusool-personal-home h2{font-size:clamp(21px,5.5vw,30px)!important}
        }
      `;
      document.head.appendChild(style);
    }

    const apply=()=>{
      const hero=document.querySelector<HTMLElement>('.main .hero');
      if(!hero)return;
      hero.classList.add('wusool-personal-home');
      const label=hero.querySelector<HTMLElement>('.hero-label');
      const title=hero.querySelector<HTMLElement>('h2');
      const subtitle=hero.querySelector<HTMLElement>('p');
      const badge=hero.querySelector<HTMLElement>('.hero-badge');
      if(label&&label.textContent!=='عملك اليوم')label.textContent='عملك اليوم';
      if(title){const label=`${greeting()}، ${managerTitle} — ${managerName}`;if(title.textContent!==label)title.textContent=label;}
      if(subtitle&&subtitle.textContent!=='مرحبًا بك في لوحة إدارة مشروع وصول')subtitle.textContent='مرحبًا بك في لوحة إدارة مشروع وصول';
      if(badge){
        const dhikr=dailyAdhkar[dayIndex()%dailyAdhkar.length];
        const html=`<strong>${dhikr}</strong><span>ذكر اليوم</span>`;if(badge.innerHTML!==html)badge.innerHTML=html;
      }
    };

    apply();
    const observer=new MutationObserver(()=>apply());
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  return null;
}
