import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";

const PerfilUsuario = () => {
  // Estados para datos del usuario
  const [nombre, setNombre] = useState("Cargando...");
  const [correo, setCorreo] = useState("Cargando...");

  // Estados para el cambio de contraseña
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [repiteContrasena, setRepiteContrasena] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarRepite, setMostrarRepite] = useState(false);

  // Estados para validación y UI
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  // --- OBTENER DATOS DEL USUARIO AL CARGAR ---
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // --- Manejo de Token Expirado (401) ---
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("auth");
          alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
          navigate("/login"); // Redirige al login
          return;
        }

        // --- Manejo de otros errores (como el 500 que probablemente tienes) ---
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

  // --- VALIDACIONES DE CONTRASEÑA ---
  const longitudValida = nuevaContrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(nuevaContrasena);
  const tieneNumero = /\d/.test(nuevaContrasena);
  const coinciden =
    nuevaContrasena === repiteContrasena && repiteContrasena.length > 0;
  const contrasenaValida =
    longitudValida && tieneMayuscula && tieneNumero && coinciden;

  // --- MANEJADOR PARA CAMBIAR CONTRASEÑA ---
  const handleCambiarContrasena = async () => {
    setError("");
    setMensajeExito("");

    if (!contrasenaValida) {
      setError(
        "La nueva contraseña no cumple con los requisitos o no coincide."
      );
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(
        "http://localhost:8000/clientes/me/password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nueva_contrasena: nuevaContrasena }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al cambiar la contraseña.");
      }

      alert("Contraseña cambiada con éxito. Debes iniciar sesión nuevamente.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("auth");
      navigate("/");
    } catch (err) {
      console.error("Error cambiando contraseña:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
      setNuevaContrasena("");
      setRepiteContrasena("");
    }
  };

  // --- MANEJADOR PARA ELIMINAR CUENTA ---
  const handleEliminarCuenta = async () => {
    setError("");
    setMensajeExito("");

    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer."
    );

    if (!confirmar) {
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("http://localhost:8000/clientes/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <>
      {/* NAVBAR */}
      <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow navbar">
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

      {/* PERFIL */}
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

        <hr className="my-6" />

        {/* Cambio de contraseña */}
        <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
        <div className="relative mb-2">
          <label className="block text-gray-700 font-medium mb-1">
            Nueva contraseña
          </label>
          <input
            type={mostrarNueva ? "text" : "password"}
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.target.value)}
            placeholder="Escribe una nueva contraseña"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={cargando}
          />
          <button
            type="button"
            onClick={() => setMostrarNueva(!mostrarNueva)}
            className="absolute top-9 right-3 transform text-sm text-blue-500 hover:underline"
          >
            {mostrarNueva ? "Ocultar" : "Ver"}
          </button>
        </div>
        <div className="relative mb-2">
          <label className="block text-gray-700 font-medium mb-1">
            Repite contraseña
          </label>
          <input
            type={mostrarRepite ? "text" : "password"}
            value={repiteContrasena}
            onChange={(e) => setRepiteContrasena(e.target.value)}
            placeholder="Confirma la nueva contraseña"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={cargando}
          />
          <button
            type="button"
            onClick={() => setMostrarRepite(!mostrarRepite)}
            className="absolute top-9 right-3 transform text-sm text-blue-500 hover:underline"
          >
            {mostrarRepite ? "Ocultar" : "Ver"}
          </button>
        </div>

        {/* Lista de condiciones */}
        {(nuevaContrasena || repiteContrasena) && (
          <ul className="text-sm mb-4 pl-5 space-y-1 mt-2">
            <li
              className={`${
                longitudValida ? "text-green-600" : "text-red-600"
              }`}
            >
              • Al menos 8 caracteres
            </li>
            <li
              className={`${
                tieneMayuscula ? "text-green-600" : "text-red-600"
              }`}
            >
              • Contiene al menos una letra mayúscula
            </li>
            <li
              className={`${tieneNumero ? "text-green-600" : "text-red-600"}`}
            >
              • Contiene al menos un número
            </li>
            <li className={`${coinciden ? "text-green-600" : "text-red-600"}`}>
              • Las contraseñas coinciden
            </li>
          </ul>
        )}

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

        {/* Botón Cambiar Contraseña */}
        <div className="mb-6">
          <button
            onClick={handleCambiarContrasena}
            disabled={!contrasenaValida || cargando}
            className={`font-semibold py-2 px-4 rounded ${
              contrasenaValida && !cargando
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {cargando ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </div>

        <hr className="my-6" />

        {/* Eliminar cuenta */}
        <div className="text-center">
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
    </>
  );
};

export default PerfilUsuario;
