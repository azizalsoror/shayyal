'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [f, setF] = useState({ email: '', password: '', full_name: '', role: 'client' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { data: { full_name: f.full_name, role: f.role }, emailRedirectTo: location.origin + '/dashboard' },
      });
      if (error) return setMsg(error.message);
      if (!data.session) return setMsg('أرسلنا رابط التأكيد إلى بريدك. افتحه ثم سجّل الدخول.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) return setMsg('البريد أو كلمة المرور غير صحيحة.');
    }
    router.replace('/dashboard');
  };

  return (
    <>
      <header className="bar"><a href="/"><img src="/logo.png" alt="شيّال" /></a></header>
      <main className="wrap">
        <h1>{signup ? 'إنشاء حساب' : 'تسجيل الدخول'}</h1>
        <form onSubmit={submit}>
          {signup && (<>
            <label>الاسم</label><input required value={f.full_name} onChange={set('full_name')} />
            <label>أنا</label>
            <select value={f.role} onChange={set('role')}>
              <option value="client">عميل أبحث عن عامل</option>
              <option value="worker">عامل أقدم الخدمة</option>
            </select>
          </>)}
          <label>البريد الإلكتروني</label><input type="email" required value={f.email} onChange={set('email')} />
          <label>كلمة المرور</label><input type="password" required minLength={8} value={f.password} onChange={set('password')} />
          {msg && <p className="err" role="alert">{msg}</p>}
          <button className="btn" type="submit">{signup ? 'أنشئ الحساب' : 'ادخل'}</button>{' '}
          <button className="btn alt" type="button" onClick={() => setSignup(!signup)}>
            {signup ? 'لدي حساب' : 'حساب جديد'}
          </button>
        </form>
      </main>
    </>
  );
}
