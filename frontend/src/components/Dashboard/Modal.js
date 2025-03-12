import React from 'react';

const Modal = ({ isOpen, onClose, articulos }) => {
  // Si el modal no debe mostrarse, retorna null para no renderizar nada
  if (!isOpen) return null;

  return (
    // Contenedor de fondo para el modal, ocupa toda la pantalla con un fondo semitransparente
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      {/* Contenedor principal del contenido del modal */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/3">
        {/* Encabezado del modal con título y botón de cierre */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Artículos Bajo Stock</h3>
          {/* Botón para cerrar el modal, llama a la función onClose pasada como prop */}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        {/* Lista de artículos */}
        <ul className="mt-4 space-y-4">
          {articulos.map((articulo) => (
            // Cada artículo se muestra en un elemento de lista
            <li key={articulo.id} className="border-b py-2">
              {/* Nombre del artículo */}
              <p className="font-semibold">{articulo.nombre}</p>
              {/* Stock actual del artículo */}
              <p className="text-gray-600">Stock: {articulo.stock_actual}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Modal;
