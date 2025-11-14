import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Este hook escucha cambios en el localStorage.
 * Si 'authToken' se elimina (desde otra pestaña),
 * forzará el cierre de sesión en la pestaña actual.
 */
export function useAuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = (event) => {
      // Si la clave 'authToken' fue eliminada o 'auth' se puso en false
      if (
        (event.key === "authToken" && !event.newValue) ||
        (event.key === "auth" && event.newValue === "false")
      ) {
        // Damos un breve aviso
        alert("Tu sesión ha sido cerrada (posiblemente desde otra pestaña).");

        // Redirigimos al login
        navigate("/login");
      }
    };

    // Añadimos el "escuchador" de eventos
    window.addEventListener("storage", handleStorageChange);

    // Limpiamos el "escuchador" cuando el componente se desmonta
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]); // Se ejecuta de nuevo si 'navigate' cambia
}
