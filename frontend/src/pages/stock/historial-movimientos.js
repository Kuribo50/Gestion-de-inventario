// src/pages/stock/historial-movimientos.js

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  useTable,
  useGlobalFilter,
  useSortBy,
  useExpanded,
  usePagination,
} from 'react-table';

import ReactModal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaFileExcel,
  FaFilePdf,
  FaFileCsv,
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
  FaChevronRight,
  FaChevronDown,
} from 'react-icons/fa';

import Sidebar from '../../components/Sidebar';
import Select from 'react-select';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import api from '@/services/api'; // Importa el módulo api.js

// En Next.js el contenedor principal suele ser #__next
ReactModal.setAppElement('#__next');

// Estilos del modal
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    width: '400px',
    maxWidth: '90%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: '1rem',
    borderRadius: '8px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
};

// Configuración de Toastify para notificaciones
const toastOptions = {
  position: 'top-center',
  autoClose: 2000,
  hideProgressBar: true,
  newestOnTop: false,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: false,
  draggable: false,
  pauseOnHover: false,
  theme: 'colored',
};

// Formateo de fechas
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

// Componente para el filtro global de la tabla
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

// Todas las columnas posibles para la exportación
const ALL_COLUMNS = [
  { key: 'nombre', label: 'Nombre', selected: true },
  { key: 'categoria', label: 'Categoría', selected: true },
  { key: 'cantidad', label: 'Cantidad', selected: true },
  { key: 'prestado', label: 'Prestado', selected: true },
  { key: 'motivo', label: 'Motivo', selected: true },
  { key: 'tipo_movimiento', label: 'Tipo Movimiento', selected: true },
  { key: 'usuario', label: 'Usuario', selected: true },
  { key: 'fecha', label: 'Fecha', selected: true },
  { key: 'marca', label: 'Marca', selected: true },
  { key: 'modelo', label: 'Modelo', selected: true },
  { key: 'ubicacion', label: 'Ubicación', selected: true },
  { key: 'estado', label: 'Estado', selected: true },
  { key: 'numero_serie', label: 'N° Serie', selected: true },
  { key: 'mac', label: 'MAC', selected: true },
  { key: 'codigo_interno', label: 'Código Interno', selected: true },
  { key: 'codigo_minvu', label: 'Código Minvu', selected: true },
  { key: 'descripcion', label: 'Descripción', selected: true },
  { key: 'stock_actual', label: 'Stock Actual', selected: true },
  { key: 'stock_anterior', label: 'Stock Anterior', selected: true },
];

