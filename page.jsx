import Link from 'next/link';
export default function Home() {
  return (
    <main className="hero">
      <img src="/logo.png" alt="شيّال" />
      <p>أقرب عامل نظافة وترتيب وشيل أغراض، وعقد شهري بأربع زيارات.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <Link className="btn" href="/login?mode=signup">أنشئ حسابك</Link>
        <Link className="btn alt" href="/login">تسجيل الدخول</Link>
      </div>
    </main>
  );
}
