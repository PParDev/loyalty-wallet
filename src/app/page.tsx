import Link from "next/link";

const features = [
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />`,
    title: "Sin apps — directo en su Wallet",
    description: "Tus clientes agregan su tarjeta a Google Wallet o Apple Wallet. Sin descargas, sin registros largos.",
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />`,
    title: "Escaneo QR ultrarrápido",
    description: "El cajero escanea el QR del cliente con la cámara o busca por teléfono. Sumar puntos en 3 segundos.",
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />`,
    title: "Dashboard en tiempo real",
    description: "Mira cuántos clientes tienes, quién visitó hoy, y qué recompensas se canjearon. Todo actualizado al instante.",
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />`,
    title: "Notificaciones push gratis",
    description: "Envía mensajes directo a la tarjeta wallet de tus clientes. Sin SMS, sin email, sin costo adicional.",
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />`,
    title: "Geofencing automático",
    description: "Tus clientes reciben una notificación cuando pasan cerca de tu negocio. Recordatorio sutil y poderoso.",
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-7.54 0" />`,
    title: "Niveles y recompensas",
    description: "Crea niveles Bronce, Plata y Oro con multiplicadores de puntos. Tus mejores clientes ganan más rápido.",
  },
];

const steps = [
  { num: "01", title: "Regístrate", desc: "Crea tu cuenta y configura tu programa de lealtad en menos de 5 minutos." },
  { num: "02", title: "Imprime tu QR", desc: "Descarga e imprime el QR para tu mostrador. Los clientes lo escanean para unirse." },
  { num: "03", title: "Escanea en cada visita", desc: "El cajero escanea el QR del cliente para sumar puntos automáticamente." },
  { num: "04", title: "Clientes felices", desc: "Tus clientes acumulan puntos y canjean recompensas. Todos ganan." },
];

const plans = [
  {
    name: "Prueba gratis",
    price: "0",
    period: "14 días",
    highlight: false,
    features: ["Hasta 50 tarjetas", "1 usuario cajero", "Puntos por visita", "QR de registro", "Notificaciones push"],
  },
  {
    name: "Básico",
    price: "299",
    period: "/mes",
    highlight: true,
    features: ["Hasta 500 tarjetas", "2 usuarios cajeros", "Puntos + niveles", "QR + flyer imprimible", "Notificaciones push", "Dashboard de insights", "Geofencing"],
  },
  {
    name: "Pro",
    price: "499",
    period: "/mes",
    highlight: false,
    features: ["Tarjetas ilimitadas", "Cajeros ilimitados", "Todo del plan Básico", "Soporte prioritario", "Logo personalizado en wallet", "Exportar datos Excel", "API para POS"],
  },
];

