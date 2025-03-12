// src/components/administracion/MotivoModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaEdit, FaSave, FaTimes, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { 
  fetchMotivos, 
  createMotivo, 
  updateMotivo, 
  deleteMotivo, 
  fetchArticulos,
  updateArticulos // Función para actualizar artículos asociados
} from '@/services/api'; // Asegúrate de que las rutas sean correctas

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
 * Componente modal para administrar motivos.
 *
 * @param {boolean} isOpen - Indica si el modal está abierto.
 * @param {function} onRequestClose - Función para cerrar el modal.
 */
const MotivoModal = ({ isOpen, onRequestClose }) => {
  // Estados para almacenar datos obtenidos de la API
  const [motivos, setMotivos] = useState([]);
  const [articulos, setArticulos] = useState([]); // Para verificar el uso de motivos
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null); // ID del motivo actualmente en edición
  const [editedName, setEditedName] = useState(''); // Nombre editado del motivo
  const [editedDescription, setEditedDescription] = useState(''); // Descripción editada del motivo
  const [loading, setLoading] = useState(false); // Indicador de carga general
  const [deletingId, setDeletingId] = useState(null); // ID del motivo a eliminar
  const [associatedArticulos, setAssociatedArticulos] = useState([]); // Artículos asociados al motivo a eliminar

  // Nuevo estado para manejar el indicador de carga durante la eliminación
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState(''); // Nombre del nuevo motivo
  const [newDescription, setNewDescription] = useState(''); // Descripción del nuevo motivo

  /**
   * Efecto que se ejecuta al abrir el modal principal.
   * Carga los motivos y artículos desde la API y resetea los formularios.
   */
  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Carga los motivos y artículos desde la API.
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [motivoData, artData] = await Promise.all([
        fetchMotivos(),
        fetchArticulos()
      ]);
      setMotivos(motivoData.results || motivoData); // Ajuste para paginación
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Muestra una alerta de error si falla la carga de datos
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los motivos o artículos.',
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
   * Inicia el proceso de edición para un motivo específico.
   *
   * @param {object} motivo - El motivo a editar.
   */
  const handleEdit = (motivo) => {
    setEditingId(motivo.id);
    setEditedName(motivo.nombre);
    setEditedDescription(motivo.descripcion || '');
  };

  /**
   * Guarda los cambios realizados en un motivo.
   *
   * @param {number} id - ID del motivo a actualizar.
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

    // Validación: verificar si el nombre ya existe en otro motivo
    const nameExists = motivos.some(
      (motivo) => motivo.nombre.toLowerCase() === editedName.trim().toLowerCase() && motivo.id !== id
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe un motivo con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    try {
      const payload = {
        nombre: editedName.trim(),
        descripcion: editedDescription.trim() ? editedDescription.trim() : 'Sin descripción',
      };

      console.log('Actualizando Motivo con datos:', payload); // Loguea los datos enviados

      // Actualiza el motivo en la API
      const updatedMotivo = await updateMotivo(id, payload);
      // Actualiza la lista local de motivos con el motivo actualizado
      setMotivos((prevMotivos) =>
        prevMotivos.map((motivo) =>
          motivo.id === id ? updatedMotivo : motivo
        )
      );

      // Notifica al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Motivo actualizado correctamente.',
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
      console.error('Error al actualizar el motivo:', error);
      // Maneja errores provenientes de la API
      if (error.response && error.response.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              MySwal.fire({
                icon: 'error',
                title: 'Error',
                html: `Error en ${capitalize(key)}: ${msg}`,
                customClass: {
                  confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
                },
                buttonsStyling: false,
              });
            });
          } else {
            MySwal.fire({
              icon: 'error',
              title: 'Error',
              html: `Error en ${capitalize(key)}: ${errors[key]}`,
              customClass: {
                confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
              },
              buttonsStyling: false,
            });
          }
        });
      } else {
        // Maneja errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al actualizar el motivo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    }
  };

  /**
   * Maneja la eliminación de un motivo.
   *
   * @param {number} id - ID del motivo a eliminar.
   */
  const handleDelete = async (id) => {
    try {
      // Verifica si el motivo está asociado a algún artículo
      const asociados = articulos.filter((articulo) => articulo.motivo === id);
      if (asociados.length > 0) {
        // Si hay asociados, almacena la información para la confirmación
        setAssociatedArticulos(asociados);
        setDeletingId(id);
        return;
      }

      // Si no hay asociados, confirma la eliminación directamente
      confirmDelete(id, []);
    } catch (error) {
      console.error('Error al preparar la eliminación del motivo:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al intentar eliminar el motivo.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Confirma y realiza la eliminación de un motivo, manejando también los artículos asociados si los hay.
   *
   * @param {number} id - ID del motivo a eliminar.
   * @param {array} asociadosList - Lista de artículos asociados al motivo.
   */
  const confirmDelete = useCallback(async (id, asociadosList) => {
    const hasAsociados = asociadosList.length > 0;

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: hasAsociados
        ? `Esta acción eliminará el motivo y dejará ${asociadosList.length} artículo(s) sin motivo.`
        : 'Esta acción eliminará el motivo de forma permanente.',
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
        // Activa el indicador de carga durante la eliminación
        setIsDeleting(true);

        // Si hay artículos asociados, actualiza su motivo a 'Sin motivo' (null)
        if (hasAsociados) {
          const actualizarArticulosPromises = asociadosList.map((articulo) => {
            return updateArticulos(articulo.id, { motivo: null });
          });

          await Promise.all(actualizarArticulosPromises);

          // Notifica al usuario de la actualización de artículos
          MySwal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Los artículos asociados ahora están sin motivo.',
            customClass: {
              confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
            },
            buttonsStyling: false,
          });
        }

        // Elimina el motivo de la API
        await deleteMotivo(id);
        // Notifica al usuario de la eliminación exitosa
        MySwal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'El motivo fue eliminado correctamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });

        // Actualiza la lista local de motivos eliminando el motivo eliminado
        setMotivos((prevMotivos) => prevMotivos.filter((motivo) => motivo.id !== id));
      } catch (error) {
        console.error('Error al eliminar el motivo:', error);
        // Maneja errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al eliminar el motivo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      } finally {
        // Desactiva el indicador de carga
        setIsDeleting(false);
      }
    }
  }, []);

  /**
   * Confirma la eliminación cuando el motivo está asociado a artículos.
   * Muestra una lista detallada de los artículos afectados antes de proceder.
   */
  const confirmDeleteWithArticulos = useCallback(async () => {
    if (!deletingId) return;

    const asociadosList = associatedArticulos;

    // Construye la lista HTML de artículos afectados
    const articuloListHTML = asociadosList.map((articulo) => {
      return `• Nombre: ${articulo.nombre}, Stock: ${articulo.stock_actual}, Código Minvu: ${articulo.codigo_minvu || 'N/A'}, Código Interno: ${articulo.codigo_interno || 'N/A'}, Nº Serie: ${articulo.numero_serie || 'N/A'}`;
    }).join('<br/>');

    // Muestra una alerta detallada de confirmación
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      html: `
        <p>El motivo seleccionado está asociado a <strong>${asociadosList.length}</strong> artículo(s):</p>
        <div style="max-height: 200px; overflow-y: auto; text-align: left;">
          ${articuloListHTML}
        </div>
        <p>¿Deseas eliminarlo? Los artículos asociados tendrán su motivo establecido en 'Sin motivo'.</p>
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
   * Abre el modal para crear un nuevo motivo y resetea el formulario de creación.
   */
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetCreateForm();
  };

  /**
   * Resetea los campos del formulario de creación de un nuevo motivo.
   */
  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
  };

  /**
   * Maneja la creación de un nuevo motivo.
   */
  const handleCreate = async () => {
    // Validación: el nombre no puede estar vacío
    if (!newName.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del motivo no puede estar vacío.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validación: verificar si el nombre ya existe
    const nameExists = motivos.some(
      (motivo) => motivo.nombre.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ya existe un motivo con este nombre.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    const payload = {
      nombre: newName.trim(),
      descripcion: newDescription.trim() ? newDescription.trim() : 'Sin descripción',
    };

    console.log('Creando Motivo con datos:', payload); // Loguea los datos enviados

    try {
      // Crea el motivo en la API
      const createdMotivo = await createMotivo(payload);
      // Actualiza la lista local de motivos con el nuevo motivo
      setMotivos((prevMotivos) => [...prevMotivos, createdMotivo]);

      // Notifica al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Motivo creado exitosamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Resetea campos de creación y cierra el modal de creación
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDescription('');
    } catch (error) {
      console.error('Error al crear motivo:', error);
      // Maneja errores provenientes de la API
      if (error.response && error.response.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              MySwal.fire({
                icon: 'error',
                title: 'Error',
                html: `Error en ${capitalize(key)}: ${msg}`,
                customClass: {
                  confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
                },
                buttonsStyling: false,
              });
            });
          } else {
            MySwal.fire({
              icon: 'error',
              title: 'Error',
              html: `Error en ${capitalize(key)}: ${errors[key]}`,
              customClass: {
                confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
              },
              buttonsStyling: false,
            });
          }
        });
      } else {
        // Maneja errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear el motivo.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    }
  };

  /**
   * Cancela la creación de un nuevo motivo y resetea los campos relacionados.
   */
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDescription('');
  };

  /**
   * Filtra los motivos basándose en el término de búsqueda ingresado.
   *
   * @param {array} motivos - Lista de motivos.
   * @param {string} term - Término de búsqueda.
   * @returns {array} Lista filtrada de motivos.
   */
  const filteredMotivos = motivos.filter((motivo) =>
    motivo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Modal Principal: Administrar Motivos */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Motivos"
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
          <h2 className="text-2xl font-semibold text-blue-800">Administrar Motivos</h2>
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
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
            title="Crear Nuevo Motivo"
          >
            <FaPlus className="mr-2" /> Crear Motivo
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar Motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Motivos */}
        {loading ? (
          <p className="text-center text-lg text-gray-600">Cargando motivos...</p>
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
                  {filteredMotivos.length > 0 ? (
                    filteredMotivos.map((motivo) => (
                      <tr key={motivo.id} className="hover:bg-gray-50">
                        {/* Columna de Nombre */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === motivo.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className={`p-2 border ${
                                editedName.trim() === '' ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Nombre del motivo"
                            />
                          ) : (
                            motivo.nombre
                          )}
                        </td>
                        {/* Columna de Descripción */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === motivo.id ? (
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
                              placeholder="Descripción del motivo (opcional)"
                            />
                          ) : (
                            motivo.descripcion || 'Sin descripción'
                          )}
                        </td>
                        {/* Columna de Acciones */}
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === motivo.id ? (
                            <>
                              {/* Botón para Guardar Cambios */}
                              <button
                                onClick={() => handleSave(motivo.id)}
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
                              {/* Botón para Editar Motivo */}
                              <button
                                onClick={() => handleEdit(motivo)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Motivo"
                              >
                                <FaEdit size={18} />
                              </button>
                              {/* Botón para Eliminar Motivo */}
                              <button
                                onClick={() => handleDelete(motivo.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Motivo"
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
                      <td colSpan="3" className="text-center py-4 text-gray-500">No se encontraron motivos</td>
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

      {/* Modal Secundario: Crear Motivo */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nuevo Motivo"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-800">Crear Nuevo Motivo</h3>
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
              newName.trim() === '' ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Nombre del motivo"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción:</label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción del motivo (opcional)"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          {/* Botón para Guardar Nuevo Motivo */}
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
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

export default MotivoModal;
