import React, { useEffect, useState } from "react";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

const S = {
  container: {
    fontFamily: "'Helvetica', 'Arial', sans-serif",
    backgroundColor: "#ffffff",
    padding: "40px",
    minHeight: "297mm",
    color: "#334155", // Slate-700
    width: "100%",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2px solid #1e293b", // Slate-800
    paddingBottom: "15px",
    marginBottom: "30px",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: "2px" },
  brandTitle: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#64748b", // Slate-500
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px",
  },
  mainTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
    color: "#1e293b", // Slate-800
    lineHeight: "1.2",
  },
  subTitle: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#2563eb", // Blue-600
    margin: "0",
  },
  headerRight: { textAlign: "right", fontSize: "12px", color: "#64748b" },

  // Cards de resumen
  summaryBox: {
    backgroundColor: "#f8fafc", // Slate-50
    border: "1px solid #e2e8f0", // Slate-200
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },
  card: {
    flex: "1",
    textAlign: "center",
  },
  cardLabel: {
    fontSize: "10px",
    color: "#64748b",
    marginBottom: "2px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardValue: { fontSize: "14px", fontWeight: "bold", color: "#1e293b" },

  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: "15px",
    marginTop: "30px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "8px",
  },

  // Tablas
  tableContainer: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "20px",
    backgroundColor: "#ffffff",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: {
    backgroundColor: "#f8fafc", // Slate-50
    color: "#64748b",
    fontWeight: "bold",
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "11px",
  },
  td: {
    padding: "10px 12px",
    verticalAlign: "top",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "12px",
  },

  // Elementos internos
  tag: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    marginTop: "4px",
  },
  contextBox: {
    backgroundColor: "#fefce8", // Yellow-50
    borderLeft: "3px solid #facc15", // Yellow-400
    padding: "6px 10px",
    fontStyle: "italic",
    borderRadius: "0 4px 4px 0",
    marginBottom: "4px",
    color: "#1e293b",
    fontSize: "11px",
  },

  // Legal Footer
  legalContainer: {
    marginTop: "60px",
    paddingTop: "20px",
    borderTop: "2px solid #e2e8f0",
  },
  legalTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: "8px",
  },
  legalText: {
    fontSize: "9px",
    color: "#64748b",
    lineHeight: "1.5",
    textAlign: "justify",
  },
  footer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "9px",
    color: "#94a3b8",
  },

  // Status Check
  statusBadge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
  },
  statusOk: { color: "#166534" }, // Green text only, more professional
  statusFail: { color: "#991b1b" },
};

const DisclaimerLegal = () => (
  <div style={S.legalContainer}>
    <h4 style={S.legalTitle}>Aviso Legal y Limitación de Responsabilidad</h4>
    <p style={S.legalText}>
      Este reporte ha sido generado automáticamente por un sistema de
      Inteligencia Artificial (IA) propiedad de NOPRO. El contenido aquí
      presentado tiene fines exclusivamente informativos y de referencia
      preliminar.
      <strong>
        Este documento NO constituye una certificación oficial, dictamen
        pericial ni validación legal
      </strong>{" "}
      ante organismos de normalización o autoridades competentes (como PROFECO,
      NYCE, ANCE, IFT, etc.).
      <br />
      <br />
      NOPRO no se hace responsable por decisiones tomadas basándose únicamente
      en la información de este reporte. Se recomienda encarecidamente someter
      los productos a pruebas de laboratorio certificadas y revisión por
      expertos humanos cualificados para garantizar el cumplimiento normativo
      estricto.
    </p>
  </div>
);

