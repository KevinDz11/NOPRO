import React, { useState } from "react";
import Joyride from "react-joyride";
import logo from "../assets/logo.PNG";
import { Link } from "react-router-dom";
import { useAuthListener } from "../useAuthListener";

// Componente de Tarjeta Reutilizable y Moderna
function TarjetaProducto({ titulo, icono, descripcion, ruta, colorBase }) {
  return (
    <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full overflow-hidden">
      {/* Gradiente de fondo al hacer hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorBase} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
      ></div>

      <div className="relative z-10 flex-grow flex flex-col items-center text-center">
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl text-5xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-100">
          {icono}
        </div>
        <h2 className="font-bold text-2xl text-slate-800 mb-3 tracking-tight">
          {titulo}
        </h2>
        <p className="text-slate-500 leading-relaxed text-sm mb-6">
          {descripcion}
        </p>
      </div>

      <div className="relative z-10 mt-auto">
        <Link to={ruta}>
          <button className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-semibold shadow-lg group-hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2">
            <span>Analizar</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              ></path>
            </svg>
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  useAuthListener();
  const [tourOpen, setTourOpen] = useState(false);

  const steps = [
    {
      target: ".navbar",
      content: "Navega entre tu perfil, historial y soporte desde aquí.",
    },
    {
      target: ".grid-productos",
      content:
        "Selecciona la categoría de tu producto para iniciar el análisis.",
    },
    {
      target: ".help-button",
      content: "Vuelve a ver este tutorial cuando quieras.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Joyride
        steps={steps}
        run={tourOpen}
        continuous={true}
        showSkipButton={true}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: "#2563EB",
            backgroundColor: "#ffffff",
            textColor: "#334155",
          },
        }}
        callback={(data) => {
          if (data.status === "finished" || data.status === "skipped")
            setTourOpen(false);
        }}
      />

      {/* NAVBAR MODERNO */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm navbar px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
          <div
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => setTourOpen(true)}
          >
            <img
              src={logo}
              alt="NOPRO"
              className="h-9 w-auto transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-extrabold text-slate-800 tracking-tighter">
              NOPRO
            </span>
          </div>

          <ul className="hidden md:flex items-center space-x-1 font-medium text-sm text-slate-600">
            {/* Botón Ayuda */}
            <li
              onClick={() => setTourOpen(true)}
              className="help-button cursor-pointer px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              AYUDA
            </li>
            <Link
              to="/perfil"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              PERFIL
            </Link>
            <Link
              to="/historial"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              HISTORIAL
            </Link>
            <Link
              to="/soporte"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              SOPORTE
            </Link>

            {/* Botón Cerrar Sesión Estilizado */}
            <Link
              to="/"
              className="ml-4 px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-red-500/30"
            >
              CERRAR SESIÓN
            </Link>
          </ul>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
        {/* Header Hero */}
        <header className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block mb-4 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-wide uppercase">
            Herramienta de Análisis IA
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Identificación de Normas <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Simple y Rápida
            </span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Analiza fichas técnicas y manuales de usuario automáticamente.
            Detecta el cumplimiento de normas NOM/NMX para Laptops, Smart TVs y
            Luminarias.
          </p>
        </header>

        {/* Grid de Tarjetas */}
        <section className="grid-productos grid gap-8 grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto">
          <div className="tarjeta-laptop h-full">
            <TarjetaProducto
              titulo="Laptop"
              icono="💻"
              descripcion="Análisis de seguridad eléctrica, eficiencia energética y etiquetado para computadoras portátiles."
              ruta="/subir/Laptop"
              colorBase="from-blue-500 to-cyan-500"
            />
          </div>
          <div className="tarjeta-smarttv h-full">
            <TarjetaProducto
              titulo="Smart TV"
              icono="📺"
              descripcion="Verificación de conectividad, consumo de energía y estándares de seguridad en pantallas."
              ruta="/subir/SmartTV"
              colorBase="from-purple-500 to-pink-500"
            />
          </div>
          <div className="tarjeta-luminaria h-full">
            <TarjetaProducto
              titulo="Luminaria Exterior"
              icono="💡"
              descripcion="Revisión de normas IP, resistencia térmica y seguridad en iluminación LED para exteriores."
              ruta="/subir/Luminaria"
              colorBase="from-yellow-500 to-orange-500"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
