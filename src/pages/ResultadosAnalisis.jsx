import React, { useEffect, useState } from "react";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- BASE DE DATOS DE CRITERIOS (Copiada del Backend para validación visual) ---
const CRITERIOS_POR_PRODUCTO = {
  Laptop: {
    Ficha: {
      "NMX-I-60950-1-NYCE-2015": { "Seguridad eléctrica y desempeño": [] },
      "NOM-008-SCFI-2002": { "Unidades y etiquetado comercial": [] },
      "NOM-024-SCFI-2013": { "Información técnica y comercial": [] },
    },
    Manual: {
      "NOM-019-SE-2021": {
        "Marcado de seguridad": [],
        "Especificaciones eléctricas": [],
        "Advertencias visibles": [],
      },
      "NMX-I-60950-1-NYCE-2015": {
        "Instrucciones de seguridad": [],
        "Especificaciones técnicas": [],
        Mantenimiento: [],
      },
      "NOM-008-SCFI-2002": {
        "Composición y vida útil": [],
        "Instrucciones de uso seguro": [],
        "Limitaciones de modificación": [],
        "Información de homologación": [],
      },
      "Información complementaria requerida": {
        "Especificaciones técnicas": [],
        "Condiciones de garantía": [],
        "Instrucciones de uso y seguridad": [],
      },
    },
    Etiqueta: {
      "NOM-024-SCFI-2013": { "Información comercial": [] },
    },
  },
  SmartTV: {
    Ficha: {
      "NOM-001-SCFI-2018": { "Seguridad eléctrica": [] },
      "NMX-I-60065-NYCE-2015": { "Seguridad térmica y ventilación": [] },
      "NMX-I-60950-1-NYCE-2015": {
        "Conexión de periféricos": [],
        "Seguridad en interfaces": [],
      },
      "NOM-032-ENER-2013": { "Eficiencia energética": [] },
      "NOM-192-SCFI/SCT1-2013": {
        "Conectividad inalámbrica": [],
        "Advertencias RF": [],
      },
      "NMX-J-606-ANCE-2008": { "Componentes y fusibles": [] },
      "NMX-J-640-ANCE-2010": {
        "Identificación y etiquetas": [],
        "Durabilidad de marcaje": [],
      },
      "NMX-J-551-ANCE-2012": {
        "Cableado y alimentación": [],
        "Recomendaciones de seguridad": [],
      },
    },
    Manual: {
      "NOM-001-SCFI-2018": {
        "Seguridad eléctrica": [],
        "Advertencias al usuario": [],
        "Servicio y soporte": [],
      },
      "NMX-I-60065-NYCE-2015": {
        "Seguridad térmica y ventilación": [],
        "Conexión y operación segura": [],
        "Mantenimiento preventivo": [],
      },
      "NMX-I-60950-1-NYCE-2015": {
        "Conexión de periféricos": [],
        "Seguridad en interfaces": [],
        "Instrucciones generales": [],
      },
      "NOM-032-ENER-2013": {
        "Eficiencia energética": [],
        "Consejos al usuario": [],
      },
      "NOM-192-SCFI/SCT1-2013": {
        "Conectividad inalámbrica": [],
        "Advertencias RF": [],
      },
      "NMX-J-606-ANCE-2008": {
        "Componentes y fusibles": [],
        "Compatibilidad y accesorios": [],
      },
      "NMX-J-640-ANCE-2010": {
        "Identificación y etiquetas": [],
        "Durabilidad de marcaje": [],
      },
      "NMX-J-551-ANCE-2012": {
        "Cableado y alimentación": [],
        "Recomendaciones de seguridad": [],
      },
    },
  },
  Luminaria: {
    Ficha: {
      "NMX-J-038/1-ANCE-2005": {
        "Verificación de desempeño y seguridad eléctrica": [],
        "Condiciones térmicas y de tensión nacional": [],
      },
      "NOM-031-ENER-2019": {
        "Eficacia luminosa (lm/w)": [],
        "Factor de potencia y pérdidas": [],
        "Flujo luminoso y distribución": [],
        "Curvas fotométricas (.ies o .ldt)": [],
        "Temperatura de color y CRI": [],
      },
      "NMX-J-507/2-ANCE-2013": {
        "Parámetros eléctricos": [],
        "Ciclos de encendido": [],
      },
      "NMX-J-543-ANCE-2013": {
        "Ensayos eléctricos": [],
        "Compatibilidad y vida útil": [],
      },
      "NMX-J-610/4-5-ANCE-2013": {
        "Aislamiento eléctrico y térmico": [],
        "Prueba de envejecimiento": [],
        "Evaluación fotobiológica": [],
        "Grado de protección IP": [],
      },
      "NOM-030-ENER-2016": { "Eficiencia energética y pérdidas totales": [] },
      "NOM-024-ENER-2016": { "Compatibilidad y control inteligente": [] },
    },
    Manual: {
      "NMX-J-507/2-ANCE-2013": {
        "Métodos de prueba fotométricos": [],
        "Instalación y montaje": [],
        "Advertencias y mantenimiento": [],
      },
      "NMX-J-543-ANCE-2013": {
        "Conectadores eléctricos": [],
        "Seguridad eléctrica": [],
        "Documentación de instalación": [],
      },
      "NMX-J-610/4-5-ANCE-2013": {
        "Compatibilidad electromagnética (EMC)": [],
        "Instalación del luminario eléctrico": [],
      },
      "NOM-030-ENER-2016": {
        "Eficiencia energética lámparas LED integradas": [],
        "Marcado e información del producto": [],
        "Pruebas y procedimientos de conformidad": [],
      },
      "NOM-024-ENER-2016": {
        "Instalación eficiente de luminarios exteriores": [],
        "Mantenimiento y reemplazo": [],
        "Advertencias de uso e instalación": [],
      },
      "Información complementaria requerida": {
        "Especificaciones técnicas": [],
      },
    },
  },
};

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
  headerLeft: { display: "flex", flexDirection: "column", gap: "5px" },
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
  headerRight: { textAlign: "right", fontSize: "12px", color: "#64748b" },
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
  cardValue: { fontSize: "16px", fontWeight: "bold", color: "#1e293b" },
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
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
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
  // Estilos Checklist
  tdCheck: {
    padding: "10px 15px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "99px",
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusOk: { backgroundColor: "#dcfce7", color: "#166534" },
  statusFail: { backgroundColor: "#fee2e2", color: "#991b1b" },
};

