export default function ResetSessionPage(){
  const script=`
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i) || '';
        if (key.startsWith('sb-') || key.toLowerCase().includes('supabase')) localStorage.removeItem(key);
      }
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i) || '';
        if (key.startsWith('sb-') || key.toLowerCase().includes('supabase')) sessionStorage.removeItem(key);
      }
    } catch (e) {}
    setTimeout(function(){ window.location.replace('/'); }, 250);
  `;
  return <html lang="ar" dir="rtl"><body style={{margin:0,fontFamily:'Arial, sans-serif',background:'#f5f8f7',color:'#123f43'}}><main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><div style={{textAlign:'center',background:'#fff',padding:32,borderRadius:20,border:'1px solid #dfe9e7',maxWidth:420,width:'100%'}}><div style={{fontSize:42,fontWeight:800,marginBottom:12}}>و</div><h1 style={{margin:'0 0 10px'}}>إعادة ضبط جلسة وصول</h1><p style={{margin:0,color:'#6f817f'}}>يتم الآن تسجيل خروجك من الجلسة العالقة وإعادتك لشاشة الدخول…</p></div></main><script dangerouslySetInnerHTML={{__html:script}} /></body></html>;
}
