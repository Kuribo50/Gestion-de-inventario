// components/CambioEstadoArticulo.jsx

import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import Sidebar from "@/components/Sidebar";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import api from "@/services/api"; // Importa el módulo de la API para realizar solicitudes al backend

/**
 * Función para obtener clases de color según el estado.
 * Estas clases se utilizan para estilizar el texto del estado en función de su valor.
 * @param {string} estado - Nombre del estado.
 * @returns {string} - Clases de Tailwind CSS para el color del texto.
 */
const getEstadoColor = (estado) => {
  if (estado === "Bueno") return "text-green-600 font-bold";
  if (estado === "Malo") return "text-red-600 font-bold";
  if (estado === "En reparación") return "text-orange-600 font-bold";
  if (estado === "De baja") return "text-red-600 font-bold";
  return "text-gray-600 font-bold"; // Por defecto, color gris para estados desconocidos
};

export default function CambioEstadoArticulo() {
  // Estados para manejar datos del formulario, selección y carga
  const [formData, setFormData] = useState({
    articulo_id: "",
    estado_id: "",
    motivo_id: "",
    cantidad_transferir: "1",
  });
  const [tipoMovimientoSeleccionado, setTipoMovimientoSeleccionado] = useState("Cambio de Estado");
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [historiaStock, setHistoriaStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [detalleArticulo, setDetalleArticulo] = useState({
    categoria: "N/A",
    marca: "N/A",
    modelo: "N/A",
    ubicacion: "N/A",
    estado: "N/A",
    nombre: "N/A",
    stock_minimo: "N/A",
    stock_actual: "N/A",
    descripcion: "N/A",
    codigo_interno: "N/A",
    codigo_minvu: "N/A",
    numero_serie: "N/A",
    mac: "N/A",
  });

  // Funciones para obtener datos desde la API y formatearlos para react-select
  const fetchCategorias = useCallback(async () => {
    const response = await api.get("/categorias/");
    const sortedData = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((c) => ({ label: c.nombre, value: c.id }));
  }, []);

  const fetchMarcas = useCallback(async () => {
    const response = await api.get("/marcas/");
    const sortedData = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((m) => ({ label: m.nombre, value: m.id }));
  }, []);

  const fetchModelos = useCallback(async () => {
    const response = await api.get("/modelos/");
    const sortedData = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((m) => ({ label: m.nombre, value: m.id }));
  }, []);

  const fetchUbicaciones = useCallback(async () => {
    const response = await api.get("/ubicaciones/");
    const sortedData = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((u) => ({ label: u.nombre, value: u.id }));
  }, []);

  const fetchArticulos = useCallback(async () => {
    const response = await api.get("/articulos/");
    const sortedData = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((a) => ({
      label: a.nombre,
      value: a.id,
      categoria_id: a.categoria,
      marca_id: a.marca,
      modelo_id: a.modelo,
      ubicacion_id: a.ubicacion,
      estado_id: a.estado,
      stock_minimo: a.stock_minimo,
      stock_actual: a.stock_actual,
      descripcion: a.descripcion,
      codigo_interno: a.codigo_interno || "N/A",
      codigo_minvu: a.codigo_minvu || "N/A",
      numero_serie: a.numero_serie || "N/A",
      mac: a.mac || "N/A",
    }));
  }, []);

  const fetchEstados = useCallback(async () => {
    const response = await api.get("/estados/");
    const sortedData = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((est) => ({ label: est.nombre, value: est.id }));
  }, []);

  const fetchMotivos = useCallback(async () => {
    const response = await api.get("/motivos/");
    const sortedData = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sortedData.map((m) => ({ label: m.nombre, value: m.id }));
  }, []);

  /**
   * Función para cargar todos los datos necesarios de manera paralela.
   * Actualiza los estados correspondientes con la información obtenida.
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        categoriasData,
        marcasData,
        modelosData,
        ubicacionesData,
        articulosData,
        estadosData,
        motivosData,
        historiaStockResponse,
      ] = await Promise.all([
        fetchCategorias(),
        fetchMarcas(),
        fetchModelos(),
        fetchUbicaciones(),
        fetchArticulos(),
        fetchEstados(),
        fetchMotivos(),
        api.get("/historial-stock/"),
      ]);

      const historiaStockData = historiaStockResponse.data;

      setCategorias(categoriasData);
      setMarcas(marcasData);
      setModelos(modelosData);
      setUbicaciones(ubicacionesData);
      setArticulos(articulosData);
      setEstados(estadosData);
      setMotivos(motivosData);
      setHistoriaStock(historiaStockData);

      console.log("Artículos:", articulosData);
    } catch (error) {
      // Muestra una alerta en caso de error al cargar datos
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los datos de la API.",
        position: "center",
        confirmButtonColor: "#2563EB",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
        },
      });
      console.error("Error al cargar los datos:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchCategorias, fetchMarcas, fetchModelos, fetchUbicaciones, fetchArticulos, fetchEstados, fetchMotivos]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Obtiene el nombre de una entidad por su ID desde una lista dada.
   * @param {number} id - ID de la entidad.
   * @param {array} lista - Lista de entidades {label, value}.
   * @returns {string} - Nombre de la entidad o "N/A" si no se encuentra.
   */
  const getNombrePorId = (id, lista) => {
    const item = lista.find((elemento) => elemento.value === id);
    return item ? item.label : "N/A";
  };

  /**
   * Maneja el cambio de artículo seleccionado desde el select.
   * Actualiza los detalles del artículo seleccionado y resetea ciertos campos.
   * @param {object} selectedOption - Opción seleccionada en el select de artículos.
   */
  const handleArticuloChange = (selectedOption) => {
    if (selectedOption) {
      setArticuloSeleccionado(selectedOption.value);
      setFormData({
        ...formData,
        articulo_id: selectedOption.value,
        estado_id: "",
        motivo_id: "",
      });

      const detalles = articulos.find(
        (articulo) => articulo.value === selectedOption.value
      );
      if (detalles) {
        const estado = estados.find((est) => est.value === detalles.estado_id);
        setDetalleArticulo({
          categoria: getNombrePorId(detalles.categoria_id, categorias),
          marca: getNombrePorId(detalles.marca_id, marcas),
          modelo: getNombrePorId(detalles.modelo_id, modelos),
          ubicacion: getNombrePorId(detalles.ubicacion_id, ubicaciones),
          estado: estado ? estado.label : "N/A",
          nombre: detalles.label || "N/A",
          stock_minimo:
            detalles.stock_minimo !== null ? detalles.stock_minimo : "N/A",
          stock_actual:
            detalles.stock_actual !== null ? detalles.stock_actual : "N/A",
          descripcion: detalles.descripcion || "N/A",
          codigo_interno: detalles.codigo_interno || "N/A",
          codigo_minvu: detalles.codigo_minvu || "N/A",
          numero_serie: detalles.numero_serie || "N/A",
          mac: detalles.mac || "N/A",
        });
      }
    } else {
      setArticuloSeleccionado(null);
      setFormData({ articulo_id: "", estado_id: "", motivo_id: "", cantidad_transferir: "1" });
      setDetalleArticulo({
        categoria: "N/A",
        marca: "N/A",
        modelo: "N/A",
        ubicacion: "N/A",
        estado: "N/A",
        nombre: "N/A",
        stock_minimo: "N/A",
        stock_actual: "N/A",
        descripcion: "N/A",
        codigo_interno: "N/A",
        codigo_minvu: "N/A",
        numero_serie: "N/A",
        mac: "N/A",
      });
    }
  };

  /**
   * Maneja el cambio de estado seleccionado desde el select.
   * Actualiza el estado_id en formData.
   * @param {object} selectedOption - Opción seleccionada en el select de estados.
   */
  const handleEstadoChange = (selectedOption) => {
    setFormData({
      ...formData,
      estado_id: selectedOption ? selectedOption.value : "",
    });
  };

  /**
   * Maneja la creación de un nuevo estado desde el select creatable.
   * Envía una solicitud para crear el estado y actualiza la lista de estados.
   * @param {string} inputValue - Nombre del nuevo estado.
   */
  const handleEstadoCreate = async (inputValue) => {
    try {
      const response = await api.post("/estados/", { nombre: inputValue });
      const nuevoEstado = response.data;
      const nuevoEstadoFormateado = {
        label: nuevoEstado.nombre,
        value: nuevoEstado.id,
      };
      setEstados((prev) => [...prev, nuevoEstadoFormateado]);
      setFormData({ ...formData, estado_id: nuevoEstado.id });
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Estado "${nuevoEstado.nombre}" creado correctamente.`,
        position: "center",
        confirmButtonColor: "#2563EB",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.detail || "No se pudo crear el estado.",
        position: "center",
        confirmButtonColor: "#DC2626",
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
      console.error("Error al crear el estado:", error);
    }
  };

  /**
   * Maneja la creación de un nuevo motivo desde el select creatable.
   * Envía una solicitud para crear el motivo y actualiza la lista de motivos.
   * @param {string} inputValue - Nombre del nuevo motivo.
   */
  const handleMotivoCreate = async (inputValue) => {
    try {
      const response = await api.post("/motivos/", { nombre: inputValue });
      const nuevoMotivo = response.data;
      const nuevoMotivoFormateado = {
        label: nuevoMotivo.nombre,
        value: nuevoMotivo.id,
      };
      setMotivos((prev) => [...prev, nuevoMotivoFormateado]);
      setFormData({ ...formData, motivo_id: nuevoMotivo.id });
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Motivo "${nuevoMotivo.nombre}" creado correctamente.`,
        position: "center",
        confirmButtonColor: "#2563EB",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.detail || "No se pudo crear el motivo.",
        position: "center",
        confirmButtonColor: "#DC2626",
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
      console.error("Error al crear el motivo:", error);
    }
  };

  /**
   * Muestra una alerta personalizada utilizando SweetAlert2.
   * @param {string} icon - Tipo de ícono para la alerta.
   * @param {string} title - Título de la alerta.
   * @param {string} text - Texto descriptivo de la alerta.
   */
  const showAlert = (icon, title, text) => {
    let buttonColor = "bg-blue-600 hover:bg-blue-700";

    if (icon === "error") {
      buttonColor = "bg-red-600 hover:bg-red-700";
    } else if (icon === "warning") {
      buttonColor = "bg-yellow-500 hover:bg-yellow-600";
    } else if (icon === "success") {
      buttonColor = "bg-green-600 hover:bg-green-700";
    }

    Swal.fire({
      icon,
      title,
      text,
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton: `${buttonColor} text-white font-bold py-2 px-4 rounded`,
      },
    });
  };

  /**
   * Maneja el envío del formulario para registrar un movimiento de cambio de estado.
   * Realiza validaciones, construye el payload y envía la solicitud a la API.
   * @param {object} e - Evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de campos obligatorios
    if (!formData.articulo_id || !formData.estado_id || !formData.motivo_id) {
      showAlert(
        "warning",
        "Campos incompletos",
        "Debes seleccionar un artículo, un estado y un motivo."
      );
      return;
    }

    const articuloActual = articulos.find(
      (articulo) => articulo.value === formData.articulo_id
    );

    let payloadMovimiento = {
      articulo: formData.articulo_id,
      tipo_movimiento: tipoMovimientoSeleccionado,
      comentario:
        tipoMovimientoSeleccionado === "Cambio de Estado"
          ? `Cambio de estado a "${getNombrePorId(formData.estado_id, estados)}" por motivo "${getNombrePorId(formData.motivo_id, motivos)}"`
          : `Cambio de estado por unidad a "${getNombrePorId(formData.estado_id, estados)}" por motivo "${getNombrePorId(formData.motivo_id, motivos)}"`,
      estado_nuevo: formData.estado_id,
      motivo: formData.motivo_id,
    };

    if (tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") {
      payloadMovimiento.cantidad = parseInt(formData.cantidad_transferir, 10);
    }

    if (tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") {
      const cantidadInt = parseInt(formData.cantidad_transferir, 10);
      if (isNaN(cantidadInt) || cantidadInt <= 0) {
        showAlert(
          "warning",
          "Cantidad Inválida",
          "La cantidad a transferir debe ser un número válido mayor a cero."
        );
        return;
      }

      if (cantidadInt > detalleArticulo.stock_actual && cantidadInt > 0) {
        showAlert(
          "warning",
          "Stock Insuficiente",
          `La cantidad a transferir (${cantidadInt}) excede el stock actual (${detalleArticulo.stock_actual}).`
        );
        return;
      }
    }

    console.log("Payload enviado al backend:", payloadMovimiento);

    try {
      const respuestaMovimiento = await api.post("/movimientos/", payloadMovimiento);

      if (respuestaMovimiento.status === 201 || respuestaMovimiento.status === 200) {
        showAlert(
          "success",
          "Éxito",
          "Movimiento registrado correctamente."
        );

        const movimientoCreado = respuestaMovimiento.data;

        if (tipoMovimientoSeleccionado === "Cambio de Estado") {
          setArticulos((prevArticulos) =>
            prevArticulos.map((articulo) =>
              articulo.value === formData.articulo_id
                ? { ...articulo, estado_id: formData.estado_id }
                : articulo
            )
          );

          const estadoNuevoNombre = getNombrePorId(formData.estado_id, estados);
          setDetalleArticulo((prev) => ({
            ...prev,
            estado: estadoNuevoNombre,
          }));
        }

        if (tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") {
          const cantidadInt = parseInt(formData.cantidad_transferir, 10);
          setDetalleArticulo((prev) => ({
            ...prev,
            stock_actual:
              prev.stock_actual !== "N/A"
                ? prev.stock_actual - cantidadInt
                : prev.stock_actual,
          }));
        }

        setFormData({ articulo_id: "", estado_id: "", motivo_id: "", cantidad_transferir: "1" });
        setArticuloSeleccionado(null);
        setTipoMovimientoSeleccionado("Cambio de Estado");

        setTimeout(() => {
          setDetalleArticulo({
            categoria: "N/A",
            marca: "N/A",
            modelo: "N/A",
            ubicacion: "N/A",
            estado: "N/A",
            nombre: "N/A",
            stock_minimo: "N/A",
            stock_actual: "N/A",
            descripcion: "N/A",
            codigo_interno: "N/A",
            codigo_minvu: "N/A",
            numero_serie: "N/A",
            mac: "N/A",
          });
        }, 5000);
      } else {
        const errorData = respuestaMovimiento.data;
        showAlert(
          "error",
          "Error al registrar el movimiento",
          errorData.detail || "No se pudo registrar el movimiento."
        );
        console.error("Error al registrar el movimiento:", errorData);
      }
    } catch (error) {
      showAlert(
        "error",
        "Error",
        "Error al comunicarse con el servidor."
      );
      console.error("Error al comunicarse con el servidor:", error);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Componente Sidebar para navegación */}
      <Sidebar />

      {/* Contenido principal para la gestión de movimientos de artículo */}
      <main className="flex-1 p-6 sm:ml-64">
        <h1 className="text-2xl font-bold mb-6">Gestión de Movimientos de Artículo</h1>

        {/* Formulario para registrar un movimiento */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6 space-y-6"
        >
          {/* Selección del tipo de movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <div className="flex space-x-4">
              {/* Botón para seleccionar "Cambio de Estado" */}
              <button
                type="button"
                onClick={() => setTipoMovimientoSeleccionado("Cambio de Estado")}
                className={`px-4 py-2 rounded-md border ${
                  tipoMovimientoSeleccionado === "Cambio de Estado"
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                } focus:outline-none focus:ring-2 focus:ring-orange-500`}
              >
                Cambio de Estado
              </button>
              {/* Botón para seleccionar "Cambio de Estado por Unidad" */}
              <button
                type="button"
                onClick={() => setTipoMovimientoSeleccionado("Cambio de Estado por Unidad")}
                className={`px-4 py-2 rounded-md border ${
                  tipoMovimientoSeleccionado === "Cambio de Estado por Unidad"
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                } focus:outline-none focus:ring-2 focus:ring-orange-500`}
              >
                Cambio de Estado por Unidad
              </button>
            </div>
          </div>

          {/* Selector de Artículo */}
          <div>
            <label htmlFor="articulo" className="block text-sm font-medium text-gray-700 mb-2">
              Artículo
            </label>
            <Select
              id="articulo"
              value={articulos.find((a) => a.value === articuloSeleccionado) || null}
              options={articulos}
              onChange={handleArticuloChange}
              className="mt-1"
              placeholder={loading ? "Cargando artículos..." : "Seleccione un artículo"}
              isDisabled={loading || articulos.length === 0}
              noOptionsMessage={() => "No hay artículos disponibles"}
              formatOptionLabel={(option) => {
                const estado = estados.find((est) => est.value === option.estado_id);
                return (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{option.label}</span>
                    <span className={`${getEstadoColor(estado?.label)}`}>
                      {estado ? estado.label : "N/A"}
                    </span>
                  </div>
                );
              }}
              filterOption={(option, inputValue) => {
                const nombre = option.data.label.toLowerCase();
                return nombre.includes(inputValue.toLowerCase());
              }}
            />
          </div>

          {/* Selectores de Estado y Motivo solo si se requiere */}
          {(tipoMovimientoSeleccionado === "Cambio de Estado" || tipoMovimientoSeleccionado === "Cambio de Estado por Unidad") && (
            <>
              {/* Selector de Nuevo Estado */}
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado
                </label>
                <CreatableSelect
                  id="estado"
                  value={estados.find((est) => est.value === formData.estado_id) || null}
                  options={estados}
                  onChange={handleEstadoChange}
                  onCreateOption={handleEstadoCreate}
                  className="mt-1"
                  placeholder={loading ? "Cargando estados..." : "Seleccione o cree un estado"}
                  isDisabled={loading || estados.length === 0}
                  noOptionsMessage={() => "No hay estados disponibles"}
                  formatOptionLabel={(option) => (
                    <span className={`${getEstadoColor(option.label)}`}>
                      {option.label}
                    </span>
                  )}
                />
              </div>

              {/* Selector de Motivo */}
              <div>
                <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <CreatableSelect
                  id="motivo"
                  value={motivos.find((mot) => mot.value === formData.motivo_id) || null}
                  options={motivos}
                  onChange={(selectedOption) =>
                    setFormData({ ...formData, motivo_id: selectedOption ? selectedOption.value : "" })
                  }
                  onCreateOption={handleMotivoCreate}
                  className="mt-1"
                  placeholder={loading ? "Cargando motivos..." : "Seleccione o cree un motivo"}
                  isDisabled={loading || motivos.length === 0}
                  noOptionsMessage={() => "No hay motivos disponibles"}
                  formatOptionLabel={(option) => (
                    <span className={`${getEstadoColor("N/A")}`}>
                      {option.label}
                    </span>
                  )}
                />
              </div>
            </>
          )}

          {/* Campo para cantidad a transferir, visible solo para "Cambio de Estado por Unidad" */}
          {tipoMovimientoSeleccionado === "Cambio de Estado por Unidad" && (
            <div>
              <label htmlFor="cantidad_transferir" className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad a Transferir
              </label>
              <input
                type="number"
                name="cantidad_transferir"
                id="cantidad_transferir"
                value={formData.cantidad_transferir}
                onChange={(e) => setFormData({ ...formData, cantidad_transferir: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
                min="1"
                max={detalleArticulo.stock_actual !== "N/A" ? detalleArticulo.stock_actual : undefined}
                required={tipoMovimientoSeleccionado === "Cambio de Estado por Unidad"}
              />
            </div>
          )}

          {/* Botón para enviar el formulario */}
          <div className="mt-4">
            <button
              type="submit"
              className={`w-full bg-orange-600 text-white py-2 rounded-md shadow hover:bg-orange-700 transition duration-200 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Registrar Movimiento"}
            </button>
          </div>
        </form>

        {/* Sección que muestra los detalles del artículo seleccionado */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Detalles del Artículo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Nombre:</strong> {detalleArticulo.nombre}</div>
            <div><strong>Categoría:</strong> {detalleArticulo.categoria}</div>
            <div><strong>Marca:</strong> {detalleArticulo.marca}</div>
            <div><strong>Modelo:</strong> {detalleArticulo.modelo}</div>
            <div><strong>Ubicación:</strong> {detalleArticulo.ubicacion}</div>
            <div>
              <strong>Estado:</strong>{" "}
              <span className={`${getEstadoColor(detalleArticulo.estado)}`}>
                {detalleArticulo.estado}
              </span>
            </div>
            <div><strong>Descripción:</strong> {detalleArticulo.descripcion}</div>
            <div><strong>Stock Mínimo:</strong> {detalleArticulo.stock_minimo}</div>
            <div><strong>Stock Actual:</strong> {detalleArticulo.stock_actual}</div>
            <div><strong>Código Interno:</strong> {detalleArticulo.codigo_interno}</div>
            <div><strong>Código Minvu:</strong> {detalleArticulo.codigo_minvu}</div>
            <div><strong>Número de Serie:</strong> {detalleArticulo.numero_serie}</div>
            <div><strong>MAC:</strong> {detalleArticulo.mac}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
