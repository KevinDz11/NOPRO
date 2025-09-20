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

  const navigate = useNavigate();

  const longitudValida = contrasena.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const coinciden = contrasena === verificaContrasena && verificaContrasena.length > 0;

  const formularioValido =
    nombre.trim() &&
    correo.trim() &&
    longitudValida &&
    tieneMayuscula &&
    tieneNumero &&
    coinciden;

  const handleRegistro = (e) => {
    e.preventDefault();

    if (!formularioValido) {
      setError("Revisa los campos antes de continuar.");
      return;
    }

    setError("");
    navigate("/registro/verificacion", { state: { correo } });
  };

  return (
    <div className="min-h-screen bg-[#eaf3fa] flex items-center justify-center">
      <div className="bg-white flex shadow-lg rounded-xl overflow-hidden max-w-4xl w-full">
        {/* IZQUIERDA */}
        <div className="w-full md:w-1/2 p-10">
          <div className="flex items-center mb-6">
            <img src={logo} alt="NOPRO" className="h-8 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">NOPRO</h2>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            Crear una nueva cuenta
          </h3>

          <form onSubmit={handleRegistro}>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              type="email"
              placeholder="Introduce tu correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="relative mb-2">
              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-500 hover:underline"
              >
                {mostrarContrasena ? "Ocultar" : "Ver"}
              </button>
            </div>

            <div className="relative mb-2">
              <input
                type={mostrarVerifica ? "text" : "password"}
                placeholder="Verifica contraseña"
                value={verificaContrasena}
                onChange={(e) => setVerificaContrasena(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <li className={`${longitudValida ? "text-green-600" : "text-red-600"}`}>
                • Al menos 8 caracteres
              </li>
              <li className={`${tieneMayuscula ? "text-green-600" : "text-red-600"}`}>
                • Contiene al menos una letra mayúscula
              </li>
              <li className={`${tieneNumero ? "text-green-600" : "text-red-600"}`}>
                • Contiene al menos un número
              </li>
              <li className={`${coinciden ? "text-green-600" : "text-red-600"}`}>
                • Las contraseñas coinciden
              </li>
            </ul>

            {error && (
              <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!formularioValido}
              className={`w-full font-semibold py-2 rounded ${
                formularioValido
                  ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Registro
            </button>

            <p className="text-sm text-gray-600 mt-4 text-center">
              ¿Ya estás registrado?{" "}
              <Link to="/login" className="text-blue-500 hover:underline font-medium">
                Acceder
              </Link>
            </p>
          </form>
        </div>

        {/* DERECHA */}
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
