// src/components/administracion/CategoriaModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  fetchCategorias,
  fetchArticulos,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  updateArticulos,
} from '@/services/api'; // Asegúrate de tener estas funciones implementadas correctamente

// Integración de SweetAlert2 con contenido de React
const MySwal = withReactContent(Swal);

// Configuración del elemento raíz para accesibilidad con react-modal
Modal.setAppElement('#__next');

/**
 * Capitaliza la primera letra de una cadena.
 *
 * @param {string} s - La cadena a capitalizar.
 * @returns {string} La cadena con la primera letra en mayúscula.
 */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Componente modal para administrar categorías.
 *
 * @param {boolean} isOpen - Indica si el modal está abierto.
 * @param {function} onRequestClose - Función para cerrar el modal.
 */
const CategoriaModal = ({ isOpen, onRequestClose }) => {
  // Estado para almacenar la lista de categorías
  const [categorias, setCategorias] = useState([]);
  
  // Estado para almacenar la lista de artículos
  const [articulos, setArticulos] = useState([]);
  
  // Estado para manejar el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para almacenar el ID de la categoría que está siendo editada
  const [editingId, setEditingId] = useState(null);
  
  // Estado para almacenar el nombre editado de la categoría
  const [editedName, setEditedName] = useState('');
  
  // Estado para almacenar la descripción editada de la categoría
  const [editedDescription, setEditedDescription] = useState('');
  
  // Estado para manejar el indicador de carga general
  const [loading, setLoading] = useState(false);
  
  // Estado para almacenar el ID de la categoría que está siendo eliminada
  const [deletingId, setDeletingId] = useState(null);
  
  // Estado para almacenar los artículos asociados a una categoría que se pretende eliminar
  const [associatedArticulos, setAssociatedArticulos] = useState([]);

  // Estado adicional para manejar el indicador de carga durante la eliminación
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para manejar el modal de creación de nuevas categorías
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  /**
   * Efecto que se ejecuta cada vez que se abre el modal principal.
   * Carga los datos necesarios y resetea los formularios.
   */
  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Carga las categorías y artículos desde la API.
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriaData, artData] = await Promise.all([
        fetchCategorias(),
        fetchArticulos(),
      ]);
      setCategorias(categoriaData.results || categoriaData);
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las categorías o artículos.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetea los formularios y estados relacionados.
   */
  const resetForm = () => {
    setSearchTerm('');
    setEditingId(null);
    setEditedName('');
    setEditedDescription('');
    setDeletingId(null);
    setAssociatedArticulos([]);
    setNewName('');
    setNewDescription('');
  };

  /**
   * Inicia el proceso de edición para una categoría específica.
   *
   * @param {object} categoria - La categoría a editar.
   */
  const handleEdit = (categoria) => {
    setEditingId(categoria.id);
    setEditedName(categoria.nombre);
    setEditedDescription(categoria.descripcion || '');
  };

  /**
   * Guarda los cambios realizados en una categoría.
   *
   * @param {number} id - ID de la categoría a actualizar.
   */
  const handleSave = async (id) => {
    // Validación: el nombre no puede estar vacío
    if (!editedName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validación: verificar si el nombre ya existe en otra categoría
    const nameExists = categorias.some(
      (c) => c.nombre.toLowerCase() === editedName.trim().toLowerCase() && c.id !== id
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una categoría con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      // Preparar el payload para la actualización
      const payload = {
        nombre: editedName.trim(),
        descripcion: editedDescription.trim() ? editedDescription.trim() : 'Sin descripción',
      };

      // Realizar la actualización en la API
      const updated = await updateCategoria(id, payload);
      
      // Actualizar la lista local de categorías con la categoría actualizada
      setCategorias((prevCategorias) =>
        prevCategorias.map((c) => (c.id === id ? updated : c))
      );

      // Notificar al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Categoría actualizada correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Resetear los estados de edición
      setEditingId(null);
      setEditedName('');
      setEditedDescription('');
    } catch (error) {
      console.error('Error al actualizar la categoría:', error);
      
      // Manejo de errores provenientes de la API
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages = Object.keys(errors).map(key => {
          return Array.isArray(errors[key]) 
            ? errors[key].map(msg => `${capitalize(key)}: ${msg}`).join('<br/>')
            : `${capitalize(key)}: ${errors[key]}`;
        }).join('<br/>');
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else {
        // Errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al actualizar la categoría.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    }
  };

  /**
   * Inicia el proceso de eliminación de una categoría.
   *
   * @param {number} id - ID de la categoría a eliminar.
   */
  const handleDelete = async (id) => {
    // Verificar si hay artículos asociados a la categoría
    const asociados = articulos.filter((a) => a.categoria === id);
    if (asociados.length > 0) {
      setAssociatedArticulos(asociados);
      setDeletingId(id);
      return;
    }

    // Confirmar eliminación si no hay artículos asociados
    confirmDelete(id, []);
  };

  /**
   * Confirma y realiza la eliminación de una categoría, manejando también los artículos asociados.
   *
   * @param {number} id - ID de la categoría a eliminar.
   * @param {array} asociadosList - Lista de artículos asociados a la categoría.
   */
  const confirmDelete = useCallback(async (id, asociadosList) => {
    const hasAsociados = asociadosList.length > 0;

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: hasAsociados
        ? `Esta acción eliminará la categoría y dejará ${asociadosList.length} artículo(s) sin categoría.`
        : 'Esta acción eliminará la categoría de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        cancelButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      try {
        setIsDeleting(true);

        // Si hay artículos asociados, actualizarlos para que no tengan categoría
        if (hasAsociados) {
          await Promise.all(
            asociadosList.map((articulo) =>
              updateArticulos(articulo.id, { categoria: "" }) // O usa null según tu API
            )
          );

          MySwal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Los artículos asociados ahora están sin categoría.',
            customClass: {
              confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
            },
            buttonsStyling: false,
          });
        }

        // Eliminar la categoría
        await deleteCategoria(id);
        MySwal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'La categoría fue eliminada correctamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });

        // Actualizar la lista local de categorías
        setCategorias((prevCategorias) => prevCategorias.filter((c) => c.id !== id));
      } catch (error) {
        console.error('Error al eliminar la categoría:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al eliminar la categoría.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } finally {
        setIsDeleting(false);
      }
    }
  }, []);

  /**
   * Confirma la eliminación cuando hay artículos asociados, mostrando detalles de los mismos.
   */
  const confirmDeleteWithArticulos = useCallback(async () => {
    if (!deletingId) return;

    const asociadosList = associatedArticulos;

    // Construir la lista HTML de artículos afectados
    const articuloListHTML = asociadosList.map((articulo) => {
      return `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${articulo.codigo_minvu || 'N/A'}, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${articulo.numero_serie || 'N/A'}`;
    }).join('<br/>');

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>La categoría seleccionada está asociada a <strong>${asociadosList.length}</strong> artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloListHTML}
        </div>
        <p>¿Deseas eliminarla? Los artículos asociados tendrán su categoría establecida en blanco.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        cancelButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      confirmDelete(deletingId, asociadosList);
    } else {
      // Resetear estados si se cancela la eliminación
      setDeletingId(null);
      setAssociatedArticulos([]);
    }
  }, [deletingId, associatedArticulos, confirmDelete]);

  /**
   * Efecto que maneja la confirmación de eliminación cuando hay artículos asociados.
   */
  useEffect(() => {
    if (deletingId && associatedArticulos.length > 0) {
      confirmDeleteWithArticulos();
    }
  }, [deletingId, associatedArticulos.length, confirmDeleteWithArticulos]);

  /**
   * Abre el modal para crear una nueva categoría y resetea el formulario de creación.
   */
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetCreateForm();
  };

  /**
   * Resetea los campos del formulario de creación de una nueva categoría.
   */
  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
  };

  /**
   * Maneja la creación de una nueva categoría.
   */
  const handleCreate = async () => {
    // Validación: el nombre no puede estar vacío
    if (!newName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la categoría no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validación: verificar si el nombre ya existe
    const nameExists = categorias.some(
      (c) => c.nombre.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una categoría con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      // Preparar el payload para la creación
      const payload = {
        nombre: newName.trim(),
        descripcion: newDescription.trim() ? newDescription.trim() : 'Sin descripción',
      };

      // Realizar la creación en la API
      const created = await createCategoria(payload);
      
      // Actualizar la lista local de categorías con la nueva categoría
      setCategorias((prevCategorias) => [...prevCategorias, created]);

      // Notificar al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Categoría creada correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Cerrar el modal de creación y resetear los campos
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear categoría:', error);
      
      // Manejo de errores provenientes de la API
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages = Object.keys(errors).map(key => {
          return Array.isArray(errors[key]) 
            ? errors[key].map(msg => `${capitalize(key)}: ${msg}`).join('<br/>')
            : `${capitalize(key)}: ${errors[key]}`;
        }).join('<br/>');
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          html: errorMessages,
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } else {
        // Errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear la categoría.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    }
  };

  /**
   * Cancela la creación de una nueva categoría y cierra el modal de creación.
   */
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  /**
   * Filtra las categorías basándose en el término de búsqueda ingresado.
   */
  const filteredCategorias = categorias.filter((categoria) =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Modal Principal: Administrar Categorías */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Categorías"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Indicador de Carga durante la Eliminación */}
        {isDeleting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          </div>
        )}

        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-800">Administrar Categorías</h2>
          <button
            onClick={onRequestClose}
            className="text-gray-500 hover:text-gray-700"
            title="Cerrar Modal"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Botón para Abrir el Modal de Creación */}
        <div className="mb-6">
          <button
            onClick={openCreateModal}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="Crear Nueva Categoría"
          >
            <FaPlus className="mr-2" /> Crear Categoría
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar Categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Categorías */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando categorías...</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-100 sticky top-0">
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Nombre</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Descripción</th>
                    <th className="py-3 px-6 text-center text-sm font-medium text-blue-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategorias.length > 0 ? (
                    filteredCategorias.map((categoria) => (
                      <tr key={categoria.id} className="hover:bg-gray-50">
                        {/* Columna de Nombre */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === categoria.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className={`p-2 border ${
                                editedName.trim() === '' ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Nombre de la categoría"
                            />
                          ) : (
                            categoria.nombre
                          )}
                        </td>

                        {/* Columna de Descripción */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === categoria.id ? (
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                              placeholder="Descripción de la categoría (opcional)"
                            />
                          ) : (
                            categoria.descripcion || 'Sin descripción'
                          )}
                        </td>

                        {/* Columna de Acciones */}
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === categoria.id ? (
                            <>
                              {/* Botón para Guardar Cambios */}
                              <button
                                onClick={() => handleSave(categoria.id)}
                                className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                title="Guardar cambios"
                              >
                                <FaSave size={18} />
                              </button>

                              {/* Botón para Cancelar Edición */}
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditedName('');
                                  setEditedDescription('');
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Cancelar edición"
                              >
                                <FaTimes size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Botón para Editar Categoría */}
                              <button
                                onClick={() => handleEdit(categoria)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Categoría"
                              >
                                <FaEdit size={18} />
                              </button>

                              {/* Botón para Eliminar Categoría */}
                              <button
                                onClick={() => handleDelete(categoria.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Categoría"
                              >
                                <FaTrash size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-gray-500">
                        No se encontraron categorías
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

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

      {/* Modal Secundario: Crear Categoría */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nueva Categoría"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-800">Crear Nueva Categoría</h3>
          <button
            onClick={handleCancelCreate}
            className="text-gray-500 hover:text-gray-700"
            title="Cerrar Modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Formulario de Creación */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Nombre<span className="text-red-500">*</span>:
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={`w-full p-2 border ${
              !newName.trim() ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Nombre de la categoría"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción:</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción de la categoría (opcional)"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          {/* Botón para Guardar Nueva Categoría */}
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <FaSave className="mr-2" />
            Guardar
          </button>

          {/* Botón para Cancelar Creación */}
          <button
            onClick={handleCancelCreate}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <FaTimes className="mr-2" />
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default CategoriaModal;
