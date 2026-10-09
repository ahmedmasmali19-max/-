'use client';
import {useEffect,useMemo,useState} from 'react';
import {db,configured,tables} from '../lib/db';
import type {Session} from '@supabase/supabase-js';

type Row=Record<string,any>;
type Section='dashboard'|'beneficiaries'|'vehicles'|'contracts'|'installments'|'maintenance'|'followups';
type Field={key:string;label:string;type?:'text'|'number'|'date'|'select';options?:string[];required?:boolean};

const money