import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ResultadosAnalisis from "./pages/ResultadosAnalisis";

// Importa tus páginas
import Home from "./pages/Home";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import NuevaContrasena from "./pages/NuevaContrasena";
import SubirArchivos from "./pages/SubirArchivos";
import PerfilUsuario from "./pages/PerfilUsuario";
import HistorialProductos from "./pages/Historial";
import ContactoSoporte from "./pages/ContactoSoporte";
import VerificarCuenta from "./pages/VerificarCuenta";
import CopiaHome from "./pages/copiaHome"; // Tu página pública
import ListaClientes from "./pages/ListaClientes";
import ResetContrasena from "./pages/ResetContrasena";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        {/* Estas rutas no requieren login */}
        <Route path="/" element={<CopiaHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/registro/verificacion" element={<VerificarCuenta />} />
        <Route path="/nuevaContrasena" element={<NuevaContrasena />} />
        <Route path="/reset-password" element={<ResetContrasena />} />

        {/* --- RUTAS PROTEGIDAS --- */}
        {/* Estas rutas SÍ requieren login. Las envolvemos. */}

        <Route
          path="/Home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilUsuario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historial"
          element={
            <ProtectedRoute>
              <HistorialProductos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subir/:producto"
          element={
            <ProtectedRoute>
              <SubirArchivos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/soporte"
          element={
            <ProtectedRoute>
              <ContactoSoporte />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <ListaClientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resultados-analisis"
          element={
            <ProtectedRoute>
              <ResultadosAnalisis />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
