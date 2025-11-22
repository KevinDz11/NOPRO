import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.PNG";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verificaContrasena, setVerificaContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarVerifica, setMostrarVerifica] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const longitudValida = contrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const coinciden =
    contrasena === verificaContrasena && verificaContrasena.length > 0;
  const esCorreoValido = /\S+@\S+\.\S+/.test(correo);
  const formularioValido =
    nombre.trim() &&
    esCorreoValido &&
    longitudValida &&
    tieneMayuscula &&
    tieneNumero &&
    coinciden;

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");
    if (!formularioValido) {
      setError("Por favor, completa todos los campos correctamente.");
      return;
    }
    setCargando(true);
    try {
      const response = await fetch("http://localhost:8000/clientes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email: correo, contrasena }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar la cuenta.");
      }
      navigate("/registro/verificacion", { state: { correo } });
    } catch (err) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Fondo Decorativo Animado */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row border border-white/50 animate-fade-in-up">
        {/* SECCIÓN IZQUIERDA (Formulario) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 order-2 md:order-1">
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="NOPRO" className="h-8 w-auto" />
            <span className="text-xl font-bold text-slate-800">NOPRO</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">
            Crea tu cuenta
          </h3>
          <p className="text-slate-500 mb-6 text-sm">
            Únete para gestionar tus análisis de normas.
          </p>

          <form onSubmit={handleRegistro} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre (apellidos opcionales)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              disabled={cargando}
            />

            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              disabled={cargando}
            />

            <div className="relative">
              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={cargando}
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute right-3 top-3.5 text-xs font-bold text-slate-400 hover:text-blue-600 uppercase"
              >
                {mostrarContrasena ? "Ocultar" : "Ver"}
              </button>
            </div>

            <div className="relative">
              <input
                type={mostrarVerifica ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={verificaContrasena}
                onChange={(e) => setVerificaContrasena(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={cargando}
              />
              <button
                type="button"
                onClick={() => setMostrarVerifica(!mostrarVerifica)}
                className="absolute right-3 top-3.5 text-xs font-bold text-slate-400 hover:text-blue-600 uppercase"
              >
                {mostrarVerifica ? "Ocultar" : "Ver"}
              </button>
            </div>

            {/* Indicadores de requisitos */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span
                className={
                  longitudValida
                    ? "text-green-600 font-semibold"
                    : "text-slate-400"
                }
              >
                • 8+ Caracteres
              </span>
              <span
                className={
                  tieneMayuscula
                    ? "text-green-600 font-semibold"
                    : "text-slate-400"
                }
              >
                • 1 Mayúscula
              </span>
              <span
                className={
                  tieneNumero
                    ? "text-green-600 font-semibold"
                    : "text-slate-400"
                }
              >
                • 1 Número
              </span>
              <span
                className={
                  coinciden ? "text-green-600 font-semibold" : "text-slate-400"
                }
              >
                • Coinciden
              </span>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!formularioValido || cargando}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1
              ${
                formularioValido && !cargando
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30"
                  : "bg-slate-300 cursor-not-allowed shadow-none"
              }`}
            >
              {cargando ? "Creando cuenta..." : "Registrarme"}
            </button>

            <p className="text-center text-sm text-slate-500 mt-4">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-bold hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>

        {/* SECCIÓN DERECHA (Decorativa) - Oculta en móvil para ahorrar espacio vertical */}
        <div className="hidden md:flex w-1/2 bg-slate-900 p-12 text-white flex-col justify-center items-center relative overflow-hidden order-1 md:order-2">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-90"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold mb-4">Únete a la comunidad</h2>
            <p className="text-slate-300">
              Accede a herramientas avanzadas de análisis normativo en segundos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
