import React, { useState } from "react";
import Joyride from "react-joyride";
import logo from "../assets/logo.PNG";
import { Link } from "react-router-dom";

// Eliminamos la verificación global que estaba aquí arriba

// Componente de Tarjeta (Estilo Landing Page)
function TarjetaLanding({ titulo, icono, descripcion, ruta, isAuthenticated }) {
  // Recibimos isAuthenticated como prop
  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 flex flex-col h-full transition-transform hover:-translate-y-1">
      <div className="flex-grow flex flex-col items-center text-center">
        <div className="text-5xl mb-6 filter drop-shadow-sm">{icono}</div>
        <h2 className="font-bold text-2xl text-slate-800 mb-3">{titulo}</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          {descripcion}
        </p>
      </div>

      <div className="mt-auto">
        {isAuthenticated ? (
          <Link to={ruta}>
            <button className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
              Realizar análisis
            </button>
          </Link>
        ) : (
          /* BOTÓN BLOQUEADO (Este es el que quieres ver al salir) */
          <button
            disabled
            className="w-full py-3.5 rounded-xl font-bold text-slate-400 bg-slate-200 border border-slate-300 cursor-not-allowed flex items-center justify-center gap-2 select-none"
          >
            <span>Realizar análisis</span>
            <svg
              className="w-4 h-4 opacity-70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CopiaHome() {
  const [tourOpen, setTourOpen] = useState(false);

  // --- CORRECCIÓN: Mover la verificación DENTRO del componente ---
  // Esto asegura que se vuelva a calcular cada vez que entras a la página
  const isAuthenticated = localStorage.getItem("auth") === "true";

  const steps = [
    {
      target: ".navbar",
      content: "Navegación principal. Inicia sesión o regístrate desde aquí.",
    },
    {
      target: ".tarjeta-landing",
      content:
        "Las herramientas de análisis están bloqueadas hasta que inicies sesión.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Fondo sutil */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white to-slate-100 -z-10"></div>

      <Joyride
        steps={steps}
        run={tourOpen}
        continuous={true}
        showSkipButton={true}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: "#2563EB",
          },
        }}
        callback={(data) => {
          if (data.status === "finished" || data.status === "skipped") {
            setTourOpen(false);
          }
        }}
      />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4 navbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Izquierda: Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="NOPRO" className="h-8 w-auto" />
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">
              NOPRO
            </span>
          </div>

          {/* Centro: Ayuda */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setTourOpen(true)}
              className="text-blue-600 font-bold text-sm hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors uppercase tracking-wide"
            >
              AYUDA
            </button>
          </div>

          {/* Derecha: Botones Auth */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/Home"
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Ir al Panel Principal
              </Link>
            ) : (
              /* ESTO es lo que verás ahora al cerrar sesión (Imagen 2) */
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Acceder
                </Link>
                <Link
                  to="/registro"
                  className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 shadow-md shadow-red-500/30 transition-all transform hover:-translate-y-0.5"
                >
                  Registro
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="text-center mb-16 max-w-4xl mx-auto animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6">
            Aplicación web para identificar normas aplicables a productos
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-3xl mx-auto">
            Esta herramienta permite identificar las normas mexicanas aplicables
            a productos: Smart TV, laptops y luminarias para exterior.
            <br />
            <span className="font-medium text-slate-600">
              No se necesita instalación.
            </span>
          </p>
        </header>

        {/* Grid de Tarjetas */}
        <section
          className="grid gap-8 grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="tarjeta-landing h-full">
            <TarjetaLanding
              titulo="Laptop"
              icono="💻"
              descripcion="Realizar el análisis de normas para una Laptop."
              ruta="/subir/Laptop"
              isAuthenticated={isAuthenticated} // Pasamos el estado actualizado
            />
          </div>

          <div className="tarjeta-landing h-full">
            <TarjetaLanding
              titulo="Smart TV"
              icono="📺"
              descripcion="Realizar el análisis de normas para una Smart TV."
              ruta="/subir/SmartTV"
              isAuthenticated={isAuthenticated}
            />
          </div>

          <div className="tarjeta-landing h-full">
            <TarjetaLanding
              titulo="Luminaria para Exterior"
              icono="💡"
              descripcion="Realizar el análisis de normas para una Luminaria para exterior."
              ruta="/subir/Luminaria"
              isAuthenticated={isAuthenticated}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
