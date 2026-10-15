'use client';
import {usePathname} from 'next/navigation';
export default function BeneficiaryQuickTools(){
 const path=usePathname();
 if(['/beneficiary/statement','/beneficiary/services','/beneficiary/files','/beneficiary/operations','/beneficiary/receipts'].includes(path))return null;
 return <div className="beneficiary-quick-tools" dir="rtl"><a href="/beneficiary/services">مركز الخدمات</a><a href="/beneficiary/files">ملفاتي</a><a href="/beneficiary/operations">الحوادث والصيانة</a><a href="/beneficiary/receipts">إيصالات السداد</a><a href="/beneficiary/statement">كشف الحساب PDF</a><style jsx global>{`.beneficiary-quick-tools{position:fixed;left:18px;bottom:18px;z-index:40;display:flex;gap:7px;flex-wrap:wrap;max-width:min(760px,calc(100vw - 36px))}.beneficiary-quick-tools a{display:inline-flex;align-items:center;justify-content:center;background:#0d5f57;color:#fff;text-decoration:none;border-radius:999px;padding:10px 14px;font:800 12px Tahoma,Arial,sans-serif;box-shadow:0 10px 24px rgba(13,95,87,.22)}.beneficiary-quick-tools a:first-child{background:#173d38}@media(max-width:700px){.beneficiary-quick-tools{left:10px;right:10px;bottom:10px;display:grid;grid-template-columns:1fr 1fr;max-width:none}.beneficiary-quick-tools a{padding:10px 8px}.beneficiary-quick-tools a:first-child{grid-column:1/-1}}@media print{.beneficiary-quick-tools{display:none}}`}</style></div>;
}
