import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.PNG";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verificaContrasena, setVerificaContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarVerifica, setMostrarVerifica] = useState(false);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [mostrarTerminosModal, setMostrarTerminosModal] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  //Texto de Términos y Condiciones
  const terminosTexto = (
    <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
      <h4 className="font-bold text-lg text-slate-900">
        Términos y condiciones de uso de NOPRO
      </h4>

      <p>
        <strong>1. Aceptación explícita de los términos:</strong> Al registrarse
        y utilizar los servicios de NOPRO, usted acepta de forma explícita y
        voluntaria cumplir con estos términos y condiciones, así como con
        nuestras políticas de privacidad. Si no está de acuerdo, no podrá
        acceder a nuestros servicios.
      </p>

      <p>
        <strong>2. Descripción del servicio y cumplimiento legal:</strong> NOPRO
        proporciona herramientas de IA para el análisis de normativas. Nuestra
        política respeta estrictamente las leyes aplicables, incluyendo el
        cumplimiento con la{" "}
        <strong>Ley Federal de Protección de Datos Personales</strong> y
        legislación vigente relacionada.
      </p>

      <p>
        <strong>3. Privacidad y uso de datos personales:</strong>
        <ul>
          <li>
            • <strong>Consentimiento:</strong> Sus datos personales y sensibles
            son tratados únicamente bajo su consentimiento al aceptar estos
            términos.
          </li>
          <li>
            • <strong>Transparencia y Derechos ARCO:</strong> Usted tiene
            derecho a acceder, modificar o eliminar su cuenta permanentemente en
            cualquier momento.
          </li>
          <li>
            • <strong>Eliminación segura:</strong> Al solicitar la baja de su
            cuenta, sus datos se borrarán de forma segura y permanente de
            nuestros sistemas si ya no son necesarios para fines legales.
          </li>
        </ul>
      </p>

      <p>
        <strong>4. Seguridad de la información:</strong>
        Implementamos medidas de seguridad robustas para proteger su
        información:
        <ul>
          <li>
            • <strong>Contraseñas:</strong> Su contraseña se almacena cifrada
            (encriptada) en nuestra base de datos; nadie en NOPRO tiene acceso a
            ella.
          </li>
          <li>
            • <strong>Datos Sensibles:</strong> La aplicación trata cualquier
            dato sensible con protocolos de alta seguridad.
          </li>
          <li>
            • <strong>Buenas prácticas:</strong> Se exhorta al usuario a
            proteger sus credenciales y no compartirlas. NOPRO le mantendrá
            informado sobre nuestras medidas de seguridad vigentes.
          </li>
        </ul>
      </p>

      <p>
        <strong>5. Responsabilidad del usuario:</strong> El usuario es
        responsable de la confidencialidad de su acceso. El análisis de la IA es
        una herramienta de apoyo y no sustituye el juicio profesional legal.
        NOPRO no se hace responsable por decisiones tomadas basándose únicamente
        en los análisis automáticos.
      </p>

      <p>
        <strong>6. Disponibilidad y Modificaciones:</strong>
        Estos términos detallan nuestras políticas, reglas y responsabilidades,
        y están accesibles en todo momento en la{" "}
        <strong>pestaña de Soporte</strong> (debajo del formulario). NOPRO se
        reserva el derecho de modificar estos términos; los cambios entrarán en
        vigor tras su publicación en la plataforma.
      </p>
    </div>
  );

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
    coinciden &&
    aceptarTerminos;

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");
    if (!formularioValido) {
      setError("Por favor, completa todos los campos correctamente.");
      return;
    }
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/clientes/`, {
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
            Crea tu cuenta.
          </h3>
          <p className="text-slate-500 mb-6 text-sm">
            Únete para usar nuestra aplicación web.
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

            {/* Input Contraseña */}
            <div className="relative">
              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={cargando}
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

            {/* Input Confirmar Contraseña */}
            <div className="relative">
              <input
                type={mostrarVerifica ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={verificaContrasena}
                onChange={(e) => setVerificaContrasena(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                disabled={cargando}
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

            {/* Checkbox Términos y Condiciones */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="terminos"
                checked={aceptarTerminos}
                onChange={(e) => setAceptarTerminos(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={cargando}
              />
              <label htmlFor="terminos" className="text-sm text-slate-600">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => setMostrarTerminosModal(true)}
                  className="text-blue-600 font-bold hover:underline focus:outline-none"
                >
                  términos y condiciones
                </button>
              </label>
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
                  ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30"
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
          <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-black opacity-90"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Únete a la aplicación web.
            </h2>
            <p className="text-slate-300">
              Accede a nuestra herramienta de análisis normativo.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL TÉRMINOS Y CONDICIONES */}
      {mostrarTerminosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                Términos y condiciones
              </h3>
              <button
                onClick={() => setMostrarTerminosModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">{terminosTexto}</div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setMostrarTerminosModal(false);
                  setAceptarTerminos(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Entendido y aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
