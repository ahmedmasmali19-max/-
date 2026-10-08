# بوابة إدارة مشروع وصول

موقع إداري مستقل لمشروع وصول، مبني بـ Next.js وSupabase ومخصص لحساب مدير واحد.

## النشر على Vercel
1. افتح Vercel واختر Add New > Project.
2. اربط GitHub واختر المستودع `ahmedmasmali19-max/-`.
3. اترك إعداد Framework على Next.js.
4. أضف متغيرات البيئة:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_ADMIN_EMAIL
5. اضغط Deploy.

## إعداد Supabase
1. أنشئ مشروع Supabase جديدًا.
2. من Authentication > Users أنشئ مستخدم المدير بالبريد المطلوب.
3. عطّل التسجيل العام للمستخدمين.
4. افتح `supabase/schema.sql` واستبدل `REPLACE_WITH_ADMIN_EMAIL@example.com` ببريد المدير ثم نفّذه في SQL Editor.
5. انسخ Project URL وPublishable/Anon Key إلى Vercel.

> لا تضع كلمات المرور أو service_role key في GitHub.