// --- COMPONENTE CHECKLIST ---
const TablaChecklist = ({ analisis, categoria, nombreDoc }) => {
  // 1. Determinar Tipo de Doc (Ficha, Manual, Etiqueta) igual que en backend
  let tipoDoc = "Ficha";
  const nombre = nombreDoc ? nombreDoc.toLowerCase() : "";
  if (nombre.includes("manual")) tipoDoc = "Manual";
  else if (nombre.includes("etiqueta")) tipoDoc = "Etiqueta";

  // 2. Mapear Categoría
  const catMap = {
    laptop: "Laptop",
    smarttv: "SmartTV",
    "smart tv": "SmartTV",
    tv: "SmartTV",
    luminaria: "Luminaria",
  };
  const categoriaClean =
    catMap[categoria ? categoria.toLowerCase() : ""] || "Laptop";

  // 3. Obtener Criterios
  const criterios = CRITERIOS_POR_PRODUCTO[categoriaClean]?.[tipoDoc] || {};

  // 4. Construir filas
  const filas = [];
  Object.entries(criterios).forEach(([norma, requisitos]) => {
    Object.keys(requisitos).forEach((req) => {
      // Buscar si cumple
      const encontrado = analisis.some(
        (item) => item.Norma === norma && item.Categoria === req
      );
      filas.push({ norma, requisito: req, cumple: encontrado });
    });
  });

  if (filas.length === 0)
    return (
      <div style={{ ...S.card, marginBottom: 20 }}>
        No hay criterios definidos para {categoriaClean} - {tipoDoc}
      </div>
    );

  return (
    <div style={S.tableContainer}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "30%" }}>Norma / Estándar</th>
            <th style={{ ...S.th, width: "50%" }}>Requisito Evaluado</th>
            <th style={{ ...S.th, width: "20%", textAlign: "center" }}>
              Estatus
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, idx) => (
            <tr key={idx}>
              <td style={S.tdCheck}>
                <strong>{fila.norma}</strong>
              </td>
              <td style={S.tdCheck}>{fila.requisito}</td>
              <td style={{ ...S.tdCheck, textAlign: "center" }}>
                <span
                  style={{
                    ...S.statusBadge,
                    ...(fila.cumple ? S.statusOk : S.statusFail),
                  }}
                >
                  {fila.cumple ? "✅ CUMPLE" : "❌ NO DETECTADO"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
                          📸 EVIDENCIA VISUAL
                        </span>
                      </div>
                      <img
                        src={`data:image/jpeg;base64,${item.ImagenBase64}`}
                        alt="Evidencia"
                        style={{
                          maxWidth: "90%",
                          maxHeight: "400px",
                          border: "4px solid white",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
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
            const esVisual =
              item.Norma &&
              (item.Norma.includes("Visual") || item.Norma.includes("Gráfica"));
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

  useEffect(() => {
    const data = localStorage.getItem("ultimoAnalisis");
    if (data) {
      setDatos(JSON.parse(data));
    }
  }, []);

  const esGeneral = datos?.tipo_vista === "general";

  const descargarPDF = async () => {
    if (generando) return;
    setGenerando(true);

    try {
      const token = localStorage.getItem("authToken");
      let response;

      // LÓGICA DIFERENCIADA PARA PDF
      if (esGeneral) {
        // Si es general, usamos el nuevo endpoint POST enviando los IDs
        response = await fetch(
          "http://localhost:8000/documentos/reporte-general-pdf",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids_documentos: datos.ids_documentos }),
          }
        );
      } else {
        // Si es individual, usamos el endpoint GET de siempre
        const idDocumento = datos.id_documento;
        response = await fetch(
          `http://localhost:8000/documentos/${idDocumento}/reporte-pdf`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (!response.ok) throw new Error("Error en servidor");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_${esGeneral ? "General" : datos.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error al descargar PDF.");
    } finally {
      setGenerando(false);
    }
  };

  if (!datos) return <div className="p-10 text-center">Cargando datos...</div>;

  const totalHallazgos = esGeneral
    ? datos.sub_reportes.reduce(
        (acc, curr) => acc + (curr.data.analisis_ia?.length || 0),
        0
      )
    : datos.analisis_ia?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <span className="font-bold text-slate-700">Reporte Digital</span>
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
            className="px-5 py-2 text-white font-bold rounded-lg text-sm bg-blue-600 hover:bg-blue-700 transition-all shadow-lg"
          >
            {generando ? "Generando..." : "⬇ PDF Oficial"}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto mt-8 mb-20 shadow-2xl">
        <div style={S.container}>
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
                  ? "Análisis Unificado de Producto"
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
                {datos.marca_producto || "Marca Desconocida"}
              </p>
              <p>{datos.modelo_producto || "Modelo no esp."}</p>
              <p style={{ marginTop: "5px", textTransform: "uppercase" }}>
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
                    pageBreakInside: "avoid",
                    marginBottom: "50px",
                    borderTop: "2px dashed #e2e8f0",
                    paddingTop: "30px",
                  }}
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
                    Documento: {sub.data.nombre}
                  </h3>

                  {/* CHECKLIST POR DOCUMENTO */}
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#64748b",
                      marginBottom: "10px",
                    }}
                  >
                    1. Checklist Normativo
                  </h4>
                  <TablaChecklist
                    analisis={sub.data.analisis_ia}
                    categoria={datos.categoria_producto}
                    nombreDoc={sub.data.nombre}
                  />

                  {/* HALLAZGOS POR DOCUMENTO */}
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#64748b",
                      marginBottom: "10px",
                      marginTop: "20px",
                    }}
                  >
                    2. Evidencias
                  </h4>
                  <TablaHallazgos analisis={sub.data.analisis_ia} />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 style={S.sectionTitle}>
                1. Checklist de Cumplimiento Normativo
              </h3>
              <TablaChecklist
                analisis={datos.analisis_ia || []}
                categoria={datos.categoria_producto}
                nombreDoc={datos.nombre}
              />

              <h3 style={S.sectionTitle}>
                2. Detalle de Evidencias Encontradas
              </h3>
              <TablaHallazgos analisis={datos.analisis_ia || []} />
            </div>
          )}

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
