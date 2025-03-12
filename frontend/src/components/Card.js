// src/components/Card.js

import React from 'react';

/**
 * Componente Card para mostrar una tarjeta con un ícono, título, descripción y botón de acción.
 * @param {Object} props - Propiedades del componente.
 * @param {string} props.title - Título a mostrar en la tarjeta.
 * @param {string} props.description - Descripción a mostrar en la tarjeta.
 * @param {React.Component} props.icon - Componente de ícono a mostrar.
 * @param {string} props.color - Clase de color para estilizar el ícono.
 * @param {function} props.onClick - Función a ejecutar al hacer clic en el botón "Abrir".
 */
const Card = ({ title, description, icon: Icon, color, onClick }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center text-center border hover:shadow-xl transition-shadow">
      {/* Contenedor del ícono con un tamaño grande y color dinámico */}
      <div className={`text-4xl mb-4 ${color}`}>
        <Icon />
      </div>
      {/* Título de la tarjeta */}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {/* Descripción de la tarjeta */}
      <p className="text-gray-600 mb-4">{description}</p>
      {/* Botón de acción que dispara la función onClick al ser presionado */}
      <button
        onClick={onClick}
        className="mt-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center space-x-2"
      >
        Abrir
      </button>
    </div>
  );
};

export default Card;
