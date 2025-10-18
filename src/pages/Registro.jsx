import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verificaContrasena, setVerificaContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarVerifica, setMostrarVerifica] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false); // Para indicar que se está procesando

  const navigate = useNavigate();

  // Validaciones (igual que antes)
  const longitudValida = contrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const coinciden =
    contrasena === verificaContrasena && verificaContrasena.length > 0;
  const esCorreoValido = /\S+@\S+\.\S+/.test(correo);

  const formularioValido =
    nombre.trim() &&
    esCorreoValido &&
    longitudValida &&
    tieneMayuscula &&
    tieneNumero &&
    coinciden;

  // --- FUNCIÓN MODIFICADA ---
  const handleRegistro = async (e) => {
    e.preventDefault();
    setError(""); // Limpia errores previos

    if (!formularioValido) {
      setError("Por favor, completa todos los campos correctamente.");
      return;
    }

    setCargando(true); // Muestra indicador de carga

    try {
      const response = await fetch("http://localhost:8000/clientes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre,
          email: correo,
          contrasena: contrasena,
        }),
      });

      if (!response.ok) {
        // Si el backend devuelve un error (ej. email ya existe)
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar la cuenta.");
      }

      // Si el registro fue exitoso, navega a la página de verificación
      navigate("/registro/verificacion", { state: { correo } });
    } catch (err) {
      console.error("Error en el registro:", err);
      setError(
        err.message || "Ocurrió un error inesperado. Inténtalo de nuevo."
      );
    } finally {
      setCargando(false); // Oculta indicador de carga
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf3fa] flex items-center justify-center">
      <div className="bg-white flex shadow-lg rounded-xl overflow-hidden max-w-4xl w-full">
        {/* IZQUIERDA (Formulario) */}
        <div className="w-full md:w-1/2 p-10">
          <div className="flex items-center mb-6">
            <img src={logo} alt="NOPRO" className="h-8 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">NOPRO</h2>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Crear una nueva cuenta
          </h3>

          <form onSubmit={handleRegistro}>
            {/* Input Nombre */}
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={cargando}
            />
            {/* Input Correo */}
            <input
              type="email"
              placeholder="Introduce tu correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={cargando}
            />
            {/* Input Contraseña */}
            <div className="relative mb-2">
              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={cargando}
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
                placeholder="Verifica contraseña"
                value={verificaContrasena}
                onChange={(e) => setVerificaContrasena(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={cargando}
              />
              <button
                type="button"
                onClick={() => setMostrarVerifica(!mostrarVerifica)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-500 hover:underline"
              >
                {mostrarVerifica ? "Ocultar" : "Ver"}
              </button>
            </div>

            {/* Lista de condiciones (igual que antes) */}
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
              <li
                className={`${coinciden ? "text-green-600" : "text-red-600"}`}
              >
                • Las contraseñas coinciden
              </li>
            </ul>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Botón de Registro */}
            <button
              type="submit"
              disabled={!formularioValido || cargando} // Deshabilitado si no es válido o está cargando
              className={`w-full font-semibold py-2 rounded ${
                formularioValido && !cargando
                  ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {cargando ? "Registrando..." : "Registro"}
            </button>

            {/* Link a Login */}
            <p className="text-sm text-gray-600 mt-4 text-center">
              ¿Ya estás registrado?{" "}
              <Link
                to="/login"
                className="text-blue-500 hover:underline font-medium"
              >
                Acceder
              </Link>
            </p>
          </form>
        </div>

        {/* DERECHA (Panel informativo) */}
        <div className="hidden md:flex w-1/2 bg-[#d2e8f9] items-center justify-center p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Crea tu nueva cuenta
            </h3>
            <p className="text-sm text-gray-600">
              Crea tu nueva cuenta ingresando tu nombre, correo electrónico y
              contraseña para acceder a NOPRO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
