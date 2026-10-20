import { Tajawal } from 'next/font/google';
import './globals.css';
const font = Tajawal({ subsets: ['arabic'], weight: ['400', '700', '800'], variable: '--font' });
export const metadata = { title: 'شيّال', description: 'اعثر على أقرب عامل نظافة وأعمال بسيطة، وتعاقد معه شهرياً' };
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
