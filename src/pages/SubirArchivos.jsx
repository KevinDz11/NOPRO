import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Joyride from "react-joyride";
import logo from "../assets/logo.PNG";

export default function SubirArchivos() {
  const { producto } = useParams();
  const [tourOpen, setTourOpen] = useState(false);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [manual, setManual] = useState(null);
  const [etiquetado, setEtiquetado] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [progreso, setProgreso] = useState({
    manual: 0,
    etiquetado: 0,
    ficha: 0,
  });

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
      content:
        "Aquí puedes verificar el producto y escribir la marca y modelo.",
    },
    {
      target: ".tarjeta-archivos",
      content: "Estas son las secciones para subir los documentos requeridos.",
    },
    {
      target: ".AnalizarDocs",
      content:
        "Una vez cargados los documentos, presiona el botón es para analizarlos.",
    },
  ];

  const obtenerIcono = (nombre) => {
    const iconos = {
      laptop: "💻",
      smarttv: "📺",
      luminaria: "💡",
    };
    return iconos[nombre.toLowerCase()] || "📁";
  };

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

  const analizar = () => {
    alert("Análisis iniciado");
  };

  const tarjetas = [
    { titulo: "Manual", tipo: "manual", archivo: manual },
    { titulo: "Etiquetado", tipo: "etiquetado", archivo: etiquetado },
    { titulo: "Ficha Técnica", tipo: "ficha", archivo: ficha },
  ];

  return (
    <>
      {/* Tour de Ayuda */}
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

      {/* NAVBAR */}
      <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow navbar">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="NOPRO" className="h-8" />
            <span className="text-xl font-bold text-gray-800">NOPRO</span>
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
            to="/soporte"
            className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300"
          >
            CONTACTAR SOPORTE
          </Link>
          <li className="cursor-pointer text-blue-600 hover:bg-blue-100 hover:text-blue-800 py-2 px-4 rounded-lg transition-all duration-300">
            CERRAR SESIÓN
          </li>
        </ul>
      </nav>

      {/* Contenido Principal */}
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 p-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Subir archivos para{" "}
          <span className="text-orange-600 capitalize">
            {producto} {obtenerIcono(producto)}
          </span>
        </h2>

        {/* Formulario producto */}
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
                className="w-full border rounded px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ingresa tu modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full border rounded px-4 py-2"
              />
            </div>
          </div>
        </div>

        {/* Tarjetas de archivos */}
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
              {/* Efecto "vaso de agua" */}
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
                />
                <label
                  htmlFor={`archivo-${tipo}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer block text-center w-full mb-2"
                >
                  Seleccionar archivo
                </label>

                {archivo && (
                  <>
                    <button
                      type="button"
                      onClick={() => quitarArchivo(tipo)}
                      className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer block text-center w-full mb-2 hover:bg-red-600"
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

        <div className="flex justify-center mt-8">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 transition AnalizarDocs"
            onClick={analizar}
          >
            Analizar documentos
          </button>
        </div>
      </div>
    </>
  );
}
