import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener"; // 1. Importar el hook

export default function ContactoSoporte() {
  useAuthListener(); // 2. Usar el hook (ya que esta es una ruta protegida)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // 3. Añadir estados para la UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 4. Convertir handleSubmit a async y llamar al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensajeExito("");

    // Validación simple
    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("http://localhost:8000/soporte/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Nota: El endpoint de backend no requiere token,
          // pero la página en sí está protegida por ProtectedRoute.
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al enviar el mensaje.");
      }

      // Éxito
      setMensajeExito(data.mensaje || "Mensaje enviado correctamente.");
      // Limpia el formulario solo si tuvo éxito
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Error enviando soporte:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* NAVBAR (Sin cambios) */}
      <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow navbar">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <Link
            to="/Home"
            className="text-xl font-bold text-gray-800 hover:underline"
          >
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
          <Link
            to="/"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            CERRAR SESIÓN
          </Link>
        </ul>
      </nav>

      {/* FORMULARIO DE CONTACTO */}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6">
        <div className="bg-white p-6 rounded-lg shadow-md w-full sm:w-96">
          <h2 className="text-2xl font-semibold text-center mb-4">
            Contacto Soporte
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Campo Nombre */}
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={cargando}
              />
            </div>

            {/* Campo Email */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={cargando}
              />
            </div>

            {/* Campo Asunto */}
            <div className="mb-4">
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={cargando}
              />
            </div>

            {/* Campo Mensaje */}
            <div className="mb-4">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={cargando}
              />
            </div>

            {/* 5. Mensajes de estado */}
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

            {/* 6. Botón con estado de carga */}
            <button
              type="submit"
              className={`w-full py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                cargando
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              disabled={cargando}
            >
              {cargando ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
