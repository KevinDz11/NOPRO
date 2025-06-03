import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.PNG";

export default function HistorialProductos() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    setProductos([
      {
        tipo: "Laptop",
        marca: "HP",
        modelo: "Pavilion x360",
        fecha: "2025-06-01",
      },
      {
        tipo: "SmartTV",
        marca: "LG",
        modelo: "OLED55CX",
        fecha: "2025-05-30",
      },
      {
        tipo: "Luminaria para exterior",
        marca: "Philips",
        modelo: "Hue Outdoor",
        fecha: "2025-05-29",
      },
    ]);
  }, []);

  return (
    <>
      {/* NAVBAR DIRECTAMENTE INCLUIDA */}
      <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow navbar">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <Link
            to="/"
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

      {/* CONTENIDO DEL HISTORIAL */}
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Historial de productos registrados
        </h1>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border px-4 py-2 text-left">Tipo de producto</th>
                <th className="border px-4 py-2 text-left">Marca</th>
                <th className="border px-4 py-2 text-left">Modelo</th>
                <th className="border px-4 py-2 text-left">
                  Fecha de registro
                </th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{producto.tipo}</td>
                  <td className="border px-4 py-2">{producto.marca}</td>
                  <td className="border px-4 py-2">{producto.modelo}</td>
                  <td className="border px-4 py-2">{producto.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
