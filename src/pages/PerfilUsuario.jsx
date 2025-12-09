import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

const PerfilUsuario = () => {
  useAuthListener();

  // Estados para datos del usuario
  const [nombre, setNombre] = useState("Cargando...");
  const [correo, setCorreo] = useState("Cargando...");

  // Estados para UI
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [cargando, setCargando] = useState(false);

  // Modales
  const [mostrarModal, setMostrarModal] = useState(false); // Modal de confirmar "¿Estás seguro?"
  const [mostrarModalExito, setMostrarModalExito] = useState(false); // Nuevo Modal de éxito (Verde)

  const navigate = useNavigate();

  // OBTENER DATOS DEL USUARIO (Sin cambios)
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No estás autenticado.");
        navigate("/login");
        return;
      }
      try {
        const response = await fetch("http://localhost:8000/clientes/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("auth");
          alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
          navigate("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("No se pudo obtener la información del usuario.");
        }
        const data = await response.json();
        setNombre(data.nombre);
        setCorreo(data.email);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message || "Error al cargar datos.");
      }
    };
    fetchUserData();
  }, [navigate]);

  // Lógica de eliminación MEJORADA (Sin alert feo)
  const ejecutarEliminacion = async () => {
    setError("");
    setMensajeExito("");
    setMostrarModal(false); // Cerramos el modal de pregunta

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
      return;
    }

    setCargando(true);
    try {
      // Nota: Asegúrate de que en tu backend la ruta /me esté ANTES que /{id}
      const response = await fetch("http://localhost:8000/clientes/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Convertimos el error a texto para que no salga [object Object]
        const mensajeError = JSON.stringify(errorData, null, 2);
        throw new Error(mensajeError);
      }

      // ÉXITO: Limpiamos todo y mostramos el modal bonito
      localStorage.clear();
      setMostrarModalExito(true);
    } catch (err) {
      console.error("Error eliminando cuenta:", err);
      // Aquí sí usamos alert o setError para errores técnicos
      alert("No se pudo eliminar: \n" + err.message);
      setError("Ocurrió un error. Revisa la consola.");
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarCuenta = () => {
    setMostrarModal(true);
  };

  // Función para irse al inicio cuando el usuario de click en "Entendido"
  const handleFinalizar = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Fondo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/50 -z-10"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>

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
              to="/historial"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              Historial
            </Link>
            <Link
              to="/soporte"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              Contactar soporte
            </Link>

            <li
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("auth");
                navigate("/");
              }}
              className="ml-4 px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-red-500/30 cursor-pointer"
            >
              Cerrar sesión
            </li>
          </ul>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="p-4 md:p-10 max-w-3xl mx-auto animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Cabecera de Perfil Visual */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg ring-4 ring-white/20">
                👤
              </div>
              <h2 className="text-3xl font-bold text-white mb-1">{nombre}</h2>
              <p className="text-blue-200 font-medium">{correo}</p>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-8">
            {/* Sección Datos */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
                Información personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">
                    Nombre:
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium select-all">
                    {nombre}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">
                    Correo electrónico:
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium select-all">
                    {correo}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes de Estado */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}
            {mensajeExito && (
              <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm font-medium text-center">
                {mensajeExito}
              </div>
            )}

            {/* Acciones */}
            <div className="pt-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">
                Gestión de cuenta
              </h3>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/nuevaContrasena"
                  className="flex-1 text-center py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  Cambiar contraseña
                </Link>
                <button
                  onClick={handleEliminarCuenta}
                  disabled={cargando}
                  className={`flex-1 py-3.5 rounded-xl border-2 font-bold transition-all transform hover:-translate-y-0.5 ${
                    cargando
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 hover:shadow-md"
                  }`}
                >
                  {cargando ? "Procesando..." : "Eliminar cuenta"}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">
                Nota: Al cambiar la contraseña serás redirigido al proceso de
                recuperación segura.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE CONFIRMACIÓN (ROJO) */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-fade-in-up border border-white/50 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-3">
              ¿Estás seguro?
            </h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Esta acción eliminará permanentemente tu cuenta y todos tus
              historiales.{" "}
              <span className="text-red-500 font-semibold">
                No se puede deshacer.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarEliminacion}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all"
                disabled={cargando}
              >
                {cargando ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO (VERDE - NUEVO) */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-bounce-in border border-white/50 text-center relative overflow-hidden">
            {/* Confeti decorativo de fondo */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-50 to-transparent -z-10"></div>

            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-green-50">
              <span className="text-4xl animate-pulse">👋</span>
            </div>

            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">
              ¡Cuenta Eliminada!
            </h3>

            <p className="text-slate-500 mb-8 leading-relaxed">
              Lamentamos verte partir. Todos tus datos han sido borrados
              correctamente del sistema.
            </p>

            <button
              onClick={handleFinalizar}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-500/30 transition-all transform hover:-translate-y-1"
            >
              Regresar al Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilUsuario;
