// src/components/Dashboard/EstadisticasWidgets.js

import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { FiBox, FiAlertTriangle, FiUserCheck, FiSearch, FiDownload } from "react-icons/fi"; // Íconos para widgets y botones
import { useRouter } from 'next/router'; 
import { fetchArticulos, fetchHistorialPrestamo } from "@/services/api"; 
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import jsPDF from "jspdf";
import "jspdf-autotable";

const MySwal = withReactContent(Swal);

Modal.setAppElement('#__next');

// Función para exportar artículos con bajo stock a un archivo PDF
const exportArticulosBajoStockToPDF = (data) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Artículos con Bajo Stock", 14, 22);
  
  const tableColumn = ["Artículo", "Stock Actual", "Stock Mínimo"];
  const tableRows = [];

  data.forEach(art => {
    const artData = [
      art.nombre,
      art.stock_actual.toString(),
      art.stock_minimo.toString()
    ];
    tableRows.push(artData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    styles: { fontSize: 12 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  doc.save("articulos_bajo_stock.pdf"); // Guarda el PDF con nombre "articulos_bajo_stock.pdf"
};

// Función para exportar préstamos activos a un archivo PDF
const exportPrestamosActivosToPDF = (data) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Préstamos Activos", 14, 22);
  
  const tableColumn = ["Artículo", "Cantidad Prestada", "Prestado a", "Fecha de Préstamo", "Motivo"];
  const tableRows = [];

  data.forEach(p => {
    const rowData = [
      p.articulo ? p.articulo.nombre : "N/D",
      p.cantidad_restante.toString(),
      p.personal ? p.personal.nombre : "N/D",
      new Date(p.fecha_prestamo).toLocaleDateString("es-CL"),
      p.motivo?.nombre || "N/D"
    ];
    tableRows.push(rowData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    styles: { fontSize: 12 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  doc.save("prestamos_activos.pdf"); // Guarda el PDF con nombre "prestamos_activos.pdf"
};

export default function EstadisticasWidgets() {
  const router = useRouter();

  // Estados para almacenar estadísticas y detalles
  const [totalProductos, setTotalProductos] = useState(0);
  const [productosBajoStock, setProductosBajoStock] = useState(0);
  const [articulosBajoStock, setArticulosBajoStock] = useState([]);
  const [prestamosCount, setPrestamosCount] = useState(0);
  const [prestamosDetalles, setPrestamosDetalles] = useState([]);

  // Estados para controlar la visibilidad de los modales
  const [isModalBajoStockOpen, setIsModalBajoStockOpen] = useState(false);
  const [isModalPrestamosOpen, setIsModalPrestamosOpen] = useState(false);

  // Estados para términos de búsqueda en los modales
  const [searchTermBajoStock, setSearchTermBajoStock] = useState("");
  const [searchTermPrestamos, setSearchTermPrestamos] = useState("");

  // Función para obtener datos de artículos y préstamos
  const fetchDatos = async () => {
    try {
      // Obtener todos los artículos desde la API
      const articulos = await fetchArticulos();
      const total = articulos.length;

      // Filtrar artículos con stock actual menor que el stock mínimo
      const bajoStock = articulos.filter(
        (art) => art.stock_actual < art.stock_minimo
      );

      setTotalProductos(total);
      setProductosBajoStock(bajoStock.length);
      setArticulosBajoStock(bajoStock);

      // Obtener historial de préstamos desde la API
      const historialPrestamo = await fetchHistorialPrestamo();

      // Filtrar préstamos que aún están activos (cantidad_restante > 0 y sin fecha_devolucion)
      const prestamosActivos = historialPrestamo.filter(
        (p) => p.cantidad_restante > 0 && !p.fecha_devolucion
      );

      // Calcular la cantidad total de artículos aún prestados sumando "cantidad_restante"
      const totalPrestado = prestamosActivos.reduce(
        (acc, p) => acc + p.cantidad_restante,
        0
      );

      setPrestamosCount(totalPrestado);
      setPrestamosDetalles(prestamosActivos);
    } catch (error) {
      console.error("Error al cargar datos en EstadisticasWidgets:", error);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos de estadísticas.",
      });
    }
  };

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchDatos();
  }, []);

  // Maneja la apertura del modal de bajo stock actualizando datos previamente
  const handleOpenModalBajoStock = async () => {
    await fetchDatos(); // Actualiza datos antes de abrir el modal
    if (articulosBajoStock.length === 0) {
      // Si no hay artículos con bajo stock, muestra una notificación
      MySwal.fire({
        icon: "info",
        title: "Sin Artículos con Bajo Stock",
        text: "No hay artículos con stock por debajo del mínimo.",
      });
      return;
    }
    setIsModalBajoStockOpen(true); // Abre el modal
  };

  const handleCloseModalBajoStock = () => {
    setIsModalBajoStockOpen(false); // Cierra el modal
  };

  // Maneja la apertura del modal de préstamos activos actualizando datos previamente
  const handleOpenModalPrestamos = async () => {
    await fetchDatos(); // Actualiza datos antes de abrir el modal
    if (prestamosDetalles.length === 0) {
      // Si no hay préstamos activos, muestra una notificación
      MySwal.fire({
        icon: "info",
        title: "Sin Préstamos Activos",
        text: "No hay artículos prestados en este momento.",
      });
      return;
    }
    setIsModalPrestamosOpen(true); // Abre el modal
  };

  const handleCloseModalPrestamos = () => {
    setIsModalPrestamosOpen(false); // Cierra el modal
  };

  // Filtrar artículos con bajo stock según el término de búsqueda ingresado
  const filteredArticulosBajoStock = articulosBajoStock.filter(art => 
    art.nombre.toLowerCase().includes(searchTermBajoStock.toLowerCase())
  );

  // Filtrar préstamos activos según el término de búsqueda ingresado
  const filteredPrestamosDetalles = prestamosDetalles.filter(p => {
    const articuloNombre = p.articulo ? p.articulo.nombre.toLowerCase() : "n/d";
    const personalNombre = p.personal ? p.personal.nombre.toLowerCase() : "n/d";
    const motivoNombre = p.motivo?.nombre ? p.motivo.nombre.toLowerCase() : "n/d";
    const fecha = new Date(p.fecha_prestamo).toLocaleDateString("es-CL").toLowerCase();
    const term = searchTermPrestamos.toLowerCase();
    return (
      articuloNombre.includes(term) ||
      personalNombre.includes(term) ||
      motivoNombre.includes(term) ||
      fecha.includes(term)
    );
  });

  return (
    <div>
      {/* Widgets de estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {/* Widget para el total de productos */}
        <div
          className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push("/stock/historial-stock")} // Redirige a historial de stock al hacer clic
        >
          <FiBox className="text-4xl text-blue-500 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Total Productos</h3>
            <p className="text-3xl font-bold text-gray-800">{totalProductos}</p>
          </div>
        </div>

        {/* Widget para productos bajo stock */}
        <div
          className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          onClick={handleOpenModalBajoStock} // Abre modal con artículos bajo stock
        >
          <FiAlertTriangle className="text-4xl text-red-500 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Bajo Stock</h3>
            <p className="text-3xl font-bold text-red-600">{productosBajoStock}</p>
          </div>
        </div>

        {/* Widget para préstamos activos */}
        <div
          className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          onClick={handleOpenModalPrestamos} // Abre modal con préstamos activos
        >
          <FiUserCheck className="text-4xl text-purple-500 mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Préstamos</h3>
            <p className="text-3xl font-bold text-purple-600">{prestamosCount}</p>
          </div>
        </div>
      </div>

      {/* Modal para Artículos con Bajo Stock */}
      <Modal
        isOpen={isModalBajoStockOpen}
        onRequestClose={handleCloseModalBajoStock}
        contentLabel="Artículos con Bajo Stock"
        className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Artículos con Bajo Stock</h2>
          <button onClick={handleCloseModalBajoStock} className="text-gray-600 hover:text-gray-800">
            <FiAlertTriangle size={24} /> {/* Ícono para cerrar el modal */}
          </button>
        </div>

        {/* Sección de búsqueda y exportación para bajo stock */}
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          {/* Campo de búsqueda para filtrar artículos */}
          <div className="flex items-center">
            <FiSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar artículo..."
              value={searchTermBajoStock}
              onChange={(e) => setSearchTermBajoStock(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botón para exportar la lista filtrada a PDF */}
          <div className="flex space-x-2">
            <button
              onClick={() => exportArticulosBajoStockToPDF(filteredArticulosBajoStock)}
              className="flex items-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              <FiDownload className="mr-2" />
              Exportar a PDF
            </button>
          </div>
        </div>

        {/* Tabla que muestra artículos con bajo stock filtrados */}
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border border-black text-left">Artículo</th>
                <th className="py-2 px-4 border border-black text-left">Stock Actual</th>
                <th className="py-2 px-4 border border-black text-left">Stock Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticulosBajoStock.map((art) => (
                <tr key={art.id}>
                  <td className="py-2 px-4 border border-black">{art.nombre}</td>
                  <td className="py-2 px-4 border border-black">{art.stock_actual}</td>
                  <td className="py-2 px-4 border border-black">{art.stock_minimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Modal para Préstamos Activos */}
      <Modal
        isOpen={isModalPrestamosOpen}
        onRequestClose={handleCloseModalPrestamos}
        contentLabel="Préstamos Activos"
        className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto p-6 overflow-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Préstamos Activos</h2>
          <button onClick={handleCloseModalPrestamos} className="text-gray-600 hover:text-gray-800">
            <FiUserCheck size={24} /> {/* Ícono para cerrar el modal */}
          </button>
        </div>

        {/* Sección de búsqueda y exportación para préstamos */}
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          {/* Campo de búsqueda para filtrar préstamos */}
          <div className="flex items-center">
            <FiSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar préstamo..."
              value={searchTermPrestamos}
              onChange={(e) => setSearchTermPrestamos(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Botón para exportar la lista filtrada de préstamos a PDF */}
          <div className="flex space-x-2">
            <button
              onClick={() => exportPrestamosActivosToPDF(filteredPrestamosDetalles)}
              className="flex items-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              <FiDownload className="mr-2" />
              Exportar a PDF
            </button>
          </div>
        </div>

        {/* Tabla que muestra préstamos activos filtrados */}
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border border-black text-left">Artículo</th>
                <th className="py-2 px-4 border border-black text-left">Cantidad Prestada</th>
                <th className="py-2 px-4 border border-black text-left">Prestado a</th>
                <th className="py-2 px-4 border border-black text-left">Fecha de Préstamo</th>
                <th className="py-2 px-4 border border-black text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrestamosDetalles.map((p) => {
                const articuloNombre = p.articulo ? p.articulo.nombre : "N/D";
                const personalNombre = p.personal ? p.personal.nombre : "N/D";
                const personalCorreo = p.personal ? p.personal.correo_institucional : "";
                const fecha = new Date(p.fecha_prestamo).toLocaleDateString("es-CL");
                const motivoNombre = p.motivo?.nombre ? p.motivo.nombre : "N/D";

                return (
                  <tr key={p.id}>
                    <td className="py-2 px-4 border border-black">{articuloNombre}</td>
                    <td className="py-2 px-4 border border-black">{p.cantidad_restante}</td>
                    <td className="py-2 px-4 border border-black">
                      {personalNombre}
                      {personalCorreo && <div className="text-xs text-gray-500">{personalCorreo}</div>}
                    </td>
                    <td className="py-2 px-4 border border-black">{fecha}</td>
                    <td className="py-2 px-4 border border-black">{motivoNombre}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
