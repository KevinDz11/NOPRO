import React, { useState } from 'react';

const PerfilUsuario = () => {
  const [nombre, setNombre] = useState('Juan Pérez');
  const [correo, setCorreo] = useState('juan.perez@example.com');
  const [nuevaContrasena, setNuevaContrasena] = useState('');

  const handleCambiarContrasena = () => {
    alert('Cambiar contraseña: ' + nuevaContrasena);
  };

  const handleEliminarCuenta = () => {
    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta?');
    if (confirmar) {
      alert('Cuenta eliminada');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Perfil de Usuario</h2>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">Nombre</label>
        <input
          type="text"
          value={nombre}
          readOnly
          className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">Correo electrónico</label>
        <input
          type="email"
          value={correo}
          readOnly
          className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-1">Nueva contraseña</label>
        <input
          type="password"
          value={nuevaContrasena}
          onChange={(e) => setNuevaContrasena(e.target.value)}
          placeholder="Escribe una nueva contraseña"
          className="w-full border rounded px-3 py-2"
        />
        <button
          onClick={handleCambiarContrasena}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cambiar contraseña
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={handleEliminarCuenta}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Eliminar cuenta
        </button>
      </div>
    </div>
  );
};

export default PerfilUsuario;
