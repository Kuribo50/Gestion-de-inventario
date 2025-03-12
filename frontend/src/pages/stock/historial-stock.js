// src/pages/stock/historial-stock.js

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  useTable,
  useGlobalFilter,
  useSortBy,
  usePagination,
} from 'react-table';
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaFileExcel,
  FaFileCsv,
  FaFilePdf,
  FaUpload,
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
  FaDownload,
} from 'react-icons/fa';

import Sidebar from '../../components/Sidebar';
import AsyncSelect from 'react-select/async';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';

// Librerías para exportar archivos
import * as XLSX from 'xlsx';        // Manejar Excel
import { saveAs } from 'file-saver'; // Guardar archivos en el navegador
import jsPDF from 'jspdf';           // Manejar PDF
import 'jspdf-autotable';            // Extensión para tablas en PDF

import {
  fetchArticulos,
  fetchCategorias,
  fetchModelos,
  fetchMarcas,
  fetchUbicaciones,
  fetchEstados,
  importArticulos,
  downloadPlantillaArticulos,
} from '../../services/api';
import { useUser } from '../../context/UserContext';

// Configuración de react-modal para accesibilidad
Modal.setAppElement('#__next');

/**
 * Formatea una cadena de fecha a un formato legible.
 * @param {string} fechaStr - Cadena de fecha en formato ISO.
 * @returns {string} Fecha formateada.
 */
const formatFecha = (fechaStr) => {
  if (!fechaStr) return '----';
  const d = new Date(fechaStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
};

/**
 * Componente para el filtro global de la tabla.
 * @param {object} props - Propiedades del componente.
 * @param {string} props.globalFilter - Valor actual del filtro global.
 * @param {function} props.setGlobalFilter - Función para actualizar el filtro global.
 */
const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
  return (
    <input
      value={globalFilter || ''}
      onChange={(e) => setGlobalFilter(e.target.value)}
      placeholder="Buscar en todos los campos..."
      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
    />
  );
};

/**
 * Componente Modal para importar artículos.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Estado de apertura del modal.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {function} props.onImportSuccess - Función a ejecutar tras una importación exitosa.
 */
const ImportarArticulosModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuración de react-dropzone para manejar la selección de archivos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        // Notificación de archivo seleccionado
        Swal.fire({
          icon: 'info',
          title: 'Archivo seleccionado',
          text: `Archivo cargado: ${acceptedFiles[0].name}`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },
  });

  /**
   * Descarga la plantilla de importación desde el backend.
   */
  const handleDownloadTemplateBackend = async () => {
    try {
      await downloadPlantillaArticulos();
      // Notificación de descarga exitosa
      Swal.fire({
        icon: 'success',
        title: 'Plantilla descargada',
        text: 'La plantilla ha sido descargada correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al descargar plantilla:', error.response?.data || error.message);
      // Notificación de error en la descarga
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo descargar la plantilla.',
      });
    }
  };

  /**
   * Procesa la importación de artículos.
   */
  const handleImport = async () => {
    if (!selectedFile) {
      // Notificación si no se ha seleccionado un archivo
      Swal.fire({
        icon: 'error',
        title: 'Archivo no seleccionado',
        text: 'Por favor, selecciona un archivo para importar.',
      });
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Notificación de carga durante la importación
      Swal.fire({
        title: 'Importando...',
        text: 'Por favor, espera mientras se procesa el archivo.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Llamada a la API para importar artículos
      const response = await importArticulos(formData);

      // Cierre de la notificación de carga
      Swal.close();

      // Verificación de la respuesta de la API
      if (response && response.creados !== undefined && response.actualizados !== undefined) {
        // Notificación de éxito con detalles de la importación
        Swal.fire({
          icon: 'success',
          title: 'Importación exitosa',
          html: `Importación completada correctamente.<br/>Registros creados: ${response.creados}.<br/>Registros actualizados: ${response.actualizados}.`,
          confirmButtonColor: '#3085d6',
        });
        onImportSuccess(); // Refresca los datos en el componente padre
        onClose(); // Cierra el modal
      } else {
        // Notificación en caso de respuesta inesperada
        Swal.fire({
          icon: 'warning',
          title: 'Importación parcial',
          text: 'La importación se realizó, pero faltan detalles en la respuesta.',
          confirmButtonColor: '#FFA500',
        });
      }
    } catch (error) {
      console.error('Error en la importación:', error.response?.data || error.message);
      Swal.close();
      // Notificación de error durante la importación
      Swal.fire({
        icon: 'error',
        title: 'Error en la importación',
        text: error.response?.data?.detail || 'Ocurrió un error durante la importación.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="z-[60] bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl relative max-h-full md:max-h-[90vh] overflow-y-auto"
      overlayClassName="z-[50] fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Importar Artículos</h2>

        {/* Instrucciones para la importación */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Instrucciones para Importar Artículos:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>1. Descarga la plantilla de importación haciendo clic en &quot;Descargar Plantilla&quot;.</li>
            <li>2. Rellena los datos en la plantilla asegurándote de seguir el formato correcto.</li>
            <li>3. Guarda el archivo completado en tu computadora.</li>
            <li>4. Arrastra y suelta el archivo en la zona de importación o haz clic para seleccionarlo.</li>
            <li>5. Haz clic en &quot;Procesar Importación&quot; para subir los datos.</li>
          </ul>
        </div>

        {/* Área de drag and drop para subir archivos */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-gray-400 rounded-lg p-10 text-center cursor-pointer bg-gray-50 ${
            isDragActive ? 'bg-blue-50 border-blue-500' : ''
          }`}
          style={{ minHeight: '200px' }}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <p className="text-green-600 text-lg font-medium">{selectedFile.name}</p>
          ) : (
            <p className="text-gray-600 text-lg">Arrastra aquí tu archivo o haz clic para seleccionarlo.</p>
          )}
        </div>

        {/* Botón para descargar la plantilla */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleDownloadTemplateBackend}
            className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <FaDownload className="inline mr-2" />
            Descargar Plantilla
          </button>
        </div>

        {/* Botones para cancelar o procesar la importación */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onClose}
            className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              isProcessing
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isProcessing || !selectedFile
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            disabled={isProcessing || !selectedFile}
          >
            <FaUpload className="inline mr-2" />
            Procesar Importación
          </button>
        </div>
      </div>
    </Modal>
  );

};

ImportarArticulosModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImportSuccess: PropTypes.func.isRequired,
};

/**
 * Componente principal para gestionar el historial de stock.
 */
const HistorialStock = () => {
  // Estados para almacenar datos de artículos y filtros
  const [stock, setStock] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [estados, setEstados] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para controlar filtros y visibilidad
  const [showFilters, setShowFilters] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  // Estados para filtros avanzados
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [modeloFiltro, setModeloFiltro] = useState(null);
  const [marcaFiltro, setMarcaFiltro] = useState(null);
  const [ubicacionFiltro, setUbicacionFiltro] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState(null);
  const [numeroSerieFiltro, setNumeroSerieFiltro] = useState('');
  const [codigoMinvuFiltro, setCodigoMinvuFiltro] = useState('');
  const [codigoInternoFiltro, setCodigoInternoFiltro] = useState('');
  const [macFiltro, setMacFiltro] = useState('');
  const [descripcionFiltro, setDescripcionFiltro] = useState('');
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
  const [fechaFinFiltro, setFechaFinFiltro] = useState('');

  // Limite de exportación
  const exportLimit = 'all'; // Cambia a un número si deseas un límite específico

  // Estado para controlar la apertura del modal de importación
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Obtención del usuario actual desde el contexto
  const { user, loading: userLoading } = useUser();

  /**
   * Función para obtener y actualizar los datos de stock.
   */
  const fetchHistorialStockData = async () => {
    try {
      const data = await fetchArticulos(); // Ajustar si tienes un endpoint específico para historial
      setStock(Array.isArray(data) ? data : []);
      // Notificación de éxito al actualizar los datos
      Swal.fire({
        icon: 'success',
        title: 'Datos actualizados',
        text: 'La tabla se ha actualizado correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      setError('Error al cargar los datos.');
      console.error(err);
      // Notificación de error al cargar los datos
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los datos.',
      });
    }
  };

  /**
   * Función para buscar un elemento de manera segura en una lista por su ID.
   * @param {Array} list - Lista de objetos.
   * @param {number|string} id - ID del objeto a buscar.
   * @returns {object} Objeto encontrado o vacío.
   */
  const safeFind = useCallback((list, id) => {
    return Array.isArray(list)
      ? list.find((item) => item.id === id) || {}
      : {};
  }, []);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          stockData,
          categoriaData,
          modeloData,
          marcaData,
          ubicacionData,
          estadoData,
        ] = await Promise.all([
          fetchArticulos(),
          fetchCategorias(),
          fetchModelos(),
          fetchMarcas(),
          fetchUbicaciones(),
          fetchEstados(),
        ]);

        setStock(Array.isArray(stockData) ? stockData : []);
        setCategorias(Array.isArray(categoriaData) ? categoriaData : []);
        setModelos(Array.isArray(modeloData) ? modeloData : []);
        setMarcas(Array.isArray(marcaData) ? marcaData : []);
        setUbicaciones(Array.isArray(ubicacionData) ? ubicacionData : []);
        setEstados(Array.isArray(estadoData) ? estadoData : []);
      } catch (err) {
        setError('Error al cargar los datos.');
        console.error(err);
        // Notificación de error al cargar los datos
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los datos.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Funciones para cargar opciones en los selectores asíncronos.
   */
  const loadCategorias = async (inputValue) => {
    try {
      const cats = await fetchCategorias();
      return cats
        .filter((cat) =>
          cat.nombre.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((cat) => ({
          label: cat.nombre,
          value: cat.id,
        }));
    } catch (error) {
      console.error('Error cargando categorías:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar categorías.',
      });
      return [];
    }
  };

  const loadModelos = async (inputValue) => {
    try {
      const mods = await fetchModelos();
      return mods
        .filter((mod) =>
          mod.nombre.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((mod) => ({
          label: mod.nombre,
          value: mod.id,
        }));
    } catch (error) {
      console.error('Error cargando modelos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar modelos.',
      });
      return [];
    }
  };

  const loadMarcas = async (inputValue) => {
    try {
      const ms = await fetchMarcas();
      return ms
        .filter((m) =>
          m.nombre.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((m) => ({
          label: m.nombre,
          value: m.id,
        }));
    } catch (error) {
      console.error('Error cargando marcas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar marcas.',
      });
      return [];
    }
  };

  const loadUbicaciones = async (inputValue) => {
    try {
      const ubics = await fetchUbicaciones();
      return ubics
        .filter((u) =>
          u.nombre.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((u) => ({
          label: u.nombre,
          value: u.id,
        }));
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar ubicaciones.',
      });
      return [];
    }
  };

  const loadEstados = async (inputValue) => {
    try {
      const ests = await fetchEstados();
      return ests
        .filter((e) =>
          e.nombre.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((e) => ({
          label: e.nombre,
          value: e.id,
        }));
    } catch (error) {
      console.error('Error cargando estados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar estados.',
      });
      return [];
    }
  };

  /**
   * Filtra los artículos según los filtros seleccionados.
   */
  const filteredStock = useMemo(() => {
    let filtered = stock;
    if (categoriaFiltro) {
      filtered = filtered.filter(
        (item) => item.categoria === categoriaFiltro.value
      );
    }
    if (modeloFiltro) {
      filtered = filtered.filter((item) => item.modelo === modeloFiltro.value);
    }
    if (marcaFiltro) {
      filtered = filtered.filter((item) => item.marca === marcaFiltro.value);
    }
    if (ubicacionFiltro) {
      filtered = filtered.filter(
        (item) => item.ubicacion === ubicacionFiltro.value
      );
    }
    if (estadoFiltro) {
      filtered = filtered.filter((item) => item.estado === estadoFiltro.value);
    }
    if (fechaInicioFiltro) {
      filtered = filtered.filter(
        (item) => new Date(item.fecha) >= new Date(fechaInicioFiltro)
      );
    }
    if (fechaFinFiltro) {
      filtered = filtered.filter(
        (item) => new Date(item.fecha) <= new Date(fechaFinFiltro)
      );
    }
    if (numeroSerieFiltro) {
      filtered = filtered.filter((item) =>
        (item.numero_serie || '')
          .toLowerCase()
          .includes(numeroSerieFiltro.toLowerCase())
      );
    }
    if (codigoMinvuFiltro) {
      filtered = filtered.filter((item) =>
        (item.codigo_minvu || '')
          .toLowerCase()
          .includes(codigoMinvuFiltro.toLowerCase())
      );
    }
    if (codigoInternoFiltro) {
      filtered = filtered.filter((item) =>
        (item.codigo_interno || '')
          .toLowerCase()
          .includes(codigoInternoFiltro.toLowerCase())
      );
    }
    if (macFiltro) {
      filtered = filtered.filter((item) =>
        (item.mac || '').toLowerCase().includes(macFiltro.toLowerCase())
      );
    }
    if (descripcionFiltro) {
      filtered = filtered.filter((item) =>
        (item.descripcion || '')
          .toLowerCase()
          .includes(descripcionFiltro.toLowerCase())
      );
    }
    return filtered;
  }, [
    stock,
    categoriaFiltro,
    modeloFiltro,
    marcaFiltro,
    ubicacionFiltro,
    estadoFiltro,
    fechaInicioFiltro,
    fechaFinFiltro,
    numeroSerieFiltro,
    codigoMinvuFiltro,
    codigoInternoFiltro,
    macFiltro,
    descripcionFiltro,
  ]);

  /**
   * Filtro global personalizado que busca en múltiples campos.
   */
  const customGlobalFilter = useCallback(
    (rows, columns, filterValue) => {
      if (!filterValue) return rows;
      const lowerFilter = filterValue.toLowerCase();

      return rows.filter((row) => {
        const valuesToSearch = [
          row.values['nombre'] || '',
          safeFind(categorias, row.original.categoria)?.nombre || '',
          safeFind(ubicaciones, row.original.ubicacion)?.nombre || '',
          safeFind(estados, row.original.estado)?.nombre || '',
          safeFind(modelos, row.original.modelo)?.nombre || '',
          safeFind(marcas, row.original.marca)?.nombre || '',
          row.values['numero_serie'] || '',
          row.values['codigo_minvu'] || '',
          row.values['codigo_interno'] || '',
          row.values['mac'] || '',
          row.values['descripcion'] || '',
        ].map((val) => val.toString().toLowerCase());

        return valuesToSearch.some((val) => val.includes(lowerFilter));
      });
    },
    [categorias, ubicaciones, modelos, marcas, estados, safeFind]
  );

  /**
   * Define las columnas de la tabla.
   */
  const columns = useMemo(
    () => [
      {
        Header: 'Nombre',
        accessor: 'nombre',
      },
      {
        Header: 'Categoría',
        accessor: 'categoria',
        Cell: ({ value }) => safeFind(categorias, value)?.nombre || '----',
      },
      {
        Header: 'Ubicación',
        accessor: 'ubicacion',
        Cell: ({ value }) => safeFind(ubicaciones, value)?.nombre || '----',
      },
      {
        Header: 'Cantidad',
        accessor: 'stock_actual',
        Cell: ({ value }) => (
          <span className="bg-green-200 text-blue-600 px-2 py-1 rounded-full text-xs font-semibold">
            {value}
          </span>
        ),
      },
      {
        Header: 'Estado',
        accessor: 'estado',
        Cell: ({ value }) => safeFind(estados, value)?.nombre || '----',
      },
      {
        Header: 'Modelo',
        accessor: 'modelo',
        Cell: ({ value }) => safeFind(modelos, value)?.nombre || '----',
      },
      {
        Header: 'Marca',
        accessor: 'marca',
        Cell: ({ value }) => safeFind(marcas, value)?.nombre || '----',
      },
      {
        Header: 'N° Serie',
        accessor: 'numero_serie',
      },
      {
        Header: 'Cód. Minvu',
        accessor: 'codigo_minvu',
      },
      {
        Header: 'Cód. Interno',
        accessor: 'codigo_interno',
      },
      {
        Header: 'MAC',
        accessor: 'mac',
      },
      {
        Header: 'Descripción',
        accessor: 'descripcion',
      },
      {
        Header: 'Prestado',
        accessor: 'prestado',
        Cell: ({ value }) => (value ? 'Sí' : 'No'),
      },
    ],
    [categorias, ubicaciones, modelos, marcas, estados, safeFind]
  );

  /**
   * Configuración de React Table con filtros, ordenamiento y paginación.
   */
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize },
    setGlobalFilter: setTableGlobalFilter,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
  } = useTable(
    {
      columns,
      data: filteredStock,
      initialState: { pageIndex: 0, pageSize: 10 },
      globalFilter: customGlobalFilter,
      filterTypes: {
        global: customGlobalFilter,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Sincroniza el filtro global con React Table
  useEffect(() => {
    setTableGlobalFilter(globalFilter);
  }, [globalFilter, setTableGlobalFilter]);

  /**
   * Exporta los datos a un archivo CSV desde el frontend.
   */
  const exportToCSVFront = () => {
    try {
      const dataToExport = filteredStock.slice(
        0,
        exportLimit === 'all' ? undefined : exportLimit
      );

      const headers = [
        'Nombre',
        'Categoría',
        'Ubicación',
        'Cantidad',
        'Estado',
        'Modelo',
        'Marca',
        'N° Serie',
        'Cód. Minvu',
        'Cód. Interno',
        'MAC',
        'Descripción',
        'Prestado',
      ];

      const csvRows = [headers.join(',')];

      dataToExport.forEach((item) => {
        const row = [
          item.nombre,
          safeFind(categorias, item.categoria)?.nombre || '',
          safeFind(ubicaciones, item.ubicacion)?.nombre || '',
          item.stock_actual,
          safeFind(estados, item.estado)?.nombre || '',
          safeFind(modelos, item.modelo)?.nombre || '',
          safeFind(marcas, item.marca)?.nombre || '',
          item.numero_serie || '',
          item.codigo_minvu || '',
          item.codigo_interno || '',
          item.mac || '',
          item.descripcion || '',
          item.prestado ? 'Sí' : 'No',
        ];

        const escaped = row.map((val) => {
          let v = val.toString().replace(/"/g, '""');
          if (v.includes(',') || v.includes('"') || v.includes('\n')) {
            v = `"${v}"`;
          }
          return v;
        });
        csvRows.push(escaped.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `HistorialStock_${Date.now()}.csv`);

      // Notificación de éxito en la exportación
      Swal.fire({
        icon: 'success',
        title: 'Exportación CSV completada',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error exportando a CSV (Front):', error);
      // Notificación de error en la exportación
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al exportar a CSV.',
        confirmButtonColor: '#d33',
      });
    }
  };

  /**
   * Exporta los datos a un archivo Excel desde el frontend.
   */
  const exportToExcelFront = () => {
    try {
      const dataToExport = filteredStock.slice(
        0,
        exportLimit === 'all' ? undefined : exportLimit
      );

      const wsData = [
        ['Historial de stock'],
        ['Fecha de exportación: ' + new Date().toLocaleString()],
        [],
      ];

      const headerRow = [
        'Nombre',
        'Categoría',
        'Ubicación',
        'Cantidad',
        'Estado',
        'Modelo',
        'Marca',
        'N° Serie',
        'Cód. Minvu',
        'Cód. Interno',
        'MAC',
        'Descripción',
        'Prestado',
      ];
      wsData.push(headerRow);

      dataToExport.forEach((item) => {
        wsData.push([
          item.nombre,
          safeFind(categorias, item.categoria)?.nombre || '',
          safeFind(ubicaciones, item.ubicacion)?.nombre || '',
          item.stock_actual,
          safeFind(estados, item.estado)?.nombre || '',
          safeFind(modelos, item.modelo)?.nombre || '',
          safeFind(marcas, item.marca)?.nombre || '',
          item.numero_serie || '',
          item.codigo_minvu || '',
          item.codigo_interno || '',
          item.mac || '',
          item.descripcion || '',
          item.prestado ? 'Sí' : 'No',
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = new Array(headerRow.length).fill({ wch: 20 });

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          if (!ws[cellAddress].s) {
            ws[cellAddress].s = {};
          }
          // Añadir bordes a las celdas
          ws[cellAddress].s.border = {
            top: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
          };

          // Formato para el título
          if (R === 0) {
            ws[cellAddress].s.font = { bold: true, sz: 14 };
          }
          // Formato para la fecha de exportación
          if (R === 1) {
            ws[cellAddress].s.font = { italic: true };
          }
          // Formato para los encabezados de la tabla
          if (R === 3) {
            ws[cellAddress].s.fill = { fgColor: { rgb: 'D3D3D3' } };
            ws[cellAddress].s.font = { bold: true };
          }
          // Alternancia de colores en las filas
          if (R > 3) {
            const rowIndex = R - 4;
            if (rowIndex % 2 === 0) {
              ws[cellAddress].s.fill = { fgColor: { rgb: 'F7F7F7' } };
            } else {
              ws[cellAddress].s.fill = { fgColor: { rgb: 'FFFFFF' } };
            }
          }
        }
      }

      // Merge de celdas para el título
      ws['!merges'] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: headerRow.length - 1 },
        },
      ];
      // Centrar el título
      if (ws['A1'] && ws['A1'].s) {
        ws['A1'].s.alignment = { horizontal: 'center' };
      }

      XLSX.utils.book_append_sheet(wb, ws, 'HistorialStock');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `HistorialStock_${Date.now()}.xlsx`);

      // Notificación de éxito en la exportación
      Swal.fire({
        icon: 'success',
        title: 'Exportación a Excel completada',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error exportando a Excel (Front):', error);
      // Notificación de error en la exportación
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al exportar a Excel.',
        confirmButtonColor: '#d33',
      });
    }
  };

  /**
   * Exporta los datos a un archivo PDF desde el frontend.
   */
  const exportToPDFFront = () => {
    try {
      const dataToExport = filteredStock.slice(
        0,
        exportLimit === 'all' ? undefined : exportLimit
      );

      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFontSize(14);
      doc.text('Historial de stock', 40, 40);

      doc.setFontSize(10);
      doc.text('Fecha de exportación: ' + new Date().toLocaleString(), 40, 60);

      const headerNames = [
        'Nombre',
        'Categoría',
        'Ubicación',
        'Cantidad',
        'Estado',
        'Modelo',
        'Marca',
        'N° Serie',
        'Cód. Minvu',
        'Cód. Interno',
        'MAC',
        'Descripción',
        'Prestado',
      ];
      const tableRows = dataToExport.map((item) => [
        item.nombre,
        safeFind(categorias, item.categoria)?.nombre || '',
        safeFind(ubicaciones, item.ubicacion)?.nombre || '',
        item.stock_actual,
        safeFind(estados, item.estado)?.nombre || '',
        safeFind(modelos, item.modelo)?.nombre || '',
        safeFind(marcas, item.marca)?.nombre || '',
        item.numero_serie || '',
        item.codigo_minvu || '',
        item.codigo_interno || '',
        item.mac || '',
        item.descripcion || '',
        item.prestado ? 'Sí' : 'No',
      ]);

      // Generar la tabla en el PDF
      doc.autoTable({
        startY: 80,
        head: [headerNames],
        body: tableRows,
        styles: { fontSize: 7 },
        headStyles: {
          fillColor: [211, 211, 211],
          textColor: 20,
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [247, 247, 247] },
        margin: { left: 40, right: 40 },
      });

      const pdfBlobUrl = doc.output('bloburl');
      window.open(pdfBlobUrl, '_blank');

      // Notificación de éxito en la exportación
      Swal.fire({
        icon: 'success',
        title: 'PDF generado',
        text: 'El PDF se ha abierto en una nueva pestaña.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al exportar PDF (Front):', error);
      // Notificación de error en la exportación
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al exportar PDF.',
        confirmButtonColor: '#d33',
      });
    }
  };

  /**
   * Abre el modal de importación.
   */
  const handleImportFront = () => {
    setIsImportModalOpen(true);
  };

  /**
   * Limpia todos los filtros aplicados.
   */
  const clearFilters = () => {
    setCategoriaFiltro(null);
    setModeloFiltro(null);
    setMarcaFiltro(null);
    setUbicacionFiltro(null);
    setEstadoFiltro(null);
    setFechaInicioFiltro('');
    setFechaFinFiltro('');
    setNumeroSerieFiltro('');
    setCodigoMinvuFiltro('');
    setCodigoInternoFiltro('');
    setMacFiltro('');
    setDescripcionFiltro('');
    setGlobalFilter('');
  };

  // Estado de carga o errores antes de renderizar la interfaz
  if (loading || userLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <div className="text-xl text-blue-500">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  /**
   * Renderiza la interfaz principal del componente.
   */
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-4 md:ml-64 bg-white">
        {/* Barra superior con filtro global y botones de exportación */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
          {/* Filtro global y botón para mostrar/ocultar filtros avanzados */}
          <div className="flex items-center w-full sm:w-1/2">
            <GlobalFilter
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center ml-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors focus:outline-none"
              title={showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              aria-label={showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            >
              <FaFilter />
            </button>
          </div>

          {/* Botones para exportar y importar artículos */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end space-x-2">
            {/* Botón para exportar a Excel */}
            <button
              onClick={exportToExcelFront}
              className="flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm mb-2 sm:mb-0"
              title="Exportar a Excel (Frontend)"
              aria-label="Exportar a Excel (Frontend)"
            >
              <FaFileExcel className="mr-1" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>

            {/* Botón para exportar a PDF */}
            <button
              onClick={exportToPDFFront}
              className="flex items-center justify-center bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm mb-2 sm:mb-0"
              title="Exportar a PDF (Frontend)"
              aria-label="Exportar a PDF (Frontend)"
            >
              <FaFilePdf className="mr-1" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>

            {/* Botón para exportar a CSV */}
            <button
              onClick={exportToCSVFront}
              className="flex items-center justify-center bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm mb-2 sm:mb-0"
              title="Exportar a CSV (Frontend)"
              aria-label="Exportar a CSV (Frontend)"
            >
              <FaFileCsv className="mr-1" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {/* Botón para abrir el modal de importación */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleImportFront}
                className="flex items-center justify-center bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm mb-2 sm:mb-0"
                title="Importar Artículos"
                aria-label="Importar Artículos"
              >
                <FaUpload className="mr-1" />
                <span className="hidden sm:inline">Importar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Muestra el nombre del usuario actual */}
        <div className="mb-4 text-right text-gray-700">
          <span>
            Usuario: <strong>{user?.username}</strong>
          </span>
        </div>

        {/* Filtros avanzados que se muestran u ocultan */}
        {showFilters && (
          <div className="bg-gray-50 shadow-md rounded-md p-4 mb-4 text-sm space-y-4">
            {/* Primera fila de filtros: Categoría, Modelo, Marca, Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="categoriaFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Categoría
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadCategorias}
                  defaultOptions
                  value={categoriaFiltro}
                  onChange={setCategoriaFiltro}
                  placeholder="Seleccionar Categoría"
                  className="mt-1"
                  isClearable
                />
              </div>
              <div>
                <label
                  htmlFor="modeloFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Modelo
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadModelos}
                  defaultOptions
                  value={modeloFiltro}
                  onChange={setModeloFiltro}
                  placeholder="Seleccionar Modelo"
                  className="mt-1"
                  isClearable
                />
              </div>
              <div>
                <label
                  htmlFor="marcaFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Marca
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadMarcas}
                  defaultOptions
                  value={marcaFiltro}
                  onChange={setMarcaFiltro}
                  placeholder="Seleccionar Marca"
                  className="mt-1"
                  isClearable
                />
              </div>
              <div>
                <label
                  htmlFor="ubicacionFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ubicación
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadUbicaciones}
                  defaultOptions
                  value={ubicacionFiltro}
                  onChange={setUbicacionFiltro}
                  placeholder="Seleccionar Ubicación"
                  className="mt-1"
                  isClearable
                />
              </div>
            </div>

            {/* Segunda fila de filtros: Estado, Número de Serie, Código Minvu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="estadoFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Estado
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadEstados}
                  defaultOptions
                  value={estadoFiltro}
                  onChange={setEstadoFiltro}
                  placeholder="Seleccionar Estado"
                  className="mt-1"
                  isClearable
                />
              </div>
              <div>
                <label
                  htmlFor="numeroSerieFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  N° Serie
                </label>
                <input
                  id="numeroSerieFiltro"
                  type="text"
                  value={numeroSerieFiltro}
                  onChange={(e) => setNumeroSerieFiltro(e.target.value)}
                  placeholder="Número de Serie"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="codigoMinvuFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Cód. Minvu
                </label>
                <input
                  id="codigoMinvuFiltro"
                  type="text"
                  value={codigoMinvuFiltro}
                  onChange={(e) => setCodigoMinvuFiltro(e.target.value)}
                  placeholder="Código Minvu"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                />
              </div>
            </div>

            {/* Tercera fila de filtros: Código Interno, MAC, Descripción */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="codigoInternoFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Cód. Interno
                </label>
                <input
                  id="codigoInternoFiltro"
                  type="text"
                  value={codigoInternoFiltro}
                  onChange={(e) => setCodigoInternoFiltro(e.target.value)}
                  placeholder="Código Interno"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="macFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  MAC
                </label>
                <input
                  id="macFiltro"
                  type="text"
                  value={macFiltro}
                  onChange={(e) => setMacFiltro(e.target.value)}
                  placeholder="MAC"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="descripcionFiltro"
                  className="block text-sm font-medium text-gray-700"
                >
                  Descripción
                </label>
                <input
                  id="descripcionFiltro"
                  type="text"
                  value={descripcionFiltro}
                  onChange={(e) => setDescripcionFiltro(e.target.value)}
                  placeholder="Descripción"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                />
              </div>
            </div>

            {/* Botón para limpiar todos los filtros */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center justify-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                title="Borrar Filtros"
                aria-label="Borrar Filtros"
              >
                Borrar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Modal de Importación */}
        <ImportarArticulosModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={fetchHistorialStockData}
        />

        {/* Tabla principal con los artículos */}
        <div className="overflow-x-auto border border-gray-300 rounded-md shadow-sm text-sm bg-white mt-4">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              {headerGroups.map((headerGroup) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={headerGroup.id}
                  className="whitespace-nowrap"
                >
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      key={column.id}
                      className="px-4 py-2 text-left font-semibold uppercase text-gray-700 border border-gray-300"
                      scope="col"
                    >
                      <div className="flex items-center">
                        {column.render('Header')}
                        <span className="ml-1">
                          {column.isSorted ? (
                            column.isSortedDesc ? <FaSortDown /> : <FaSortUp />
                          ) : (
                            <FaSort className="opacity-50" />
                          )}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              {page.length === 0 ? (
                <tr key="no-data">
                  <td colSpan={columns.length} className="px-4 py-4 text-center">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                page.map((row) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      key={`row-${row.original.id}`}
                      className="bg-white even:bg-gray-50 hover:bg-gray-100"
                    >
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          key={`cell-${row.original.id}-${cell.column.id}`}
                          className="px-4 py-2 border border-gray-300"
                        >
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación de la tabla */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm">
          {/* Controles de navegación entre páginas */}
          <div className="flex space-x-2 mb-2 sm:mb-0">
            <button
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
              className={`px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                !canPreviousPage ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              aria-label="Primera Página"
            >
              <FaAngleDoubleLeft />
            </button>
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className={`px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                !canPreviousPage ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              aria-label="Página Anterior"
            >
              <FaAngleLeft />
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className={`px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                !canNextPage ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              aria-label="Página Siguiente"
            >
              <FaAngleRight />
            </button>
            <button
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
              className={`px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                !canNextPage ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              aria-label="Última Página"
            >
              <FaAngleDoubleRight />
            </button>
          </div>

          {/* Información de la página actual */}
          <span className="text-gray-700 mb-2 sm:mb-0">
            Página <strong>{pageIndex + 1}</strong> de <strong>{pageCount}</strong>
          </span>

          {/* Selector para el tamaño de página */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-md p-2 text-black bg-white shadow focus:ring-2 focus:ring-blue-500 focus:outline-none hover:bg-gray-50"
            aria-label="Tamaño de Página"
          >
            {[10, 20, 30, 50].map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption} artículos por página
              </option>
            ))}
            <option value={filteredStock.length}>
              Mostrar todos los artículos
            </option>
          </select>
        </div>
      </div>
    </div>
  );

};

HistorialStock.propTypes = {
  // Define propTypes si lo requieres
};

export default HistorialStock;
