// src/components/Autocomplete.js

import React, { useState, useRef, useEffect } from 'react';

const Autocomplete = ({ options, selected, onSelect, label }) => {
  // Estado para controlar el valor actual del input
  const [inputValue, setInputValue] = useState('');
  // Estado para almacenar las opciones filtradas según el input del usuario
  const [filteredOptions, setFilteredOptions] = useState([]);
  // Estado para mostrar u ocultar la lista de sugerencias
  const [showOptions, setShowOptions] = useState(false);
  // Referencia al contenedor principal para detectar clics fuera del componente
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Filtrar las opciones disponibles basado en el valor actual del input
    const filtered = options.filter(option =>
      option.nombre.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  useEffect(() => {
    // Función para detectar clics fuera del componente y cerrar sugerencias
    const handleClickOutside = event => {
      // Si el clic no está dentro del componente, se ocultan las opciones
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    // Añadir listener para clics en el documento
    document.addEventListener('mousedown', handleClickOutside);
    // Limpiar el listener al desmontar el componente
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Si no hay un elemento seleccionado, resetea el input a vacío
    if (!selected) {
      setInputValue('');
    } else {
      // Si hay un elemento seleccionado, busca la opción correspondiente y
      // actualiza el input con su nombre
      const selectedOption = options.find(option => option.id === selected);
      if (selectedOption) {
        setInputValue(selectedOption.nombre);
      }
    }
  }, [selected, options]);

  // Manejador de cambio en el input
  const handleChange = (e) => {
    setInputValue(e.target.value); // Actualiza el valor del input
    setShowOptions(true); // Muestra la lista de opciones al escribir
    if (e.target.value === '') {
      onSelect(''); // Si el input se borra, resetea la selección en el componente padre
    }
  };

  // Manejador de clic en una opción de la lista
  const handleOptionClick = (option) => {
    setInputValue(option.nombre); // Establece el input con el nombre de la opción seleccionada
    setShowOptions(false); // Oculta la lista de sugerencias
    onSelect(option.id); // Notifica al componente padre la selección realizada
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Muestra la etiqueta si se proporciona */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowOptions(true)} // Al enfocar el input, muestra las opciones
        placeholder={`Selecciona una ${label.toLowerCase()}`}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-black"
      />
      {/* Muestra la lista de opciones si se deben mostrar y hay opciones filtradas */}
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto mt-1">
          {filteredOptions.map(option => (
            <li
              key={option.id}
              onClick={() => handleOptionClick(option)} // Al hacer clic en una opción, se selecciona
              className="cursor-pointer p-2 hover:bg-gray-100"
            >
              {option.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
