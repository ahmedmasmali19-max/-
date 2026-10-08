'use client';
import {useEffect,useState} from 'react';
import {db,configured,tables} from '../lib/db';
import type {TableName} from '../lib/db';
import type {Session} from '@supabase/supabase-js';

type Beneficiary={id:string;full_name:string;phone:string|null;status:string|null};

export default function Home(){
 const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[