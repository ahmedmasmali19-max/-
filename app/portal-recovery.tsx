'use client';

import {FormEvent,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {configured,db} from '../lib/db';

type Row=Record<string,any>;
type Section='dashboard'|'beneficiaries'|'vehicles'|'contracts'|'installments'|'maintenance'|'followups';

const titles:Record<Section,string>={
  dashboard:'الرئيسية',beneficiaries:'المستفيدون',vehicles:'المركبات',contracts:'العقود',installments:'الأقساط والتحصيل',maintenance:'التأمين والصيانة',followups:'المتابعات'
};

export default function PortalRecovery(){
  const [session,setSession]=useState<Session|null>(null);
  const [email,setEmail]=useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL||'');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
