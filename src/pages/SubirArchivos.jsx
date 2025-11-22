import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- COMPONENTE VISUAL: MODAL DE CARGA (ORIGINAL) ---
const ModalCarga = ({ tipo, mensaje }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300 animate-fade-in">
    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/50">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {tipo === "Manual" ? "📖" : tipo === "Etiqueta" ? "🏷️" : "📄"}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
        Analizando {tipo}
      </h3>
      <p className="text-slate-500 text-sm font-medium">{mensaje}</p>

      {tipo === "Manual" && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 text-left">
          <span className="text-xl">⏳</span>
          <div>
            <p className="text-orange-800 font-bold text-xs uppercase tracking-wider mb-1">
              Proceso Extenso
            </p>
            <p className="text-orange-600 text-xs leading-relaxed">
              Esto puede tardar de 3 a 5 minutos. Por favor,{" "}
              <strong>no cierres esta pestaña</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// --- NUEVO: MODAL DE ÉXITO (VISUAL) ---
const ModalExito = ({ mensaje, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all animate-fade-in">
    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full transform scale-100 animate-bounce-slow border-4 border-green-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
      <h3 className="text-2xl font-extrabold text-slate-800 mb-2">
        ¡Excelente!
      </h3>
      <p className="text-slate-500 mb-6 font-medium">{mensaje}</p>
      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all transform hover:-translate-y-1"
      >
        Continuar
      </button>
    </div>
  </div>
);

// --- COMPONENTE AUXILIAR: TARJETA DOCUMENTO ---
const CardDocumento = ({
  tipo, // "ficha", "manual", "etiqueta"
  titulo,
  descripcion,
  icono,
  archivo,
  progreso,
  resultado,
  loading,
  onCargar,
  onProcesar,
  onEliminar,
  onVerReporte,
}) => {
  // Definir colores según el tipo
  const isBlue = tipo === "ficha";
  const isOrange = tipo === "manual";
  // Eliminamos const isPurple = ... porque no se usa explícitamente (es el default)

  const gradientClass = isBlue
    ? "from-blue-600 to-indigo-600"
    : isOrange
    ? "from-orange-500 to-red-500"
    : "from-purple-600 to-pink-600";

  const lightBgClass = isBlue
    ? "bg-blue-50 text-blue-700"
    : isOrange
    ? "bg-orange-50 text-orange-700"
    : "bg-purple-50 text-purple-700";

  const barColorClass = isBlue
    ? "bg-blue-600"
    : isOrange
    ? "bg-orange-500"
    : "bg-purple-600";

  return (
    <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 group flex flex-col h-full">
      <div
        className={`bg-gradient-to-r ${gradientClass} px-6 py-4 relative overflow-hidden`}
      >
        <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-x-6 -translate-y-6"></div>
        <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
          {icono} {titulo}
        </h3>
      </div>

      <div className="p-6 flex-grow flex flex-col justify-between">
        {/* Si ya hay resultado, mostrar estado de completado */}
        {resultado ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <p className="text-slate-800 font-bold text-sm mb-1">
              Análisis Completado
            </p>

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={onVerReporte}
                className={`py-2 px-3 rounded-lg font-bold text-xs border ${lightBgClass} border-opacity-20`}
              >
                VER PDF
              </button>
              <button
                onClick={onEliminar}
                className="text-xs text-slate-400 hover:text-red-500 underline decoration-dotted transition-colors"
              >
                Analizar otro archivo
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sección de carga o visualización de archivo */}
            <div className="mb-4">
              <p className="text-slate-500 mb-4 text-xs">{descripcion}</p>

              {!archivo ? (
                // INPUT ORIGINAL (Estilizado igual)
                <input
                  type="file"
                  accept=".pdf"
                  onChange={onCargar}
                  disabled={loading}
                  className={`block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:cursor-pointer hover:file:bg-opacity-80 cursor-pointer border border-slate-200 rounded-lg p-1 ${lightBgClass}`}
                />
              ) : (
                // NUEVA VISTA: Archivo Seleccionado + Botón Eliminar
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border border-slate-200 ${lightBgClass} animate-fade-in`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <span className="text-xs font-bold truncate max-w-[120px]">
                      {archivo.name}
                    </span>
                  </div>
                  {!loading && (
                    <button
                      onClick={onEliminar}
                      className="p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                      title="Eliminar archivo"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Barra de Progreso */}
            <div className="h-1 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
              <div
                className={`${barColorClass} h-full rounded-full transition-all duration-300`}
                style={{
                  width: `${progreso}%`,
                  opacity: progreso > 0 ? 1 : 0,
                }}
              ></div>
            </div>

            {/* Botón Analizar */}
            <button
              onClick={onProcesar}
              disabled={!archivo || loading}
              className={`w-full py-3 px-3 rounded-lg font-bold text-xs tracking-wide transition-all shadow-md ${
                !archivo || loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : `bg-gradient-to-r ${gradientClass} text-white transform hover:-translate-y-0.5`
              }`}
            >
              {loading && progreso > 0 ? "..." : "ANALIZAR"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default function SubirArchivos() {
  useAuthListener();
  const { producto } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");

  const [manual, setManual] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [etiqueta, setEtiqueta] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  // Nuevo estado para el modal de éxito
  const [exito, setExito] = useState(null);

  const [progreso, setProgreso] = useState({
    manual: 0,
    ficha: 0,
    etiqueta: 0,
  });

  const [resultadoFicha, setResultadoFicha] = useState(null);
  const [resultadoManual, setResultadoManual] = useState(null);
  const [resultadoEtiqueta, setResultadoEtiqueta] = useState(null);

  // --- FUNCIONES ---

  const iniciarCarga = (e, tipo) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    if (tipo === "manual") setManual(archivo);
    if (tipo === "ficha") setFicha(archivo);
    if (tipo === "etiqueta") setEtiqueta(archivo);

    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setProgreso((prev) => ({ ...prev, [tipo]: p > 100 ? 100 : p }));
      if (p >= 100) clearInterval(interval);
    }, 80);
  };

  // NUEVA FUNCIÓN: Eliminar archivo y resetear estado parcial
  const eliminarArchivo = (tipo) => {
    setProgreso((prev) => ({ ...prev, [tipo]: 0 }));
    if (tipo === "manual") {
      setManual(null);
      setResultadoManual(null);
    } else if (tipo === "ficha") {
      setFicha(null);
      setResultadoFicha(null);
    } else if (tipo === "etiqueta") {
      setEtiqueta(null);
      setResultadoEtiqueta(null);
    }
  };

  const asegurarProducto = async (token) => {
    try {
      const res = await axios.post(
        "http://localhost:8000/productos/",
        { nombre: producto, marca: marca, descripcion: modelo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.id_producto;
    } catch (error) {
      console.error("Error creando producto:", error);
      throw new Error("No se pudo registrar el producto en la base de datos.");
    }
  };

  const procesarArchivo = async (tipoArchivo) => {
    if (!marca.trim() || !modelo.trim()) {
      return alert("Por favor, completa Marca y Modelo antes de iniciar.");
    }

    let archivo;
    if (tipoArchivo === "manual") archivo = manual;
    else if (tipoArchivo === "ficha") archivo = ficha;
    else if (tipoArchivo === "etiqueta") archivo = etiqueta;

    if (!archivo)
      return alert(
        `Debes seleccionar el archivo PDF del ${tipoArchivo} primero.`
      );

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Tu sesión expiró.");
      return navigate("/login");
    }

    try {
      let nombreUI = "Ficha Técnica";
      let mensajeUI =
        "Extrayendo especificaciones técnicas y validando datos...";

      if (tipoArchivo === "manual") {
        nombreUI = "Manual";
        mensajeUI =
          "Leyendo documentos extensos, aplicando NLP y verificando normas...";
      } else if (tipoArchivo === "etiqueta") {
        nombreUI = "Etiqueta";
        mensajeUI =
          "Analizando imagen con IA (YOLO + Google Vision) buscando logos y advertencias...";
      }

      setLoadingType(nombreUI);
      setLoadingMessage(mensajeUI);
      setLoading(true);

      const idProducto = await asegurarProducto(token);

      const formData = new FormData();
      formData.append("id_producto", idProducto);
      formData.append("nombre", `${tipoArchivo} - ${modelo}`);
      formData.append("tipo", tipoArchivo);
      formData.append("categoria", producto);
      formData.append("marca", marca);
      formData.append("archivo", archivo);
      formData.append("analizar", "true");

      const response = await axios.post(
        "http://localhost:8000/documentos/subir-analizar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 600000,
        }
      );

      // Guardar resultado y MOSTRAR MODAL DE ÉXITO en vez de alert
      if (tipoArchivo === "manual") {
        setResultadoManual(response.data);
        setExito({ mensaje: "¡Manual analizado correctamente!" });
      } else if (tipoArchivo === "etiqueta") {
        setResultadoEtiqueta(response.data);
        setExito({ mensaje: "¡Etiqueta analizada con IA Visual!" });
      } else {
        setResultadoFicha(response.data);
        setExito({ mensaje: "¡Ficha Técnica analizada correctamente!" });
      }
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.detail || "Ocurrió un error de conexión.";
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const verReportePDF = (dataResultados, tituloReporte) => {
    const datosParaReporte = {
      ...dataResultados,
      titulo_reporte: tituloReporte,
      categoria_producto: producto,
      marca_producto: marca,
      modelo_producto: modelo,
    };
    localStorage.setItem("ultimoAnalisis", JSON.stringify(datosParaReporte));
    window.open("/resultados-analisis", "_blank");
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/50 -z-10"></div>

      {/* Modales Globales */}
      {loading && <ModalCarga tipo={loadingType} mensaje={loadingMessage} />}
      {exito && (
        <ModalExito mensaje={exito.mensaje} onClose={() => setExito(null)} />
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm navbar px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
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
              to="/historial"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              HISTORIAL
            </Link>
            <Link
              to="/soporte"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              SOPORTE
            </Link>
            <li
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("auth");
                navigate("/");
              }}
              className="ml-4 px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              CERRAR SESIÓN
            </li>
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in-up">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide mb-3">
            Nueva Solicitud
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Subir Documentos para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {producto}
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Carga ficha técnica, manual de usuario y etiquetado para el análisis
            normativo.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-10 relative overflow-hidden max-w-4xl mx-auto">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-extrabold">
              1
            </span>
            Información del Producto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Marca
              </label>
              <input
                type="text"
                placeholder="Ej. Samsung..."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-5 py-3.5 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Modelo
              </label>
              <input
                type="text"
                placeholder="Ej. UN55AU7000..."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-5 py-3.5 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 px-2 max-w-4xl mx-auto">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-extrabold">
            2
          </span>
          Carga y Análisis de Documentos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* FICHA TÉCNICA */}
          <CardDocumento
            tipo="ficha"
            titulo="Ficha Técnica"
            descripcion="Especificaciones de voltaje y potencia."
            icono="📄"
            archivo={ficha}
            progreso={progreso.ficha}
            resultado={resultadoFicha}
            loading={loading}
            onCargar={(e) => iniciarCarga(e, "ficha")}
            onProcesar={() => procesarArchivo("ficha")}
            onEliminar={() => eliminarArchivo("ficha")}
            onVerReporte={() =>
              verReportePDF(resultadoFicha, "Reporte Ficha Técnica")
            }
          />

          {/* MANUAL */}
          <CardDocumento
            tipo="manual"
            titulo="Manual"
            descripcion="Instrucciones de seguridad y uso."
            icono="📖"
            archivo={manual}
            progreso={progreso.manual}
            resultado={resultadoManual}
            loading={loading}
            onCargar={(e) => iniciarCarga(e, "manual")}
            onProcesar={() => procesarArchivo("manual")}
            onEliminar={() => eliminarArchivo("manual")}
            onVerReporte={() =>
              verReportePDF(resultadoManual, "Reporte Manual")
            }
          />

          {/* ETIQUETA */}
          <CardDocumento
            tipo="etiqueta"
            titulo="Etiqueta"
            descripcion="Detección de logos y advertencias."
            icono="🏷️"
            archivo={etiqueta}
            progreso={progreso.etiqueta}
            resultado={resultadoEtiqueta}
            loading={loading}
            onCargar={(e) => iniciarCarga(e, "etiqueta")}
            onProcesar={() => procesarArchivo("etiqueta")}
            onEliminar={() => eliminarArchivo("etiqueta")}
            onVerReporte={() =>
              verReportePDF(resultadoEtiqueta, "Reporte Etiqueta")
            }
          />
        </div>
      </main>
    </div>
  );
}
