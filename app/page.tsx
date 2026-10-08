'use client';
import {useEffect,useMemo,useState} from 'react';
import {db,configured,tables} from '../lib/db';
import type {TableName} from '../lib/db';
import type {Session} from '@supabase/supabase-js';

type AnyRow=Record<string,any>;
type Field={key:string;label:string;type?:'text'|'number'|'date'|'select';options?:string[];required?:boolean};

type ReportRow={
 id:string; beneficiary_name:string;