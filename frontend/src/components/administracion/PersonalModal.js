// src/components/administracion/PersonalModal.js

import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaSave, FaTimes, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  fetchPersonal,
  createPersonal,
  updatePersonal,
  deletePersonal,
  fetchArticulos,
  updateArticulos, // Función para actualizar artículos asociados
} from '../../services/api'; // Asegúrate de que estas funciones están correctamente definidas en tu API

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
 * Componente modal para administrar el personal.
 *
 * @param {boolean} isOpen - Indica si el modal está abierto.
 * @param {function} onRequestClose - Función para cerrar el modal.
 */
const PersonalModal = ({ isOpen, onRequestClose }) => {
  // Estados para almacenar datos obtenidos de la API
  const [personal, setPersonal] = useState([]); // Lista de personal
  const [articulos, setArticulos] = useState([]); // Lista de artículos para verificar asociaciones
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda para filtrar personal
  const [editingId, setEditingId] = useState(null); // ID del personal actualmente en edición
  const [editedNombre, setEditedNombre] = useState(''); // Nombre editado del personal
  const [editedCorreo, setEditedCorreo] = useState(''); // Correo institucional editado
  const [editedSeccion, setEditedSeccion] = useState(''); // Sección editada del personal
  const [errors, setErrors] = useState({
    correo_institucional: false,
  }); // Errores de validación para campos específicos

  // Estado para manejar el indicador de carga durante operaciones críticas
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para el Modal de Creación de Nuevo Personal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Indica si el modal de creación está abierto
  const [newCorreo, setNewCorreo] = useState(''); // Correo institucional del nuevo personal
  const [createErrors, setCreateErrors] = useState({
    correo_institucional: false,
  }); // Errores de validación para campos de creación

  /**
   * Efecto que se ejecuta al abrir el modal principal.
   * Carga los datos de personal y artículos desde la API y resetea los formularios.
   */
  useEffect(() => {
    if (isOpen) {
      loadData();
      resetEditForm();
      resetCreateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Carga los datos de personal y artículos desde la API.
   * Maneja el estado de carga y errores.
   */
  const loadData = async () => {
    setIsProcessing(true);
    try {
      const [personalData, artData] = await Promise.all([
        fetchPersonal(),
        fetchArticulos(),
      ]);
      setPersonal(personalData.results || personalData); // Ajuste para paginación
      setArticulos(artData.results || artData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Muestra una alerta de error si falla la carga de datos
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos de personal o artículos.',
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
   * Resetea el formulario de edición y los estados relacionados.
   */
  const resetEditForm = () => {
    setEditingId(null);
    setEditedNombre('');
    setEditedCorreo('');
    setEditedSeccion('');
    setErrors({
      correo_institucional: false,
    });
  };

  /**
   * Resetea el formulario de creación y los estados relacionados.
   */
  const resetCreateForm = () => {
    setNewCorreo('');
    setCreateErrors({
      correo_institucional: false,
    });
  };

  /**
   * Inicia el proceso de edición para un personal específico.
   *
   * @param {object} p - El personal a editar.
   */
  const handleEdit = (p) => {
    setEditingId(p.id);
    setEditedNombre(p.nombre);
    setEditedCorreo(p.correo_institucional);
    setEditedSeccion(p.seccion);
    setErrors({
      correo_institucional: false,
    });
  };

  /**
   * Guarda los cambios realizados en un personal.
   * Realiza validaciones y actualiza la API.
   */
  const handleSaveEdit = async () => {
    // Validaciones de correo_institucional
    const newErrors = {
      correo_institucional: !editedCorreo.trim(),
    };

    if (Object.values(newErrors).some((err) => err)) {
      setErrors(newErrors);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete el correo institucional.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validar duplicados en el correo institucional
    const correoDuplicado = personal.some(
      (p) =>
        p.correo_institucional.toLowerCase() === editedCorreo.trim().toLowerCase() &&
        p.id !== editingId
    );

    if (correoDuplicado) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El correo institucional ya está registrado.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      setErrors({ ...newErrors, correo_institucional: true });
      return;
    }

    // Asignar valores predeterminados si están en blanco
    const payload = {
      nombre: editedNombre.trim() || 'Sin nombre',
      correo_institucional: editedCorreo.trim(),
      seccion: editedSeccion.trim() || 'Sin sección',
    };

    try {
      setIsProcessing(true);
      // Actualiza el personal en la API
      const updatedPersonal = await updatePersonal(editingId, payload);
      // Actualiza la lista local de personal con el personal actualizado
      setPersonal((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...updatedPersonal } : p))
      );

      // Notifica al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'El personal se actualizó correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Resetea los estados de edición
      resetEditForm();
    } catch (error) {
      console.error('Error al actualizar el personal:', error);
      // Maneja errores provenientes de la API
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessages = '';
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              errorMessages += `Error en ${capitalize(key)}: ${msg}<br/>`;
            });
          } else {
            errorMessages += `Error en ${capitalize(key)}: ${errors[key]}<br/>`;
          }
        });

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
        // Maneja errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al actualizar el personal.',
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

  /**
   * Maneja la eliminación de un personal.
   * Verifica si el personal tiene préstamos activos antes de eliminar.
   *
   * @param {number} id - ID del personal a eliminar.
   */
  const handleDelete = async (id) => {
    try {
      // Verificar si el personal tiene préstamos activos
      const hasActiveLoans = await checkActiveLoans(id); // Implementa esta función según tu lógica de negocio
      if (hasActiveLoans) {
        // Si tiene préstamos activos, notifica al usuario y no permite la eliminación
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Este personal tiene préstamos activos y no puede ser eliminado.',
          customClass: {
            confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
        return;
      }

      // Muestra una alerta de confirmación antes de eliminar
      const result = await MySwal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará el registro de forma permanente.',
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
        setIsProcessing(true);
        // Elimina el personal de la API
        await deletePersonal(id);
        // Actualiza la lista local de personal eliminando el personal eliminado
        setPersonal((prev) => prev.filter((p) => p.id !== id));

        // Notifica al usuario de la eliminación exitosa
        MySwal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'El personal fue eliminado correctamente.',
          customClass: {
            confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error('Error al eliminar el personal:', error);
      // Maneja errores generales durante la eliminación
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al eliminar el personal.',
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
   * Verifica si un personal tiene préstamos activos.
   *
   * @param {number} id - ID del personal a verificar.
   * @returns {boolean} Indica si el personal tiene préstamos activos.
   */
  const checkActiveLoans = async (id) => {
    // Implementa la lógica para verificar préstamos activos
    // Por ejemplo, podrías tener un endpoint como /api/personal/{id}/prestamos_activos/
    try {
      const response = await fetch(`/api/personal/${id}/prestamos_activos/`);
      if (response.ok) {
        const data = await response.json();
        return data.has_active_loans;
      }
      return false;
    } catch (error) {
      console.error('Error al verificar préstamos activos:', error);
      return false;
    }
  };

  /**
   * Abre el modal para crear un nuevo personal y resetea el formulario de creación.
   */
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    resetCreateForm();
  };

  /**
   * Maneja la creación de un nuevo personal.
   * Realiza validaciones y crea el personal en la API.
   */
  const handleCreate = async () => {
    // Validaciones de correo_institucional
    const newErrors = {
      correo_institucional: !newCorreo.trim(),
    };

    if (Object.values(newErrors).some((err) => err)) {
      setCreateErrors(newErrors);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete el correo institucional.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      return;
    }

    // Validar duplicados en el correo institucional
    const correoDuplicado = personal.some(
      (p) => p.correo_institucional.toLowerCase() === newCorreo.trim().toLowerCase()
    );

    if (correoDuplicado) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El correo institucional ya está registrado.',
        customClass: {
          confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });
      setCreateErrors({ ...newErrors, correo_institucional: true });
      return;
    }

    // Asignar valores predeterminados si están en blanco
    const payload = {
      nombre: 'Sin nombre', // Valor predeterminado
      correo_institucional: newCorreo.trim(),
      seccion: 'Sin sección', // Valor predeterminado
    };

    try {
      setIsProcessing(true);
      // Crea el nuevo personal en la API
      const createdPersonal = await createPersonal(payload);
      // Actualiza la lista local de personal agregando el nuevo personal
      setPersonal((prev) => [...prev, createdPersonal]);

      // Notifica al usuario del éxito
      MySwal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Nuevo personal agregado correctamente.',
        customClass: {
          confirmButton: 'bg-green-600 text-white px-4 py-2 rounded-md',
        },
        buttonsStyling: false,
      });

      // Cierra el modal de creación y resetea el formulario
      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error('Error al crear personal:', error);
      // Maneja errores provenientes de la API
      if (error.response && error.response.data) {
        const errors = error.response.data;
        let errorMessages = '';
        Object.keys(errors).forEach((key) => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg) => {
              errorMessages += `Error en ${capitalize(key)}: ${msg}<br/>`;
            });
          } else {
            errorMessages += `Error en ${capitalize(key)}: ${errors[key]}<br/>`;
          }
        });

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
        // Maneja errores generales
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear el personal.',
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

  /**
   * Cancela la creación de un nuevo personal y resetea los campos relacionados.
   */
  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  /**
   * Filtra la lista de personal basándose en el término de búsqueda ingresado.
   *
   * @param {array} personal - Lista completa de personal.
   * @param {string} term - Término de búsqueda.
   * @returns {array} Lista filtrada de personal.
   */
  const filterPersonal = useCallback(
    (personal, term) => {
      if (!term) return personal;
      const termLower = term.toLowerCase();
      return personal.filter(
        (p) =>
          p.nombre.toLowerCase().includes(termLower) ||
          p.correo_institucional.toLowerCase().includes(termLower) ||
          p.seccion.toLowerCase().includes(termLower)
      );
    },
    []
  );

  return (
    <>
      {/* Modal Principal: Administrar Personal */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Administrar Personal"
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Indicador de Carga durante Operaciones Críticas */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-50">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          </div>
        )}

        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-800">Administrar Personal</h2>
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
            title="Crear Nuevo Personal"
          >
            <FaPlus className="mr-2" /> Crear Personal
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Buscar personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaTimes className="ml-2 text-gray-500" />
        </div>

        {/* Tabla de Personal */}
        {isProcessing ? (
          <p className="text-center text-lg text-gray-600">Procesando...</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-100 sticky top-0">
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Nombre</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Correo Institucional</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-blue-700">Sección</th>
                    <th className="py-3 px-6 text-center text-sm font-medium text-blue-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filterPersonal(personal, searchTerm).length > 0 ? (
                    filterPersonal(personal, searchTerm).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        {/* Columna de Nombre */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === p.id ? (
                            <input
                              type="text"
                              value={editedNombre}
                              onChange={(e) => setEditedNombre(e.target.value)}
                              className={`p-2 border ${
                                editedNombre.trim() === '' ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Nombre del personal"
                            />
                          ) : (
                            p.nombre
                          )}
                        </td>
                        {/* Columna de Correo Institucional */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === p.id ? (
                            <input
                              type="email"
                              value={editedCorreo}
                              onChange={(e) => setEditedCorreo(e.target.value)}
                              className={`p-2 border ${
                                errors.correo_institucional ? 'border-red-500' : 'border-gray-300'
                              } rounded-md w-full`}
                              placeholder="Correo institucional"
                            />
                          ) : (
                            p.correo_institucional
                          )}
                        </td>
                        {/* Columna de Sección */}
                        <td className="py-3 px-6 text-sm text-gray-700">
                          {editingId === p.id ? (
                            <input
                              type="text"
                              value={editedSeccion}
                              onChange={(e) => setEditedSeccion(e.target.value)}
                              className="p-2 border border-gray-300 rounded-md w-full"
                              placeholder="Sección"
                            />
                          ) : (
                            p.seccion
                          )}
                        </td>
                        {/* Columna de Acciones */}
                        <td className="py-3 px-6 text-center space-x-4">
                          {editingId === p.id ? (
                            <>
                              {/* Botón para Guardar Cambios */}
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                title="Guardar cambios"
                              >
                                <FaSave size={18} />
                              </button>
                              {/* Botón para Cancelar Edición */}
                              <button
                                onClick={resetEditForm}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Cancelar edición"
                              >
                                <FaTimes size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Botón para Editar Personal */}
                              <button
                                onClick={() => handleEdit(p)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Editar Personal"
                              >
                                <FaEdit size={18} />
                              </button>
                              {/* Botón para Eliminar Personal */}
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Eliminar Personal"
                              >
                                <FaTrash size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fila que se muestra cuando no hay registros filtrados
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">
                        No se encontraron registros.
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

      {/* Modal Secundario: Crear Personal */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCancelCreate}
        contentLabel="Crear Nuevo Personal"
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 overflow-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        {/* Encabezado del Modal de Creación */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-800">Crear Nuevo Personal</h3>
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
            Correo Institucional<span className="text-red-500">*</span>:
          </label>
          <input
            type="email"
            value={newCorreo}
            onChange={(e) => setNewCorreo(e.target.value)}
            className={`w-full p-2 border ${
              createErrors.correo_institucional ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Correo institucional"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4">
          {/* Botón para Guardar Nuevo Personal */}
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

export default PersonalModal;
