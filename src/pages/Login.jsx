import { useState } from "react";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();

  const esCorreoValido = (correo) => /\S+@\S+\.\S+/.test(correo);
  const esFormularioValido = () =>
    esCorreoValido(email) && password.length >= 8;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!esFormularioValido()) {
      setMensaje(
        "Introduce un correo válido y una contraseña de al menos 8 caracteres."
      );
      return;
    }

    // Simula autenticación
    localStorage.setItem("auth", "true");
    navigate("/Home");
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
            Acceder a mi cuenta
          </h3>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Introduce tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-2 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <Link
              to="/nuevaContrasena"
              className="text-sm text-blue-500 hover:underline block mb-4"
            >
              ¿Has olvidado tu contraseña?
            </Link>

            <button
              type="submit"
              disabled={!esFormularioValido()}
              className={`w-full font-semibold py-2 rounded ${
                esFormularioValido()
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Acceder
            </button>

            {mensaje && (
              <p className="text-sm text-center mt-3 text-red-600 font-medium">
                {mensaje}
              </p>
            )}

            <p className="text-sm text-gray-600 mt-4 text-center">
              ¿Aún no tienes cuenta?{" "}
              <Link
                to="/registro"
                className="text-blue-500 hover:underline font-medium"
              >
                Crear una cuenta
              </Link>
            </p>
          </form>
        </div>

        {/* DERECHA */}
        <div className="hidden md:flex w-1/2 bg-[#d2e8f9] items-center justify-center p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Accede a tu cuenta en NOPRO
            </h3>
            <p className="text-sm text-gray-600">
              Ingresa tu correo electrónico y contraseña para acceder a tu
              cuenta en NOPRO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
