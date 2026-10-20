export default function Home() {
  const features = [
    { title: "عقود نظافة شهرية", text: "أربع زيارات في الشهر مع أقرب عامل لموقعك." },
    { title: "عرض سعر واضح", text: "اختر نوع المبنى والطوابق وأرسل طلبك ليصلك عرض السعر." },
    { title: "متابعة الزيارات", text: "ابدأ وانهِ كل زيارة بإشعار وتأكيد من الطرفين." },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16">
      <h1 className="text-6xl font-bold mb-4">شيّال</h1>
      <p className="text-lg text-gray-300 mb-10 text-center max-w-xl">
        اعثر على عامل نظافة وأعمال بسيطة بالقرب منك، وتعاقد معه شهرياً بكل سهولة.
      </p>

      <div className="flex gap-4 mb-16">
        <button className="bg-white text-black font-semibold px-6 py-3 rounded-lg">
          أحتاج عامل
        </button>
        <button className="border border-white px-6 py-3 rounded-lg">
          أنا عامل
        </button>
      </div>

      <section className="grid gap-6 md:grid-cols-3 max-w-4xl w-full">
        {features.map((f) => (
          <div key={f.title} className="border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-2">{f.title}</h2>
            <p className="text-gray-400">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
