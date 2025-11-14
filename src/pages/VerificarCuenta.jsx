import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function VerificarCuenta() {
  const location = useLocation();
  const navigate = useNavigate();
  const correo = location.state?.correo || "";

  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [mensajeExito, setMensajeExito] = useState("");
  const [cargandoReenvio, setCargandoReenvio] = useState(false);

  // --- FUNCIÓN PARA VERIFICAR ---
  const handleVerificar = async () => {
    setError("");
    setMensajeExito(""); // Limpia el mensaje de reenvío
    if (!codigo || codigo.length < 6) {
      setError("Por favor, introduce el código de verificación de 6 dígitos.");
      return;
    }
    if (!correo) {
      setError(
        "No se encontró el correo electrónico asociado. Por favor, regresa al registro."
      );
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("http://localhost:8000/clientes/verificar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: correo,
          code: codigo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al verificar la cuenta.");
      }

      alert("¡Cuenta verificada con éxito! Ahora puedes iniciar sesión.");
      navigate("/login");
    } catch (err) {
      console.error("Error en la verificación:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  // Función para reenviar el correo
  const handleReenviar = async () => {
    setError("");
    setMensajeExito("");

    if (!correo) {
      setError("No se encontró el correo electrónico para reenviar.");
      return;
    }

    setCargandoReenvio(true);
    try {
      const response = await fetch(
        "http://localhost:8000/clientes/reenviar-verificacion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: correo }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Error al reenviar el correo.");
      }

      setMensajeExito(
        data.mensaje || "Correo reenviado. Revisa tu bandeja de entrada."
      );
    } catch (err) {
      console.error("Error en el reenvío:", err);
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargandoReenvio(false);
    }
  };

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
            Introduce el código de verificación que hemos enviado a:
          </p>
          <p className="text-base font-medium text-gray-700 mb-4 text-center">
            {correo || "No se especificó correo"}
          </p>

          {/* Botón para reenviar (Ahora funcional) */}
          <div className="flex gap-4 mb-6">
            <button
              className={`w-full font-medium py-2 rounded ${
                cargando || cargandoReenvio
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              onClick={handleReenviar}
              disabled={cargando || cargandoReenvio || !correo}
            >
              {cargandoReenvio ? "Reenviando..." : "Reenviar correo"}
            </button>
          </div>

          {/* Campo para código */}
          <input
            type="text"
            placeholder="Código de verificación"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={6}
            className="w-full mb-6 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={cargando || cargandoReenvio}
          />

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Mensaje de éxito de reenvío */}
          {mensajeExito && (
            <div className="bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded mb-4 text-sm">
              {mensajeExito}
            </div>
          )}

          {/* Botón para confirmar */}
          <button
            onClick={handleVerificar}
            disabled={cargando || cargandoReenvio || !codigo}
            className={`w-full font-semibold py-2 rounded ${
              !cargando && !cargandoReenvio && codigo
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {cargando ? "Verificando..." : "Verificar"}
          </button>
        </div>
      </div>
    </div>
  );
}
