import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Importa useNavigate
import Joyride from "react-joyride";
import logo from "../assets/logo.PNG";
import { useAuthListener } from "../useAuthListener";

export default function SubirArchivos() {
  useAuthListener();
  const { producto } = useParams(); // "Laptop", "SmartTV", etc.
  const navigate = useNavigate(); // Hook para navegar

  // Estados del formulario y archivos
  const [tourOpen, setTourOpen] = useState(false);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [manual, setManual] = useState(null);
  const [etiquetado, setEtiquetado] = useState(null);
  const [ficha, setFicha] = useState(null);

  // Estados de UI y lógica
  const [progreso, setProgreso] = useState({
    manual: 0,
    etiquetado: 0,
    ficha: 0,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [analisisCompleto, setAnalisisCompleto] = useState(false); // Nuevo estado
  const [productoGuardado, setProductoGuardado] = useState(null); // Nuevo estado

  // --- PASOS DEL TOUR ---
  const steps = [
    {
      target: ".navbar",
      content:
        "Este es el menú de navegación, donde puedes acceder a otras partes de la aplicación.",
    },
    {
      target: ".help-button",
      content: "Haz clic aquí para abrir este tutorial.",
    },
    {
      target: ".formulario-producto",
      content: "Aquí puedes escribir la marca y modelo del producto.",
    },
    {
      target: ".tarjeta-archivos",
      content: "Estas son las secciones para subir los documentos requeridos.",
    },
    {
      target: ".AnalizarDocs",
      content:
        "Una vez cargados los documentos, presiona este botón para analizarlos.",
    },
  ];

  // --- VALIDACIÓN DE FORMULARIO ---
  const esFormularioValido =
    marca.trim() !== "" &&
    modelo.trim() !== "" &&
    manual !== null &&
    etiquetado !== null &&
    ficha !== null;

  // --- OBTENER ICONO ---
  const obtenerIcono = (nombre) => {
    const iconos = {
      laptop: "💻",
      smarttv: "📺",
      luminaria: "💡",
    };
    return iconos[nombre.toLowerCase()] || "📁";
  };

  // --- LÓGICA DE CARGA DE ARCHIVOS ---
  const iniciarCarga = (e, tipo) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    const setArchivo = {
      manual: setManual,
      etiquetado: setEtiquetado,
      ficha: setFicha,
    }[tipo];

    setArchivo(archivo);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setProgreso((prev) => ({ ...prev, [tipo]: prog }));
      if (prog >= 100) clearInterval(interval);
    }, 100);
  };

  const quitarArchivo = (tipo) => {
    const reset = {
      manual: () => setManual(null),
      etiquetado: () => setEtiquetado(null),
      ficha: () => setFicha(null),
    };
    reset[tipo]?.();
    setProgreso((prev) => ({ ...prev, [tipo]: 0 }));
  };

  // --- FUNCIÓN DE ANÁLISIS (MODIFICADA) ---
  const analizar = async () => {
    if (!esFormularioValido) {
      setError(
        "Debes completar la marca, modelo y subir los 3 archivos en formato PDF."
      );
      return;
    }

    setError("");
    setCargando(true);
    setAnalisisCompleto(false); // Resetea en caso de re-análisis
    setProductoGuardado(null);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      navigate("/login");
      return;
    }

    try {
      // 1. Crear el producto en la base de datos
      const responseProducto = await fetch("http://localhost:8000/productos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: producto, // "Laptop", "SmartTV"...
          marca: marca,
          descripcion: modelo, // Usamos 'descripcion' para 'modelo'
        }),
      });

      if (!responseProducto.ok) {
        const errorData = await responseProducto.json();
        throw new Error(errorData.detail || "Error al guardar el producto.");
      }

      const productoCreado = await responseProducto.json();
      setProductoGuardado(productoCreado); // Guardamos datos del producto

      // 2. Simular el análisis de documentos (aquí iría la subida de archivos real)
      console.log("Producto guardado:", productoCreado);
      console.log("Simulando análisis de archivos...");
      // Simula una demora por el análisis
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Marcar como completo
      alert("Análisis simulado iniciado correctamente.");
      setAnalisisCompleto(true); // Habilita el botón de resumen
    } catch (err) {
      console.error("Error en el proceso:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  // --- NUEVA FUNCIÓN: VISUALIZAR RESUMEN (SIMULADO) ---
  const handleVerResumen = () => {
    if (!productoGuardado) return;

    const pdfTemplate = `
      <html>
        <head>
          <title>Resumen de Análisis - NOPRO</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header img { height: 40px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { margin-top: 30px; }
            .content h2 { font-size: 20px; border-bottom: 1px solid #ccc; }
            .info { line-height: 1.6; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logo}" alt="NOPRO Logo" />
            <h1>NOPRO - Resumen de Análisis</h1>
          </div>
          
          <div class="content">
            <h2>Datos del Producto Analizado</h2>
            <div class="info">
              <strong>Empresa:</strong> NOPRO S.A. de C.V.<br/>
              <strong>Producto:</strong> ${productoGuardado.nombre}<br/>
              <strong>Marca:</strong> ${productoGuardado.marca}<br/>
              <strong>Modelo:</strong> ${productoGuardado.descripcion}<br/>
              <strong>Fecha de Registro:</strong> ${new Date(
                productoGuardado.fecha_registro
              ).toLocaleString("es-ES")}
            </div>
            
            <h2 style="margin-top: 30px;">Resultados del Análisis (Simulación)</h2>
            <p>Este es un documento simulado. Aquí se mostrarían los resultados detallados del análisis de normas (NOMs) aplicables al producto.</p>
            <ul>
              <li>Norma A: Cumple</li>
              <li>Norma B: No Cumple</li>
              <li>Norma C: N/A</li>
            </ul>
          </div>
          
          <div class="footer">
            Documento generado por NOPRO &copy; ${new Date().getFullYear()}
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open("", "_blank");
    newWindow.document.write(pdfTemplate);
    newWindow.document.close();
  };

  const tarjetas = [
    { titulo: "Manual", tipo: "manual", archivo: manual },
    { titulo: "Etiquetado", tipo: "etiquetado", archivo: etiquetado },
    { titulo: "Ficha Técnica", tipo: "ficha", archivo: ficha },
  ];

  return (
    <>
      <Joyride
        steps={steps}
        run={tourOpen}
        continuous
        scrollToFirstStep
        showSkipButton
        styles={{ options: { zIndex: 10000 } }}
        callback={(data) => {
          if (["finished", "skipped"].includes(data.status)) {
            setTourOpen(false);
          }
        }}
      />

      <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow navbar">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <Link
            to="/"
            className="text-xl font-bold text-gray-800 hover:underline"
          >
            NOPRO
          </Link>
        </div>

        <ul className="hidden md:flex items-center space-x-4 font-medium text-sm text-gray-700">
          <li
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300 help-button"
            onClick={() => setTourOpen(true)}
          >
            AYUDA
          </li>

          <Link
            to="/perfil"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            PERFIL
          </Link>
          <Link
            to="/historial"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            HISTORIAL PRODUCTOS
          </Link>
          <Link
            to="/soporte"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            CONTACTAR SOPORTE
          </Link>
          <Link to="/">
            <li className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300">
              CERRAR SESIÓN
            </li>
          </Link>
        </ul>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 p-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Subir archivos para{" "}
          <span className="text-orange-600 capitalize">
            {producto} {obtenerIcono(producto)}
          </span>
        </h2>

        {/* --- Formulario de Marca/Modelo --- */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto mb-10 formulario-producto">
          <p className="text-center text-gray-700 mb-4 font-medium">
            Esta información se verá reflejada en tu historial. Lo que se
            escriba queda bajo su consideración.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Tipo de producto
              </label>
              <input
                type="text"
                value={producto}
                readOnly
                className="w-full border rounded px-4 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ingresa tu marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className={`w-full border rounded px-4 py-2 ${
                  marca.trim() === "" ? "border-red-400" : "border-gray-300"
                }`} // Validación visual
                disabled={cargando}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ingresa tu modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className={`w-full border rounded px-4 py-2 ${
                  modelo.trim() === "" ? "border-red-400" : "border-gray-300"
                }`} // Validación visual
                disabled={cargando}
              />
            </div>
          </div>
        </div>

        {/* --- Tarjetas de Archivos --- */}
        <div className="grid md:grid-cols-3 gap-6 tarjeta-archivos">
          {tarjetas.map(({ titulo, tipo, archivo }) => (
            <div
              key={tipo}
              className={`relative border-2 rounded-xl p-6 bg-white shadow-md transition-all duration-300 overflow-hidden ${
                archivo
                  ? "border-blue-600 border-solid"
                  : "border-black border-dashed"
              }`}
            >
              <div
                className="absolute bottom-0 left-0 w-full bg-blue-300 transition-all duration-500 opacity-30"
                style={{ height: `${progreso[tipo]}%`, zIndex: 0 }}
              ></div>

              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-center mb-4">
                  {titulo}
                </h2>

                <input
                  type="file"
                  id={`archivo-${tipo}`}
                  className="hidden"
                  onChange={(e) => iniciarCarga(e, tipo)}
                  disabled={cargando}
                />
                <label
                  htmlFor={`archivo-${tipo}`}
                  className={`bg-blue-500 text-white px-4 py-2 rounded cursor-pointer block text-center w-full mb-2 ${
                    cargando ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Seleccionar archivo
                </label>

                {archivo && (
                  <>
                    <button
                      type="button"
                      onClick={() => quitarArchivo(tipo)}
                      className="bg-red-500 text-white px-4 py-2 rounded block text-center w-full mb-2 hover:bg-red-600 disabled:opacity-50"
                      disabled={cargando}
                    >
                      Quitar archivo
                    </button>
                    <p className="text-center text-sm text-green-700 mt-1">
                      {archivo.name}
                    </p>
                  </>
                )}

                <div
                  className={`h-2 rounded mt-3 overflow-hidden transition-all duration-300 ${
                    progreso[tipo] > 0 && progreso[tipo] < 100
                      ? "bg-blue-200"
                      : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      progreso[tipo] < 100 ? "bg-blue-500" : "bg-green-500"
                    }`}
                    style={{ width: `${progreso[tipo]}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- Mensaje de Error --- */}
        {error && (
          <p className="text-center text-red-600 bg-red-100 p-3 rounded-lg max-w-4xl mx-auto mt-6">
            {error}
          </p>
        )}

        {/* --- Botones de Acción --- */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 transition AnalizarDocs disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={analizar}
            disabled={!esFormularioValido || cargando} // Validación aplicada
          >
            {cargando ? "Analizando..." : "Analizar documentos"}
          </button>

          {/* Botón de Resumen (Condicional) */}
          {analisisCompleto && (
            <button
              className="bg-green-600 text-white px-6 py-3 rounded shadow hover:bg-green-700 transition"
              onClick={handleVerResumen}
            >
              Visualizar resumen de los resultados
            </button>
          )}
        </div>
      </div>
    </>
  );
}
