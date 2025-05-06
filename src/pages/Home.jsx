import logo from "../assets/logo.PNG";

const tools = [
  {
    title: "Unir PDF",
    desc: "Une PDFs y ponlos en el orden que prefieras.",
    icon: "📎",
  },
  {
    title: "Dividir PDF",
    desc: "Extrae una o varias páginas del PDF.",
    icon: "✂️",
  },
  {
    title: "Comprimir PDF",
    desc: "Reduce el tamaño del archivo manteniendo calidad.",
    icon: "📉",
  },
];

export default function Home() {
  return (
    <>
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-3 bg-white shadow">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="NOPRO" className="h-8" />
          <span className="text-xl font-bold text-gray-800">NOPRO</span>
        </div>

        <ul className="flex items-center space-x-6 font-medium text-sm text-gray-700">
          <li className="hover:text-blue-600 cursor-pointer">UNIR PDF</li>
          <li className="hover:text-blue-600 cursor-pointer">DIVIDIR PDF</li>
          <li className="hover:text-blue-600 cursor-pointer">COMPRIMIR PDF</li>
          <li className="hover:text-blue-600 cursor-pointer">
            CONVERTIR PDF ▼
          </li>
          <li className="hover:text-blue-600 cursor-pointer">
            TODAS LAS HERRAMIENTAS ▼
          </li>
        </ul>

        <div className="flex items-center space-x-4">
          <button className="text-sm text-gray-700 hover:text-blue-600">
            Acceder
          </button>
          <button className="bg-red-500 text-white text-sm font-semibold px-4 py-1 rounded hover:bg-red-600">
            Registro
          </button>
        </div>
      </nav>

      {/* HERRAMIENTAS */}
      <main className="min-h-screen bg-gray-50 p-6">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold">
            Herramientas online para amantes de los PDF
          </h1>
          <p className="text-gray-600 mt-2">
            Herramientas online y completamente gratuitas para unir PDF, separar
            PDF, comprimir PDF, convertir documentos Office a PDF, PDF a JPG y
            JPG a PDF. No se necesita instalación.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="bg-white p-4 shadow rounded-xl text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-2">{tool.icon}</div>
              <h2 className="font-semibold text-lg">{tool.title}</h2>
              <p className="text-sm text-gray-500">{tool.desc}</p>
              <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                Ir a herramienta
              </button>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