const TablaChecklist = ({ resultadoNormativo }) => {
  if (!resultadoNormativo || resultadoNormativo.length === 0) {
    return (
      <div
        style={{
          ...S.tableContainer,
          padding: 15,
          color: "#64748b",
          fontSize: 12,
        }}
      >
        No hay normas evaluadas para este documento.
      </div>
    );
  }

  return (
    <div style={S.tableContainer}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "30%" }}>Norma / Estándar</th>
            <th style={{ ...S.th, width: "40%" }}>Requisito evaluado</th>
            <th style={{ ...S.th, width: "30%", textAlign: "center" }}>
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {resultadoNormativo.map((norma, idx) => (
            <tr key={idx}>
              <td style={S.td}>
                <strong>{norma.norma}</strong>
              </td>
              <td style={S.td}>{norma.nombre}</td>
              <td style={{ ...S.td, textAlign: "center" }}>
                <span
                  style={{
                    ...S.statusBadge,
                    ...(norma.estado === "CUMPLE" ? S.statusOk : S.statusFail),
                  }}
                >
                  {norma.estado === "CUMPLE" ? "✅ Cumple" : "❌ No detectado"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TablaHallazgos = ({ analisis, resultadoNormativo }) => {
  /* ===============================
     NORMALIZACIÓN SEGURA DE DATOS
     =============================== */
  const analisisSeguro = Array.isArray(analisis) ? analisis : [];
  const resultadoNormativoSeguro = Array.isArray(resultadoNormativo)
    ? resultadoNormativo
    : [];

  /* ===============================
     MAPA: NORMA → DESCRIPCIÓN
     =============================== */
  const mapaDescripcion = {};
  resultadoNormativoSeguro.forEach((n) => {
    if (n?.norma && n.descripcion && !mapaDescripcion[n.norma]) {
      mapaDescripcion[n.norma] = n.descripcion;
    }
  });
  console.log("MAPA DESCRIPCIONES:", mapaDescripcion);

  /* ===============================
     SIN EVIDENCIAS
     =============================== */
  if (analisisSeguro.length === 0) {
    return (
      <div
        style={{
          ...S.tableContainer,
          padding: 15,
          backgroundColor: "#fff7ed",
          border: "1px solid #ffedd5",
        }}
      >
        <strong style={{ color: "#9a3412", fontSize: 12 }}>
          Sin coincidencias normativas
        </strong>
        <p style={{ fontSize: "11px", margin: "5px 0 0 0", color: "#9a3412" }}>
          No se detectaron elementos clave en el análisis de texto.
        </p>
      </div>
    );
  }

  /* ===============================
     TABLA
     =============================== */
  return (
    <div style={S.tableContainer}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "25%" }}>Norma y categoría</th>
            <th style={{ ...S.th, width: "30%" }}>Descripción de la norma</th>
            <th style={{ ...S.th, width: "35%" }}>Evidencia encontrada</th>
            <th
              style={{
                ...S.th,
                width: "10%",
                textAlign: "center",
              }}
            >
              Pág.
            </th>
          </tr>
        </thead>

        <tbody>
          {analisisSeguro.map((item, index) => {
            /* ===============================
               EVIDENCIA VISUAL
               =============================== */
            if (item?.ImagenBase64) {
              return (
                <tr key={index}>
                  <td colSpan="4" style={{ padding: 0 }}>
                    <div
                      style={{
                        padding: 20,
                        backgroundColor: "#f8fafc",
                        textAlign: "center",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 10,
                          borderBottom: "1px dashed #cbd5e1",
                          paddingBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "#475569",
                            fontSize: 11,
                          }}
                        >
                          📸 EVIDENCIA VISUAL
                        </span>
                      </div>

                      <img
                        src={`data:image/jpeg;base64,${item.ImagenBase64}`}
                        alt="Evidencia"
                        style={{
                          maxWidth: 250,
                          maxHeight: 150,
                          border: "4px solid white",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      />

                      <p
                        style={{
                          fontSize: 10,
                          marginTop: 10,
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

            /* ===============================
               EVIDENCIA TEXTUAL
               =============================== */
            const esVisual =
              item?.Norma &&
              (item.Norma.includes("Visual") || item.Norma.includes("Gráfica"));

            const colorNorma = esVisual ? "#9333ea" : "#2563eb";
            const bgContext = esVisual ? "#faf5ff" : "#fefce8";
            const borderContext = esVisual ? "#c084fc" : "#facc15";

            return (
              <tr key={index}>
                {/* Norma y categoría */}
                <td style={S.td}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 12,
                      color: colorNorma,
                      marginBottom: 2,
                    }}
                  >
                    {item.Norma}
                  </div>
                  <span style={S.tag}>{item.Categoria}</span>
                </td>

                {/* Descripción de la norma */}
                <td style={{ ...S.td, fontSize: 11, color: "#374151" }}>
                  {mapaDescripcion[item.Norma] || "—"}
                </td>

                {/* Evidencia */}
                <td style={S.td}>
                  <div
                    style={{
                      ...S.contextBox,
                      backgroundColor: bgContext,
                      borderLeftColor: borderContext,
                    }}
                  >
                    “{item.Contexto}”
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      marginTop: 4,
                    }}
                  >
                    <strong>Patrón:</strong> {item.Hallazgo}
                  </div>
                </td>

                {/* Página */}
                <td style={{ ...S.td, textAlign: "center" }}>{item.Pagina}</td>
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

  useEffect(() => {
    const data = localStorage.getItem("ultimoAnalisis");
    if (!data) return;

    const parsed = JSON.parse(data);

    // 🟢 CASO REPORTE GENERAL (UNIFICADO)
    if (parsed.sub_reportes && Array.isArray(parsed.sub_reportes)) {
      const subReportes = parsed.sub_reportes;

      // 🔥 DOCUMENTOS (ESTO ES LO CRÍTICO)
      const documentos = subReportes
        .map((sub) => sub?.data)
        .filter(Boolean)
        .map((d) => ({
          id_documento: d.id_documento,
          nombre: d.nombre,
        }));

      console.log("DOCUMENTOS DEL REPORTE:", documentos);

      // Análisis y checklist unificado (solo visual)
      const analisisUnificado = subReportes.flatMap((sub) =>
        Array.isArray(sub?.data?.analisis_ia) ? sub.data.analisis_ia : []
      );

      const resultadoNormativoUnificado = subReportes.flatMap((sub) =>
        Array.isArray(sub?.data?.resultado_normativo)
          ? sub.data.resultado_normativo
          : []
      );

      setDatos({
        ...parsed,
        documentos, // 🔥 AHORA SÍ EXISTE
        analisisUnificado,
        resultadoNormativoUnificado,
      });
    } else {
      // 🟢 CASO REPORTE INDIVIDUAL
      setDatos(parsed);
    }
  }, []);

  const esGeneral = datos?.tipo_vista === "general";

  const descargarPDF = async () => {
    if (generando) return;
    setGenerando(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      // ==================================================
      // 🟢 CASO 1: REPORTE GENERAL (UNIFICADO)
      // ==================================================
      if (esGeneral) {
        if (!datos?.documentos || datos.documentos.length === 0) {
          throw new Error("No hay documentos para generar el PDF");
        }

        const ids_documentos = datos.documentos.map((d) => d.id_documento);
        console.log("IDs enviados al backend:", ids_documentos);

        const response = await fetch(
          "http://localhost:8000/documentos/reporte-general-pdf",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids_documentos }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Error generando el PDF general");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "Reporte_General_Unificado.pdf";
        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      // ==================================================
      // 🟢 CASO 2: REPORTE INDIVIDUAL
      // ==================================================
      if (!datos?.id_documento) {
        throw new Error("No se encontró el documento para descargar");
      }

      console.log("Descargando PDF individual ID:", datos.id_documento);

      const response = await fetch(
        `http://localhost:8000/documentos/${datos.id_documento}/reporte-pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Error generando el PDF individual"
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_${datos.nombre || "Documento"}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      alert(error.message || "No se pudo descargar el PDF");
    } finally {
      setGenerando(false);
    }
  };

  if (!datos)
    return (
      <div className="p-10 text-center text-slate-500">Cargando reporte...</div>
    );

  const totalHallazgos = esGeneral
    ? datos.sub_reportes.reduce(
        (acc, curr) => acc + (curr.data.analisis_ia?.length || 0),
        0
      )
    : datos.analisis_ia?.length || 0;

  return (
    <div className="min-h-screen bg-slate-100 relative pb-20">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <img src={logo} alt="NOPRO" className="h-6" />
          <span className="font-semibold text-slate-700 text-sm">
            Visor de Reportes
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.close()}
            className="px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200"
          >
            Cerrar pestaña
          </button>
          <button
            onClick={descargarPDF}
            disabled={generando}
            className="px-4 py-1.5 text-white font-medium rounded text-xs bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
          >
            {generando ? "Generando..." : "⬇ Descargar PDF"}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-8 mb-20 shadow-xl bg-white">
        <div style={S.container}>
          <header style={S.header}>
            <div style={S.headerLeft}>
              <div style={S.brandTitle}>
                <img
                  src={logo}
                  alt="Logo"
                  style={{ height: "12px", opacity: 0.5 }}
                />
                REPORTE DIGITAL NOPRO
              </div>
              <h1 style={S.mainTitle}>{datos.titulo_reporte}</h1>
              <p style={S.subTitle}>
                {esGeneral
                  ? "Análisis Unificado de Producto"
                  : "Análisis Automatizado por IA"}
              </p>
            </div>
            <div style={S.headerRight}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#334155",
                }}
              >
                {datos.marca_producto || "Marca desconocida"}
              </p>
              <p>{datos.modelo_producto || "Modelo no esp."}</p>
              <p style={{ marginTop: "4px" }}>
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </header>

          <section style={S.summaryBox}>
            <div style={S.card}>
              <p style={S.cardLabel}>Categoría</p>
              <p style={S.cardValue}>{datos.categoria_producto || "N/A"}</p>
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

          {/* CONTENIDO DINÁMICO */}
          {esGeneral ? (
            <div>
              {datos.sub_reportes.map((sub, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "40px",
                    borderTop: "1px dashed #e2e8f0",
                    paddingTop: "20px",
                  }}
                >
                  <h3 style={S.sectionTitle}>
                    {idx + 1}. Documento: {sub.data.nombre}
                  </h3>

                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#64748b",
                      marginBottom: "10px",
                    }}
                  >
                    1. Checklist normativo
                  </h4>
                  <TablaChecklist
                    resultadoNormativo={sub.data.resultado_normativo}
                  />

                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#64748b",
                      marginBottom: "10px",
                      marginTop: "20px",
                    }}
                  >
                    2. Evidencias encontradas
                  </h4>
                  <TablaHallazgos
                    analisis={sub.data.analisis_ia}
                    resultadoNormativo={sub.data.resultado_normativo}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 style={S.sectionTitle}>
                1. Checklist de cumplimiento normativo
              </h3>
              <TablaChecklist resultadoNormativo={datos.resultado_normativo} />

              <h3 style={S.sectionTitle}>
                2. Detalle de evidencias encontradas
              </h3>
              <TablaHallazgos
                analisis={datos.analisis_ia || []}
                resultadoNormativo={datos.resultado_normativo || []}
              />
            </div>
          )}

          <DisclaimerLegal />

          <footer style={S.footer}>
            <span>Sistema NOPRO AI Platform v1.0</span>
            <span>Documento confidencial - Uso interno</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default ResultadosAnalisis;
