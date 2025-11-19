import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

// --- COMPONENTE VISUAL: MODAL DE CARGA ---
const ModalCarga = ({ tipo, mensaje }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
    <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md animate-fade-in">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        Analizando {tipo}...
      </h3>
      <p className="text-gray-600 text-sm">{mensaje}</p>

      {tipo === "Manual" && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 font-semibold">
          ⚠️ Este proceso es exhaustivo y toma entre 3 a 5 minutos.
          <br />
          Por favor, no cierres esta pestaña.
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
      // Intentamos crear el producto. Si ya existe, el backend idealmente debería manejarlo
      // o devolver el ID del existente. Aquí asumimos creación simple.
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
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Carga (Bloquea la pantalla si loading es true) */}
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

      {/* Barra de Navegación */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={logo} alt="NOPRO" className="h-8 w-auto" />
          <span className="font-bold text-gray-700 text-lg tracking-tight">
            Gestión de Archivos
          </span>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-gray-500 hover:text-blue-600 transition"
        >
          ← Volver al Inicio
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Subir Documentos para{" "}
            <span className="text-blue-600">{producto}</span>
          </h1>
          <p className="text-gray-500 mt-2">
            Completa la información del producto y carga los archivos PDF
            requeridos.
          </p>
        </div>

        {/* Formulario de Marca y Modelo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            1. Información del Producto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                placeholder="Ej. Samsung, Dell, Philips..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                placeholder="Ej. X500-Pro, UN55AU7000..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Sección de Tarjetas de Carga */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          2. Carga y Análisis de Documentos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* --- TARJETA 1: FICHA TÉCNICA --- */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-600 px-6 py-3">
              <h3 className="text-white font-bold text-lg">Ficha Técnica</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
                Sube el PDF de especificaciones para verificar voltajes,
                potencias y conectividad.
              </p>

              {/* Input de Archivo */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Archivo PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(e, "ficha")}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Barra de Progreso Visual */}
              {progreso.ficha > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progreso.ficha}%` }}
                  ></div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => procesarArchivo("ficha")}
                  disabled={!ficha || loading}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition shadow-md 
                                ${
                                  !ficha || loading
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                >
                  {loading && loadingType === "Ficha Técnica"
                    ? "Analizando..."
                    : "Analizar"}
                </button>

                {resultadoFicha && (
                  <button
                    onClick={() =>
                      verReportePDF(resultadoFicha, "Reporte Ficha Técnica")
                    }
                    className="flex-1 py-2 px-4 rounded-lg font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition border border-blue-200"
                  >
                    📄 Ver PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --- TARJETA 2: MANUAL DE USUARIO --- */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="bg-orange-500 px-6 py-3">
              <h3 className="text-white font-bold text-lg">
                Manual de Usuario
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
                Análisis profundo de instrucciones de seguridad, mantenimiento y
                advertencias normativas.
              </p>

              {/* Input de Archivo */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Archivo PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(e, "manual")}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>

              {/* Barra de Progreso Visual */}
              {progreso.manual > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progreso.manual}%` }}
                  ></div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => procesarArchivo("manual")}
                  disabled={!manual || loading}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition shadow-md 
                                ${
                                  !manual || loading
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-orange-500 hover:bg-orange-600"
                                }`}
                >
                  {loading && loadingType === "Manual"
                    ? "Procesando..."
                    : "Analizar"}
                </button>

                {resultadoManual && (
                  <button
                    onClick={() =>
                      verReportePDF(
                        resultadoManual,
                        "Reporte Manual de Usuario"
                      )
                    }
                    className="flex-1 py-2 px-4 rounded-lg font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 transition border border-orange-200"
                  >
                    📄 Ver PDF
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
