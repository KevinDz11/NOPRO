import { useState } from "react";
import logo from "../assets/logo.PNG";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const esCorreoValido = (correo) => /\S+@\S+\.\S+/.test(correo);
  const esFormularioValido = () => esCorreoValido(email) && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!esFormularioValido()) {
      setMensaje("Introduce un correo válido y tu contraseña.");
      return;
    }

    setCargando(true);
    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (
          errorData.detail ===
          "La cuenta no ha sido verificada. Por favor, revisa tu correo."
        ) {
          setMensaje(
            "Tu cuenta no está verificada. Revisa tu correo o contacta a soporte."
          );
        } else {
          setMensaje(errorData.detail || "Error al iniciar sesión.");
        }
        throw new Error(errorData.detail);
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("auth", "true");
      navigate("/Home");
    } catch (err) {
      console.error(err);
      if (!mensaje) setMensaje("Credenciales incorrectas o error de conexión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 -z-20"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row animate-fade-in-up border border-white/50">
        {/* SECCIÓN IZQUIERDA (Formulario) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <img
              src={logo}
              alt="NOPRO"
              className="h-10 w-auto drop-shadow-md"
            />
            <span className="text-2xl font-bold text-slate-800 tracking-tight">
              NOPRO
            </span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            ¡Bienvenido de nuevo!
          </h2>
          <p className="text-slate-500 mb-8">
            Ingresa tus credenciales para acceder al panel.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                disabled={cargando}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                disabled={cargando}
              />
            </div>

            <div className="flex justify-end">
              <Link
                to="/nuevaContrasena"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={!esFormularioValido() || cargando}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 hover:shadow-blue-500/30 
                ${
                  esFormularioValido() && !cargando
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
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
                  Accediendo...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>

            {mensaje && (
              <div
                className={`p-3 rounded-lg text-sm text-center font-medium animate-fade-in ${
                  mensaje.includes("verificada")
                    ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {mensaje}
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              ¿Aún no tienes cuenta?{" "}
              <Link
                to="/registro"
                className="text-blue-600 font-bold hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* SECCIÓN DERECHA (Decorativa) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900 p-12 text-white items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 text-center max-w-sm">
            <div className="mb-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl inline-block shadow-inner border border-white/10">
              <img
                src={logo}
                alt="Logo"
                className="h-24 w-auto mx-auto drop-shadow-xl filter brightness-0 invert"
              />
            </div>
            <h3 className="text-3xl font-extrabold mb-4 tracking-tight">
              Bienvenido a NOPRO
            </h3>
            <p className="text-blue-100 text-lg leading-relaxed">
              Tu plataforma inteligente para el análisis de cumplimiento
              normativo y seguridad eléctrica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
