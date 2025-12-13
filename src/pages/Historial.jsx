import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- COMPONENTE LISTA DE DOCUMENTOS ---
const ListaDocumentos = ({ documentos, grupo, onVerReporte }) => {
  if (!documentos || documentos.length === 0) {
    return (
      <span className="text-slate-400 italic text-xs">
        Sin documentos asociados
      </span>
    );
  }

  return (
    <ul className="space-y-3">
      {documentos.map((doc, idx) => {
        // Generar URL pública para ver el archivo original
        const nombreArchivo = doc.archivo_url
          ? doc.archivo_url.split(/[\\/]/).pop()
          : "archivo.dat";
        const urlPublica = `${API_URL}/uploads/${nombreArchivo}`;

        // Verificamos si tiene análisis para habilitar el botón
        const tieneAnalisis = doc.analisis_ia && doc.analisis_ia.length > 0;

        return (
          <li
            key={idx}
            className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-blue-200 transition-colors"
          >
            {/* 1. DOCUMENTO ORIGINAL */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xl">📄</span>
                <span
                  className="text-xs font-semibold text-slate-700 truncate"
                  title={doc.nombre}
                >
                  {doc.nombre}
                </span>
              </div>
              <a
                href={urlPublica}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                Ver Original ↗
              </a>
            </div>

            {/* 2. BOTÓN DE REPORTE */}
            {tieneAnalisis ? (
              <button
                onClick={() => onVerReporte(doc, grupo)}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-slate-800 text-white text-[11px] font-bold hover:bg-slate-700 hover:shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <span>📋</span> Ver Reporte de Normas
              </button>
            ) : (
              <div className="text-[10px] text-center text-slate-400 italic py-1">
                (Sin análisis registrado)
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function HistorialProductos() {
  useAuthListener();
  const [productosAgrupados, setProductosAgrupados] = useState([]);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  // --- FUNCIÓN INDIVIDUAL: Abre en nueva pestaña ---
  const handleVerReporte = (doc, grupo) => {
    const datosParaReporte = {
      ...doc,
      titulo_reporte: `Reporte de ${doc.nombre}`,
      tipo_vista: "individual",
      // Datos cruciales para el Checklist y Encabezado del PDF/Vista
      categoria_producto: grupo.tipo,
      marca_producto: grupo.marca,
      modelo_producto: grupo.modelo,
    };

    localStorage.setItem("ultimoAnalisis", JSON.stringify(datosParaReporte));
    window.open("/resultados-analisis", "_blank");
  };

  // --- FUNCIÓN GENERAL: Abre reporte unificado ---
  const handleVerReporteGeneral = (grupo) => {
    // 1. Filtrar solo los documentos que tienen análisis
    const docsConAnalisis = grupo.documentos.filter(
      (d) => d.analisis_ia && d.analisis_ia.length > 0
    );

    if (docsConAnalisis.length === 0) {
      alert("Este grupo no tiene documentos analizados.");
      return;
    }

    // 2. Construir objeto de reporte general
    const datosGeneral = {
      titulo_reporte: `Reporte General Unificado - ${grupo.marca}`,
      tipo_vista: "general", // FLAG IMPORTANTE
      categoria_producto: grupo.tipo,
      marca_producto: grupo.marca,
      modelo_producto: grupo.modelo,

      // IDs para el PDF backend
      ids_documentos: docsConAnalisis.map((d) => d.id_documento),

      // Sub-reportes para la vista frontend
      sub_reportes: docsConAnalisis.map((doc) => ({
        titulo: doc.nombre,
        data: doc,
      })),
    };

    localStorage.setItem("ultimoAnalisis", JSON.stringify(datosGeneral));
    window.open("/resultados-analisis", "_blank");
  };

  const agruparProductos = (data) => {
    const grupos = {};
    data.forEach((p) => {
      const key = `${p.marca || "N/A"}-${p.nombre}`.toUpperCase();
      if (!grupos[key]) {
        grupos[key] = {
          uniqueKey: key,
          tipo: p.nombre,
          marca: p.marca || "N/A",
          modelo: p.descripcion || "N/A",
          fecha: p.fecha_registro,
          ids_productos: [],
          documentos: [],
        };
      }
      grupos[key].ids_productos.push(p.id_producto);

      if (p.documentos && Array.isArray(p.documentos)) {
        grupos[key].documentos.push(...p.documentos);
      }
      if (new Date(p.fecha_registro) > new Date(grupos[key].fecha)) {
        grupos[key].fecha = p.fecha_registro;
      }
    });
    return Object.values(grupos).sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
  };

  useEffect(() => {
    const fetchProductos = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/productos/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Error al cargar historial");

        const data = await response.json();
        const agrupados = agruparProductos(data);
        setProductosAgrupados(agrupados);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el historial.");
      } finally {
        setCargando(false);
      }
    };
    fetchProductos();
  }, [navigate]);

  const handleEliminar = async (grupo) => {
    if (!window.confirm("¿Estás seguro de eliminar este historial completo?"))
      return;
    const token = localStorage.getItem("authToken");

    try {
      await Promise.all(
        grupo.ids_productos.map((id) =>
          fetch(`${API_URL}/productos/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      window.location.reload();
    } catch (e) {
      console.error("Error al eliminar:", e);
      alert("Ocurrió un error al intentar eliminar el historial.");
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "N/A";
    return new Date(fechaISO).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-slate-50 to-blue-50/40 -z-10"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
          <Link to="/Home" className="flex items-center space-x-3 group">
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
            <Link to="/perfil" className="px-4 py-2 hover:text-blue-600">
              Perfil
            </Link>
            <Link to="/soporte" className="px-4 py-2 hover:text-blue-600">
              Soporte
            </Link>
            <li
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
              className="ml-4 px-5 py-2 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white cursor-pointer transition-all"
            >
              Cerrar sesión
            </li>
          </ul>
        </div>
      </nav>

      <main className="p-6 md:p-10 max-w-7xl mx-auto animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Historial de análisis.
          </h1>
          <p className="text-slate-500">
            Consulta tus documentos originales y los reportes generados por la
            aplicación web.
          </p>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-xl">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 ">
                <tr>
                  <th className="p-5 text-center">Tipo</th>
                  <th className="p-5">Marca y modelo</th>
                  <th className="p-5 w-1/3">Documentos y reportes</th>
                  <th className="p-5 text-right">Último análisis</th>
                  <th className="p-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosAgrupados.length > 0 ? (
                  productosAgrupados.map((grupo, index) => {
                    // Verificamos si hay al menos un análisis en el grupo
                    const tieneAnalisis = grupo.documentos.some(
                      (d) => d.analisis_ia && d.analisis_ia.length > 0
                    );

                    return (
                      <tr
                        key={index}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="p-5 align-top text-center">
                          <span
                            className={`inline-flex w-12 h-12 rounded-full items-center justify-center text-xl shadow-sm ${
                              grupo.tipo === "Laptop"
                                ? "bg-blue-100"
                                : "bg-purple-100"
                            }`}
                          >
                            {grupo.tipo === "Laptop" ? "💻" : "📦"}
                          </span>
                          <div className="mt-2 font-bold text-slate-700 text-xs">
                            {grupo.tipo}
                          </div>
                        </td>
                        <td className="p-5 align-top">
                          <div className="font-bold text-slate-700 text-lg">
                            {grupo.marca}
                          </div>
                          <div className="text-sm text-slate-500">
                            {grupo.modelo}
                          </div>
                        </td>
                        <td className="p-5 align-top">
                          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Pasamos onVerReporte al componente hijo */}
                            <ListaDocumentos
                              documentos={grupo.documentos}
                              grupo={grupo}
                              onVerReporte={handleVerReporte}
                            />
                          </div>
                        </td>
                        <td className="p-5 text-right text-slate-500 text-sm font-mono align-top">
                          {formatearFecha(grupo.fecha)}
                        </td>
                        <td className="p-5 text-center align-top">
                          <div className="flex flex-col gap-2 items-center">
                            {/* BOTÓN REPORTE GENERAL */}
                            {tieneAnalisis && (
                              <button
                                onClick={() => handleVerReporteGeneral(grupo)}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow hover:bg-indigo-700 transition-all w-full mb-2"
                              >
                                📑 Reporte General
                              </button>
                            )}

                            <button
                              onClick={() => handleEliminar(grupo)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                              title="Eliminar historial"
                            >
                              <span className="text-xl">🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400">
                      No hay historial disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
}
