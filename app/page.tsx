'use client';
import {FormEvent,useEffect,useMemo,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import QRCode from 'qrcode';
import {db,configured} from '../lib/db';

type Row=Record<string,any>;
type Section='dashboard'|'beneficiaries'|'vehicles'|'contracts'|'installments'|'maintenance'|'accidents'|'documents'|'approvals'|'handovers'|'ownership'|'followups'|'audit';
type Field={key:string;