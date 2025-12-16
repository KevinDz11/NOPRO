import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// --- PERSISTENCIA POR PRODUCTO ---
const ALMACENAMIENTO = {};

// Función para obtener el estado inicial limpio
const getDefaultState = () => ({
  marca: "",
  modelo: "",
  manual: null,
  ficha: null,
  etiqueta: null,
  progreso: { manual: 0, ficha: 0, etiqueta: 0 },
  resultadoFicha: null,
  resultadoManual: null,
  resultadoEtiqueta: null,
  inputKeys: { manual: 0, ficha: 0, etiqueta: 0 },
});

// --- COMPONENTE VISUAL: MODAL DE CARGA CON PROGRESO ---
const ModalCarga = ({ tipo, mensaje, porcentaje }) => {
  const porcentajeVisual = Number.isFinite(porcentaje)
    ? Math.round(porcentaje)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center max-w-md w-full animate-fade-in-up border border-white/50">
        {/* Spinner y Porcentaje */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-700">
            {porcentajeVisual}%
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
          Analizando {tipo}.
        </h3>
        <p className="text-slate-500 text-sm font-medium mb-6">{mensaje}</p>

        {/* BARRA DE PROGRESO VISUAL */}
        <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden border border-slate-300 relative">
          <div
            className="bg-linear-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${porcentajeVisual}%` }}
          ></div>
          <div
            className="absolute inset-0 bg-white/20 animate-pulse"
            style={{ width: `${porcentajeVisual}%` }}
          ></div>
        </div>

        {tipo === "Manual" && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 text-left animate-pulse">
            <span className="text-xl">⏳</span>
            <div>
              <p className="text-orange-800 font-bold text-xs tracking-wider mb-1">
                Proceso extenso.
              </p>
              <p className="text-orange-600 text-xs leading-relaxed">
                Esto puede tardar hasta 5 minutos. Por favor,{" "}
                <strong>no cierres esta pestaña</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
        El documento <strong>{tipo}</strong> ha sido procesado y validado.
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

  // --- HELPER PARA CARGAR ESTADO ---
  const getStoredState = (prodKey) => {
    if (!ALMACENAMIENTO[prodKey]) {
      ALMACENAMIENTO[prodKey] = getDefaultState();
    }
    return ALMACENAMIENTO[prodKey];
  };

  const initialState = getStoredState(producto);

  // Estados locales
  const [marca, setMarca] = useState(initialState.marca);
  const [modelo, setModelo] = useState(initialState.modelo);

  const [manual, setManual] = useState(initialState.manual);
  const [ficha, setFicha] = useState(initialState.ficha);
  const [etiqueta, setEtiqueta] = useState(initialState.etiqueta);

  const [inputKeys, setInputKeys] = useState(initialState.inputKeys);
  const [progreso, setProgreso] = useState(initialState.progreso);

  const [resultadoFicha, setResultadoFicha] = useState(
    initialState.resultadoFicha
  );
  const [resultadoManual, setResultadoManual] = useState(
    initialState.resultadoManual
  );
  const [resultadoEtiqueta, setResultadoEtiqueta] = useState(
    initialState.resultadoEtiqueta
  );

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successType, setSuccessType] = useState("");

  // --- EFECTO: CAMBIO DE PRODUCTO ---
  useEffect(() => {
    const saved = getStoredState(producto);
    setMarca(saved.marca);
    setModelo(saved.modelo);
    setManual(saved.manual);
    setFicha(saved.ficha);
    setEtiqueta(saved.etiqueta);
    setProgreso(saved.progreso);
    setInputKeys(saved.inputKeys);
    setResultadoFicha(saved.resultadoFicha);
    setResultadoManual(saved.resultadoManual);
    setResultadoEtiqueta(saved.resultadoEtiqueta);
  }, [producto]);

  // --- WRAPPERS DE ACTUALIZACIÓN ---
  const updateMarca = (val) => {
    setMarca(val);
    ALMACENAMIENTO[producto].marca = val;
  };
  const updateModelo = (val) => {
    setModelo(val);
    ALMACENAMIENTO[producto].modelo = val;
  };

  const updateArchivo = (tipo, file) => {
    if (tipo === "manual") {
      setManual(file);
      ALMACENAMIENTO[producto].manual = file;
    }
    if (tipo === "ficha") {
      setFicha(file);
      ALMACENAMIENTO[producto].ficha = file;
    }
    if (tipo === "etiqueta") {
      setEtiqueta(file);
      ALMACENAMIENTO[producto].etiqueta = file;
    }
  };

  const updateResultado = (tipo, data) => {
    if (tipo === "manual") {
      setResultadoManual(data);
      ALMACENAMIENTO[producto].resultadoManual = data;
    } else if (tipo === "etiqueta") {
      setResultadoEtiqueta(data);
      ALMACENAMIENTO[producto].resultadoEtiqueta = data;
    } else {
      setResultadoFicha(data);
      ALMACENAMIENTO[producto].resultadoFicha = data;
    }
  };

  const updateProgreso = (tipo, valor) => {
    setProgreso((prev) => {
      const nuevo = { ...prev, [tipo]: valor };
      ALMACENAMIENTO[producto].progreso = nuevo;
      return nuevo;
    });
  };

  const iniciarCarga = (e, tipo) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (archivo.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    updateArchivo(tipo, archivo);

    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      updateProgreso(tipo, p > 100 ? 100 : p);
      if (p >= 100) clearInterval(interval);
    }, 50);
  };

  const limpiarArchivo = (tipo) => {
    if (tipo === "manual") {
      setManual(null);
      setResultadoManual(null);
      ALMACENAMIENTO[producto].manual = null;
      ALMACENAMIENTO[producto].resultadoManual = null;
    } else if (tipo === "ficha") {
      setFicha(null);
      setResultadoFicha(null);
      ALMACENAMIENTO[producto].ficha = null;
      ALMACENAMIENTO[producto].resultadoFicha = null;
    } else if (tipo === "etiqueta") {
      setEtiqueta(null);
      setResultadoEtiqueta(null);
      ALMACENAMIENTO[producto].etiqueta = null;
      ALMACENAMIENTO[producto].resultadoEtiqueta = null;
    }

    updateProgreso(tipo, 0);
    setInputKeys((prev) => {
      const keys = { ...prev, [tipo]: prev[tipo] + 1 };
      ALMACENAMIENTO[producto].inputKeys = keys;
      return keys;
    });
  };

  const asegurarProducto = async (token) => {
    try {
      const res = await axios.post(
        `${API_URL}/productos/`,
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
    if (!marca.trim() || !modelo.trim())
      return alert("Completa Marca y Modelo.");

    let archivo;
    if (tipoArchivo === "manual") archivo = manual;
    else if (tipoArchivo === "ficha") archivo = ficha;
    else if (tipoArchivo === "etiqueta") archivo = etiqueta;

    if (!archivo) return alert(`Selecciona el archivo PDF de ${tipoArchivo}.`);

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Sesión expirada");
      return navigate("/login");
    }

    updateProgreso(tipoArchivo, 0);

    // Intervalo de simulación fluido
    const simulationInterval = setInterval(() => {
      setProgreso((prev) => {
        const current = prev[tipoArchivo] || 0;
        if (current >= 90) return prev;
        const incremento = current < 50 ? 2 : 0.5;
        return { ...prev, [tipoArchivo]: current + incremento };
      });
    }, 150);

    try {
      let nombreUI = "Ficha Técnica";
      let mensajeUI = "Analizando documento...";

      if (tipoArchivo === "manual") {
        nombreUI = "Manual";
        mensajeUI = "Analizando documento extenso...";
      } else if (tipoArchivo === "etiqueta") {
        nombreUI = "Etiqueta";
        mensajeUI = "Buscando logos y simbologías...";
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
        `${API_URL}/documentos/subir-analizar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 600000,
        }
      );

      clearInterval(simulationInterval);
      updateProgreso(tipoArchivo, 100);
      updateResultado(tipoArchivo, response.data);
      setSuccessType(nombreUI);

      setTimeout(() => {
        setLoading(false);
        setShowSuccessModal(true);
      }, 600);
    } catch (error) {
      clearInterval(simulationInterval);
      updateProgreso(tipoArchivo, 0);
      console.error(error);
      const msg =
        error.response?.data?.detail || "Ocurrió un error de conexión.";
      alert(`Error: ${msg}`);
      setLoading(false);
    }
  };

  const verReportePDF = (data, titulo) => {
    const reporte = {
      ...data,
      titulo_reporte: titulo,
      categoria_producto: producto,
      marca_producto: marca,
      modelo_producto: modelo,
      tipo_vista: "individual",
    };
    localStorage.setItem("ultimoAnalisis", JSON.stringify(reporte));
    window.open("/resultados-analisis", "_blank");
  };

  const verReporteGeneral = () => {
    if (!resultadoFicha && !resultadoManual && !resultadoEtiqueta)
      return alert("Sin resultados para reporte general.");
    const subReportes = [];
    if (resultadoFicha)
      subReportes.push({ titulo: "Ficha Técnica", data: resultadoFicha });
    if (resultadoManual)
      subReportes.push({ titulo: "Manual de Usuario", data: resultadoManual });
    if (resultadoEtiqueta)
      subReportes.push({ titulo: "Etiquetado", data: resultadoEtiqueta });

    const general = {
      titulo_reporte: "Reporte General de Conformidad",
      categoria_producto: producto,
      marca_producto: marca,
      modelo_producto: modelo,
      tipo_vista: "general",
      sub_reportes: subReportes,
    };
    localStorage.setItem("ultimoAnalisis", JSON.stringify(general));
    window.open("/resultados-analisis", "_blank");
  };

  const getPorcentajeActual = () => {
    if (loadingType === "Manual") return progreso.manual || 0;
    if (loadingType === "Etiqueta") return progreso.etiqueta || 0;
    return progreso.ficha || 0;
  };

  // --- COMPONENTE TARJETA ---
  // Se eliminó la prop 'typeLabel' que no se usaba
  const RenderCard = ({
    tipoKey,
    titulo,
    desc,
    color,
    icon,
    result,
    setFileFn,
    progress,
  }) => {
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
        <div
          className={`bg-linear-to-r ${grad} px-6 py-4 relative overflow-hidden`}
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-x-6 -translate-y-6"></div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
            {icon} {titulo}
          </h3>
        </div>

        <div className="p-6 grow flex flex-col">
          <p className="text-slate-500 mb-4 text-xs grow">{desc}</p>

          <div className="mb-4">
            {!fileValue ? (
              <input
                key={inputKeys[tipoKey]}
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
                <button
                  onClick={() => limpiarArchivo(tipoKey)}
                  disabled={loading}
                  className="p-1 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          <div className="h-1 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              className={`${
                color === "blue"
                  ? "bg-blue-600"
                  : color === "orange"
                  ? "bg-orange-500"
                  : "bg-purple-600"
              } h-full rounded-full transition-all duration-300`}
              style={{
                width: `${progress || 0}%`,
                opacity: progress > 0 ? 1 : 0,
              }}
            ></div>
          </div>

          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => procesarArchivo(tipoKey)}
              disabled={!fileValue || loading || result}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all shadow-md ${
                !fileValue || loading || result
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : `bg-linear-to-r ${grad} text-white transform hover:scale-105`
              }`}
            >
              {result ? "Analizado" : "Analizar"}
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
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-slate-50 to-blue-50/50 -z-10"></div>
      {loading && (
        <ModalCarga
          tipo={loadingType}
          mensaje={loadingMessage}
          porcentaje={getPorcentajeActual()}
        />
      )}
      {showSuccessModal && (
        <ModalFeedback
          tipo={successType}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

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
              Perfil
            </Link>
            <Link
              to="/historial"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              Historial
            </Link>
            <Link
              to="/soporte"
              className="px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              Soporte
            </Link>
            <li
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("auth");
                navigate("/");
              }}
              className="ml-4 px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              Cerrar sesión
            </li>
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in-up">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-wide mb-3">
            Nueva solicitud.
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Subir documentos para{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              {producto}
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Carga ficha técnica, manual de usuario y etiquetado para el análisis
            normativo.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-10 relative overflow-hidden max-w-4xl mx-auto">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-blue-500 to-indigo-500"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-extrabold">
              1
            </span>{" "}
            Información del producto.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 ml-1">
                Marca:
              </label>
              <input
                type="text"
                placeholder="Ej. Samsung..."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-5 py-3.5 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                value={marca}
                onChange={(e) => updateMarca(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 tracking-wider mb-2 ml-1">
                Modelo:
              </label>
              <input
                type="text"
                placeholder="Ej. UN55AU7000..."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-5 py-3.5 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                value={modelo}
                onChange={(e) => updateModelo(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 px-2 max-w-4xl mx-auto">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-extrabold">
            2
          </span>{" "}
          Carga y análisis de documentos.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-12">
          <RenderCard
            tipoKey="ficha"
            titulo="Ficha técnica"
            desc="Validación de especificaciones técnicas."
            color="blue"
            result={resultadoFicha}
            setFileFn={iniciarCarga}
            progress={progreso.ficha}
          />
          <RenderCard
            tipoKey="manual"
            titulo="Manual"
            desc="Verificación de contenido normativo."
            color="orange"
            result={resultadoManual}
            setFileFn={iniciarCarga}
            progress={progreso.manual}
          />
          <RenderCard
            tipoKey="etiqueta"
            titulo="Etiqueta"
            desc="Identificación de simbología."
            color="purple"
            result={resultadoEtiqueta}
            setFileFn={iniciarCarga}
            progress={progreso.etiqueta}
          />
        </div>

        {resultadoFicha && resultadoManual && resultadoEtiqueta && (
          <div className="flex justify-center mt-10 mb-8 animate-fade-in-up">
            <button
              onClick={verReporteGeneral}
              className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all font-bold flex items-center gap-3 border border-slate-700 transform"
            >
              <span className="text-xl"></span> Ver reporte general unificado
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
