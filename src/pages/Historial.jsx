import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- FUNCIÓN PARA GENERAR Y ABRIR REPORTE EN NUEVA PESTAÑA ---
const abrirReporteEnNuevaPestana = (doc) => {
  const analisis = doc.analisis_ia;
  if (!analisis || analisis.length === 0) return;

  // Creamos una ventana nueva
  const ventana = window.open("", "_blank");

  // Escribimos el HTML del reporte dinámicamente
  ventana.document.write(`
    <html>
      <head>
        <title>Reporte de Normas - ${doc.nombre}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>body { font-family: 'Segoe UI', sans-serif; }</style>
      </head>
      <body class="bg-slate-50 min-h-screen py-10 px-4">
        <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          
          <div class="bg-slate-900 text-white p-8 text-center">
            <h1 class="text-3xl font-bold mb-2">Reporte de Cumplimiento Normativo</h1>
            <p class="text-slate-400">Documento analizado: <span class="text-white font-semibold">${
              doc.nombre
            }</span></p>
          </div>

          <div class="p-8 border-b border-slate-100 bg-blue-50/30">
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              📊 Resumen del Análisis
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div class="text-3xl font-bold text-blue-600">${
                  analisis.length
                }</div>
                <div class="text-xs text-slate-500 uppercase font-bold tracking-wider">Hallazgos</div>
              </div>
              <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div class="text-3xl font-bold text-green-600">
                  ${
                    analisis.filter((a) => a.Categoria === "Cumplimiento")
                      .length
                  }
                </div>
                <div class="text-xs text-slate-500 uppercase font-bold tracking-wider">Cumplimientos</div>
              </div>
              <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div class="text-3xl font-bold text-amber-500">
                  ${
                    analisis.filter((a) => a.Categoria !== "Cumplimiento")
                      .length
                  }
                </div>
                <div class="text-xs text-slate-500 uppercase font-bold tracking-wider">Observaciones</div>
              </div>
            </div>
          </div>

          <div class="p-8">
            <h2 class="text-xl font-bold text-slate-800 mb-6">Detalle de Normas Identificadas</h2>
            <div class="space-y-6">
              ${analisis
                .map(
                  (item, index) => `
                <div class="flex gap-4 p-4 rounded-xl border ${
                  item.Categoria === "Cumplimiento"
                    ? "border-green-100 bg-green-50/20"
                    : "border-amber-100 bg-amber-50/20"
                }">
                  <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    item.Categoria === "Cumplimiento"
                      ? "bg-green-100 text-green-600"
                      : "bg-amber-100 text-amber-600"
                  }">
                    ${index + 1}
                  </div>
                  <div class="flex-1">
                    <div class="flex flex-wrap justify-between items-start mb-2">
                      <h3 class="font-bold text-slate-800">${item.Norma}</h3>
                      <span class="px-3 py-1 rounded-full text-xs font-bold ${
                        item.Categoria === "Cumplimiento"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }">
                        ${item.Categoria}
                      </span>
                    </div>
                    <p class="text-sm text-slate-600 mb-2"><span class="font-semibold">Hallazgo:</span> ${
                      item.Hallazgo || "N/A"
                    }</p>
                    <p class="text-xs text-slate-500 italic bg-white/50 p-2 rounded border border-slate-100">
                      "${item.Contexto || "Contexto no disponible"}"
                    </p>
                    <div class="mt-2 text-xs font-mono text-slate-400">Página detectada: ${
                      item.Pagina
                    }</div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="p-6 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
            Generado automáticamente por el Sistema NOPRO • ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
    </html>
  `);
  ventana.document.close();
};

// --- COMPONENTE LISTA DE DOCUMENTOS ---
const ListaDocumentos = ({ documentos }) => {
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
        // Generar URL pública
        const nombreArchivo = doc.archivo_url
          ? doc.archivo_url.split(/[\\/]/).pop()
          : "archivo.dat";
        const urlPublica = `http://localhost:8000/uploads/${nombreArchivo}`;
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

            {/* 2. REPORTE DEL SISTEMA (Si existe análisis) */}
            {tieneAnalisis ? (
              <button
                onClick={() => abrirReporteEnNuevaPestana(doc)}
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
      // Agregamos documentos. Si el backend manda 'analisis_ia', ya estará aquí.
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
        const response = await fetch("http://localhost:8000/productos/me", {
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
          fetch(`http://localhost:8000/productos/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      window.location.reload();
    } catch (e) {
      // CORRECCIÓN: Ahora "usamos" la variable 'e' imprimiéndola
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
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/40 -z-10"></div>

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
              PERFIL
            </Link>
            <Link to="/soporte" className="px-4 py-2 hover:text-blue-600">
              SOPORTE
            </Link>
            <li
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
              className="ml-4 px-5 py-2 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white cursor-pointer transition-all"
            >
              CERRAR SESIÓN
            </li>
          </ul>
        </div>
      </nav>

      <main className="p-6 md:p-10 max-w-7xl mx-auto animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Historial de Análisis
          </h1>
          <p className="text-slate-500">
            Consulta tus documentos originales y los reportes generados por el
            sistema.
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
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-5 text-center">Tipo</th>
                  <th className="p-5">Marca & Modelo</th>
                  <th className="p-5 w-1/3">Documentos y Reportes</th>
                  <th className="p-5 text-right">Último Análisis</th>
                  <th className="p-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosAgrupados.length > 0 ? (
                  productosAgrupados.map((grupo, index) => (
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
                          <ListaDocumentos documentos={grupo.documentos} />
                        </div>
                      </td>
                      <td className="p-5 text-right text-slate-500 text-sm font-mono align-top">
                        {formatearFecha(grupo.fecha)}
                      </td>
                      <td className="p-5 text-center align-top">
                        <button
                          onClick={() => handleEliminar(grupo)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                          title="Eliminar historial"
                        >
                          <span className="text-xl">🗑️</span>
                        </button>
                      </td>
                    </tr>
                  ))
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
