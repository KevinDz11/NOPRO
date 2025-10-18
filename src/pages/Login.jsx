import { useState } from "react";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const esCorreoValido = (correo) => /\S+@\S+\.\S+/.test(correo);
  const esFormularioValido = () => esCorreoValido(email) && password.length > 0; // Solo necesitamos que haya contraseña

  // --- FUNCIÓN MODIFICADA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!esFormularioValido()) {
      setMensaje("Introduce un correo válido y tu contraseña.");
      return;
    }

    setCargando(true);
    try {
      // Importante: El endpoint de login espera los datos como 'form data', no JSON
      const formData = new FormData();
      formData.append("username", email); // FastAPI espera 'username' para el email en este flujo
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        body: formData, // Enviamos como form data
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Diferenciamos si la cuenta no está verificada
        if (
          errorData.detail ===
          "La cuenta no ha sido verificada. Por favor, revisa tu correo."
        ) {
          setMensaje(
            "Tu cuenta no está verificada. Revisa tu correo o contacta a soporte."
          );
        } else {
          setMensaje(errorData.detail || "Error al iniciar sesión.");
        }
        throw new Error(errorData.detail || "Error en el inicio de sesión.");
      }

      const data = await response.json(); // { "access_token": "...", "token_type": "bearer" }

      // --- GUARDAR EL TOKEN ---
      // localStorage es una forma simple de guardar el token en el navegador
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("auth", "true"); // Mantenemos tu lógica anterior si la necesitas

      // Redirige a la página principal después del login exitoso
      navigate("/Home");
    } catch (err) {
      console.error("Error en el login:", err);
      // El mensaje de error ya se estableció dentro del try si la respuesta no fue ok
      if (!mensaje) {
        // Si el error fue otro (ej. red), mostramos uno genérico
        setMensaje("Ocurrió un error inesperado. Inténtalo de nuevo.");
      }
    } finally {
      setCargando(false);
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
            Acceder a mi cuenta
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Input Email */}
            <input
              type="email"
              placeholder="Introduce tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={cargando}
            />
            {/* Input Contraseña */}
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-2 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={cargando}
            />
            {/* Link Olvidaste Contraseña */}
            <Link
              to="/nuevaContrasena"
              className="text-sm text-blue-500 hover:underline block mb-4"
            >
              ¿Has olvidado tu contraseña?
            </Link>
            {/* Botón Acceder */}
            <button
              type="submit"
              disabled={!esFormularioValido() || cargando}
              className={`w-full font-semibold py-2 rounded ${
                esFormularioValido() && !cargando
                  ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {cargando ? "Accediendo..." : "Acceder"}
            </button>
            {/* Mensaje de error/info */}
            {mensaje && (
              <p
                className={`text-sm text-center mt-3 font-medium ${
                  mensaje.includes("verificada")
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {mensaje}
              </p>
            )}
            {/* Link a Registro */}
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
        {/* DERECHA (Panel informativo) */}
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
