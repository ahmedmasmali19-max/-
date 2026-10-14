import './style.css';
import './portal-extra.css';
import './beneficiary-share.css';
export const metadata={title:'وصول | بوابة الإدارة',description:'بوابة إدارة مشروع وصول - جمعية الأسر المنتجة بجازان',manifest:'/manifest.webmanifest',themeColor:'#0f7d6d'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