const HistorialMovimientos = () => {
  // Estados para almacenar datos de la API
  const [articulos, setArticulos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [historialStock, setHistorialStock] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [estados, setEstados] = useState([]);

  const [loading, setLoading] = useState(true); // Estado para manejar la carga de datos
  const [error, setError] = useState(null); // Estado para manejar errores

  // Estados para filtros de UI
  const [showFilters, setShowFilters] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [articuloFiltro, setArticuloFiltro] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [modeloFiltro, setModeloFiltro] = useState(null);
  const [marcaFiltro, setMarcaFiltro] = useState(null);
  const [tipoMovFiltro, setTipoMovFiltro] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
  const [fechaFinFiltro, setFechaFinFiltro] = useState('');

  // Límite de exportación
  const [exportLimit, setExportLimit] = useState(50);

  // Modal para seleccionar columnas a exportar
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState(ALL_COLUMNS);

  // Modo de exportación (PDF, CSV, Excel, etc.)
  const [exportMode, setExportMode] = useState(null);

  // Función auxiliar para encontrar elementos por ID de manera segura
  const safeFind = useCallback((list, id) => {
    return Array.isArray(list)
      ? list.find((item) => item.id === id) || {}
      : {};
  }, []);

  // Carga de datos desde la API usando el módulo api.js
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Iniciar carga

        // Realizar solicitudes paralelas usando api.js
        const [
          articuloRes,
          categoriaRes,
          modeloRes,
          marcaRes,
          ubicacionRes,
          historialRes,
          usuariosRes,
          motivosRes,
          estadosRes,
        ] = await Promise.all([
          api.get('/articulos/'),
          api.get('/categorias/'),
          api.get('/modelos/'),
          api.get('/marcas/'),
          api.get('/ubicaciones/'),
          api.get('/historial-stock/'),
          api.get('/usuarios/'),
          api.get('/motivos/'),
          api.get('/estados/'),
        ]);

        // Extraer datos de las respuestas
        const [
          articuloData,
          categoriaData,
          modeloData,
          marcaData,
          ubicacionData,
          historialData,
          usuariosData,
          motivosData,
          estadosData,
        ] = [
          articuloRes.data,
          categoriaRes.data,
          modeloRes.data,
          marcaRes.data,
          ubicacionRes.data,
          historialRes.data,
          usuariosRes.data,
          motivosRes.data,
          estadosRes.data,
        ];

        // Limpiar duplicados en historialStock si aplica
        const cleanHistorialMap = new Map();
        historialData.forEach((item) => {
          const uniqueKey = `${item.articulo}-${item.tipo_movimiento}-${item.usuario}-${item.fecha}-${item.cantidad}`;
          if (!cleanHistorialMap.has(uniqueKey)) {
            cleanHistorialMap.set(uniqueKey, item);
          }
        });
        const cleanHistorial = Array.from(cleanHistorialMap.values());
        cleanHistorial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha descendente
        setHistorialStock(cleanHistorial); // Actualizar estado

        // Actualizar estados con los datos obtenidos
        setArticulos(articuloData);
        setCategorias(categoriaData);
        setModelos(modeloData);
        setMarcas(marcaData);
        setUbicaciones(ubicacionData);
        setUsuarios(usuariosData);
        setMotivos(motivosData);

        // Mapear estados para react-select
        const estadosMapeados = estadosData.map((e) => ({
          value: e.id,
          label: e.nombre,
        }));
        setEstados(estadosMapeados);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los datos.');
      } finally {
        setLoading(false); // Finalizar carga
      }
    };

    fetchData();
  }, [safeFind]);

  // Opciones para react-select basadas en los datos cargados
  const articuloOptions = useMemo(
    () => articulos.map((a) => ({ value: a.id, label: a.nombre })),
    [articulos]
  );
  const categoriaOptions = useMemo(
    () => categorias.map((c) => ({ value: c.id, label: c.nombre })),
    [categorias]
  );
  const modeloOptions = useMemo(
    () => modelos.map((m) => ({ value: m.id, label: m.nombre })),
    [modelos]
  );
  const marcaOptions = useMemo(
    () => marcas.map((m) => ({ value: m.id, label: m.nombre })),
    [marcas]
  );

  // Filtrado de movimientos basado en los filtros aplicados
  const filteredHistorial = useMemo(() => {
    let filteredArt = articulos;
    if (articuloFiltro) {
      filteredArt = filteredArt.filter((item) => item.id === articuloFiltro.value);
    }
    if (categoriaFiltro) {
      filteredArt = filteredArt.filter(
        (item) => item.categoria === categoriaFiltro.value
      );
    }
    if (modeloFiltro) {
      filteredArt = filteredArt.filter(
        (item) => item.modelo === modeloFiltro.value
      );
    }
    if (marcaFiltro) {
      filteredArt = filteredArt.filter(
        (item) => item.marca === marcaFiltro.value
      );
    }

    const filteredIds = filteredArt.map((a) => a.id);
    let filteredMov = historialStock.filter((m) =>
      filteredIds.includes(m.articulo)
    );

    if (globalFilter) {
      const gf = globalFilter.toLowerCase();
      filteredMov = filteredMov.filter((m) => {
        const art = safeFind(articulos, m.articulo);
        const usuarioName =
          usuarios.find((u) => u.id === m.usuario)?.username || '';
        const fieldsToSearch = [
          m.tipo_movimiento || '',
          m.comentario || '',
          m.fecha || '',
          usuarioName,
          art.nombre || '',
        ].map((v) => v.toLowerCase());
        return fieldsToSearch.some((val) => val.includes(gf));
      });
    }

    if (tipoMovFiltro) {
      filteredMov = filteredMov.filter(
        (m) => m.tipo_movimiento === tipoMovFiltro
      );
    }

    if (usuarioFiltro) {
      const userId = parseInt(usuarioFiltro, 10);
      filteredMov = filteredMov.filter((m) => m.usuario === userId);
    }

    const getYYYYMMDD = (f) => (f ? f.slice(0, 10) : '');
    if (fechaInicioFiltro) {
      filteredMov = filteredMov.filter(
        (m) => getYYYYMMDD(m.fecha) >= fechaInicioFiltro
      );
    }
    if (fechaFinFiltro) {
      filteredMov = filteredMov.filter(
        (m) => getYYYYMMDD(m.fecha) <= fechaFinFiltro
      );
    }

    return filteredMov;
  }, [
    articulos,
    historialStock,
    usuarios,
    articuloFiltro,
    categoriaFiltro,
    modeloFiltro,
    marcaFiltro,
    globalFilter,
    tipoMovFiltro,
    usuarioFiltro,
    fechaInicioFiltro,
    fechaFinFiltro,
    safeFind,
  ]);

  // Preparar datos para la tabla
  const data = useMemo(() => {
    return filteredHistorial.map((mov) => {
      const art = safeFind(articulos, mov.articulo);
      const movMotivo = mov.motivo
        ? motivos.find((mo) => mo.id === mov.motivo)?.nombre || '----'
        : '----';

      return {
        nombre: art.nombre || '----',
        categoria: safeFind(categorias, art.categoria)?.nombre || '----',
        cantidad: mov.cantidad || '----',
        prestado: mov.prestado || false,
        motivo: movMotivo,
        tipo_movimiento: mov.tipo_movimiento || '----',
        usuario: usuarios.find((u) => u.id === mov.usuario)?.username || '----',
        fecha: mov.fecha || '----',
        subRows: [
          {
            marca: safeFind(marcas, art.marca)?.nombre || '----',
            modelo: safeFind(modelos, art.modelo)?.nombre || '----',
            ubicacion: safeFind(ubicaciones, art.ubicacion)?.nombre || '----',
            estado: estados.find((e) => e.value === art.estado)?.label || '----',
            numero_serie: art.numero_serie || '----',
            mac: art.mac || '----',
            codigo_interno: art.codigo_interno || '----',
            codigo_minvu: art.codigo_minvu || '----',
            descripcion: art.descripcion || '----',
            stock_actual: art.stock_actual || '----',
            stock_anterior: mov.stock_anterior || '----',
          },
        ],
      };
    });
  }, [
    filteredHistorial,
    articulos,
    categorias,
    marcas,
    modelos,
    ubicaciones,
    usuarios,
    motivos,
    estados,
    safeFind,
  ]);

  // Definir columnas para React Table
  const columns = useMemo(
    () => [
      {
        Header: '',
        id: 'expander',
        Cell: ({ row }) =>
          row.canExpand ? (
            <span
              {...row.getToggleRowExpandedProps()}
              className="cursor-pointer text-gray-600"
            >
              {row.isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </span>
          ) : null,
        width: 30,
      },
      { Header: 'Nombre', accessor: 'nombre' },
      { Header: 'Categoría', accessor: 'categoria' },
      { Header: 'Cantidad', accessor: 'cantidad' },
      {
        Header: 'Movimiento',
        accessor: 'tipo_movimiento',
        Cell: ({ value }) => {
          let bgColor = 'bg-gray-200';
          let textColor = 'text-black';
          switch (value) {
            case 'Entrada':
              bgColor = 'bg-green-100';
              textColor = 'text-green-800';
              break;
            case 'Salida':
              bgColor = 'bg-red-100';
              textColor = 'text-red-800';
              break;
            case 'Cambio de Estado':
              bgColor = 'bg-yellow-100';
              textColor = 'text-yellow-800';
              break;
            case 'Prestamo':
              bgColor = 'bg-purple-100';
              textColor = 'text-purple-800';
              break;
            case 'Regresado':
              bgColor = 'bg-orange-100';
              textColor = 'text-orange-800';
              break;
            case 'Nuevo Articulo':
              bgColor = 'bg-blue-100';
              textColor = 'text-blue-800';
              break;
            default:
              bgColor = 'bg-gray-200';
              textColor = 'text-black';
          }
          return (
            <span
              className={`${bgColor} ${textColor} px-2 py-1 rounded-full text-xs font-semibold`}
            >
              {value}
            </span>
          );
        },
      },
      { Header: 'Usuario', accessor: 'usuario' },
      {
        Header: 'Fecha',
        accessor: 'fecha',
        Cell: ({ value }) => formatFecha(value),
      },
    ],
    []
  );

  // Función para renderizar subfilas (detalles adicionales)
  const renderSubRow = (sub) => {
    const fields = [
      { label: 'Marca', value: sub.marca },
      { label: 'Modelo', value: sub.modelo },
      { label: 'Ubicación', value: sub.ubicacion },
      { label: 'Estado', value: sub.estado },
      { label: 'N° Serie', value: sub.numero_serie },
      { label: 'MAC', value: sub.mac },
      { label: 'Código Interno', value: sub.codigo_interno },
      { label: 'Código Minvu', value: sub.codigo_minvu },
      { label: 'Descripción', value: sub.descripcion },
      { label: 'Stock Actual', value: sub.stock_actual },
      { label: 'Stock Anterior', value: sub.stock_anterior },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-100">
        {fields.map((f, i) => (
          <div
            key={i}
            className="flex flex-col text-sm bg-white p-3 rounded-md shadow-sm border"
          >
            <span className="font-semibold text-gray-700">{f.label}:</span>
            <span className="text-gray-600">{f.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Configuración de React Table con los hooks necesarios
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
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    useExpanded,
    usePagination
  );

  // Sincronizar el filtro global con React Table
  useEffect(() => {
    setTableGlobalFilter(globalFilter);
  }, [globalFilter, setTableGlobalFilter]);

  // Preparar datos para la exportación
  const getExportData = () => {
    const limitedData = data.slice(
      0,
      exportLimit === 'all' ? undefined : exportLimit
    );
    return limitedData.map((row) => {
      const sub = row.subRows?.[0] || {};
      return {
        nombre: row.nombre,
        categoria: row.categoria,
        cantidad: row.cantidad,
        prestado: row.prestado ? 'Sí' : 'No',
        motivo: row.motivo,
        tipo_movimiento: row.tipo_movimiento,
        usuario: row.usuario,
        fecha: row.fecha,
        marca: sub.marca,
        modelo: sub.modelo,
        ubicacion: sub.ubicacion,
        estado: sub.estado,
        numero_serie: sub.numero_serie,
        mac: sub.mac,
        codigo_interno: sub.codigo_interno,
        codigo_minvu: sub.codigo_minvu,
        descripcion: sub.descripcion,
        stock_actual: sub.stock_actual,
        stock_anterior: sub.stock_anterior,
      };
    });
  };

  // Columnas seleccionadas para la exportación
  const activeExportColumns = exportColumns.filter((c) => c.selected);

  // ----- Exportar CSV -----
  const exportToCSVFront = () => {
    try {
      const exportData = getExportData();
      const headers = activeExportColumns.map((c) => c.label);

      let csvRows = [];
      csvRows.push(headers.join(',')); // Agregar cabeceras

      exportData.forEach((item) => {
        const row = activeExportColumns.map((col) => {
          const val =
            col.key === 'fecha' ? formatFecha(item[col.key]) : item[col.key];
          let v = val ? val.toString() : '';
          v = v.replace(/"/g, '""'); // Escapar comillas
          if (v.includes(',') || v.includes('"') || v.includes('\n')) {
            v = `"${v}"`; // Envolver en comillas si contiene caracteres especiales
          }
          return v;
        });
        csvRows.push(row.join(',')); // Agregar fila al CSV
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `HistorialMovimientos_${Date.now()}.csv`);

      toast.success('CSV exportado correctamente.', toastOptions);
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar CSV.', toastOptions);
    }
  };

  // ----- Exportar Excel -----
  const exportToExcelFront = () => {
    try {
      const exportData = getExportData();
      const wsData = [
        ['Historial de Movimientos'],
        ['Fecha de exportación: ' + new Date().toLocaleString()],
        [],
      ];
      const headerRow = activeExportColumns.map((c) => c.label);
      wsData.push(headerRow); // Agregar cabeceras

      exportData.forEach((item) => {
        const row = activeExportColumns.map((col) => {
          if (col.key === 'fecha') {
            return formatFecha(item[col.key]);
          }
          return item[col.key] ?? '';
        });
        wsData.push(row);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Definir ancho de columnas
      ws['!cols'] = new Array(headerRow.length).fill({ wch: 20 });

      // Aplicar estilos personalizados
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          if (!ws[cellAddress].s) {
            ws[cellAddress].s = {};
          }
          ws[cellAddress].s.border = {
            top: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
          };
          // Estilo para el título
          if (R === 0) {
            ws[cellAddress].s.font = { bold: true, sz: 14 };
          }
          // Estilo para la fecha de exportación
          if (R === 1) {
            ws[cellAddress].s.font = { italic: true };
          }
          // Estilo para las cabeceras
          if (R === 3) {
            ws[cellAddress].s.fill = { fgColor: { rgb: 'D3D3D3' } };
            ws[cellAddress].s.font = { bold: true };
          }
          // Alternancia de colores para las filas
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

      // Merge de la primera fila (título)
      ws['!merges'] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: headerRow.length - 1 },
        },
      ];
      if (ws['A1'] && ws['A1'].s) {
        ws['A1'].s.alignment = { horizontal: 'center' };
      }

      XLSX.utils.book_append_sheet(wb, ws, 'HistorialMovimientos');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `HistorialMovimientos_${Date.now()}.xlsx`);

      toast.success('Excel exportado correctamente.', toastOptions);
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar Excel.', toastOptions);
    }
  };

  // ----- Exportar PDF -----
  const exportToPDFFront = () => {
    try {
      const exportData = getExportData();
      const head = [activeExportColumns.map((c) => c.label)];
      const body = exportData.map((row) =>
        activeExportColumns.map((col) => {
          if (col.key === 'fecha') {
            return formatFecha(row[col.key]);
          }
          return row[col.key] ?? '';
        })
      );

      const doc = new jsPDF('l', 'pt', 'a4'); // Formato horizontal
      doc.setFontSize(12);
      doc.text('Historial de Movimientos', 40, 40); // Título

      doc.setFontSize(10);
      doc.text('Fecha de exportación: ' + new Date().toLocaleString(), 40, 60); // Fecha de exportación

      doc.autoTable({
        startY: 80,
        head,
        body,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [211, 211, 211],
          textColor: 20,
          fontStyle: 'bold',
        },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto',
      });

      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank'); // Abrir PDF en una nueva pestaña

      toast.success('PDF exportado correctamente.', toastOptions);
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar PDF.', toastOptions);
    }
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setGlobalFilter('');
    setArticuloFiltro(null);
    setCategoriaFiltro(null);
    setModeloFiltro(null);
    setMarcaFiltro(null);
    setTipoMovFiltro('');
    setUsuarioFiltro('');
    setFechaInicioFiltro('');
    setFechaFinFiltro('');
  };

  // Función para abrir el modal de exportación y establecer el modo de exportación
  const handleOpenExportModal = (mode) => {
    setExportMode(mode); // "pdf", "csv", etc.
    setIsExportModalOpen(true);
  };

  // Función para manejar la exportación una vez cerrada la selección de columnas
  const handleExport = () => {
    setIsExportModalOpen(false);
    if (exportMode === 'pdf') {
      exportToPDFFront();
    }
    // Puedes agregar más modos de exportación aquí si lo deseas
  };

  // Renderizado condicional basado en el estado de carga y errores
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl text-blue-500">Cargando...</div>
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

  return (
    <>
      {/* Contenedor de notificaciones */}
      <ToastContainer />

      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <Sidebar />

        {/* Modal para seleccionar columnas a exportar */}
        <ReactModal
          isOpen={isExportModalOpen}
          onRequestClose={() => setIsExportModalOpen(false)}
          style={modalStyles}
          contentLabel="Selección de Columnas"
        >
          <h2 className="text-lg font-bold mb-3">Seleccionar Columnas</h2>

          {/* Lista de columnas con checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            {exportColumns.map((col, idx) => (
              <label key={col.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={col.selected}
                  onChange={() => {
                    const newCols = [...exportColumns];
                    newCols[idx] = {
                      ...newCols[idx],
                      selected: !newCols[idx].selected,
                    };
                    setExportColumns(newCols);
                  }}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>

          {/* Botones para cancelar o confirmar la exportación */}
          <div className="flex justify-end mt-4 space-x-2">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setIsExportModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleExport}
            >
              Exportar PDF
            </button>
          </div>
        </ReactModal>

        {/* Contenido principal */}
        <div className="flex-1 p-4 md:ml-64">
          {/* Barra superior con filtros globales y botones de exportación */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
            <div className="flex items-center w-full sm:w-1/2">
              {/* Filtro global */}
              <GlobalFilter
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
              {/* Botón para mostrar/ocultar filtros avanzados */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center ml-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors focus:outline-none"
                title={showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              >
                <FaFilter />
              </button>
            </div>

            {/* Botones de exportación */}
            <div className="flex flex-row space-x-2">
              {/* Botón para exportar a Excel */}
              <button
                onClick={exportToExcelFront}
                className="flex items-center justify-center bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"
              >
                <FaFileExcel className="mr-1" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              {/* Botón para abrir el modal de exportación a PDF */}
              <button
                onClick={() => handleOpenExportModal('pdf')}
                className="flex items-center justify-center bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                <FaFilePdf className="mr-1" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              {/* Botón para exportar a CSV */}
              <button
                onClick={exportToCSVFront}
                className="flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <FaFileCsv className="mr-1" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="bg-white shadow-md rounded-md p-4 mb-4 text-sm space-y-4">
              {/* Filtros de artículo, categoría y modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Artículo
                  </label>
                  <Select
                    options={articuloOptions}
                    value={articuloFiltro}
                    onChange={setArticuloFiltro}
                    isClearable
                    placeholder="Seleccionar Artículo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoría
                  </label>
                  <Select
                    options={categoriaOptions}
                    value={categoriaFiltro}
                    onChange={setCategoriaFiltro}
                    isClearable
                    placeholder="Seleccionar Categoría"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Modelo
                  </label>
                  <Select
                    options={modeloOptions}
                    value={modeloFiltro}
                    onChange={setModeloFiltro}
                    isClearable
                    placeholder="Seleccionar Modelo"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Filtros de tipo de movimiento, usuario y fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo Movimiento
                  </label>
                  <select
                    value={tipoMovFiltro}
                    onChange={(e) => setTipoMovFiltro(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                  >
                    <option value="">Todos</option>
                    <option value="Entrada">Entrada</option>
                    <option value="Salida">Salida</option>
                    <option value="Nuevo Articulo">Nuevo Articulo</option>
                    <option value="Cambio de Estado">Cambio de Estado</option>
                    <option value="Prestamo">Prestamo</option>
                    <option value="Regresado">Regresado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Usuario
                  </label>
                  <select
                    value={usuarioFiltro}
                    onChange={(e) => setUsuarioFiltro(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                  >
                    <option value="">Todos</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicioFiltro}
                    onChange={(e) => setFechaInicioFiltro(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFinFiltro}
                    onChange={(e) => setFechaFinFiltro(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black text-sm bg-gray-100"
                  />
                </div>
              </div>

              {/* Botón para limpiar todos los filtros */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Borrar Filtros
                </button>
              </div>
            </div>
          )}

          {/* Tabla principal */}
          <div className="overflow-x-auto border border-gray-300 rounded-md shadow-sm text-sm">
            <table
              {...getTableProps()}
              className="min-w-full bg-white text-black text-sm border-collapse"
            >
              <thead className="bg-gray-200">
                {headerGroups.map((headerGroup) => (
                  <tr
                    {...headerGroup.getHeaderGroupProps()}
                    key={headerGroup.id}
                    className="whitespace-nowrap"
                  >
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(
                          column.getSortByToggleProps()
                        )}
                        key={column.id}
                        className="px-4 py-3 text-left font-semibold uppercase text-gray-700 border border-gray-300"
                      >
                        <div className="flex items-center">
                          {column.render('Header')}
                          <span className="ml-2">
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <FaSortDown />
                              ) : (
                                <FaSortUp />
                              )
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
              <tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row);
                  const isExpanded = row.isExpanded;
                  return (
                    <React.Fragment key={row.getRowProps().key}>
                      <tr
                        {...row.getRowProps()}
                        className={`${
                          i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-gray-100 whitespace-nowrap`}
                      >
                        {row.cells.map((cell) => (
                          <td
                            {...cell.getCellProps()}
                            key={cell.column.id}
                            className="px-4 py-2 border border-gray-300"
                          >
                            {cell.render('Cell')}
                          </td>
                        ))}
                      </tr>
                      {/* Renderizar subfilas (detalles adicionales) */}
                      {isExpanded &&
                        row.original.subRows &&
                        row.original.subRows.length > 0 && (
                          <tr className="border-t bg-gray-100">
                            <td colSpan={columns.length} className="p-4">
                              {renderSubRow(row.original.subRows[0])}
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })}
                {/* Mostrar mensaje si no hay registros */}
                {page.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-4 text-center">
                      No se encontraron registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación de la tabla */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm">
            <div className="flex space-x-2 mb-2 sm:mb-0">
              <button
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canPreviousPage ? 'bg-gray-300 cursor-not-allowed' : ''
                }`}
              >
                <FaAngleDoubleLeft />
              </button>
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canPreviousPage ? 'bg-gray-300 cursor-not-allowed' : ''
                }`}
              >
                <FaAngleLeft />
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canNextPage ? 'bg-gray-300 cursor-not-allowed' : ''
                }`}
              >
                <FaAngleRight />
              </button>
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                className={`px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
                  !canNextPage ? 'bg-gray-300 cursor-not-allowed' : ''
                }`}
              >
                <FaAngleDoubleRight />
              </button>
            </div>
            <span className="text-gray-700 mb-2 sm:mb-0">
              Página <strong>{pageIndex + 1}</strong> de <strong>{pageCount}</strong>
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2 text-black bg-white shadow focus:ring-2 focus:ring-blue-500 focus:outline-none hover:bg-gray-50"
            >
              {[10, 20, 30, 50].map((sizeOption) => (
                <option key={sizeOption} value={sizeOption}>
                  {sizeOption} por página
                </option>
              ))}
              <option value={data.length}>Mostrar todos</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorialMovimientos;
