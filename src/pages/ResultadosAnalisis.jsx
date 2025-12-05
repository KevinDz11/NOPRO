import React, { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- BASE DE DATOS DE CONOCIMIENTO (Actualizada con tus normas exactas) ---
const INFO_NORMATIVA = {
  Luminaria: {
    noms_esperadas: [
      "NOM-031-ENER-2019", // Eficacia luminosa, Factor de potencia
      "NMX-J-507/2-ANCE-2013", // Instalación y montaje
    ],
    pruebas: [
      "Medición de Eficacia Luminosa (>99 lm/W)",
      "Prueba de Factor de Potencia (>= 0.89)",
      "Resistencia a la humedad y polvo (Grado IP)",
      "Seguridad fotobiológica",
      "Ciclo de vida acelerado",
    ],
    laboratorios: [
      {
        nombre: "Laboratorios LENOR México",
        contacto: "mexico@lenorgroup.com",
      },
      { nombre: "ANCE", contacto: "servicios@ance.org.mx" },
      {
        nombre: "Intertek Testing Services",
        contacto: "info.mexico@intertek.com",
      },
    ],
  },
  SmartTV: {
    noms_esperadas: [
      "NOM-001-SCFI-2018", // Seguridad aparatos electrónicos
      "NMX-I-60065-NYCE-2015", // Seguridad audio/video (Corriente fuga)
      "NMX-I-60950-1-NYCE-2015", // Puertos e interfaces
      "NOM-032-ENER-2013", // Eficiencia energética (Standby)
      "NOM-192-SCFI/SCT1-2013", // Conectividad (WiFi/BT)
    ],
    pruebas: [
      "Seguridad eléctrica (Calentamiento y Choque eléctrico)",
      "Medición de consumo en espera (Standby)",
      "Homologación de módulos inalámbricos (IFETEL)",
      "Pruebas de interfaz (HDMI, USB, Ethernet)",
      "Estabilidad mecánica y montaje",
    ],
    laboratorios: [
      { nombre: "TÜV Rheinland de México", contacto: "ventas@mex.tuv.com" },
      { nombre: "UL de México", contacto: "customerservice.mx@ul.com" },
      { nombre: "Logis Consultores", contacto: "auditoria@logis.com" },
    ],
  },
  Laptop: {
    noms_esperadas: [
      "NMX-I-60950-1-NYCE-2015", // Seguridad equipos TI (Dielectrica, Materiales)
      "NOM-008-SCFI-2002", // Sistema general de unidades
      "NOM-024-SCFI-2013", // Información comercial / Instructivos
    ],
    pruebas: [
      "Rigidez dieléctrica (>2500V) y Aislamiento",
      "Inflamabilidad de materiales (UL94 V-0)",
      "Protección térmica (Máx 70°C en superficies)",
      "Caída libre y resistencia mecánica",
      "Validación de etiquetado comercial",
    ],
    laboratorios: [
      { nombre: "NYCE Laboratorios", contacto: "contacto@nyce.org.mx" },
      {
        nombre: "Normalización y Certificación (NYCE)",
        contacto: "evaluacion@nyce.org.mx",
      },
      {
        nombre: "Laboratorio de Pruebas ANCE",
        contacto: "pruebas@ance.org.mx",
      },
    ],
  },
  Default: {
    noms_esperadas: ["NOM-024-SCFI-2013", "NOM-050-SCFI-2004"],
    pruebas: [
      "Revisión de información comercial",
      "Seguridad general del producto",
    ],
    laboratorios: [
      { nombre: "NYCE", contacto: "contacto@nyce.org.mx" },
      { nombre: "ANCE", contacto: "servicios@ance.org.mx" },
    ],
  },
};

// --- ESTILOS VISUALES (Diseño Cuadrado y Limpio) ---
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
    borderBottom: "3px solid #0f172a",
    paddingBottom: "20px",
    marginBottom: "30px",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  brandTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "3px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  mainTitle: {
    fontSize: "26px",
    fontWeight: "900",
    margin: "5px 0 0 0",
    color: "#0f172a",
    lineHeight: "1.1",
    textTransform: "uppercase",
  },
  subTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#3b82f6",
    margin: "0",
  },
  headerRight: {
    textAlign: "right",
    fontSize: "12px",
    color: "#475569",
  },
  // Resumen
  summaryBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "0px", // Cuadrado
    padding: "25px",
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "4px",
    padding: "15px",
    textAlign: "left",
    flex: "1",
    borderLeft: "4px solid #3b82f6",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardLabel: {
    fontSize: "10px",
    color: "#94a3b8",
    marginBottom: "5px",
    textTransform: "uppercase",
    fontWeight: "800",
    letterSpacing: "1px",
  },
  cardValue: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#1e293b",
  },
  // Títulos
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "15px",
    textTransform: "uppercase",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "30px",
  },
  // Tabla
  tableContainer: {
    border: "1px solid #e2e8f0",
    marginBottom: "30px",
    backgroundColor: "#ffffff",
    pageBreakInside: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px",
  },
  th: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontWeight: "800",
    textTransform: "uppercase",
    padding: "10px 15px",
    textAlign: "left",
    borderBottom: "2px solid #cbd5e1",
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
    padding: "3px 8px",
    borderRadius: "2px",
    fontSize: "9px",
    fontWeight: "700",
    backgroundColor: "#e2e8f0",
    color: "#475569",
    marginTop: "5px",
    textTransform: "uppercase",
  },
  contextBox: {
    backgroundColor: "#fffbeb",
    borderLeft: "3px solid #fbbf24",
    padding: "10px",
    fontStyle: "italic",
    borderRadius: "0 4px 4px 0",
    marginBottom: "5px",
    color: "#451a03",
    fontSize: "11px",
  },
  // Imagen / Evidencia
  imageContainer: {
    padding: "20px",
    backgroundColor: "#f8fafc",
    textAlign: "center",
    pageBreakInside: "avoid", // Evita cortes de página
    breakInside: "avoid",
    display: "block",
  },
  // Checklist
  checklistGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "30px",
  },
  checkItem: {
    flex: "1 1 45%",
    border: "1px solid #e2e8f0",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: "4px",
  },
  // Info Adicional
  infoGrid: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
  },
  infoColumn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
  },
  listUl: {
    margin: "0",
    paddingLeft: "20px",
    fontSize: "11px",
    lineHeight: "1.8",
  },
  // Legal
  legalBox: {
    marginTop: "40px",
    padding: "20px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    fontSize: "9px",
    color: "#64748b",
    textAlign: "justify",
    pageBreakInside: "avoid",
  },
  footer: {
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px solid #cbd5e1",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "9px",
    color: "#94a3b8",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
};

