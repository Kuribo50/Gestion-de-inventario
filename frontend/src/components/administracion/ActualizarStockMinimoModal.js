// src/components/administracion/ActualizarStockMinimoModal.js

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaSave, FaTimes, FaEdit, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { fetchArticulos, actualizarStockMinimo } from '@/services/api'; // Asegúrate de que la ruta es correcta

// Integración de SweetAlert2 con contenido de React
const MySwal = withReactContent(Swal);

// Configuración del elemento raíz para accesibilidad con react-modal
Modal.setAppElement('#__next');

/**
 * Componente modal para actualizar el stock mínimo de los artículos.
 *
 * @param {boolean} isOpen - Indica si el modal está abierto.
 * @param {function} onRequestClose - Función para cerrar el modal.
 */
const ActualizarStockMinimoModal = ({ isOpen, onRequestClose }) => {
  // Estado para almacenar la lista completa de artículos
  const [articulos, setArticulos] = useState([]);
  
  // Estado para almacenar la lista filtrada de artículos según el término de búsqueda
  const [filteredArticulos, setFilteredArticulos] = useState([]);
  
  // Estado para almacenar el ID del artículo que está siendo editado
  const [editingId, setEditingId] = useState(null);
  
  // Estado para almacenar el valor del stock mínimo editado
  const [editedStockMinimo, setEditedStockMinimo] = useState('');
  
  // Estado para manejar el indicador de carga general
  const [loading, setLoading] = useState(false);
  
  // Estado para almacenar el término de búsqueda ingresado por el usuario
  const [searchTerm, setSearchTerm] = useState('');

  // Estado adicional para manejar el indicador de carga durante operaciones críticas
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Función para obtener los datos de los artículos desde la API.
   * Se ejecuta al abrir el modal.
   */
  const fetchArticulosData = async () => {
    setIsProcessing(true);
    try {
      const data = await fetchArticulos();
      setArticulos(data);
      setFilteredArticulos(data);
    } catch (error) {
      console.error('Error al obtener artículos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los artículos.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Maneja el cambio en el campo de búsqueda y filtra los artículos.
   *
   * @param {object} e - Evento de cambio en el input de búsqueda.
   */
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    const filtered = articulos.filter((art) =>
      art.nombre.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredArticulos(filtered);
  };

  // Efecto que se ejecuta cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchArticulosData();
      setEditingId(null);
      setEditedStockMinimo('');
      setSearchTerm('');
    }
  }, [isOpen]);

  /**
   * Inicia el proceso de edición para un artículo específico.
   *
   * @param {object} articulo - Objeto del artículo a editar.
   */
  const handleEdit = (articulo) => {
    setEditingId(articulo.id);
    setEditedStockMinimo(
      articulo.stock_minimo !== null && articulo.stock_minimo !== undefined
        ? String(articulo.stock_minimo)
        : ''
    );
  };

  /**
   * Guarda los cambios realizados en el stock mínimo de un artículo.
   *
   * @param {number} id - ID del artículo a actualizar.
   */
  const handleSave = async (id) => {
    // Validación: el campo de stock mínimo no puede estar vacío
    if (editedStockMinimo === '') {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El stock mínimo no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Conversión y validación: el stock mínimo debe ser un número no negativo
    const stockMinimoNumber = Number(editedStockMinimo);
    if (isNaN(stockMinimoNumber) || stockMinimoNumber < 0) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El stock mínimo debe ser un número válido y no negativo.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      setIsProcessing(true);
      await actualizarStockMinimo(id, stockMinimoNumber);

      // Actualización de la lista local de artículos con el nuevo stock mínimo
      const updatedList = articulos.map((art) =>
        art.id === id ? { ...art, stock_minimo: stockMinimoNumber } : art
      );
      setArticulos(updatedList);

      // Actualización de la lista filtrada según el término de búsqueda actual
      setFilteredArticulos(
        updatedList.filter((art) =>
          art.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

      // Reinicio de los estados de edición
      setEditingId(null);
      setEditedStockMinimo('');

      // Notificación de éxito al usuario
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Stock mínimo actualizado correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      // Manejo de diferentes tipos de errores para notificar al usuario adecuadamente
      if (error.response && error.response.data) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response.data.error || 'No se pudo actualizar el stock mínimo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else if (error.request) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se recibió respuesta del servidor.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al intentar actualizar el stock mínimo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Actualizar Stock Mínimo"
      className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-auto my-8 p-6 outline-none relative"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      {/* Indicador de carga visible durante operaciones críticas */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
        </div>
      )}

      {/* Encabezado del modal con título y botón de cierre */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-blue-800">Actualizar Stock Mínimo</h2>
        <button
          onClick={onRequestClose}
          className="text-gray-500 hover:text-gray-700"
          title="Cerrar Modal"
        >
          <FaTimes size={24} />
        </button>
      </div>

      {/* Campo de búsqueda para filtrar artículos */}
      <div className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Buscar artículo..."
          value={searchTerm}
          onChange={handleSearch}
          className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FaSearch className="ml-2 text-gray-500" />
      </div>

      {/* Tabla que muestra la lista de artículos filtrados */}
      {loading ? (
        <p className="text-center text-lg text-gray-600">Cargando artículos...</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-blue-100 sticky top-0">
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Nombre</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Stock Actual</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Stock Mínimo</th>
                  <th className="py-3 px-6 text-center text-sm font-medium text-blue-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticulos.map((art) => (
                  <tr key={art.id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-700">{art.nombre}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{art.stock_actual}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      {editingId === art.id ? (
                        <input
                          type="number"
                          value={editedStockMinimo}
                          onChange={(e) => setEditedStockMinimo(e.target.value)}
                          className="p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        art.stock_minimo ?? 0
                      )}
                    </td>
                    <td className="py-3 px-6 text-center space-x-2">
                      {editingId === art.id ? (
                        <>
                          <button
                            onClick={() => handleSave(art.id)}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200"
                            title="Guardar"
                          >
                            <FaSave size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditedStockMinimo('');
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            title="Cancelar"
                          >
                            <FaTimes size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(art)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          title="Editar Stock Mínimo"
                        >
                          <FaEdit size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Mensaje cuando no se encuentran artículos */}
                {filteredArticulos.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-600">
                      No se encontraron artículos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estilos CSS para el indicador de carga */}
      <style jsx>{`
        .loader {
          border-top-color: #3498db;
          animation: spinner 1.5s linear infinite;
        }

        @keyframes spinner {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Modal>
  );
};

export default ActualizarStockMinimoModal;
