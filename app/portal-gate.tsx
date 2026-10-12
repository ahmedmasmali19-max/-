'use client';

import {useEffect,useState} from 'react';
import Portal from './portal';
import {db} from '../lib/db';

export default function PortalGate(){
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    if(!db){
      setReady(true);
      return;
    }

    let mounted=true;
    const client:any=db;
    const adminEmail=(process.env.NEXT_PUBLIC_ADMIN_EMAIL||'').trim().toLowerCase();
    const originalRpc=client.__wusoolOriginalRpc || db.rpc.bind(db);
    client.__wusoolOriginalRpc=originalRpc;

    const applyRoleBridge=(session:any)=>{
      const sessionEmail=(session?.user?.email||'').trim().toLowerCase();
      const primaryAdmin=Boolean(session && adminEmail && sessionEmail===adminEmail);

      client.rpc=(fn:string,args?:any,options?:any)=>{
        if(fn==='portal_role' && primaryAdmin){
          return Promise.resolve({
            data:'admin',
            error:null,
            count:null,
            status:200,
            statusText:'OK'
          });
        }
        return originalRpc(fn,args,options);
      };
    };

    db.auth.getSession().then(({data})=>{
      if(!mounted)return;
      applyRoleBridge(data.session);
      setReady(true);
    }).catch(()=>{
      if(mounted)setReady(true);
    });

    const {data:listener}=db.auth.onAuthStateChange((_event,session)=>{
      applyRoleBridge(session);
    });

    return()=>{
      mounted=false;
      listener.subscription.unsubscribe();
      client.rpc=originalRpc;
    };
  },[]);

  if(!ready){
    return <div className="center"><div className="login-card"><div className="mark">و</div><h1>بوابة إدارة وصول</h1><p>جارٍ تجهيز جلسة الدخول…</p><div className="loader"/></div></div>;
  }

  return <Portal/>;
}
