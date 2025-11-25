import React, { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- ESTILOS MANUALES (PARA REEMPLAZAR TAILWIND EN EL PDF) ---
const S = {
  container: {
    fontFamily: "'Helvetica', 'Arial', sans-serif",
    backgroundColor: "#ffffff",
    padding: "40px",
    minHeight: "297mm",
    color: "#334155",
    width: "100%",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2px solid #1e293b",
    paddingBottom: "20px",
    marginBottom: "30px",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  brandTitle: {
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  mainTitle: {
    fontSize: "28px",
    fontWeight: "800",
    margin: "0",
    color: "#0f172a",
    lineHeight: "1.2",
  },
  subTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2563eb",
    margin: "0",
  },
  headerRight: {
    textAlign: "right",
    fontSize: "12px",
    color: "#64748b",
  },
  summaryBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    flex: "1",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    border: "1px solid #f1f5f9",
  },
  cardLabel: {
    fontSize: "10px",
    color: "#64748b",
    marginBottom: "4px",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  cardValue: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1e293b",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "10px",
  },
  tableContainer: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "30px",
    backgroundColor: "#ffffff",
    pageBreakInside: "avoid",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  th: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontWeight: "bold",
    textTransform: "uppercase",
    padding: "12px 15px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "10px",
  },
  td: {
    padding: "12px 15px",
    verticalAlign: "top",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
  },
  tag: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    marginTop: "4px",
  },
  contextBox: {
    backgroundColor: "#fefce8",
    borderLeft: "3px solid #facc15",
    padding: "8px",
    fontStyle: "italic",
    borderRadius: "4px",
    marginBottom: "4px",
    color: "#1e293b",
  },
  footer: {
    marginTop: "50px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    color: "#94a3b8",
  },
};

