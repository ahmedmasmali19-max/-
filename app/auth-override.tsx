'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

export default function AuthOverride(){
  useEffect(()=>{
    if(!db)return;

    const adminEmail=(process.env.NEXT_PUBLIC_ADMIN_EMAIL||'').toLowerCase().trim();
    const originalRpc=db.rpc.bind(db);

    (db as any).rpc=async (fn:string,args?:any,options?:any)=>{
      if(fn==='portal_role'){
        const {data:{session}}=await db.auth.getSession();
        const email=session?.user?.email?.toLowerCase().trim();
        if(session && adminEmail && email===adminEmail){
          return {data:'admin',error:null};
        }
      }
      return originalRpc(fn,args,options);
    };

    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});
    }
    if('caches' in window){
      caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{});
    }

    return()=>{(db as any).rpc=originalRpc;};
  },[]);

  return null;
}
