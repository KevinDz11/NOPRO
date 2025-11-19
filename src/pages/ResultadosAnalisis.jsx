import React, { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";

function ResultadosAnalisis() {
  const [datos, setDatos] = useState(null);
  const contentRef = useRef(null); // Referencia al área imprimible

  useEffect(() => {
    // Leemos los datos que guardaremos en localStorage desde la página de subida
    const data = localStorage.getItem("ultimoAnalisis");
    if (data) {
      setDatos(JSON.parse(data));
    }
  }, []);

  const descargarPDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: `Reporte_IA_${datos?.nombre || "documento"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!datos)
    return <div className="p-10 text-center">Cargando reporte...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Botonera superior (No sale en el PDF) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700">Vista de Resultados</h2>
        <button
          onClick={descargarPDF}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-bold flex items-center gap-2"
        >
          ⬇ Descargar PDF
        </button>
      </div>

      {/* Área del Reporte (Esto se convierte a PDF) */}
      <div
        ref={contentRef}
        className="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-xl text-gray-800"
      >
        <div className="border-b-2 border-blue-500 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Informe de Conformidad
            </h1>
            <p className="text-gray-500 mt-1">Análisis Automatizado NOPRO AI</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Documento: {datos.nombre}</p>
            <p>Fecha: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {datos.analisis_ia && datos.analisis_ia.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Hallazgos Normativos
            </h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-3 font-semibold text-sm">
                    Norma / Categoría
                  </th>
                  <th className="p-3 font-semibold text-sm">
                    Detalle del Hallazgo
                  </th>
                  <th className="p-3 font-semibold text-sm w-20 text-center">
                    Pág.
                  </th>
                </tr>
              </thead>
              <tbody>
                {datos.analisis_ia.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 text-sm">
                    <td className="p-3 align-top">
                      <span className="block font-bold text-blue-800">
                        {item.Norma}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {item.Categoria}
                      </span>
                    </td>
                    <td className="p-3 align-top">
                      <div className="font-medium text-gray-800">
                        "{item.Contexto}"
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Patrón: {item.Hallazgo}
                      </div>
                    </td>
                    <td className="p-3 align-top text-center font-bold text-gray-700">
                      {item.Pagina}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded text-center text-yellow-800">
            <p className="font-bold">Sin coincidencias normativas</p>
            <p className="text-sm">
              No se detectaron frases clave de las normas NMX/NOM en este
              documento.
            </p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>
            Este documento es un reporte generado automáticamente por
            inteligencia artificial.
          </p>
          <p>NOPRO Systems v1.0</p>
        </div>
      </div>
    </div>
  );
}

export default ResultadosAnalisis;
