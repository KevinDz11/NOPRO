import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function VerificarCuenta() {
  const location = useLocation();
  const navigate = useNavigate();
  const correo = location.state?.correo || "";

  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Nuevos estados
  const [exito, setExito] = useState(false); // Para controlar la vista de éxito
  const [mensajeExito, setMensajeExito] = useState(""); // Para mensajes de reenvío
  const [cargandoReenvio, setCargandoReenvio] = useState(false);

  // --- FUNCIÓN PARA VERIFICAR ---
  const handleVerificar = async () => {
    setError("");
    setMensajeExito("");
    if (!codigo || codigo.length < 6) {
      setError("Por favor, introduce el código de verificación de 6 dígitos.");
      return;
    }
    if (!correo) {
      setError(
        "No se encontró el correo electrónico asociado. Por favor, regresa al registro."
      );
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/clientes/verificar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: correo,
          code: codigo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al verificar la cuenta.");
      }

      // ÉXITO: Cambiamos a vista visual en lugar de alert/console.log
      setExito(true);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      // Mantenemos el console.error solo para depuración interna de errores reales
      console.error("Error en la verificación:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  // Función para reenviar el correo
  const handleReenviar = async () => {
    setError("");
    setMensajeExito("");

    if (!correo) {
      setError("No se encontró el correo electrónico para reenviar.");
      return;
    }

    setCargandoReenvio(true);
    try {
      const response = await fetch(`${API_URL}/clientes/reenvio-verificacion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: correo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al reenviar el correo.");
      }

      setMensajeExito(
        data.mensaje || "Correo reenviado. Revisa tu bandeja de entrada."
      );
    } catch (err) {
      console.error("Error en el reenvío:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargandoReenvio(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Fondos Decorativos Animados (Mismo diseño) */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div
        className="absolute top-40 -right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row border border-white/50 animate-fade-in-up">
        {/* IZQUIERDA (Contenido cambiante) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 order-2 md:order-1 flex flex-col justify-center min-h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="NOPRO" className="h-9 w-auto drop-shadow-sm" />
            <span className="text-2xl font-bold text-slate-800 tracking-tight">
              NOPRO
            </span>
          </div>

          {exito ? (
            // --- VISTA DE ÉXITO ---
            <div className="flex flex-col items-center animate-fade-in text-center py-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce-slow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-12 h-12 text-green-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                ¡Verificación exitosa!
              </h3>
              <p className="text-slate-500 mb-6">
                Tu cuenta ha sido activada. Redirigiendo...
              </p>
              <div className="flex gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></span>
              </div>
            </div>
          ) : (
            // --- VISTA DEL FORMULARIO (Original) ---
            <div className="animate-fade-in">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                Verificar cuenta.
              </h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Hemos enviado un código de verificación a tu correo electrónico.
              </p>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                <p className="text-xs text-blue-500 font-bold mb-1">
                  Enviado a:
                </p>
                <p className="text-slate-700 font-medium break-all">
                  {correo || "No especificado"}
                </p>
              </div>

              <div className="space-y-5">
                {/* Input Código */}
                <div className="group">
                  <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                    Código de 6 dígitos.
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 123456"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium text-center tracking-widest text-lg focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                    disabled={cargando || cargandoReenvio}
                  />
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleVerificar}
                    disabled={cargando || cargandoReenvio || !codigo}
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                        ${
                          !cargando && !cargandoReenvio && codigo
                            ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 cursor-pointer"
                            : "bg-slate-300 cursor-not-allowed shadow-none"
                        }`}
                  >
                    {cargando ? "Verificando..." : "Verificar código"}
                  </button>

                  <button
                    onClick={handleReenviar}
                    disabled={cargando || cargandoReenvio || !correo}
                    className="w-full py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {cargandoReenvio
                      ? "Reenviando..."
                      : "¿No recibiste el código? Reenviar"}
                  </button>
                </div>

                {/* Mensajes de Estado */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center animate-fade-in">
                    {error}
                  </div>
                )}

                {mensajeExito && (
                  <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-bold text-center animate-fade-in">
                    ✅ {mensajeExito}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DERECHA (Panel informativo - Mantenido igual) */}
        <div className="hidden md:flex w-1/2 bg-linear-to-br from-slate-800 to-slate-900 p-12 text-white flex-col justify-center items-center relative overflow-hidden order-1 md:order-2">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500 opacity-20 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>

          <div className="relative z-10 text-center max-w-sm">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl">
              <span className="text-4xl">📩</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Revisa tu bandeja.</h3>
            <p className="text-slate-300 text-lg leading-relaxed">
              Busca un correo de NOPRO con el asunto "Verifica tu cuenta en
              NOPRO". Si no lo ves, revisa la carpeta de spam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
