// src/components/administracion/MarcaModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  fetchMarcas,
  fetchArticulos,
  createMarca,
  updateMarca,
  deleteMarca,
  updateArticulos,
} from '@/services/api'; // Importa las funciones necesarias desde el servicio de API

// Configura SweetAlert2 para trabajar con contenido de React
const MySwal = withReactContent(Swal);

// Establece el elemento raíz para mejorar la accesibilidad del modal
Modal.setAppElement('#__next');

/**
 * Capitaliza la primera letra de una cadena de texto.
 * @param {string} s - La cadena a capitalizar.
 * @returns {string} La cadena con la primera letra en mayúscula.
 */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Componente modal para administrar marcas.
 *
 * @param {boolean} isOpen - Indica si el modal está abierto.
 * @param {function} onRequestClose - Función para cerrar el modal.
 */
const MarcaModal = ({ isOpen, onRequestClose }) => {
  // Lista de marcas obtenidas desde la API
  const [marcas, setMarcas] = useState([]);

  // Lista de artículos obtenidos desde la API
  const [articulos, setArticulos] = useState([]);

  // Término de búsqueda para filtrar marcas
  const [searchTerm, setSearchTerm] = useState('');

  // ID de la marca actualmente en edición
  const [editingId, setEditingId] = useState(null);

  // Nombre editado de la marca
  const [editedName, setEditedName] = useState('');

  // Descripción editada de la marca
  const [editedDescription, setEditedDescription] = useState('');

  // Indicador de carga para operaciones de datos
  const [loading, setLoading] = useState(false);

  // ID de la marca que se pretende eliminar
  const [deletingId, setDeletingId] = useState(null);

  // Lista de artículos asociados a una marca que se pretende eliminar
  const [associatedArticulos, setAssociatedArticulos] = useState([]);

  // Estado para manejar el modal de creación de nuevas marcas
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Nombre de la nueva marca a crear
  const [newName, setNewName] = useState('');

  // Descripción de la nueva marca a crear
  const [newDescription, setNewDescription] = useState('');

  /**
   * Efecto que se ejecuta al abrir el modal.
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
   * Carga las marcas y artículos desde la API.
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [marcaData, artData] = await Promise.all([
        fetchMarcas(),
        fetchArticulos(),
      ]);
      setMarcas(marcaData.results || marcaData);
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Muestra una alerta de error si falla la carga de datos
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las marcas o artículos.',
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
   * Inicia el proceso de edición para una marca específica.
   *
   * @param {object} marca - La marca a editar.
   */
  const handleEdit = (marca) => {
    setEditingId(marca.id);
    setEditedName(marca.nombre);
    setEditedDescription(marca.descripcion || '');
  };

  /**
   * Guarda los cambios realizados en una marca.
   *
   * @param {number} id - ID de la marca a actualizar.
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

    // Validación: verificar si el nombre ya existe en otra marca
    const nameExists = marcas.some(
      (m) => m.nombre.toLowerCase() === editedName.trim().toLowerCase() && m.id !== id
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una marca con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      // Actualiza la marca en la API
      const updated = await updateMarca(
        id,
        editedName.trim() || '',
        editedDescription.trim() || 'Sin descripción'
      );
      // Actualiza la lista local de marcas
      setMarcas(marcas.map((m) => (m.id === id ? updated : m)));

      // Notifica al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Marca actualizada correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Resetea los estados de edición
      setEditingId(null);
      setEditedName('');
      setEditedDescription('');
    } catch (error) {
      console.error('Error al actualizar la marca:', error);
      // Maneja errores generales
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al actualizar la marca.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Inicia el proceso de eliminación de una marca.
   *
   * @param {number} id - ID de la marca a eliminar.
   */
  const handleDelete = async (id) => {
    // Verifica si hay artículos asociados a la marca
    const asociados = articulos.filter((a) => a.marca === id);
    if (asociados.length > 0) {
      // Si hay asociados, almacena la información para la confirmación
      setAssociatedArticulos(asociados);
      setDeletingId(id);
      return;
    }

    // Si no hay asociados, confirma la eliminación directamente
    confirmDelete(id, []);
  };

  /**
   * Confirma y realiza la eliminación de una marca, manejando también los artículos asociados.
   *
   * @param {number} id - ID de la marca a eliminar.
   * @param {array} asociadosList - Lista de artículos asociados a la marca.
   */
  const confirmDelete = useCallback(async (id, asociadosList) => {
    const hasAsociados = asociadosList.length > 0;

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: hasAsociados
        ? `Esta acción eliminará la marca y dejará ${asociadosList.length} artículo(s) sin marca.`
        : 'Esta acción eliminará la marca de forma permanente.',
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
        // Si hay artículos asociados, actualiza su marca a vacío
        if (hasAsociados) {
          for (const articulo of asociadosList) {
            await updateArticulos(articulo.id, { marca: "" }); // O usa null según tu API
          }

          // Notifica al usuario de la actualización de artículos
          MySwal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Los artículos asociados ahora están sin marca.',
            customClass: {
              confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
            },
            buttonsStyling: false,
          });
        }

        // Elimina la marca de la API
        await deleteMarca(id);
        // Notifica al usuario de la eliminación exitosa
        MySwal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'La marca fue eliminada correctamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
        // Actualiza la lista local de marcas eliminando la marca eliminada
        setMarcas((prev) => prev.filter((m) => m.id !== id));
      } catch (error) {
        console.error('Error al eliminar la marca:', error);
        // Maneja errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al eliminar la marca.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    }
  }, []);

  /**
   * Muestra una confirmación detallada cuando hay artículos asociados antes de eliminar una marca.
   */
  const confirmDeleteWithArticulos = useCallback(async () => {
    if (!deletingId) return;

    const asociadosList = associatedArticulos;

    // Construye la lista HTML de artículos afectados
    const articuloListHTML = asociadosList
      .map((articulo) => {
        return `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${
          articulo.codigo_minvu || 'N/A'
        }, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${
          articulo.numero_serie || 'N/A'
        }`;
      })
      .join('<br/>');

    // Muestra una alerta detallada de confirmación
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>La marca seleccionada está asociada a <strong>${asociadosList.length}</strong> artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloListHTML}
        </div>
        <p>¿Deseas eliminarla? Los artículos asociados tendrán su marca establecida en blanco.</p>
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
      // Si el usuario confirma, procede con la eliminación
      confirmDelete(deletingId, asociadosList);
    } else {
      // Si el usuario cancela, resetea los estados de eliminación
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
   * Abre el modal para crear una nueva marca y resetea el formulario de creación.
   */
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetCreateForm();
  };

  /**
   * Resetea los campos del formulario de creación de una nueva marca.
   */
  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
  };

  /**
   * Maneja la creación de una nueva marca.
   */
  const handleCreate = async () => {
    // Validación: el nombre no puede estar vacío
    if (!newName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la marca no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validación: verificar si el nombre ya existe
    const nameExists = marcas.some(
      (m) => m.nombre.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe una marca con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      // Crea la marca en la API
      const created = await createMarca(
        newName.trim() || '',
        newDescription.trim() || 'Sin descripción'
      );
      // Actualiza la lista local de marcas con la nueva marca
      setMarcas([...marcas, created]);

      // Notifica al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Marca creada correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Cierra el modal de creación y resetea los campos
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear marca:', error);
      // Maneja errores generales
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al crear la marca.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Cancela la creación de una nueva marca y cierra el modal de creación.
   */
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  /**
   * Filtra las marcas basándose en el término de búsqueda ingresado.
   */
  const filteredMarcas = marcas.filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Modal Principal: Administrar Marcas */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Marcas"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-800">Administrar Marcas</h2>
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
            title="Crear Nueva Marca"
          >
            <FaPlus className="mr-2" /> Crear Marca
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar Marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Marcas */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando marcas...</p>
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
                  {filteredMarcas.length > 0 ? (
                    filteredMarcas.map((marca) => (
                      <tr key={marca.id} className="hover:bg-gray-50">
                        {/* Columna de Nombre */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === marca.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className={`p-2 border ${
                                editedName.trim() === '' ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Nombre de la marca"
                            />
                          ) : (
                            marca.nombre
                          )}
                        </td>
                        {/* Columna de Descripción */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === marca.id ? (
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                              placeholder="Descripción de la marca"
                            />
                          ) : (
                            marca.descripcion || 'Sin descripción'
                          )}
                        </td>
                        {/* Columna de Acciones */}
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === marca.id ? (
                            <>
                              {/* Botón para Guardar Cambios */}
                              <button
                                onClick={() => handleSave(marca.id)}
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
                              {/* Botón para Editar Marca */}
                              <button
                                onClick={() => handleEdit(marca)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Marca"
                              >
                                <FaEdit size={18} />
                              </button>
                              {/* Botón para Eliminar Marca */}
                              <button
                                onClick={() => handleDelete(marca.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Marca"
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
                        No se encontraron marcas
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

      {/* Modal Secundario: Crear Marca */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nueva Marca"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-800">Crear Nueva Marca</h3>
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
            placeholder="Nombre de la marca"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción:</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción de la marca (opcional)"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          {/* Botón para Guardar Nueva Marca */}
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

export default MarcaModal;
