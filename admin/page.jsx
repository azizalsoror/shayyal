'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Admin() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [ws, setWs] = useState([]);
  const [tk, setTk] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace('/login');
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (p?.role !== 'admin') return router.replace('/dashboard');
    setOk(true);
    const w = await supabase.from('worker_profiles').select('*, profiles(full_name)').order('created_at', { ascending: false });
    setWs(w.data || []);
    const t = await supabase.from('support_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
    setTk(t.data || []);
  };
  useEffect(() => { load(); }, []);
  const run = async (q) => { const { error } = await q; setMsg(error ? error.message : ''); load(); };
  const verify = (w) => run(supabase.from('worker_profiles').update({ is_verified: !w.is_verified }).eq('id', w.id));
  const subscribe = (w, days) => run(supabase.from('subscriptions').insert({ worker_id: w.id, status: 'active', ends_at: new Date(Date.now() + days * 864e5).toISOString() }));
  const closeTicket = (t) => run(supabase.from('support_tickets').update({ status: 'closed' }).eq('id', t.id));

  if (!ok) return <p className="wrap">جارٍ التحميل…</p>;
  return (
    <>
      <header className="bar"><img src="/logo.png" alt="شيّال" /><a href="/dashboard">لوحتي</a></header>
      <main className="wrap">
        <h1>لوحة الإدارة</h1>
        {msg && <p className="err" role="alert">{msg}</p>}
        <h2>العمال</h2>
        {ws.length === 0 && <p>لا يوجد عمال مسجلون.</p>}
        {ws.map((w) => (
          <div className="card" key={w.id}>
            <strong>{w.profiles?.full_name || 'بدون اسم'}</strong>{' '}
            <span className="tag">{w.is_verified ? 'موثق' : 'غير موثق'}</span>{' '}
            <span className="tag">{w.accepting_new ? 'يستقبل الطلبات' : 'مقفل'}</span>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => verify(w)}>{w.is_verified ? 'إلغاء التوثيق' : 'وثّق'}</button>
              <button className="btn alt" onClick={() => subscribe(w, 30)}>اشتراك شهري</button>
              <button className="btn alt" onClick={() => subscribe(w, 365)}>اشتراك سنوي</button>
            </div>
          </div>
        ))}
        <h2>الدعم والشكاوى</h2>
        {tk.length === 0 && <p>لا توجد طلبات.</p>}
        {tk.map((t) => (
          <div className="card" key={t.id}>
            <span className="tag">{t.status === 'closed' ? 'مغلق' : 'مفتوح'}</span> <strong>{t.subject}</strong>
            <p>{t.profiles?.full_name}: {t.message}</p>
            {t.status !== 'closed' && <button className="btn alt" onClick={() => closeTicket(t)}>أغلق</button>}
          </div>
        ))}
      </main>
    </>
  );
}
