import { useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

export default function VerificarCuenta() {
  const location = useLocation();
  const correo = location.state?.correo || "user@gmail.com"; // fallback si no se envía

  return (
    <div className="min-h-screen bg-[#eaf3fa] flex items-center justify-center">
      <div className="bg-white flex shadow-lg rounded-xl overflow-hidden max-w-xl w-full">
        <div className="w-full p-10">
          <div className="flex items-center mb-6">
            <img src={logo} alt="NOPRO" className="h-8 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">NOPRO</h2>
          </div>

          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Verificar cuenta
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            Para verificar que eres tú, introduce el código de verificación que
            te hemos enviado a la dirección de correo electrónico indicada a
            continuación.
          </p>

          <p className="text-base font-medium text-gray-700 mb-4 text-center">
            {correo}
          </p>

          <div className="flex gap-4 mb-6">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded">
              Reenviar correo
            </button>
          </div>

          <input
            type="text"
            placeholder="Código de verificación"
            defaultValue="912369"
            className="w-full mb-6 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded">
            Verificar
          </button>
        </div>
      </div>
    </div>
  );
}
