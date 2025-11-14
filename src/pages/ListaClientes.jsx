import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

export default function ListaClientes() {
  useAuthListener();
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("http://localhost:8000/clientes/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClientes(data);
      } catch (e) {
        console.error("Error al obtener los clientes:", e);
        setError(
          "No se pudieron cargar los clientes. Asegúrate de que el backend esté funcionando."
        );
      } finally {
        setCargando(false);
      }
    };

    fetchClientes();
  }, []);

  return (
    <>
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
      </nav>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Lista de Clientes Registrados
        </h1>
        {cargando && (
          <p className="text-center text-gray-600">Cargando clientes...</p>
        )}
        {error && (
          <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg">
            {error}
          </p>
        )}
        {!cargando && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border px-4 py-2 text-left">ID Cliente</th>
                  <th className="border px-4 py-2 text-left">Nombre</th>
                  <th className="border px-4 py-2 text-left">Email</th>
                  <th className="border px-4 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{cliente.id_cliente}</td>
                      <td className="border px-4 py-2">{cliente.nombre}</td>
                      <td className="border px-4 py-2">{cliente.email}</td>
                      <td className="border px-4 py-2">
                        {cliente.estado ? "Activo" : "Inactivo"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No hay clientes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
