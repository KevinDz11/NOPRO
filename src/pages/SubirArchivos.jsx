import logo from "../assets/logo.PNG";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";

export default function SubirArchivos() {
  const { producto } = useParams();
  const [manual, setManual] = useState(null);
  const [etiquetado, setEtiquetado] = useState(null);
  const [ficha, setFicha] = useState(null);
  
  

  const [progreso, setProgreso] = useState({
    manual: 0,
    etiquetado: 0,
    ficha: 0,
  });

  const iniciarCarga = (tipo, archivo) => {
    if (archivo) {
      switch (tipo) {
        case "manual":
          setManual(archivo);
          break;
        case "etiquetado":
          setEtiquetado(archivo);
          break;
        case "ficha":
          setFicha(archivo);
          break;
        default:
          break;
      }

      let porcentaje = 0;
      const intervalo = setInterval(() => {
        porcentaje += 10;
        setProgreso((prev) => ({ ...prev, [tipo]: porcentaje }));
        if (porcentaje >= 100) {
          clearInterval(intervalo);
        }
      }, 100); // simula carga en 1s
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Producto:", producto);
    console.log("Manual:", manual);
    console.log("Etiquetado:", etiquetado);
    console.log("Ficha técnica:", ficha);
  };

  const tarjetas = [
    { tipo: "manual", titulo: "Manual", archivo: manual },
    { tipo: "etiquetado", titulo: "Etiquetado", archivo: etiquetado },
    { tipo: "ficha", titulo: "Ficha Técnica", archivo: ficha },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-blue-300 p-6">
      <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">
        Subir archivos para{" "}
        <span className="text-orange-600">{producto}</span>
      </h2>

      <form onSubmit={handleSubmit} className="w-full max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {tarjetas.map(({ tipo, titulo, archivo }) => (
            <div
              key={tipo}
              className="relative h-60 rounded-xl shadow-md overflow-hidden bg-white transition-all"
            >
              {/* Fondo tipo "vaso de agua" */}
              <div
                className="absolute bottom-0 left-0 w-full bg-blue-400 transition-all duration-300"
                style={{
                  height: `${progreso[tipo]}%`,
                  opacity: progreso[tipo] > 0 ? 0.3 : 0,
                  zIndex: 0,
                }}
              ></div>

              {/* Borde dinámico */}
              <div
                className={`absolute inset-0 pointer-events-none rounded-xl border-2 transition-all duration-300 ${
                  archivo
                    ? "border-blue-500"
                    : "border-dashed border-gray-400"
                }`}
              ></div>

              {/* Contenido */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
                <h3 className="text-lg font-semibold mb-4">{titulo}</h3>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => iniciarCarga(tipo, e.target.files[0])}
                  className="text-sm text-gray-700 file:bg-blue-500 file:text-white file:px-4 file:py-2 file:rounded file:border-none file:cursor-pointer"
                  required
                />
                {archivo && (
                  <p className="mt-2 text-sm text-green-700">
                    {archivo.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="mt-10 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Analizar documentos
        </button>
      </form>
    </div>
  );
}