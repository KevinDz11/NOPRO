import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import NuevaContrasena from "./pages/NuevaContrasena";
import SubirArchivos from "./pages/SubirArchivos";
import PerfilUsuario from "./pages/PerfilUsuario";
import ContactoSoporte from "./pages/ContactoSoporte";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/nuevaContrasena" element={<NuevaContrasena />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="/soporte" element={<ContactoSoporte />} />
        <Route path="/subir/:producto" element={<SubirArchivos />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