// --- COMPONENTE TABLA (Maneja Texto e Imagen) ---
const TablaHallazgos = ({ analisis }) => {
  if (!analisis || analisis.length === 0) {
    return (
      <div
        style={{
          ...S.card,
          backgroundColor: "#fff7ed",
          borderColor: "#ffedd5",
          color: "#9a3412",
        }}
      >
        <strong>Sin coincidencias normativas</strong>
        <p style={{ fontSize: "11px", margin: "5px 0 0 0" }}>
          No se detectaron elementos clave.
        </p>
      </div>
    );
  }

  return (
    <div style={S.tableContainer}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "35%" }}>Norma y Categoría</th>
            <th style={{ ...S.th, width: "55%" }}>Evidencia</th>
            <th style={{ ...S.th, width: "10%", textAlign: "center" }}>Pág.</th>
          </tr>
        </thead>
        <tbody>
          {analisis.map((item, index) => {
            // --- BLOQUE ESPECIAL: SI HAY IMAGEN ---
            if (item.ImagenBase64) {
              return (
                <tr key={index}>
                  <td
                    colSpan="3"
                    style={{ padding: "0", borderBottom: "1px solid #e2e8f0" }}
                  >
                    <div
                      style={{
                        padding: "20px",
                        backgroundColor: "#f8fafc",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: "10px",
                          borderBottom: "1px dashed #cbd5e1",
                          paddingBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "#475569",
                            fontSize: "12px",
                          }}
                        >
                          📸 EVIDENCIA VISUAL DEL ANÁLISIS
                        </span>
                      </div>

                      {/* Imagen con borde y sombra */}
                      <img
                        src={`data:image/jpeg;base64,${item.ImagenBase64}`}
                        alt="Evidencia Analizada"
                        style={{
                          maxWidth: "90%",
                          maxHeight: "600px",
                          border: "4px solid white",
                          borderRadius: "4px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />

                      <p
                        style={{
                          fontSize: "11px",
                          marginTop: "10px",
                          color: "#64748b",
                          fontStyle: "italic",
                        }}
                      >
                        {item.Contexto}
                      </p>
                    </div>
                  </td>
                </tr>
              );
            }
            // --------------------------------------

            const esVisual =
              item.Norma &&
              (item.Norma.includes("Visual") ||
                item.Norma.includes("Inspección Visual") ||
                item.Norma.includes("Gráfica"));

            // Colores dinámicos
            const colorNorma = esVisual ? "#9333ea" : "#1d4ed8";
            const bgContext = esVisual ? "#faf5ff" : "#fefce8";
            const borderContext = esVisual ? "#c084fc" : "#facc15";

            return (
              <tr key={index}>
                <td style={S.td}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      color: colorNorma,
                      marginBottom: "4px",
                    }}
                  >
                    {item.Norma}
                  </div>
                  <span style={S.tag}>{item.Categoria}</span>
                </td>
                <td style={S.td}>
                  <div
                    style={{
                      ...S.contextBox,
                      backgroundColor: bgContext,
                      borderLeftColor: borderContext,
                    }}
                  >
                    "{item.Contexto}"
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    <strong>Patrón:</strong> {item.Hallazgo}
                  </div>
                </td>
                <td style={{ ...S.td, textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "24px",
                      height: "24px",
                      lineHeight: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      fontWeight: "bold",
                      fontSize: "10px",
                    }}
                  >
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
  const [generando, setGenerando] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const data = localStorage.getItem("ultimoAnalisis");
    if (data) {
      setDatos(JSON.parse(data));
    }
  }, []);

  const descargarPDF = async () => {
    if (generando) return;
    setGenerando(true);

    const safetyTimeout = setTimeout(() => {
      setGenerando(false);
      alert("El proceso tardó demasiado.");
    }, 20000);

    const element = contentRef.current;

    const opt = {
      margin: 10,
      filename: `Reporte_${datos?.categoria_producto || "Analisis"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2, // Mejor calidad
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const styles = clonedDoc.querySelectorAll(
            'style, link[rel="stylesheet"]'
          );
          styles.forEach((s) => s.remove());
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error(error);
      alert("Error al generar PDF.");
    } finally {
      clearTimeout(safetyTimeout);
      setGenerando(false);
    }
  };

  if (!datos) return <div className="p-10 text-center">Cargando datos...</div>;

  const esGeneral = datos.tipo_vista === "general";
  const totalHallazgos = esGeneral
    ? datos.sub_reportes.reduce(
        (acc, curr) => acc + (curr.data.analisis_ia?.length || 0),
        0
      )
    : datos.analisis_ia?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <span className="font-bold text-slate-700">Vista Previa</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.close()}
            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            Cerrar
          </button>
          <button
            onClick={descargarPDF}
            disabled={generando}
            className={`px-5 py-2 text-white font-bold rounded-lg text-sm shadow-lg transition-all ${
              generando ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {generando ? "Generando..." : "⬇ Descargar PDF"}
          </button>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="max-w-4xl mx-auto mt-8 mb-20 shadow-2xl">
        {/* === ÁREA IMPRIMIBLE === */}
        <div ref={contentRef} style={S.container} id="pdf-content">
          {/* HEADER */}
          <header style={S.header}>
            <div style={S.headerLeft}>
              <div style={S.brandTitle}>
                <img
                  src={logo}
                  alt="Logo"
                  style={{ height: "14px", opacity: 0.6 }}
                />
                Reporte Oficial
              </div>
              <h1 style={S.mainTitle}>{datos.titulo_reporte}</h1>
              <p style={S.subTitle}>
                {esGeneral
                  ? "Análisis Integral Multi-Documento"
                  : "Análisis Automatizado por IA"}
              </p>
            </div>
            <div style={S.headerRight}>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#334155",
                }}
              >
                {datos.marca_producto}
              </p>
              <p>{datos.modelo_producto}</p>
              <p style={{ marginTop: "5px", textTransform: "uppercase" }}>
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </header>

          {/* RESUMEN (GRID MANUAL) */}
          <section style={S.summaryBox}>
            <div style={S.card}>
              <p style={S.cardLabel}>Categoría</p>
              <p style={S.cardValue}>{datos.categoria_producto}</p>
            </div>
            <div style={S.card}>
              <p style={S.cardLabel}>Tipo Reporte</p>
              <p style={S.cardValue}>{esGeneral ? "Completo" : "Individual"}</p>
            </div>
            <div style={S.card}>
              <p style={S.cardLabel}>Hallazgos</p>
              <p style={{ ...S.cardValue, color: "#2563eb" }}>
                {totalHallazgos}
              </p>
            </div>
            <div style={S.card}>
              <p style={S.cardLabel}>Estado</p>
              <p style={{ ...S.cardValue, color: "#16a34a" }}>Finalizado</p>
            </div>
          </section>

          {/* CONTENIDO PRINCIPAL */}
          {esGeneral ? (
            <div>
              {datos.sub_reportes.map((sub, idx) => (
                <div
                  key={idx}
                  style={{ pageBreakInside: "avoid", marginBottom: "40px" }}
                >
                  <h3 style={S.sectionTitle}>
                    <span
                      style={{
                        backgroundColor: "#1e293b",
                        color: "white",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}
                    >
                      {idx + 1}
                    </span>
                    Resultados: {sub.titulo}
                  </h3>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      paddingLeft: "35px",
                      marginBottom: "15px",
                    }}
                  >
                    Archivo fuente: {sub.data.nombre || "N/A"}
                  </p>
                  <TablaHallazgos analisis={sub.data.analisis_ia} />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 style={S.sectionTitle}>Detalle de Cumplimiento Normativo</h3>
              <TablaHallazgos analisis={datos.analisis_ia} />
            </div>
          )}

          {/* FOOTER */}
          <footer style={S.footer}>
            <span>Generado automáticamente por NOPRO AI Platform</span>
            <span>Documento confidencial - Uso interno</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default ResultadosAnalisis;
