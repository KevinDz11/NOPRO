import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.PNG";

export default function ContactoSoporte() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del formulario enviados:", formData);
    setFormData({ name: "", email: "", subject: "", message: "" });
    alert("Mensaje enviado correctamente.");
  };

  return (
    <>
      {/* NAVBAR DIRECTAMENTE INCLUIDA */}
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
              />
            </div>

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
              />
            </div>

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
              />
            </div>

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
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
