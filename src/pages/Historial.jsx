import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

export default function HistorialProductos() {
  useAuthListener();
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductos = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("Debes iniciar sesión para ver tu historial.");
        setCargando(false);
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/productos/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("auth");
          alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const productosMapeados = data.map((p) => ({
          tipo: p.nombre,
          marca: p.marca || "N/A",
          modelo: p.descripcion || "N/A",
          fecha: p.fecha_registro
            ? new Date(p.fecha_registro).toLocaleString("es-ES")
            : "N/A",
        }));

        setProductos(productosMapeados.reverse()); // Mostrar los más nuevos primero
      } catch (e) {
        console.error("Error al obtener los productos:", e);
        setError(
          "No se pudieron cargar los productos. Por favor, asegúrate de que el backend esté funcionando e inténtalo de nuevo."
        );
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Fondo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/40 -z-10"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div
        className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ animationDelay: "3s" }}
      ></div>

      {/* NAVBAR MODERNO */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
          {/* Logo redirige a Home */}
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
              to="/soporte"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              CONTACTAR SOPORTE
            </Link>

            {/* Botón Cerrar Sesión */}
            <li
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("auth");
                navigate("/"); // Redirige a la landing page
              }}
              className="ml-4 px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-red-500/30 cursor-pointer"
            >
              CERRAR SESIÓN
            </li>
          </ul>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="p-6 md:p-10 max-w-6xl mx-auto animate-fade-in-up">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Historial de Actividad
          </h1>
          <p className="text-slate-500 mt-2">
            Consulta los productos analizados recientemente.
          </p>
        </div>

        {/* Estado de Carga */}
        {cargando && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center font-medium shadow-sm mb-8">
            ⚠️ {error}
          </div>
        )}

        {/* Tabla de Productos */}
        {!cargando && !error && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Tipo de Producto
                    </th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Fecha Registro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productos.length > 0 ? (
                    productos.map((p, index) => (
                      <tr
                        key={index}
                        className="hover:bg-blue-50/40 transition-colors duration-150 group"
                      >
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm
                                    ${
                                      p.tipo === "Laptop"
                                        ? "bg-blue-100 text-blue-600"
                                        : p.tipo === "Smart TV"
                                        ? "bg-purple-100 text-purple-600"
                                        : "bg-yellow-100 text-yellow-600"
                                    }`}
                            >
                              {p.tipo === "Laptop"
                                ? "💻"
                                : p.tipo === "Smart TV"
                                ? "📺"
                                : "💡"}
                            </span>
                            <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                              {p.tipo}
                            </span>
                          </div>
                        </td>
                        <td className="p-5 text-slate-600 font-medium">
                          {p.marca}
                        </td>
                        <td className="p-5 text-slate-500">{p.modelo}</td>
                        <td className="p-5 text-right text-slate-400 text-sm font-mono">
                          {p.fecha}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <span className="text-4xl mb-3 opacity-50">📂</span>
                          <p className="text-lg font-medium">
                            No hay productos registrados aún.
                          </p>
                          <p className="text-sm mt-1">
                            Los análisis que realices aparecerán aquí.
                          </p>
                          <Link
                            to="/Home"
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
                          >
                            Realizar mi primer análisis
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de la tabla */}
            {productos.length > 0 && (
              <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 font-medium border-t border-slate-100">
                Mostrando {productos.length} registros recientes
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
