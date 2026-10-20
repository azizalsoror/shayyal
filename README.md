# شيّال — واجهة الويب (المرحلة الأولى)

1. `npm install` ثم `npm run dev` للتجربة المحلية (ملف `.env.local` جاهز).
2. للنشر: ارفع المجلد إلى GitHub، ثم في Vercel اختر Add New → Project واستورد المستودع.
3. أضف في Vercel المتغيرين `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY` من ملف `.env.local`.
4. في Supabase: Authentication → URL Configuration أضف رابط موقعك على Vercel إلى Site URL وRedirect URLs.
