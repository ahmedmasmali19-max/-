'use client';

import {useEffect} from 'react';
import {db} from '../lib/db';

export default function SmartNotificationsRefresh(){
 useEffect(()=>{
  if(!db)return;
  let mounted=true;
  let timer:number|undefined;
  async function refresh(){
   if(!db||!mounted)return;
   const {data:{session}}=await db.auth.getSession();
   if(!session)return;
   const {data:role}=await db.rpc('portal_role');
   if(!['admin','project_manager'].includes(String(role||'').toLowerCase()))return;
   await db.rpc('refresh_installment_statuses');
   await db.rpc('refresh_notifications');
  }
  void refresh();
  timer=window.setInterval(()=>void refresh(),120000);
  return()=>{mounted=false;if(timer)window.clearInterval(timer);};
 },[]);
 return null;
}
