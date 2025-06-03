import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import NuevaContrasena from "./pages/NuevaContrasena";
import SubirArchivos from "./pages/SubirArchivos";
import PerfilUsuario from "./pages/PerfilUsuario";
import HistorialProductos from "./pages/Historial";
import ContactoSoporte from "./pages/ContactoSoporte";
import VerificarCuenta from "./pages/VerificarCuenta";
import CopiaHome from "./pages/copiaHome"; // Importa el componente copiaHome si es necesario

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/nuevaContrasena" element={<NuevaContrasena />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="/historial" element={<HistorialProductos />} />
        <Route path="/subir/:producto" element={<SubirArchivos />} />
        <Route path="/soporte" element={<ContactoSoporte />} />
        <Route path="/registro/verificacion" element={<VerificarCuenta />} />
        <Route path="/" element={<CopiaHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
