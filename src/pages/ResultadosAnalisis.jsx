import React, { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import { Link } from "react-router-dom";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- SUB-COMPONENTE: Tabla de Hallazgos (Reutilizable) ---
const TablaHallazgos = ({ analisis }) => {
  if (!analisis || analisis.length === 0) {
    return (
      <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl text-center mb-6">
        <h3 className="text-sm font-bold text-orange-800 mb-1">
          Sin coincidencias normativas
        </h3>
        <p className="text-xs text-orange-700">
          No se detectaron elementos clave en este documento.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 mb-8 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider">
            <th className="p-3 w-1/3">Norma Y Categoría</th>
            <th className="p-3 w-1/2">Evidencia</th>
            <th className="p-3 text-center w-16">Pág.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {analisis.map((item, index) => {
            const esVisual =
              item.Norma.includes("Visual") ||
              item.Norma.includes("Inspección Visual");

            return (
              <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                <td className="p-3 align-top">
                  <div
                    className={`font-bold text-sm mb-1 ${
                      esVisual ? "text-purple-600" : "text-blue-700"
                    }`}
                  >
                    {item.Norma}
                  </div>
                  <div className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded">
                    {item.Categoria}
                  </div>
                  {esVisual && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1 rounded border border-purple-200 font-bold">
                      📷 IA
                    </span>
                  )}
                </td>
                <td className="p-3 align-top">
                  <div
                    className={`text-sm text-slate-800 italic p-2 rounded border-l-2 mb-1 ${
                      esVisual
                        ? "bg-purple-50 border-purple-400"
                        : "bg-yellow-50 border-yellow-400"
                    }`}
                  >
                    "{item.Contexto}"
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    <span className="font-bold">Patrón:</span> {item.Hallazgo}
                  </div>
                </td>
                <td className="p-3 align-top text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                    {item.Pagina}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

function ResultadosAnalisis() {
  useAuthListener();
  const [datos, setDatos] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const data = localStorage.getItem("ultimoAnalisis");
    if (data) {
      setDatos(JSON.parse(data));
    }
  }, []);

  const descargarPDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: `Reporte_NOPRO_${datos?.categoria_producto || "Analisis"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!datos)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-700">
            Generando vista...
          </h2>
        </div>
      </div>
    );

  const esGeneral = datos.tipo_vista === "general";

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative pb-20">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-200 to-slate-50 -z-10"></div>

      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NOPRO" className="h-8" />
            <span className="font-bold text-slate-700 text-lg hidden sm:block">
              Resultados del Análisis
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              to="/subir-archivos/Laptop" // O volver atrás dinámicamente
              onClick={(e) => {
                e.preventDefault();
                window.close(); // Si se abrió en nueva pestaña
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cerrar
            </Link>
            <button
              onClick={descargarPDF}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-blue-700 font-bold text-sm flex items-center gap-2 transition-transform hover:scale-105"
            >
              <span>⬇</span> Descargar PDF
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8 animate-fade-in-up">
        {/* ÁREA IMPRIMIBLE */}
        <div
          ref={contentRef}
          className="bg-white p-10 md:p-16 rounded-none md:rounded-xl shadow-2xl text-slate-800 border border-slate-100 relative overflow-hidden"
        >
          {/* Header del Reporte */}
          <header className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src={logo} alt="NOPRO" className="h-6 opacity-80" />
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                  Reporte Oficial
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {datos.titulo_reporte}
              </h1>
              <p className="text-blue-600 font-medium mt-1">
                {esGeneral
                  ? "Análisis Integral Multi-Documento"
                  : "Análisis Automatizado por IA"}
              </p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p className="font-bold text-slate-700 text-lg">
                {datos.marca_producto}
              </p>
              <p>{datos.modelo_producto}</p>
              <p className="text-xs uppercase tracking-wide mt-1">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </header>

          {/* Resumen General */}
          <section className="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Datos del Análisis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Categoría</p>
                <p className="font-bold text-slate-800">
                  {datos.categoria_producto}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Tipo</p>
                <p className="font-bold text-slate-800">
                  {esGeneral ? "Completo" : "Individual"}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Total Hallazgos</p>
                <p className="font-bold text-blue-600">
                  {esGeneral
                    ? datos.sub_reportes.reduce(
                        (acc, curr) =>
                          acc + (curr.data.analisis_ia?.length || 0),
                        0
                      )
                    : datos.analisis_ia?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-slate-500">Estado</p>
                <p className="font-bold text-green-600">Finalizado</p>
              </div>
            </div>
          </section>

          {/* CONTENIDO DEL REPORTE */}

          {esGeneral ? (
            // --- VISTA REPORTE GENERAL (Multiples Tablas) ---
            <div className="space-y-10">
              {datos.sub_reportes.map((sub, idx) => (
                <div key={idx} className="break-inside-avoid">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-white text-xs">
                      {idx + 1}
                    </span>
                    Resultados: {sub.titulo}
                  </h3>
                  {/* Nombre del archivo original */}
                  <p className="text-xs text-slate-400 mb-4 pl-10">
                    Archivo: {sub.data.nombre || "Desconocido"}
                  </p>

                  <TablaHallazgos analisis={sub.data.analisis_ia} />
                </div>
              ))}
            </div>
          ) : (
            // --- VISTA REPORTE INDIVIDUAL (Una Tabla) ---
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Detalle de Cumplimiento Normativo
              </h3>
              <TablaHallazgos analisis={datos.analisis_ia} />
            </div>
          )}

          {/* Footer del PDF */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
            <p>Generado automáticamante por NOPRO AI Platform</p>
            <p>Este documento es de carácter informativo.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResultadosAnalisis;
