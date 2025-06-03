import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.PNG";

const PerfilUsuario = () => {
  const [nombre, setNombre] = useState("Juan Pérez");
  const [correo, setCorreo] = useState("juan.perez@example.com");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [repiteContrasena, setRepiteContrasena] = useState("");
  const [error, setError] = useState("");

  const handleCambiarContrasena = () => {
  const longitudValida = nuevaContrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(nuevaContrasena);
  const tieneNumero = /\d/.test(nuevaContrasena);
  const contrasenasIguales = nuevaContrasena === repiteContrasena;

  if (!longitudValida || !tieneMayuscula || !tieneNumero) {
    setError(
      "La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número."
    );
    return;
  }

  if (!contrasenasIguales) {
    setError("Las contraseñas no coinciden.");
    return;
  }

  setError("");
  alert("Contraseña cambiada correctamente: " + nuevaContrasena);
};


  const handleEliminarCuenta = () => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar tu cuenta?"
    );
    if (confirmar) {
      alert("Cuenta eliminada");
    }
  };

  return (
    <>
      {/* NAVBAR DIRECTAMENTE INCLUIDA */}
            <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow navbar">
              <div className="flex items-center space-x-2">
              <img src={logo} alt="NOPRO" className="h-8" />
              <Link to="/" className="text-xl font-bold text-gray-800 hover:underline">
                  NOPRO
              </Link>
              </div>
      
              <ul className="hidden md:flex items-center space-x-4 font-medium text-sm text-gray-700">
                <li className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300">
                  AYUDA
                </li>
                <Link
                  to="/perfil"
                  className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
                >
                  PERFIL
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
                <li className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300">
                  CERRAR SESIÓN
                </li>
              </ul>
      
              <div className="flex items-center space-x-4 mt-2 md:mt-0">
                <Link to="/login" className="text-sm text-gray-700 hover:text-blue-600">
                  Acceder
                </Link>
                <Link
                  to="/registro"
                  className="bg-red-500 text-white text-sm font-semibold px-4 py-1 rounded hover:bg-red-600"
                >
                  Registro
                </Link>
              </div>
            </nav>

      {/* PERFIL */}
      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Perfil de Usuario
        </h2>

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

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            Nueva contraseña
          </label>
          <input
            type="password"
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.target.value)}
            placeholder="Escribe una nueva contraseña"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            Repite contraseña
          </label>
          <input
            type="password"
            value={repiteContrasena}
            onChange={(e) => setRepiteContrasena(e.target.value)}
            placeholder="Confirma la nueva contraseña"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={handleCambiarContrasena}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Cambiar contraseña
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={handleEliminarCuenta}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Eliminar cuenta
          </button>
        </div>
      </div>
    </>
  );
};

export default PerfilUsuario;