// --- COMPONENTES AUXILIARES ---

// 1. Checklist de Cumplimiento (Checklist Visual)
const SeccionChecklist = ({ categoria, hallazgosTotales }) => {
  // Selección de normativa basada en la categoría
  const info = INFO_NORMATIVA[categoria] || INFO_NORMATIVA["Default"];
  const noms = info.noms_esperadas;

  // Extraemos las normas detectadas en el análisis
  const normasDetectadas = hallazgosTotales.map(
    (h) => h.Norma?.toUpperCase() || ""
  );

  return (
    <div style={{ pageBreakInside: "avoid" }}>
      <h3 style={S.sectionTitle}>
        ✅ Lista de Verificación Normativa (Checklist)
      </h3>
      <div style={S.checklistGrid}>
        {noms.map((nom, idx) => {
          // Lógica: Si el texto de la norma aparece en los hallazgos, se marca como CUMPLE
          const cumple = normasDetectadas.some((n) => n.includes(nom));

          return (
            <div
              key={idx}
              style={{
                ...S.checkItem,
                borderColor: cumple ? "#bbf7d0" : "#fecaca",
                backgroundColor: cumple ? "#f0fdf4" : "#fef2f2",
              }}
            >
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  color: "#334155",
                }}
              >
                {nom}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: cumple ? "#15803d" : "#b91c1c",
                    textTransform: "uppercase",
                  }}
                >
                  {cumple ? "CUMPLE" : "NO DETECTADA"}
                </span>
                <span style={{ fontSize: "16px" }}>{cumple ? "✔️" : "❌"}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p
        style={{
          fontSize: "10px",
          color: "#64748b",
          fontStyle: "italic",
          marginTop: "-15px",
          marginBottom: "30px",
        }}
      >
        * La validación "Cumple" indica que la IA encontró evidencia explícita
        de la norma en los documentos.
      </p>
    </div>
  );
};