const faqs = [
  {
    q: "¿Mis clientes necesitan descargar alguna app?",
    a: "No. Su tarjeta de lealtad se agrega directamente a Google Wallet o Apple Wallet, que ya viene instalado en todos los celulares modernos. Sin descargas adicionales.",
  },
  {
    q: "¿Necesito una terminal especial o hardware?",
    a: "No. Solo necesitas un celular o tablet con cámara para escanear el QR de tus clientes. Todo funciona desde el navegador web.",
  },
  {
    q: "¿Qué pasa si mi cliente no tiene Google Wallet?",
    a: "Todos los celulares Android lo traen. Para iPhone, se usa Apple Wallet. Además, cada cliente tiene una página web con su tarjeta digital que funciona sin wallet.",
  },
  {
    q: "¿Cuánto tiempo toma configurar el programa?",
    a: "Menos de 5 minutos. Te guiamos paso a paso: defines cómo ganan puntos, creas tu primera recompensa, y tu QR está listo para imprimir.",
  },
  {
    q: "¿Puedo cambiar las recompensas después?",
    a: "Sí, puedes agregar, modificar o desactivar recompensas en cualquier momento desde tu dashboard. Los cambios se reflejan inmediatamente.",
  },
  {
    q: "¿Funciona para mi tipo de negocio?",
    a: "LoyaltyWallet funciona para cafeterías, barberías, restaurantes, farmacias, lavanderías, gymnasios, salones de belleza, y cualquier negocio con clientes recurrentes.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            LoyaltyWallet
          </Link>
          <div className="hidden sm:flex items-center gap-8 text-sm text-gray-400">
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
              Prueba gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-40 right-[20%] w-[300px] h-[300px] bg-violet-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm text-indigo-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Hecho para negocios locales de México
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Tarjetas de lealtad{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              digitales
            </span>
            <br />
            que tus clientes sí van a usar
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Olvídate de las tarjetas de cartón que nadie carga. Con LoyaltyWallet, la tarjeta de lealtad de tu negocio vive en el celular de tus clientes —{" "}
            <span className="text-gray-200 font-medium">sin que descarguen ninguna app.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:shadow-indigo-600/40 hover:-translate-y-0.5"
            >
              Empieza gratis — 14 días
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 font-medium text-base px-8 py-4 rounded-xl transition-colors"
            >
              Ver cómo funciona
            </a>
          </div>

          {/* Mini card mockup */}
          <div className="relative mx-auto w-72 sm:w-80">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 blur-2xl rounded-3xl" />
            <div className="relative bg-gradient-to-br from-[#1a1a3e] to-[#0d0d2b] rounded-3xl p-6 border border-indigo-500/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-white text-sm">Cafetería Lupita ☕</p>
                  <p className="text-xs text-indigo-300 mt-0.5">Club de Lealtad</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">28</p>
                  <p className="text-[10px] text-gray-400">puntos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-gray-900">★ Oro × 2</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-indigo-400 h-2 rounded-full" style={{ width: "70%" }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">2 puntos más para: Café gratis ☕</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Cómo funciona</h2>
            <p className="text-gray-400 max-w-lg mx-auto">De registro a recompensa en 4 pasos simples.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="relative group">
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-full hover:border-indigo-500/40 transition-colors">
                  <span className="text-5xl font-black text-indigo-600/20 group-hover:text-indigo-600/40 transition-colors">{s.num}</span>
                  <h3 className="text-lg font-bold mt-2 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Todo lo que necesitas</h2>
            <p className="text-gray-400 max-w-lg mx-auto">Un sistema completo de lealtad digital, sin complicaciones.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-gray-900/30 border border-gray-800/60 rounded-2xl p-6 hover:border-indigo-500/30 transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} dangerouslySetInnerHTML={{ __html: f.icon }} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Precios simples, sin sorpresas</h2>
            <p className="text-gray-400 max-w-lg mx-auto">Empieza gratis y escala cuando quieras.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-gradient-to-b from-indigo-600/20 to-indigo-600/5 border-2 border-indigo-500/50 shadow-lg shadow-indigo-600/10"
                    : "bg-gray-900/30 border border-gray-800"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Más popular
                  </span>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-sm text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-white/5 hover:bg-white/10 text-gray-200 border border-gray-700"
                  }`}
                >
                  {plan.price === "0" ? "Comenzar gratis" : "Elegir plan"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Preguntas frecuentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-800/30 transition-colors list-none">
                  <span className="font-medium text-sm sm:text-base text-gray-200 pr-4">{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-500 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Empieza a fidelizar clientes{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">hoy</span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            14 días gratis, sin tarjeta de crédito. Configura tu programa en 5 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:shadow-indigo-600/40"
            >
              Crear mi cuenta gratis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="https://wa.me/523111234567?text=Hola%2C%20me%20interesa%20LoyaltyWallet%20para%20mi%20negocio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-green-500/50 text-gray-300 hover:text-green-400 font-medium text-base px-8 py-4 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">LoyaltyWallet</span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-500">Hecho en Tepic, Nayarit 🇲🇽</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-300 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-gray-300 transition-colors">Registro</Link>
            <Link href="/card" className="hover:text-gray-300 transition-colors">Mi tarjeta</Link>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} LoyaltyWallet</p>
        </div>
      </footer>
    </div>
  );
}
