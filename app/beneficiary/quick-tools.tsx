'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {db} from '../../lib/db';
export default function BeneficiaryQuickTools(){
 const path=usePathname();
 useEffect(()=>{if(!db)return;void db.auth.getSession().then(({data})=>{if(data.session)void db!.rpc('refresh_my_beneficiary_reminders')});},[path]);
 if(['/beneficiary/statement','/beneficiary/files','/beneficiary/operations','/beneficiary/receipts','/beneficiary/signatures','/beneficiary/communications','/beneficiary/search'].includes(path))return null;
 return <div className="beneficiary-quick-tools" dir="rtl"><a href="/beneficiary/services">مركز الخدمات</a><a href="/beneficiary/conversations">محادثاتي</a><a href="/beneficiary/deferrals">تأجيل قسط</a><a href="/beneficiary/search">بحث</a><a href="/beneficiary/communications">المراسلات</a><a href="/beneficiary/signatures">التوقيع</a><a href="/beneficiary/files">ملفاتي</a><a href="/beneficiary/operations">الحوادث والصيانة</a><a href="/beneficiary/receipts">إيصالات السداد</a><a href="/beneficiary/statement">كشف الحساب</a><style jsx global>{`.beneficiary-quick-tools{position:fixed;left:18px;bottom:18px;z-index:40;display:flex;gap:7px;flex-wrap:wrap;max-width:min(900px,calc(100vw - 36px))}.beneficiary-quick-tools a{display:inline-flex;align-items:center;justify-content:center;background:#0d5f57;color:#fff;text-decoration:none;border-radius:999px;padding:10px 14px;font:800 12px Tahoma,Arial,sans-serif;box-shadow:0 10px 24px rgba(13,95,87,.22)}.beneficiary-quick-tools a:first-child{background:#173d38}@media(max-width:700px){.beneficiary-quick-tools{left:10px;right:10px;bottom:10px;display:grid;grid-template-columns:repeat(2,1fr);max-width:none;max-height:32vh;overflow:auto;background:rgba(244,248,247,.96);padding:8px;border-radius:16px}.beneficiary-quick-tools a{padding:9px 7px}.beneficiary-quick-tools a:first-child{grid-column:1/-1}}@media print{.beneficiary-quick-tools{display:none}}`}</style></div>;
}