// 2. Recomendaciones y Laboratorios
const SeccionInfoAdicional = ({ categoria }) => {
  const info = INFO_NORMATIVA[categoria] || INFO_NORMATIVA["Default"];

  return (
    <div style={{ pageBreakInside: "avoid" }}>
      <div style={S.infoGrid}>
        {/* Columna Pruebas */}
        <div style={S.infoColumn}>
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#0f172a",
              textTransform: "uppercase",
            }}
          >
            🛠️ Pruebas Recomendadas
          </h4>
          <ul style={S.listUl}>
            {info.pruebas.map((prueba, idx) => (
              <li key={idx} style={{ marginBottom: "5px" }}>
                {prueba}
              </li>
            ))}
          </ul>
        </div>

        {/* Columna Laboratorios */}
        <div style={S.infoColumn}>
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#0f172a",
              textTransform: "uppercase",
            }}
          >
            🏢 Laboratorios Acreditados
          </h4>
          <ul style={{ ...S.listUl, listStyle: "none", paddingLeft: "0" }}>
            {info.laboratorios.map((lab, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "8px",
                  borderBottom: "1px dashed #cbd5e1",
                  paddingBottom: "5px",
                }}
              >
                <strong style={{ color: "#334155" }}>{lab.nombre}</strong>
                <br />
                <span style={{ color: "#3b82f6" }}>{lab.contacto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// 3. Notas Legales
const SeccionLegal = () => (
  <div style={S.legalBox}>
    <strong
      style={{
        display: "block",
        marginBottom: "5px",
        textTransform: "uppercase",
      }}
    >
      Aviso Legal y Deslinde de Responsabilidad:
    </strong>
    Este reporte ha sido generado automáticamente por el sistema de Inteligencia
    Artificial de NOPRO. Los hallazgos presentados ("CUMPLE" / "NO DETECTADA")
    se basan exclusivamente en el análisis de texto e imagen de los documentos
    proporcionados por el usuario. Este documento{" "}
    <strong>NO constituye un certificado oficial</strong> de cumplimiento de la
    Norma Oficial Mexicana (NOM) ni sustituye el dictamen de un Organismo de
    Certificación de Producto (OCP) acreditado. NOPRO no se hace responsable por
    errores u omisiones en la interpretación de la normativa. Se recomienda
    validar estos resultados con los laboratorios listados anteriormente antes
    de iniciar procesos de importación o comercialización.
  </div>
);

// --- COMPONENTE TABLA PRINCIPAL ---
const TablaHallazgos = ({ analisis }) => {
  if (!analisis || analisis.length === 0) {
    return (
      <div
        style={{
          ...S.card,
          backgroundColor: "#fff7ed",
          borderColor: "#ffedd5",
          color: "#9a3412",
          marginBottom: "20px",
        }}
      >
        <strong>Sin coincidencias normativas</strong>
        <p style={{ fontSize: "11px", margin: "5px 0 0 0" }}>
          No se detectaron elementos clave en este documento.
        </p>
      </div>
    );
  }

  return (
    <div style={S.tableContainer}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "30%" }}>Norma / Categoría</th>
            <th style={{ ...S.th, width: "60%" }}>Evidencia y Contexto</th>
            <th style={{ ...S.th, width: "10%", textAlign: "center" }}>Ref.</th>
          </tr>
        </thead>
        <tbody>
          {analisis.map((item, index) => {
            // --- BLOQUE ESPECIAL IMAGEN (ETIQUETA) ---
            if (item.ImagenBase64) {
              return (
                <tr key={index}>
                  <td
                    colSpan="3"
                    style={{ padding: "0", borderBottom: "1px solid #e2e8f0" }}
                  >
                    {/* Contenedor con page-break-inside: avoid para no cortar la imagen */}
                    <div style={S.imageContainer}>
                      <div
                        style={{
                          marginBottom: "15px",
                          borderBottom: "2px solid #e2e8f0",
                          paddingBottom: "10px",
                          display: "inline-block",
                          width: "100%",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "800",
                            color: "#334155",
                            fontSize: "12px",
                            textTransform: "uppercase",
                          }}
                        >
                          📸 Análisis Visual de Etiquetado
                        </span>
                      </div>

                      <img
                        src={`data:image/jpeg;base64,${item.ImagenBase64}`}
                        alt="Evidencia Analizada"
                        style={{
                          maxWidth: "80%",
                          maxHeight: "500px",
                          border: "1px solid #cbd5e1",
                          padding: "5px",
                          backgroundColor: "white",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />

                      <div
                        style={{
                          marginTop: "15px",
                          padding: "10px",
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "4px",
                          fontSize: "11px",
                          textAlign: "left",
                        }}
                      >
                        <strong>Interpretación IA:</strong> {item.Contexto}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            }
            // ------------------------------------------

            const esVisual =
              item.Norma &&
              (item.Norma.includes("Visual") ||
                item.Norma.includes("Etiqueta"));
            const colorNorma = esVisual ? "#7e22ce" : "#1d4ed8"; // Morado o Azul

            return (
              <tr key={index} style={{ pageBreakInside: "avoid" }}>
                {" "}
                {/* Tratar de no romper filas */}
                <td style={S.td}>
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "12px",
                      color: colorNorma,
                      marginBottom: "4px",
                    }}
                  >
                    {item.Norma}
                  </div>
                  <span style={S.tag}>{item.Categoria}</span>
                </td>
                <td style={S.td}>
                  <div style={S.contextBox}>"{item.Contexto}"</div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    <strong>Hallazgo:</strong> {item.Hallazgo}
                  </div>
                </td>
                <td
                  style={{
                    ...S.td,
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: "12px",
                      color: "#94a3b8",
                    }}
                  >
                    P.{item.Pagina}
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

// --- COMPONENTE PRINCIPAL ---
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

    const element = contentRef.current;

    const opt = {
      margin: [10, 10, 10, 10], // Márgenes cuadrados
      filename: `Reporte_${datos?.modelo_producto || "NOPRO"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }, // Configuración fuerte para saltos de página
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error(error);
      alert("Error al generar PDF.");
    } finally {
      setGenerando(false);
    }
  };

  if (!datos)
    return (
      <div className="p-10 text-center font-bold text-slate-500">
        Cargando reporte...
      </div>
    );

  const esGeneral = datos.tipo_vista === "general";

  // Calcular hallazgos totales para el checklist global
  let todosLosHallazgos = [];
  if (esGeneral) {
    datos.sub_reportes.forEach((sub) => {
      if (sub.data.analisis_ia)
        todosLosHallazgos = [...todosLosHallazgos, ...sub.data.analisis_ia];
    });
  } else {
    todosLosHallazgos = datos.analisis_ia || [];
  }

  const totalCount = todosLosHallazgos.length;

  // Normalización de categorías para coincidir con las claves de INFO_NORMATIVA
  let categoriaNormalizada = "Default";
  const catRaw = datos.categoria_producto?.toLowerCase() || "";

  if (catRaw.includes("laptop") || catRaw.includes("computadora")) {
    categoriaNormalizada = "Laptop";
  } else if (
    catRaw.includes("tv") ||
    catRaw.includes("pantalla") ||
    catRaw.includes("televisión")
  ) {
    categoriaNormalizada = "SmartTV";
  } else if (
    catRaw.includes("luminaria") ||
    catRaw.includes("lampara") ||
    catRaw.includes("luz")
  ) {
    categoriaNormalizada = "Luminaria";
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <span className="font-bold text-slate-700">
            Vista Previa del Reporte
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.close()}
            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cerrar Pestaña
          </button>
          <button
            onClick={descargarPDF}
            disabled={generando}
            className={`px-6 py-2 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center gap-2 ${
              generando
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {generando ? (
              "Generando PDF..."
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar Reporte Oficial
              </>
            )}
          </button>
        </div>
      </nav>

      {/* CONTENEDOR VISTA PREVIA */}
      <div className="max-w-[210mm] mx-auto mt-10 mb-20 shadow-2xl border border-slate-200 bg-white">
        {/* === ÁREA IMPRIMIBLE (PDF) === */}
        <div ref={contentRef} style={S.container} id="pdf-content">
          {/* HEADER */}
          <header style={S.header}>
            <div style={S.headerLeft}>
              <div style={S.brandTitle}>
                <img
                  src={logo}
                  alt="Logo"
                  style={{ height: "16px", opacity: 0.8 }}
                />
                Plataforma de Cumplimiento Normativo
              </div>
              <h1 style={S.mainTitle}>{datos.titulo_reporte}</h1>
              <p style={S.subTitle}>
                {esGeneral
                  ? "Expediente Integral de Conformidad"
                  : "Dictamen Técnico Individual"}
              </p>
            </div>
            <div style={S.headerRight}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#0f172a",
                  marginBottom: "2px",
                }}
              >
                {datos.marca_producto} - {datos.modelo_producto}
              </p>
              <p>
                ID Referencia:{" "}
                {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              <p style={{ marginTop: "4px", fontWeight: "bold" }}>
                Fecha: {new Date().toLocaleDateString()}
              </p>
            </div>
          </header>

          {/* RESUMEN EJECUTIVO */}
          <section style={S.summaryBox}>
            <div style={S.card}>
              <p style={S.cardLabel}>Categoría Producto</p>
              <p style={S.cardValue}>{datos.categoria_producto}</p>
            </div>
            <div style={S.card}>
              <p style={S.cardLabel}>Total Hallazgos</p>
              <p style={{ ...S.cardValue, color: "#2563eb" }}>
                {totalCount} Puntos
              </p>
            </div>
            <div style={S.card}>
              <p style={S.cardLabel}>Estatus Preliminar</p>
              <p style={{ ...S.cardValue, color: "#16a34a" }}>PROCESADO</p>
            </div>
          </section>

          {/* --- CHECKLIST VISUAL (NUEVO) --- */}
          <SeccionChecklist
            categoria={categoriaNormalizada}
            hallazgosTotales={todosLosHallazgos}
          />

          {/* CONTENIDO PRINCIPAL (TABLAS) */}
          {esGeneral ? (
            <div>
              {datos.sub_reportes.map((sub, idx) => (
                <div key={idx} style={{ marginBottom: "40px" }}>
                  <h3 style={S.sectionTitle}>
                    <span style={{ color: "#94a3b8", marginRight: "10px" }}>
                      0{idx + 1}.
                    </span>
                    Análisis: {sub.titulo}
                  </h3>
                  <TablaHallazgos analisis={sub.data.analisis_ia} />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h3 style={S.sectionTitle}>Detalle Técnico de Hallazgos</h3>
              <TablaHallazgos analisis={datos.analisis_ia} />
            </div>
          )}

          {/* --- INFO ADICIONAL (LABS Y PRUEBAS) --- */}
          <h3 style={{ ...S.sectionTitle, marginTop: "50px" }}>
            Guía de Certificación y Pruebas
          </h3>
          <SeccionInfoAdicional categoria={categoriaNormalizada} />

          {/* --- LEGALES --- */}
          <SeccionLegal />

          {/* FOOTER */}
          <footer style={S.footer}>
            <span>NOPRO Certification Assistant v1.0</span>
            <span>
              Documento para uso interno | No válido ante aduanas sin firma
              autógrafa
            </span>
            <span>Página 1 de 1</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default ResultadosAnalisis;
