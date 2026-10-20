'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const CS = { pending_schedule: 'بانتظار الجدولة', active: 'نشط', suspended: 'معلق', completed: 'مكتمل', renewal_pending: 'بانتظار رد العامل على التجديد', renewed: 'تم التجديد', renewal_declined: 'رُفض التجديد', renewal_expired: 'انتهت مهلة التجديد' };
const VS = { scheduled: 'مجدولة', started: 'جارية', pending_client: 'بانتظار قبول العميل', accepted: 'مقبولة', auto_accepted: 'مقبولة آلياً', rejected: 'مرفوضة' };
const fmt = (d) => new Date(d).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' });

export default function Contracts({ me }) {
  const worker = me.role === 'worker';
  const [cs, setCs] = useState([]);
  const [inv, setInv] = useState([]);
  const [av, setAv] = useState([]);
  const [a, setA] = useState({ weekday: 6, start_time: '09:00', end_time: '12:00' });
  const [t, setT] = useState({ category: 'other', subject: '', message: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const c = await supabase.from('contracts').select('*, visits(*), buildings(name,building_type)').order('created_at', { ascending: false });
    setCs(c.data || []);
    const i = await supabase.from('invoices').select('*').order('issued_at', { ascending: false });
    setInv(i.data || []);
    if (worker) { const v = await supabase.from('worker_availability').select('*').order('weekday'); setAv(v.data || []); }
  };
  useEffect(() => { load(); }, []);
  const act = async (fn, args) => { const { error } = await supabase.rpc(fn, args); setMsg(error ? error.message : ''); load(); };
  const addAv = async () => {
    const { error } = await supabase.from('worker_availability').insert({ worker_id: me.id, ...a, weekday: +a.weekday });
    setMsg(error ? error.message : ''); load();
  };
  const sendTicket = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('support_tickets').insert({ user_id: me.id, ...t });
    setMsg(error ? error.message : 'وصل طلبك للإدارة وسنتواصل معك.');
    if (!error) setT({ category: 'other', subject: '', message: '' });
  };

  return (
    <>
      {msg && <p className="err" role="alert">{msg}</p>}
      {worker && (
        <section className="card">
          <h2>أوقاتي المتاحة أسبوعياً</h2>
          {av.map((x) => (
            <div className="row" key={x.id}>
              <span style={{ flex: 1 }}>{DAYS[x.weekday]} من {x.start_time.slice(0, 5)} إلى {x.end_time.slice(0, 5)}</span>
              <button className="btn alt" onClick={async () => { await supabase.from('worker_availability').delete().eq('id', x.id); load(); }}>احذف</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10 }}>
            <select style={{ width: 'auto' }} value={a.weekday} onChange={(e) => setA({ ...a, weekday: e.target.value })}>{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select>
            <input type="time" value={a.start_time} onChange={(e) => setA({ ...a, start_time: e.target.value })} />
            <input type="time" value={a.end_time} onChange={(e) => setA({ ...a, end_time: e.target.value })} />
            <button className="btn" onClick={addAv}>أضف</button>
          </div>
        </section>
      )}

      <h2>العقود</h2>
      {cs.length === 0 && <p>لا توجد عقود بعد. تظهر هنا بعد الاتفاق على السعر.</p>}
      {cs.map((c) => (
        <div className="card" key={c.id}>
          <span className="tag">{CS[c.status]}</span>
          <p>{c.buildings?.name || 'مبنى'} · {c.price} ر.س شهرياً</p>
          {worker && c.status === 'pending_schedule' && <button className="btn" onClick={() => act('generate_visit_schedule', { p_contract: c.id })}>ابنِ جدول الزيارات من أوقاتي</button>}
          {!worker && c.status === 'completed' && <button className="btn" onClick={() => act('request_renewal', { p_contract: c.id })}>جدد العقد</button>}
          {worker && c.status === 'renewal_pending' && (
            <div className="row">
              <button className="btn" onClick={() => act('respond_renewal', { p_contract: c.id, p_accept: true })}>اقبل التجديد</button>
              <button className="btn alt" onClick={() => act('respond_renewal', { p_contract: c.id, p_accept: false })}>ارفض</button>
            </div>
          )}
          {[...(c.visits || [])].sort((x, y) => x.visit_no - y.visit_no).map((v) => (
            <div className="row" key={v.id} style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
              <span style={{ flex: 1 }}>الزيارة {v.visit_no}: {fmt(v.scheduled_at)} — {VS[v.status]}</span>
              {worker && v.status === 'scheduled' && <button className="btn" onClick={() => act('start_visit', { p_visit: v.id })}>بدء</button>}
              {worker && v.status === 'started' && <button className="btn" onClick={() => act('end_visit', { p_visit: v.id })}>انتهاء</button>}
              {!worker && v.status === 'pending_client' && <>
                <button className="btn" onClick={() => act('respond_visit', { p_visit: v.id, p_accept: true })}>اقبل الإنهاء</button>
                <button className="btn alt" onClick={() => act('respond_visit', { p_visit: v.id, p_accept: false })}>ارفض</button>
              </>}
              {!worker && v.status === 'rejected' && <button className="btn" onClick={() => act('respond_visit', { p_visit: v.id, p_accept: true })}>اقبل بعد الاتفاق</button>}
            </div>
          ))}
        </div>
      ))}

      <h2>الفواتير</h2>
      {inv.length === 0 && <p>لا توجد فواتير بعد.</p>}
      {inv.map((i) => (
        <div className="card row" key={i.id}>
          <span style={{ flex: 1 }}>فاتورة {i.invoice_no}: {i.amount} ر.س — {i.status === 'paid' ? 'مدفوعة' : 'بانتظار الدفع'}</span>
          {worker && i.status === 'issued' && <>
            <button className="btn" onClick={() => act('mark_invoice_paid', { p_invoice: i.id, p_method: 'cash' })}>استلمت كاش</button>
            <button className="btn alt" onClick={() => act('mark_invoice_paid', { p_invoice: i.id, p_method: 'online' })}>استلمت أونلاين</button>
          </>}
        </div>
      ))}

      <section className="card">
        <h2>الدعم والشكاوى</h2>
        <form onSubmit={sendTicket}>
          <select value={t.category} onChange={(e) => setT({ ...t, category: e.target.value })}>
            <option value="technical">مشكلة تقنية</option><option value="complaint">شكوى</option><option value="dispute">خلاف على زيارة</option><option value="other">أخرى</option>
          </select>
          <input required placeholder="العنوان" value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} />
          <input required placeholder="اكتب رسالتك" value={t.message} onChange={(e) => setT({ ...t, message: e.target.value })} />
          <button className="btn" type="submit">أرسل للإدارة</button>
        </form>
      </section>
    </>
  );
}
