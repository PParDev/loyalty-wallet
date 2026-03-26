import Link from "next/link";

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const features = [
  { icon: <IconPhone />, title: "Sin descargas", desc: "La tarjeta vive en el wallet nativo del cliente" },
  { icon: <IconMapPin />, title: "Geofencing", desc: "Notificaciones automáticas cuando el cliente se acerca" },
  { icon: <IconChart />, title: "Dashboard", desc: "Controla puntos, canjes y estadísticas en tiempo real" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">LoyaltyWallet</h1>
        <Link
          href="/login"
          className="text-sm text-indigo-200 hover:text-white font-medium"
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-2xl">
          Tarjetas de lealtad digital para tu negocio
        </h2>
        <p className="mt-4 text-lg text-indigo-200 max-w-xl">
          Sin apps. Sin plástico. Tus clientes guardan su tarjeta directo en Google Wallet o Apple Wallet.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="bg-white text-indigo-900 px-8 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors"
          >
            Empieza gratis
          </Link>
          <Link
            href="/login"
            className="border border-indigo-400 text-white px-8 py-3 rounded-full font-medium hover:bg-indigo-800 transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
          {features.map((f) => (
            <div key={f.title} className="bg-indigo-800/50 rounded-2xl p-5">
              <div className="text-indigo-300 mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-indigo-300 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-8 py-6 text-center text-xs text-indigo-400">
        © 2026 LoyaltyWallet · Tepic, Nayarit
      </footer>
    </div>
  );
}
