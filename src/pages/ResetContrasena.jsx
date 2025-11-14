import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/logo.png";

export default function ResetContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verificaContrasena, setVerificaContrasena] = useState("");

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarVerifica, setMostrarVerifica] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // Obtener el token de la URL al cargar
  useEffect(() => {
    const tokenDeURL = searchParams.get("token");
    if (tokenDeURL) {
      setToken(tokenDeURL);
    } else {
      setError("Token no encontrado. Asegúrate de usar el enlace correcto.");
    }
  }, [searchParams]);

  // Validaciones
  const longitudValida = contrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const coinciden =
    contrasena === verificaContrasena && verificaContrasena.length > 0;

  const formularioValido =
    token && longitudValida && tieneMayuscula && tieneNumero && coinciden;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!formularioValido) {
      setError("Por favor, completa la contraseña cumpliendo los requisitos.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(
        "http://localhost:8000/clientes/ejecutar-reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            nueva_contrasena: contrasena,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al cambiar la contraseña.");
      }

      setMensaje("¡Contraseña cambiada con éxito! Redirigiendo al login...");

      localStorage.removeItem("authToken");
      localStorage.removeItem("auth");

      // Espera 3 segundos y redirige al login
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Error en el reseteo:", err);
      setError(
        err.message ||
          "Ocurrió un error. El token podría ser inválido o haber expirado."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf3fa] flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden max-w-lg w-full p-10">
        <div className="flex items-center mb-6 justify-center">
          <img src={logo} alt="NOPRO" className="h-8 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">NOPRO</h2>
        </div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Crear nueva contraseña
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Input Contraseña */}
          <div className="relative mb-2">
            <input
              type={mostrarContrasena ? "text" : "password"}
              placeholder="Nueva Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={cargando || !!mensaje} // Deshabilita si ya tuvo éxito
            />
            <button
              type="button"
              onClick={() => setMostrarContrasena(!mostrarContrasena)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-500 hover:underline"
            >
              {mostrarContrasena ? "Ocultar" : "Ver"}
            </button>
          </div>
          {/* Input Verifica Contraseña */}
          <div className="relative mb-2">
            <input
              type={mostrarVerifica ? "text" : "password"}
              placeholder="Verifica la contraseña"
              value={verificaContrasena}
              onChange={(e) => setVerificaContrasena(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={cargando || !!mensaje}
            />
            <button
              type="button"
              onClick={() => setMostrarVerifica(!mostrarVerifica)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-500 hover:underline"
            >
              {mostrarVerifica ? "Ocultar" : "Ver"}
            </button>
          </div>

          {/* Lista de condiciones */}
          <ul className="text-sm mb-4 pl-5 space-y-1">
            <li
              className={`${
                longitudValida ? "text-green-600" : "text-red-600"
              }`}
            >
              • Al menos 8 caracteres
            </li>
            <li
              className={`${
                tieneMayuscula ? "text-green-600" : "text-red-600"
              }`}
            >
              • Contiene al menos una letra mayúscula
            </li>
            <li
              className={`${tieneNumero ? "text-green-600" : "text-red-600"}`}
            >
              • Contiene al menos un número
            </li>
            <li className={`${coinciden ? "text-green-600" : "text-red-600"}`}>
              • Las contraseñas coinciden
            </li>
          </ul>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Mensaje de éxito */}
          {mensaje && (
            <div className="bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded mb-4 text-sm">
              {mensaje}
            </div>
          )}

          {/* Botón de Registro */}
          <button
            type="submit"
            disabled={!formularioValido || cargando || !!mensaje}
            className={`w-full font-semibold py-2 rounded ${
              formularioValido && !cargando && !mensaje
                ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
