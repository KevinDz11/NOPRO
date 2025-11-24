import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- COMPONENTE VISUAL: MODAL DE CARGA ---
const ModalCarga = ({ tipo, mensaje }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300">
    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center max-w-md w-full animate-fade-in-up border border-white/50">
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

// --- COMPONENTE VISUAL: MODAL DE ÉXITO ---
const ModalFeedback = ({ tipo, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-bounce-in border border-slate-100">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
        ✅
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        ¡Análisis Completado!
      </h3>
      <p className="text-slate-500 text-sm mb-6">
        El documento <strong>{tipo}</strong> ha sido procesado y validado
        correctamente por la IA.
      </p>
      <button
        onClick={onClose}
        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl"
      >
        Continuar
      </button>
    </div>
  </div>
);

export default function SubirArchivos() {
  useAuthListener();
  const { producto } = useParams();
  const navigate = useNavigate();

  // Estados del formulario
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");

  // Estados de archivos
  const [manual, setManual] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [etiqueta, setEtiqueta] = useState(null);

  // Claves para reiniciar inputs de archivo
  const [inputKeys, setInputKeys] = useState({
    manual: 0,
    ficha: 0,
    etiqueta: 0,
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successType, setSuccessType] = useState("");

  const [progreso, setProgreso] = useState({
    manual: 0,
    ficha: 0,
    etiqueta: 0,
  });

  // Resultados
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

    // Animación barra
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setProgreso((prev) => ({ ...prev, [tipo]: p > 100 ? 100 : p }));
      if (p >= 100) clearInterval(interval);
    }, 80);
  };

  const limpiarArchivo = (tipo) => {
    // 1. Resetear estado del archivo
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

    // 2. Resetear progreso
    setProgreso((prev) => ({ ...prev, [tipo]: 0 }));

    // 3. Forzar re-render del input file cambiando su key
    setInputKeys((prev) => ({ ...prev, [tipo]: prev[tipo] + 1 }));
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

    if (!archivo) {
      return alert(
        `Debes seleccionar el archivo PDF del ${tipoArchivo} primero.`
      );
    }

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
          "Analizando imagen con IA (YOLO + Google Vision) buscando logos...";
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

      // Guardar resultados
      if (tipoArchivo === "manual") setResultadoManual(response.data);
      else if (tipoArchivo === "etiqueta") setResultadoEtiqueta(response.data);
      else setResultadoFicha(response.data);

      // Mostrar modal de éxito en lugar de alert
      setSuccessType(nombreUI);
      setShowSuccessModal(true);
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
      tipo_vista: "individual", // Flag para saber cómo renderizar
    };
    localStorage.setItem("ultimoAnalisis", JSON.stringify(datosParaReporte));
    window.open("/resultados-analisis", "_blank");
  };

  // --- LÓGICA REPORTE GENERAL ---
  const verReporteGeneral = () => {
    // Validar que haya al menos un resultado
    if (!resultadoFicha && !resultadoManual && !resultadoEtiqueta) {
      return alert(
        "Debes analizar al menos un documento para generar el reporte general."
      );
    }

    // Estructurar datos combinados
    const subReportes = [];
    if (resultadoFicha)
      subReportes.push({ titulo: "Ficha Técnica", data: resultadoFicha });
    if (resultadoManual)
      subReportes.push({ titulo: "Manual de Usuario", data: resultadoManual });
    if (resultadoEtiqueta)
      subReportes.push({ titulo: "Etiquetado", data: resultadoEtiqueta });

    const datosGeneral = {
      titulo_reporte: "Reporte General de Conformidad",
      categoria_producto: producto,
      marca_producto: marca,
      modelo_producto: modelo,
      tipo_vista: "general", // Flag importante
      sub_reportes: subReportes,
    };

    localStorage.setItem("ultimoAnalisis", JSON.stringify(datosGeneral));
    window.open("/resultados-analisis", "_blank");
  };

  // --- HELPER RENDER CARD ---
  const RenderCard = ({
    tipoKey,
    titulo,
    desc,
    color,
    icon,
    result,
    setFileFn,
    progress,
    typeLabel,
  }) => {
    // Clases de colores dinámicas
    const grad =
      color === "blue"
        ? "from-blue-600 to-indigo-600"
        : color === "orange"
        ? "from-orange-500 to-red-500"
        : "from-purple-600 to-pink-600";

    const bgLight =
      color === "blue"
        ? "bg-blue-50"
        : color === "orange"
        ? "bg-orange-50"
        : "bg-purple-50";

    const textDark =
      color === "blue"
        ? "text-blue-700"
        : color === "orange"
        ? "text-orange-700"
        : "text-purple-700";

    const fileValue =
      tipoKey === "ficha" ? ficha : tipoKey === "manual" ? manual : etiqueta;

    return (
      <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 group flex flex-col relative">
        {/* Header Card */}
        <div
          className={`bg-gradient-to-r ${grad} px-6 py-4 relative overflow-hidden`}
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-x-6 -translate-y-6"></div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
            {icon} {titulo}
          </h3>
        </div>

        <div className="p-6 flex-grow flex flex-col">
          <p className="text-slate-500 mb-4 text-xs flex-grow">{desc}</p>

          {/* Input File o Info Archivo */}
          <div className="mb-4">
            {!fileValue ? (
              <input
                key={inputKeys[tipoKey]} // KEY para resetear
                type="file"
                accept=".pdf"
                onChange={(e) => setFileFn(e, tipoKey)}
                disabled={loading}
                className={`block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold ${bgLight} ${textDark} hover:file:opacity-80 cursor-pointer border border-slate-200 rounded-lg p-1`}
              />
            ) : (
              <div
                className={`flex items-center justify-between p-2 rounded-lg border border-slate-200 ${bgLight}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xl">📄</span>
                  <span className={`text-xs font-bold truncate ${textDark}`}>
                    {fileValue.name}
                  </span>
                </div>
                {/* Botón Eliminar */}
                <button
                  onClick={() => limpiarArchivo(tipoKey)}
                  disabled={loading}
                  className="p-1 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
                  title="Eliminar archivo y resultados"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Barra de Progreso */}
          <div className="h-1 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              className={`${
                color === "blue"
                  ? "bg-blue-600"
                  : color === "orange"
                  ? "bg-orange-500"
                  : "bg-purple-600"
              } h-full rounded-full transition-all duration-300`}
              style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
            ></div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => procesarArchivo(tipoKey)}
              disabled={!fileValue || loading || result} // Deshabilitar si ya hay resultado
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all shadow-md ${
                !fileValue || loading || result
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : `bg-gradient-to-r ${grad} text-white transform hover:scale-105`
              }`}
            >
              {result
                ? "ANALIZADO ✅"
                : loading && loadingType === typeLabel
                ? "..."
                : "ANALIZAR"}
            </button>

            {result && (
              <button
                onClick={() => verReportePDF(result, `Reporte ${titulo}`)}
                className={`py-2 px-3 rounded-lg font-bold text-xs ${textDark} ${bgLight} border border-slate-200 hover:bg-white`}
              >
                VER PDF
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/50 -z-10"></div>

      {loading && <ModalCarga tipo={loadingType} mensaje={loadingMessage} />}
      {showSuccessModal && (
        <ModalFeedback
          tipo={successType}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {/* NAVBAR (Igual que antes) */}
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

        {/* Formulario Marca/Modelo */}
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

        {/* GRID DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-12">
          <RenderCard
            tipoKey="ficha"
            titulo="Ficha Técnica"
            desc="Especificaciones de voltaje y potencia."
            color="blue"
            icon="📄"
            result={resultadoFicha}
            setFileFn={iniciarCarga}
            progress={progreso.ficha}
            typeLabel="Ficha Técnica"
          />
          <RenderCard
            tipoKey="manual"
            titulo="Manual"
            desc="Instrucciones de seguridad y mantenimiento."
            color="orange"
            icon="📖"
            result={resultadoManual}
            setFileFn={iniciarCarga}
            progress={progreso.manual}
            typeLabel="Manual"
          />
          <RenderCard
            tipoKey="etiqueta"
            titulo="Etiqueta"
            desc="Detección de logos normativos y advertencias."
            color="purple"
            icon="🏷️"
            result={resultadoEtiqueta}
            setFileFn={iniciarCarga}
            progress={progreso.etiqueta}
            typeLabel="Etiqueta"
          />
        </div>

        {/* BOTÓN REPORTE GENERAL - MODIFICADO AQUÍ */}
        {(resultadoFicha || resultadoManual || resultadoEtiqueta) && (
          <div className="flex justify-center mt-10 mb-8 animate-fade-in-up">
            <button
              onClick={verReporteGeneral}
              className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all font-bold flex items-center gap-3 border border-slate-700 transform"
            >
              <span className="text-xl">📊</span> Ver Reporte General Unificado
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
