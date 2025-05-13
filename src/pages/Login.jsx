import logo from "../assets/logo.png";
import { Link } from "react-router-dom";

export default function Login() {
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

          <form>
            <input
              type="email"
              placeholder="Introduce tu email"
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full mb-2 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <Link
              to="/nuevaContrasena"
              className="text-sm text-blue-500 hover:underline block mb-4"
            >
              ¿Has olvidado tu contraseña?
            </Link>

            <Link to="/registro/verificacion" className="w-full">
              <button
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded"
              >
                Acceder
              </button>
            </Link>

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
