import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener"; // Importamos el hook

const PerfilUsuario = () => {
  useAuthListener(); // Usamos el hook

  // Estados para datos del usuario
  const [nombre, setNombre] = useState("Cargando...");
  const [correo, setCorreo] = useState("Cargando...");

  // Estados para UI
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

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

  // Lógica de eliminación (Sin cambios)
  const ejecutarEliminacion = async () => {
    setError("");
    setMensajeExito("");
    setMostrarModal(false);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("http://localhost:8000/clientes/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al eliminar la cuenta.");
      }

      alert("Cuenta eliminada correctamente.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("auth");
      navigate("/");
    } catch (err) {
      console.error("Error eliminando cuenta:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarCuenta = () => {
    setMostrarModal(true);
  };

  return (
    <>
      {/* NAVBAR (Sin cambios) */}
      <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow navbar">
        {/* ... (Tu código de Navbar) ... */}
        <div className="flex items-center space-x-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <Link
            to="/" // O a /Home si prefieres
            className="text-xl font-bold text-gray-800 hover:underline"
          >
            NOPRO
          </Link>
        </div>
        <ul className="hidden md:flex items-center space-x-4 font-medium text-sm text-gray-700">
          <Link
            to="/Home"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            HOME
          </Link>
          <Link
            to="/historial"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            HISTORIAL PRODUCTOS
          </Link>
          <Link
            to="/soporte"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            CONTACTAR SOPORTE
          </Link>
          <li
            onClick={() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("auth");
              navigate("/");
            }}
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            CERRAR SESIÓN
          </li>
        </ul>
      </nav>

      {/* PERFIL (Sin cambios en esta parte) */}
      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Perfil de Usuario
        </h2>

        {/* Datos del usuario */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={correo}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Botón Cambiar Contraseña (Sin cambios) */}
        <hr className="my-6" />
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
          <p className="text-sm text-gray-600 mb-4">
            Serás redirigido al proceso de recuperación de contraseña, donde te
            enviaremos un enlace a tu correo.
          </p>
          <Link
            to="/nuevaContrasena"
            className="font-semibold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer no-underline"
          >
            Cambiar contraseña
          </Link>
        </div>
        <hr className="my-6" />

        {/* Eliminar cuenta */}
        <div className="text-center">
          {/* Mensajes */}
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {mensajeExito && (
            <div className="bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded mb-4 text-sm">
              {mensajeExito}
            </div>
          )}

          {/* Botón Eliminar Cuenta */}
          <button
            onClick={handleEliminarCuenta}
            disabled={cargando}
            className={`font-semibold py-2 px-4 rounded ${
              !cargando
                ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {cargando ? "Procesando..." : "Eliminar cuenta"}
          </button>
        </div>
      </div>

      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* El Modal (Clases actualizadas) */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-lg">
          {/* --- FIN DE LA MODIFICACIÓN --- */}
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold text-center mb-4">
              ¿Estás seguro?
            </h3>
            <p className="text-sm text-gray-700 text-center mb-6">
              Esta acción eliminará permanentemente tu cuenta y todos tus datos.
              No se puede deshacer.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMostrarModal(false)} // Botón "No"
                className="font-semibold py-2 px-6 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
                disabled={cargando}
              >
                No
              </button>
              <button
                onClick={ejecutarEliminacion} // Botón "Sí"
                className="font-semibold py-2 px-6 rounded bg-red-600 hover:bg-red-700 text-white"
                disabled={cargando}
              >
                {cargando ? "Eliminando..." : "Sí"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerfilUsuario;
