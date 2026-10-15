import './style.css';
import './portal-extra.css';
import './beneficiary-share.css';
import PwaRegister from './pwa-register';
export const metadata={title:'وصول | بوابة الإدارة',description:'بوابة إدارة مشروع وصول - جمعية الأسر المنتجة بجازان',manifest:'/manifest.webmanifest',themeColor:'#0f7d6d',appleWebApp:{capable:true,title:'وصول',statusBarStyle:'default'},icons:{icon:'/wusool-icon.svg',apple:'/wusool-icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}<PwaRegister/></body></html>}
