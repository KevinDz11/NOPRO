import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

export default function ContactoSoporte() {
  useAuthListener();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [cargando, setCargando] = useState(false);
  const [cargandoDatosUsuario, setCargandoDatosUsuario] = useState(true);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("authToken");

      // Si no hay token, redirigimos al login (seguridad básica)
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/clientes/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar la información del usuario.");
        }

        const data = await response.json();

        // Rellenamos el formulario con los datos de la BD
        setFormData((prev) => ({
          ...prev,
          name: data.nombre,
          email: data.email,
        }));
      } catch (err) {
        console.error("Error cargando usuario:", err);
        setError("No se pudieron cargar tus datos automáticamente.");
      } finally {
        setCargandoDatosUsuario(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // --- NUEVA FUNCIÓN DE VALIDACIÓN ---
  const validarMensaje = (texto) => {
    const textoLimpio = texto.trim();

    // 1. Validar que no esté vacío (espacios en blanco)
    if (!textoLimpio) return "El mensaje no puede estar vacío.";

    // 2. Validar longitud mínima (evita "hola" o "ayuda")
    if (textoLimpio.length < 20)
      return "Por favor, detalla más tu consulta (mínimo 20 caracteres).";

    // 3. Validar caracteres repetidos excesivos (ej. "aaaaaaa", ".......")
    const repeticiones = /(.)\1{4,}/;
    if (repeticiones.test(textoLimpio))
      return "El mensaje parece contener caracteres repetidos sin sentido.";

    // 4. Validar que tenga al menos algunas letras (evita puros números o símbolos)
    const tieneLetras = /[a-zA-Z]/;
    if (!tieneLetras.test(textoLimpio))
      return "El mensaje debe contener texto descriptivo válido.";

    return null; // Pasó todas las pruebas
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensajeExito("");

    // Validación básica de campos vacíos
    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    // --- INTEGRACIÓN DE LA VALIDACIÓN AVANZADA ---
    const errorMensaje = validarMensaje(formData.message);
    if (errorMensaje) {
      setError(errorMensaje);
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("http://localhost:8000/soporte/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al enviar el mensaje.");
      }

      setMensajeExito(data.mensaje || "Mensaje enviado correctamente.");
      setFormData((prev) => ({ ...prev, subject: "", message: "" }));
    } catch (err) {
      console.error("Error enviando soporte:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans flex flex-col">
      {/* Fondo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/40 -z-10"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div
        className="absolute bottom-20 left-0 w-72 h-72 bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* NAVBAR MODERNO */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
          <Link
            to="/Home"
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <img
              src={logo}
              alt="NOPRO"
              className="h-9 w-auto transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-extrabold text-slate-800 tracking-tighter">
              NOPRO
            </span>
          </Link>

          <ul className="hidden md:flex items-center space-x-1 font-medium text-sm text-slate-600">
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
              HISTORIAL PRODUCTOS
            </Link>

            <li
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("auth");
                window.location.href = "/";
              }}
              className="ml-4 px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-red-500/30 cursor-pointer"
            >
              CERRAR SESIÓN
            </li>
          </ul>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL - FORMULARIO */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden relative">
          {/* Header de la tarjeta */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl font-extrabold text-white relative z-10 mb-2">
              ¿Necesitas ayuda?
            </h2>
            <p className="text-blue-100 text-sm relative z-10">
              Envíanos un mensaje y te responderemos lo antes posible.
            </p>
          </div>

          <div className="p-8">
            {/* Mostrar un loader pequeño si estamos trayendo los datos del usuario */}
            {cargandoDatosUsuario ? (
              <div className="text-center py-10 text-slate-500">
                Cargando tus datos...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre (Solo Lectura) */}
                <div className="group">
                  <label
                    htmlFor="name"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1"
                  >
                    Nombre (Registrado)
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    readOnly // Campo de solo lectura
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium cursor-not-allowed focus:outline-none shadow-inner"
                    title="Este campo se obtiene de tu perfil y no se puede editar"
                  />
                </div>

                {/* Email (Solo Lectura) */}
                <div className="group">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1"
                  >
                    Correo Electrónico (Registrado)
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly // Campo de solo lectura
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium cursor-not-allowed focus:outline-none shadow-inner"
                    title="Este campo se obtiene de tu perfil y no se puede editar"
                  />
                </div>

                {/* Asunto (Editable) */}
                <div className="group">
                  <label
                    htmlFor="subject"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1 group-focus-within:text-blue-600 transition-colors"
                  >
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                    disabled={cargando}
                    placeholder="Resumen de tu consulta"
                  />
                </div>

                {/* Mensaje (Editable) */}
                <div className="group">
                  <label
                    htmlFor="message"
                    className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1 group-focus-within:text-blue-600 transition-colors"
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                    disabled={cargando}
                    placeholder="Describe tu problema o duda aquí..."
                  />
                </div>

                {/* Mensajes de Estado */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center animate-fade-in">
                    ⚠️ {error}
                  </div>
                )}
                {mensajeExito && (
                  <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-bold text-center animate-fade-in flex items-center justify-center gap-2">
                    ✅ {mensajeExito}
                  </div>
                )}

                {/* Botón de Envío */}
                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl font-bold text-white text-lg shadow-lg transition-all transform hover:-translate-y-0.5
                    ${
                      cargando
                        ? "bg-slate-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30"
                    }`}
                  disabled={cargando}
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
                    "Enviar Mensaje"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
