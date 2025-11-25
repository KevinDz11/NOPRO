import { useState } from "react";
import logo from "../assets/logo.PNG";
import { Link } from "react-router-dom";

export default function NuevaContrasena() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const esCorreoValido = (correo) => /\S+@\S+\.\S+/.test(correo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!esCorreoValido(email)) {
      setError("Por favor, introduce un correo válido.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(
        "http://localhost:8000/clientes/solicitar-reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al enviar la solicitud.");
      }
      setMensaje(data.mensaje + " Ya puedes cerrar esta ventana.");
    } catch (err) {
      console.error("Error solicitando reseteo:", err);
      setError(err.message || "Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Fondos Decorativos Animados */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div
        className="absolute top-40 -right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row border border-white/50 animate-fade-in-up">
        {/* IZQUIERDA (Formulario) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="NOPRO" className="h-9 w-auto drop-shadow-sm" />
            <span className="text-2xl font-bold text-slate-800 tracking-tight">
              NOPRO
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Recuperar Contraseña
          </h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Ingresa tu correo electrónico registrado y verificado, y te
            enviaremos un enlace seguro para restablecer tu acceso a dicho
            correo. Si tu correo no cumple estas características, no se enviará
            el correo de recuperación.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                disabled={cargando}
              />
            </div>

            {/* Mensajes de Estado */}
            {mensaje && (
              <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-medium text-center animate-fade-in flex items-center justify-center gap-2">
                ✅ {mensaje}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!esCorreoValido(email) || cargando}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                ${
                  esCorreoValido(email) && !cargando
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed shadow-none"
                }`}
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                "Enviar Enlace"
              )}
            </button>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-slate-500 text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-bold hover:text-blue-800 transition-colors hover:underline"
                >
                  Iniciar Sesión
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* DERECHA (Panel informativo) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 p-12 text-white flex-col justify-center items-center relative overflow-hidden order-1 md:order-2">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center max-w-sm">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Seguridad ante todo</h3>
            <p className="text-slate-300 text-lg leading-relaxed">
              No te preocupes si olvidaste tu contraseña. Nuestro proceso de
              recuperación es rápido y seguro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
