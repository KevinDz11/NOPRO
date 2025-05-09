import logo from "../assets/logo.png";
export default function NuevaContrasena() {
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
            Reestablece tu contraseña
          </h3>

          <form>
            <input
              type="email"
              placeholder="Introduce tu email"
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded"
            >
              Enviar
            </button>

            <p className="text-sm text-gray-600 mt-4 text-center">
              ¿Ya estás registrado?{" "}
              <a href="/login" className="text-blue-500 hover:underline font-medium">
                Acceder
              </a>
            </p>
          </form>
        </div>

        {/* DERECHA */}
        <div className="hidden md:flex w-1/2 bg-[#d2e8f9] items-center justify-center p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              ¿Has olvidado tu contraseña?
            </h3>
            <p className="text-sm text-gray-600">
              No te preocupes. Vamos a conseguirte una nueva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
