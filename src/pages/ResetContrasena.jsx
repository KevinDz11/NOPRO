import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/logo.PNG";

export default function ResetContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verificaContrasena, setVerificaContrasena] = useState("");

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarVerifica, setMostrarVerifica] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // Obtener el token de la URL al cargar
  useEffect(() => {
    const tokenDeURL = searchParams.get("token");
    if (tokenDeURL) {
      setToken(tokenDeURL);
    } else {
      setError("Token no encontrado. Asegúrate de usar el enlace correcto.");
    }
  }, [searchParams]);

  // Validaciones
  const longitudValida = contrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const coinciden =
    contrasena === verificaContrasena && verificaContrasena.length > 0;

  const formularioValido =
    token && longitudValida && tieneMayuscula && tieneNumero && coinciden;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!formularioValido) {
      setError("Por favor, completa la contraseña cumpliendo los requisitos.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(
        "http://localhost:8000/clientes/ejecutar-reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            nueva_contrasena: contrasena,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al cambiar la contraseña.");
      }

      setMensaje("¡Contraseña cambiada con éxito! Redirigiendo al login...");

      localStorage.removeItem("authToken");
      localStorage.removeItem("auth");

      // Espera 3 segundos y redirige al login
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Error en el reseteo:", err);
      setError(
        err.message ||
          "Ocurrió un error. El token podría ser inválido o haber expirado."
      );
    } finally {
      setCargando(false);
    }
  };

  // Componente auxiliar para los items de validación
  const RequisitoItem = ({ valido, texto }) => (
    <li
      className={`flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
        valido ? "text-green-600" : "text-slate-400"
      }`}
    >
      <span
        className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] border ${
          valido
            ? "bg-green-100 border-green-200 text-green-600"
            : "bg-slate-100 border-slate-200 text-slate-400"
        }`}
      >
        {valido ? "✓" : "•"}
      </span>
      {texto}
    </li>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Fondos Decorativos Animados */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/40 -z-10"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>

      <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row border border-white/50 animate-fade-in-up">
        {/* IZQUIERDA (Formulario) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 order-2 md:order-1">
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="NOPRO" className="h-8 w-auto" />
            <span className="text-xl font-bold text-slate-800">NOPRO</span>
          </div>

          <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
            Nueva contraseña.
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Crea una contraseña segura para tu cuenta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Contraseña */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                Nueva contraseña:
              </label>
              <div className="relative">
                <input
                  type={mostrarContrasena ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm pr-10"
                  disabled={cargando || !!mensaje}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                  tabIndex="-1"
                >
                  {mostrarContrasena ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Input Verifica Contraseña */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                Confirmar contraseña:
              </label>
              <div className="relative">
                <input
                  type={mostrarVerifica ? "text" : "password"}
                  value={verificaContrasena}
                  onChange={(e) => setVerificaContrasena(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm pr-10"
                  disabled={cargando || !!mensaje}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarVerifica(!mostrarVerifica)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                  tabIndex="-1"
                >
                  {mostrarVerifica ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de requisitos visualmente atractiva */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-3">
                Requisitos de seguridad:
              </p>
              <ul className="space-y-2">
                <RequisitoItem
                  valido={longitudValida}
                  texto="Mínimo 8 caracteres."
                />
                <RequisitoItem
                  valido={tieneMayuscula}
                  texto="Al menos una mayúscula."
                />
                <RequisitoItem
                  valido={tieneNumero}
                  texto="Al menos un número."
                />
                <RequisitoItem
                  valido={coinciden}
                  texto="Las contraseñas coinciden."
                />
              </ul>
            </div>

            {/* Mensajes de Estado */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center animate-fade-in">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-bold text-center animate-fade-in">
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              disabled={!formularioValido || cargando || !!mensaje}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                ${
                  formularioValido && !cargando && !mensaje
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 cursor-pointer"
                    : "bg-slate-300 cursor-not-allowed shadow-none"
                }`}
            >
              {cargando ? "Guardando..." : "Establecer contraseña"}
            </button>
          </form>
        </div>

        {/* DERECHA (Panel informativo - Oculto en móvil) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 p-12 text-white flex-col justify-center items-center relative overflow-hidden order-1 md:order-2">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>

          <div className="relative z-10 text-center max-w-sm">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl">
              <span className="text-4xl">🔐</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Recupera tu acceso.</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Define una nueva contraseña para volver a ingresar. Al finalizar,
              te redirigiremos automáticamente al inicio de sesión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
