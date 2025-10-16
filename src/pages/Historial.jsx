import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.PNG";

export default function HistorialProductos() {
  // Estado para guardar los productos que vienen del backend
  const [productos, setProductos] = useState([]);
  // Estado para manejar cualquier error durante la petición
  const [error, setError] = useState(null);
  // Estado para mostrar un mensaje de carga
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Función asíncrona para obtener los datos del backend
    const fetchProductos = async () => {
      try {
        // Hacemos la petición GET al endpoint /productos/ de FastAPI
        // Asegúrate de que tu backend esté corriendo en http://localhost:8000
        const response = await fetch("http://localhost:8000/productos/");

        // Si la respuesta no es exitosa (ej. error 500, 404), lanzamos un error
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Mapeamos los datos recibidos del backend a la estructura que necesita la tabla
        const productosMapeados = data.map((p) => ({
          tipo: p.nombre, // El campo 'nombre' del producto es el 'tipo' en la tabla
          marca: "N/A", // Tu modelo de producto no tiene 'marca', puedes añadirlo si lo necesitas
          modelo: p.descripcion, // El campo 'descripcion' es el 'modelo'
          fecha: new Date(p.fecha_registro).toLocaleDateString("es-ES"), // Formateamos la fecha a un formato local
        }));

        setProductos(productosMapeados); // Actualizamos el estado con los productos
      } catch (e) {
        console.error("Error al obtener los productos:", e);
        setError(
          "No se pudieron cargar los productos. Por favor, asegúrate de que el backend esté funcionando e inténtalo de nuevo."
        );
      } finally {
        // Ocultamos el mensaje de carga, ya sea que la petición tuvo éxito o falló
        setCargando(false);
      }
    };

    fetchProductos(); // Ejecutamos la función al cargar el componente
  }, []); // El array vacío [] asegura que este efecto se ejecute solo una vez

  return (
    <>
      {/* NAVBAR */}
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

        {/* --- Lógica de visualización --- */}
        {cargando && (
          <p className="text-center text-gray-600">Cargando productos...</p>
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
                  <th className="border px-4 py-2 text-left">
                    Tipo de producto
                  </th>
                  <th className="border px-4 py-2 text-left">Marca</th>
                  <th className="border px-4 py-2 text-left">Modelo</th>
                  <th className="border px-4 py-2 text-left">
                    Fecha de registro
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.length > 0 ? (
                  productos.map((producto, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{producto.tipo}</td>
                      <td className="border px-4 py-2">{producto.marca}</td>
                      <td className="border px-4 py-2">{producto.modelo}</td>
                      <td className="border px-4 py-2">{producto.fecha}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No hay productos registrados.
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
