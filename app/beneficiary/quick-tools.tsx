'use client';
import {usePathname} from 'next/navigation';
export default function BeneficiaryQuickTools(){
 const path=usePathname();if(path==='/beneficiary/statement'||path==='/beneficiary/services')return null;
 return <div className="beneficiary-quick-tools" dir="rtl"><a href="/beneficiary/services">مركز الخدمات</a><a href="/beneficiary/statement">كشف الحساب PDF</a><style jsx global>{`.beneficiary-quick-tools{position:fixed;left:18px;bottom:18px;z-index:40;display:flex;gap:8px;flex-wrap:wrap}.beneficiary-quick-tools a{display:inline-flex;align-items:center;justify-content:center;background:#0d5f57;color:#fff;text-decoration:none;border-radius:999px;padding:11px 16px;font:800 12px Tahoma,Arial,sans-serif;box-shadow:0 10px 24px rgba(13,95,87,.24)}.beneficiary-quick-tools a:first-child{background:#173d38}@media(max-width:700px){.beneficiary-quick-tools{left:12px;right:12px;bottom:12px}.beneficiary-quick-tools a{flex:1;padding:10px 13px}}@media print{.beneficiary-quick-tools{display:none}}`}</style></div>;
}
