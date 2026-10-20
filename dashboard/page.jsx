'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const STATUS = {
  pending_worker_review: 'بانتظار عرض العامل', offer_sent: 'عرض سعر مرسل',
  client_countered: 'سعر مضاد من العميل', worker_countered: 'رد العامل النهائي',
  accepted: 'تم الاتفاق', closed: 'مغلق',
};
const TYPES = { apartment_building: 'عمارة سكنية', villa: 'فيلا', office: 'مكاتب', other: 'أخرى' };

function RequestCard({ r, role, rpc }) {
  const [price, setPrice] = useState('');
  const isClient = role === 'client';
  const canOffer = !isClient && r.status === 'pending_worker_review';
  const canCounter = (isClient && r.status === 'offer_sent') || (!isClient && r.status === 'client_countered');
  const canAccept = (isClient && ['offer_sent', 'worker_countered'].includes(r.status)) || (!isClient && r.status === 'client_countered');
  const open = !['accepted', 'closed'].includes(r.status);
  const fn = canOffer ? 'submit_offer' : isClient ? 'client_counter_offer' : 'worker_counter_offer';
  const current = r.worker_counter ?? r.client_counter ?? r.worker_offer;
  return (
    <div className="card">
      <span className="tag">{STATUS[r.status]}</span>
      <p>{r.buildings?.name || TYPES[r.buildings?.building_type] || 'مبنى'} · السعر الاسترشادي {r.suggested_price} ر.س{current ? ` · آخر سعر ${current} ر.س` : ''}{r.final_price ? ` · المتفق عليه ${r.final_price} ر.س` : ''}</p>
      {(canOffer || canCounter) && (
        <div className="row">
          <input type="number" min="1" placeholder="السعر بالريال" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button className="btn" onClick={() => rpc(fn, { p_request: r.id, p_price: Number(price) })}>{canOffer ? 'أرسل العرض' : 'اقترح سعراً'}</button>
        </div>
      )}
      <div className="row" style={{ marginTop: 8 }}>
        {canAccept && <button className="btn" onClick={() => rpc('accept_price', { p_request: r.id })}>اقبل السعر</button>}
        {open && <button className="btn alt" onClick={() => rpc('close_request', { p_request: r.id })}>أغلق الطلب</button>}
      </div>
    </div>
  );
}

function NewRequest({ userId, onDone, setMsg }) {
  const [b, setB] = useState({ building_type: 'apartment_building', name: '', floors: 1, stairs: 1, elevators: 0, courtyards: 0 });
  const [workers, setWorkers] = useState(null);
  const [pos, setPos] = useState(null);
  const set = (k) => (e) => setB({ ...b, [k]: e.target.value });

  const find = () => navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    setPos(coords);
    const { data, error } = await supabase.rpc('nearby_workers', { p_lat: coords.latitude, p_lng: coords.longitude, p_radius_km: 15, p_limit: 10 });
    if (error) return setMsg(error.message);
    setWorkers(data);
  }, () => setMsg('فعّل خدمة الموقع في المتصفح للبحث عن الأقرب.'));

  const request = async (workerId) => {
    const { data: bld, error } = await supabase.from('buildings').insert({
      owner_id: userId, building_type: b.building_type, name: b.name || null,
      floors: +b.floors, stairs: +b.stairs, elevators: +b.elevators, courtyards: +b.courtyards,
      lat: pos.latitude, lng: pos.longitude,
    }).select().single();
    if (error) return setMsg(error.message);
    const { error: e2 } = await supabase.from('contract_requests').insert({ building_id: bld.id, client_id: userId, worker_id: workerId });
    setMsg(e2 ? e2.message : '');
    if (!e2) { setWorkers(null); onDone(); }
  };

  return (
    <section className="card">
      <h2>طلب عقد نظافة جديد</h2>
      <label>نوع المبنى</label>
      <select value={b.building_type} onChange={set('building_type')}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <label>اسم المبنى (اختياري)</label><input value={b.name} onChange={set('name')} />
      <div className="row">
        {[['floors', 'الطوابق'], ['stairs', 'الدرج'], ['elevators', 'المصاعد'], ['courtyards', 'الأحواش']].map(([k, l]) => (
          <div key={k} style={{ flex: 1, minWidth: 90 }}><label>{l}</label><input type="number" min="0" value={b[k]} onChange={set(k)} /></div>
        ))}
      </div>
      <button className="btn" onClick={find}>ابحث عن أقرب العمال</button>
      {workers && (workers.length === 0 ? <p>لا يوجد عمال موثقون ضمن 15 كم حالياً.</p> :
        workers.map((w) => (
          <div className="row card" key={w.worker_id}>
            <strong style={{ flex: 1 }}>{w.full_name || 'عامل'} · {w.distance_km.toFixed(1)} كم</strong>
            <button className="btn" onClick={() => request(w.worker_id)}>اطلب عقداً</button>
          </div>
        )))}
    </section>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [reqs, setReqs] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace('/login');
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setMe(p);
    const { data } = await supabase.from('contract_requests').select('*, buildings(name,building_type)').order('created_at', { ascending: false });
    setReqs(data || []);
  };
  useEffect(() => { load(); }, []);
  const rpc = async (fn, args) => { const { error } = await supabase.rpc(fn, args); setMsg(error ? error.message : ''); load(); };
  const out = async () => { await supabase.auth.signOut(); router.replace('/'); };

  if (!me) return <p className="wrap">جارٍ التحميل…</p>;
  return (
    <>
      <header className="bar"><img src="/logo.png" alt="شيّال" /><button onClick={out}>خروج</button></header>
      <main className="wrap">
        <h1>أهلاً {me.full_name}</h1>
        {msg && <p className="err" role="alert">{msg}</p>}
        {me.role === 'client' && <NewRequest userId={me.id} onDone={load} setMsg={setMsg} />}
        {me.role === 'worker' && <p className="card">يبدأ ظهورك للعملاء بعد توثيق حسابك من الإدارة.</p>}
        <h2>{me.role === 'worker' ? 'الطلبات الواردة' : 'طلباتي'}</h2>
        {reqs.length === 0 ? <p>لا توجد طلبات بعد.</p> : reqs.map((r) => <RequestCard key={r.id} r={r} role={me.role} rpc={rpc} />)}
      </main>
    </>
  );
}
