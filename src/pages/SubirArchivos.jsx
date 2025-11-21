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
        {/* Icono central decorativo */}
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

export default function SubirArchivos() {
  // Verificar sesión
  useAuthListener();

  // "producto" viene de la URL (ej: /subir-archivos/Laptop)
  const { producto } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS DEL FORMULARIO ---
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");

  // --- ESTADOS DE LOS ARCHIVOS ---
  const [manual, setManual] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [etiqueta, setEtiqueta] = useState(null);

  // --- ESTADOS DE UI (Carga y Progreso) ---
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [loadingMessage, setLoadingMessage] = useState(""); // <--- NUEVO: Estado para el mensaje
  const [progreso, setProgreso] = useState({
    manual: 0,
    ficha: 0,
    etiqueta: 0,
  });

  // --- ESTADOS DE RESULTADOS ---
  const [resultadoFicha, setResultadoFicha] = useState(null);
  const [resultadoManual, setResultadoManual] = useState(null);
  const [resultadoEtiqueta, setResultadoEtiqueta] = useState(null);

  // ---------------------------------------------------------
  //  FUNCIONES AUXILIARES
  // ---------------------------------------------------------

  const iniciarCarga = (e, tipo) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    // Asignación según tipo
    if (tipo === "manual") setManual(archivo);
    if (tipo === "ficha") setFicha(archivo);
    if (tipo === "etiqueta") setEtiqueta(archivo);

    // Animación visual de la barra (0 a 100%)
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setProgreso((prev) => ({ ...prev, [tipo]: p > 100 ? 100 : p }));
      if (p >= 100) clearInterval(interval);
    }, 80);
  };

  const asegurarProducto = async (token) => {
    try {
      const res = await axios.post(
        "http://localhost:8000/productos/",
        {
          nombre: producto,
          marca: marca,
          descripcion: modelo,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data.id_producto;
    } catch (error) {
      console.error("Error creando producto:", error);
      throw new Error("No se pudo registrar el producto en la base de datos.");
    }
  };

  // ---------------------------------------------------------
  //  LÓGICA PRINCIPAL DE ANÁLISIS
  // ---------------------------------------------------------
  const procesarArchivo = async (tipoArchivo) => {
    // Validaciones básicas
    if (!marca.trim() || !modelo.trim()) {
      return alert("Por favor, completa Marca y Modelo antes de iniciar.");
    }

    // Selección del archivo correcto
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
      // 1. Configurar UI de Carga
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
      setLoadingMessage(mensajeUI); // <--- CORRECCIÓN: Guardamos el mensaje en el estado
      setLoading(true);

      // 2. Obtener ID del Producto
      const idProducto = await asegurarProducto(token);

      // 3. Preparar datos para el Backend
      const formData = new FormData();
      formData.append("id_producto", idProducto);
      formData.append("nombre", `${tipoArchivo} - ${modelo}`);

      // DATOS CLAVE PARA LA IA:
      formData.append("tipo", tipoArchivo);
      formData.append("categoria", producto);
      formData.append("marca", marca); // Enviamos la marca para validación

      formData.append("archivo", archivo);
      formData.append("analizar", "true");

      // 4. Enviar petición
      const response = await axios.post(
        "http://localhost:8000/documentos/subir-analizar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 600000, // 10 minutos máximo
        }
      );

      // 5. Guardar el resultado
      if (tipoArchivo === "manual") {
        setResultadoManual(response.data);
        alert("¡Manual analizado correctamente!");
      } else if (tipoArchivo === "etiqueta") {
        setResultadoEtiqueta(response.data);
        alert("¡Etiqueta analizada con IA Visual!");
      } else {
        setResultadoFicha(response.data);
        alert("¡Ficha Técnica analizada correctamente!");
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

  // ---------------------------------------------------------
  //  VISUALIZACIÓN DE REPORTE
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  //  RENDERIZADO (JSX)
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 pb-12 relative overflow-hidden">
      {/* Fondo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/50 -z-10"></div>

      {/* Modal de Carga CORREGIDO: Ahora usa loadingMessage */}
      {loading && <ModalCarga tipo={loadingType} mensaje={loadingMessage} />}

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
        {/* Encabezado */}
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
            Carga Ficha Técnica, Manual y Etiquetado para un análisis normativo
            integral.
          </p>
        </div>

        {/* Formulario de Marca y Modelo */}
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

        {/* Sección de Tarjetas de Carga (GRID DE 3 COLUMNAS) */}
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 px-2 max-w-4xl mx-auto">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-extrabold">
            2
          </span>
          Carga y Análisis de Documentos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* --- TARJETA 1: FICHA TÉCNICA --- */}
          <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 group flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-x-6 -translate-y-6"></div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
                📄 Ficha Técnica
              </h3>
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <p className="text-slate-500 mb-4 text-xs flex-grow">
                Especificaciones de voltaje y potencia.
              </p>
              <div className="mb-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(e, "ficha")}
                  disabled={loading}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1"
                />
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progreso.ficha}%`,
                    opacity: progreso.ficha > 0 ? 1 : 0,
                  }}
                ></div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => procesarArchivo("ficha")}
                  disabled={!ficha || loading}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all shadow-md ${
                    !ficha || loading
                      ? "bg-slate-200 text-slate-400"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  }`}
                >
                  {loading && loadingType === "Ficha Técnica"
                    ? "..."
                    : "ANALIZAR"}
                </button>
                {resultadoFicha && (
                  <button
                    onClick={() =>
                      verReportePDF(resultadoFicha, "Reporte Ficha Técnica")
                    }
                    className="py-2 px-3 rounded-lg font-bold text-xs text-blue-700 bg-blue-50 border border-blue-100"
                  >
                    VER PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --- TARJETA 2: MANUAL DE USUARIO --- */}
          <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 group flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-x-6 -translate-y-6"></div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
                📖 Manual
              </h3>
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <p className="text-slate-500 mb-4 text-xs flex-grow">
                Instrucciones de seguridad y mantenimiento.
              </p>
              <div className="mb-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(e, "manual")}
                  disabled={loading}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-slate-200 rounded-lg p-1"
                />
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progreso.manual}%`,
                    opacity: progreso.manual > 0 ? 1 : 0,
                  }}
                ></div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => procesarArchivo("manual")}
                  disabled={!manual || loading}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all shadow-md ${
                    !manual || loading
                      ? "bg-slate-200 text-slate-400"
                      : "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  }`}
                >
                  {loading && loadingType === "Manual" ? "..." : "ANALIZAR"}
                </button>
                {resultadoManual && (
                  <button
                    onClick={() =>
                      verReportePDF(resultadoManual, "Reporte Manual")
                    }
                    className="py-2 px-3 rounded-lg font-bold text-xs text-orange-700 bg-orange-50 border border-orange-100"
                  >
                    VER PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --- TARJETA 3: ETIQUETA (NUEVA) --- */}
          <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 group flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-x-6 -translate-y-6"></div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
                🏷️ Etiqueta
              </h3>
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <p className="text-slate-500 mb-4 text-xs flex-grow">
                IA Visual para detectar logos NOM y advertencias.
              </p>
              <div className="mb-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(e, "etiqueta")}
                  disabled={loading}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer border border-slate-200 rounded-lg p-1"
                />
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progreso.etiqueta}%`,
                    opacity: progreso.etiqueta > 0 ? 1 : 0,
                  }}
                ></div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => procesarArchivo("etiqueta")}
                  disabled={!etiqueta || loading}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all shadow-md ${
                    !etiqueta || loading
                      ? "bg-slate-200 text-slate-400"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  }`}
                >
                  {loading && loadingType === "Etiqueta" ? "..." : "ANALIZAR"}
                </button>
                {resultadoEtiqueta && (
                  <button
                    onClick={() =>
                      verReportePDF(resultadoEtiqueta, "Reporte Etiqueta")
                    }
                    className="py-2 px-3 rounded-lg font-bold text-xs text-purple-700 bg-purple-50 border border-purple-100"
                  >
                    VER PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
