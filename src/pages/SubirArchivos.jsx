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
          {tipo === "Manual" ? "📖" : "📄"}
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

  // "producto" viene de la URL (ej: /subir-archivos/Laptop) y sirve como la CATEGORÍA
  const { producto } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS DEL FORMULARIO ---
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");

  // --- ESTADOS DE LOS ARCHIVOS ---
  const [manual, setManual] = useState(null);
  const [ficha, setFicha] = useState(null);

  // --- ESTADOS DE UI (Carga y Progreso) ---
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(""); // "Ficha Técnica" o "Manual"
  const [progreso, setProgreso] = useState({ manual: 0, ficha: 0 });

  // --- ESTADOS DE RESULTADOS (Para activar los botones de PDF) ---
  const [resultadoFicha, setResultadoFicha] = useState(null);
  const [resultadoManual, setResultadoManual] = useState(null);

  // ---------------------------------------------------------
  //  FUNCIONES AUXILIARES
  // ---------------------------------------------------------

  // Simula la barra de carga al seleccionar archivo
  const iniciarCarga = (e, tipo) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    if (tipo === "manual") setManual(archivo);
    if (tipo === "ficha") setFicha(archivo);

    // Animación visual de la barra (0 a 100%)
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setProgreso((prev) => ({ ...prev, [tipo]: p > 100 ? 100 : p }));
      if (p >= 100) clearInterval(interval);
    }, 80);
  };

  // Asegura que el producto exista en BD antes de subir documentos
  const asegurarProducto = async (token) => {
    try {
      const res = await axios.post(
        "http://localhost:8000/productos/",
        {
          nombre: producto, // Ej: "Laptop"
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
      return alert(
        "Por favor, completa los campos de Marca y Modelo antes de iniciar."
      );
    }

    const archivo = tipoArchivo === "manual" ? manual : ficha;
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
      // 1. Activar Pantalla de Carga
      setLoadingType(tipoArchivo === "manual" ? "Manual" : "Ficha Técnica");
      setLoading(true);

      // 2. Obtener ID del Producto
      const idProducto = await asegurarProducto(token);

      // 3. Preparar datos para el Backend
      const formData = new FormData();
      formData.append("id_producto", idProducto);
      formData.append("nombre", `${tipoArchivo} - ${modelo}`);

      // DATOS CLAVE PARA LA IA:
      formData.append("tipo", tipoArchivo); // "ficha" o "manual"
      formData.append("categoria", producto); // "Laptop", "SmartTV", "Luminaria"

      formData.append("archivo", archivo);
      formData.append("analizar", "true"); // Interruptor para activar IA

      // 4. Enviar petición (Aumentamos timeout para el manual)
      const response = await axios.post(
        "http://localhost:8000/documentos/subir-analizar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 600000, // 10 minutos máximo de espera
        }
      );

      // 5. Guardar el resultado en el estado correspondiente
      if (tipoArchivo === "manual") {
        setResultadoManual(response.data);
        alert("¡Manual analizado correctamente!");
      } else {
        setResultadoFicha(response.data);
        alert("¡Ficha Técnica analizada correctamente!");
      }
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.detail ||
        "Ocurrió un error de conexión o tiempo de espera.";
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  //  VISUALIZACIÓN DE REPORTE
  // ---------------------------------------------------------
  const verReportePDF = (dataResultados, tituloReporte) => {
    // Guardamos los datos en LocalStorage para que la nueva pestaña los lea
    const datosParaReporte = {
      ...dataResultados,
      titulo_reporte: tituloReporte,
      categoria_producto: producto,
      marca_producto: marca,
      modelo_producto: modelo,
    };

    localStorage.setItem("ultimoAnalisis", JSON.stringify(datosParaReporte));

    // Abrimos la pestaña del reporte
    window.open("/resultados-analisis", "_blank");
  };

  // ---------------------------------------------------------
  //  RENDERIZADO (JSX)
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 pb-12 relative overflow-hidden">
      {/* Fondo Decorativo Sutil */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 to-blue-50/50 -z-10"></div>

      {/* Modal de Carga */}
      {loading && (
        <ModalCarga
          tipo={loadingType}
          mensaje={
            loadingType === "Manual"
              ? "Leyendo documentos extensos, aplicando NLP y verificando normas de seguridad..."
              : "Extrayendo especificaciones técnicas y validando etiquetado..."
          }
        />
      )}

      {/* NAVBAR MODERNO (Igual al de Home) */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm navbar px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
          {/* Logo con Link a Home */}
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

            {/* Botón Cerrar Sesión CORREGIDO */}
            <li
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("auth");
                navigate("/"); // Redirige a la landing page
              }}
              className="ml-4 px-5 py-2.5 rounded-full bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-red-500/30 cursor-pointer"
            >
              CERRAR SESIÓN
            </li>
          </ul>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10 animate-fade-in-up">
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
            Completa la información del producto y carga los archivos PDF
            requeridos para iniciar el análisis normativo inteligente.
          </p>
        </div>

        {/* Formulario de Marca y Modelo */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>

          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-extrabold">
              1
            </span>
            Información del Producto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                Marca
              </label>
              <input
                type="text"
                placeholder="Ej. Samsung, Dell, Philips..."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-5 py-3.5 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-blue-600 transition-colors">
                Modelo
              </label>
              <input
                type="text"
                placeholder="Ej. X500-Pro, UN55AU7000..."
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-5 py-3.5 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Sección de Tarjetas de Carga */}
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 px-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-extrabold">
            2
          </span>
          Carga y Análisis de Documentos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- TARJETA 1: FICHA TÉCNICA --- */}
          <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 group flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2 relative z-10">
                📄 Ficha Técnica
              </h3>
            </div>

            <div className="p-8 flex-grow flex flex-col">
              <p className="text-slate-500 mb-6 leading-relaxed text-sm flex-grow">
                Sube el PDF de especificaciones para verificar voltajes,
                potencias y conectividad.
              </p>

              {/* Input de Archivo */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Seleccionar Archivo
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(e, "ficha")}
                  disabled={loading}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1 transition-colors"
                />
              </div>

              {/* Barra de Progreso Visual */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full mb-6 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progreso.ficha}%`,
                    opacity: progreso.ficha > 0 ? 1 : 0,
                  }}
                ></div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => procesarArchivo("ficha")}
                  disabled={!ficha || loading}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg transform hover:-translate-y-0.5
                                ${
                                  !ficha || loading
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30"
                                }`}
                >
                  {loading && loadingType === "Ficha Técnica"
                    ? "Analizando..."
                    : "ANALIZAR"}
                </button>

                {resultadoFicha && (
                  <button
                    onClick={() =>
                      verReportePDF(resultadoFicha, "Reporte Ficha Técnica")
                    }
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-blue-700 bg-blue-50 hover:bg-blue-100 transition border border-blue-100 shadow-sm"
                  >
                    📄 VER PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --- TARJETA 2: MANUAL DE USUARIO --- */}
          <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 group flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2 relative z-10">
                📖 Manual de Usuario
              </h3>
            </div>

            <div className="p-8 flex-grow flex flex-col">
              <p className="text-slate-500 mb-6 leading-relaxed text-sm flex-grow">
                Análisis profundo de instrucciones de seguridad, mantenimiento y
                advertencias normativas.
              </p>

              {/* Input de Archivo */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Seleccionar Archivo
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(e, "manual")}
                  disabled={loading}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-slate-200 rounded-lg p-1 transition-colors"
                />
              </div>

              {/* Barra de Progreso Visual */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full mb-6 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progreso.manual}%`,
                    opacity: progreso.manual > 0 ? 1 : 0,
                  }}
                ></div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => procesarArchivo("manual")}
                  disabled={!manual || loading}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg transform hover:-translate-y-0.5
                                ${
                                  !manual || loading
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                    : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-orange-500/30"
                                }`}
                >
                  {loading && loadingType === "Manual"
                    ? "PROCESANDO..."
                    : "ANALIZAR"}
                </button>

                {resultadoManual && (
                  <button
                    onClick={() =>
                      verReportePDF(
                        resultadoManual,
                        "Reporte Manual de Usuario"
                      )
                    }
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide text-orange-700 bg-orange-50 hover:bg-orange-100 transition border border-orange-100 shadow-sm"
                  >
                    📄 VER PDF
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
