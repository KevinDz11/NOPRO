import logo from "../assets/logo.PNG";
import { Link } from "react-router-dom";

// COMPONENTES INDIVIDUALES DENTRO DE Home.jsx

function TarjetaLaptop() {
  return (
    <div className="bg-white p-4 shadow rounded-xl text-center hover:shadow-lg transition-shadow w-full sm:w-auto">
      <div className="text-4xl mb-2">💻</div>
      <h2 className="font-semibold text-lg">Laptop</h2>
      <p className="text-sm text-gray-500">
        Realizar el análisis de normas para una Laptop.
      </p>
      <Link to="/subir/Laptop">
        <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Realizar análisis
        </button>
      </Link>
    </div>
  );
}

function TarjetaSmartTV() {
  return (
    <div className="bg-white p-4 shadow rounded-xl text-center hover:shadow-lg transition-shadow w-full sm:w-auto">
      <div className="text-4xl mb-2">📺</div>
      <h2 className="font-semibold text-lg">Smart TV</h2>
      <p className="text-sm text-gray-500">
        Realizar el análisis de normas para una Smart TV.
      </p>
      <Link to="/subir/SmartTV">
        <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Realizar análisis
        </button>
      </Link>
    </div>
  );
}

function TarjetaLuminaria() {
  return (
    <div className="bg-white p-4 shadow rounded-xl text-center hover:shadow-lg transition-shadow w-full sm:w-auto">
      <div className="text-4xl mb-2">💡</div>
      <h2 className="font-semibold text-lg">Luminaria para Exterior</h2>
      <p className="text-sm text-gray-500">
        Realizar el análisis de normas para una Luminaria para exterior.
      </p>
      <Link to="/subir/Luminaria">
        <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Realizar análisis
        </button>
      </Link>
    </div>
  );
}

// COMPONENTE PRINCIPAL Home
export default function Home() {
  return (
    <>
      {/* NAVBAR */}
      <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white shadow">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <span className="text-xl font-bold text-gray-800">NOPRO</span>
        </div>

        <ul className="hidden md:flex items-center space-x-4 font-medium text-sm text-gray-700">
          <li className="hover:text-blue-600 cursor-pointer">AYUDA</li>
          <Link to = "/perfil"className="hover:text-blue-600 cursor-pointer">PERFIL</Link>
          <li className="hover:text-blue-600 cursor-pointer">CERRAR SESIÓN</li>
        </ul>

        <div className="flex items-center space-x-4 mt-2 md:mt-0">
          <Link to="/login" className="text-sm text-gray-700 hover:text-blue-600">
            Acceder
          </Link>
          <Link to="/registro" className="bg-red-500 text-white text-sm font-semibold px-4 py-1 rounded hover:bg-red-600">
            Registro
          </Link>
        </div>
      </nav>

      {/* HERRAMIENTAS */}
      <main className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
        <header className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Aplicación web para identificar normas aplicables a productos
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg">
            Esta herramienta online permite identificar las normas mexicanas
            aplicables a productos: Smart TV, laptops y luminarias para exterior.
            <br />
            No se necesita instalación.
          </p>
        </header>

        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl mx-auto justify-items-center px-4">
          <TarjetaLaptop />
          <TarjetaSmartTV />
          <TarjetaLuminaria />
        </section>
      </main>
    </>
  );
}
