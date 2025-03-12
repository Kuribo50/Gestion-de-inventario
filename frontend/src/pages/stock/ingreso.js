// components/EntradaProducto.jsx

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Sidebar from "@/components/Sidebar";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import api from "@/services/api";

export default function EntradaProducto() {
  // Estado para manejar los datos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    articulo_id: "",
    categoria: "",
    cantidad: "",
    modelo: "",
    marca: "",
    numero_serie: "",
    codigo_minvu: "",
    codigo_interno: "",
    mac: "",
    descripcion: "",
    ubicacion: "",
    motivo: "",
  });

  // Estados para almacenar las opciones de los selects
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [motivos, setMotivos] = useState([]);

  // Estados para manejar el estado de la aplicación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stockActual, setStockActual] = useState(null);
  const [isArticuloExistente, setIsArticuloExistente] = useState(false);

  // Cargar los datos iniciales desde la API al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Función para obtener todos los datos necesarios desde la API
  const fetchData = async () => {
    try {
      setLoading(true);

      // Realizamos todas las peticiones de forma paralela
      const [
        categoriaRes,
        marcaRes,
        modeloRes,
        ubicacionRes,
        articuloRes,
        motivoRes,
      ] = await Promise.all([
        api.get("/categorias/"),
        api.get("/marcas/"),
        api.get("/modelos/"),
        api.get("/ubicaciones/"),
        api.get("/articulos/"),
        api.get("/motivos/"),
      ]);

      // Extraemos los datos de las respuestas
      const categoriaData = categoriaRes.data;
      const marcaData = marcaRes.data;
      const modeloData = modeloRes.data;
      const ubicacionData = ubicacionRes.data;
      const articuloData = articuloRes.data;
      const motivoData = motivoRes.data;

      // Actualizamos los estados con las opciones obtenidas
      setCategorias(categoriaData);
      setMarcas(marcaData);
      setModelos(modeloData);
      setUbicaciones(ubicacionData);

      // Formateamos las opciones para el Select de artículos
      setArticulos(
        articuloData.map((articulo) => ({
          value: String(articulo.id),
          label: articulo.nombre,
          stock: articulo.stock_actual,
          categoria: articulo.categoria,
          marca: articulo.marca,
          modelo: articulo.modelo,
          ubicacion: articulo.ubicacion,
          descripcion: articulo.descripcion,
          numero_serie: articulo.numero_serie || "N/A",
          codigo_minvu: articulo.codigo_minvu || "N/A",
          codigo_interno: articulo.codigo_interno || "N/A",
          mac: articulo.mac || "N/A",
        }))
      );

      // Formateamos las opciones para el Select de motivos
      setMotivos(
        motivoData.map((motivo) => ({
          label: motivo.nombre,
          value: String(motivo.id),
        }))
      );
    } catch (error) {
      console.error("Error al cargar los datos de la API:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al cargar los datos de la API.",
        position: "center",
        buttonsStyling: false,
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en los campos de entrada estándar
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Manejar la selección de un artículo desde el Select
  const handleNombreChange = (selectedOption) => {
    if (selectedOption) {
      const articulo = articulos.find((a) => a.value === selectedOption.value);
      if (articulo) {
        setFormData({
          ...formData,
          nombre: articulo.label,
          articulo_id: articulo.value,
          categoria: articulo.categoria,
          marca: articulo.marca,
          modelo: articulo.modelo,
          ubicacion: articulo.ubicacion,
          numero_serie: articulo.numero_serie,
          codigo_minvu: articulo.codigo_minvu,
          codigo_interno: articulo.codigo_interno,
          mac: articulo.mac,
          descripcion: articulo.descripcion || "",
          motivo: "", // Resetear motivo al seleccionar un nuevo artículo
        });
        setStockActual(articulo.stock || 0);
        setIsArticuloExistente(true);
      }
    } else {
      resetForm();
    }
  };

  // Manejar la selección o creación de un motivo desde el Select
  const handleMotivoChange = async (selectedOption) => {
    if (selectedOption) {
      if (selectedOption.__isNew__) {
        // Guardar en la API si se crea una nueva opción
        try {
          const response = await api.post("/motivos/", { nombre: selectedOption.label });

          if (response.status === 201 || response.status === 200) {
            const nuevoMotivo = response.data;
            setMotivos((prevMotivos) => [
              ...prevMotivos,
              { label: nuevoMotivo.nombre, value: String(nuevoMotivo.id) },
            ]);
            setFormData((prev) => ({ ...prev, motivo: String(nuevoMotivo.id) }));
            Swal.fire({
              icon: "success",
              title: "Éxito",
              text: `Motivo "${nuevoMotivo.nombre}" creado correctamente.`,
              position: "center",
              showConfirmButton: false,
              timer: 1500,
              toast: true,
              background: "#F0FDF4",
              iconColor: "#10B981",
            });
          } else {
            throw new Error("No se pudo crear el motivo.");
          }
        } catch (error) {
          console.error("Error al crear el motivo:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo crear el motivo.",
            position: "center",
            buttonsStyling: false,
            customClass: {
              confirmButton:
                "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
            },
          });
        }
      } else {
        setFormData((prev) => ({ ...prev, motivo: String(selectedOption.value) }));
      }
    } else {
      setFormData((prev) => ({ ...prev, motivo: "" }));
    }
  };

  // Validar los campos del formulario antes de enviarlo
  const validateForm = () => {
    if (!formData.nombre || !formData.cantidad) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Debes seleccionar un artículo y especificar la cantidad.",
        position: "center",
        buttonsStyling: false,
        customClass: {
          confirmButton:
            "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded",
        },
      });
      return false;
    }

    const cantidadInt = parseInt(formData.cantidad, 10);
    if (isNaN(cantidadInt) || cantidadInt <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "La cantidad debe ser un número positivo.",
        position: "center",
        buttonsStyling: false,
        customClass: {
          confirmButton:
            "bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded",
        },
      });
      return false;
    }

    return true;
  };

  // Manejar el envío del formulario para registrar la entrada de un producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Preparar el payload para la API
      const movimientoPayload = {
        articulo: formData.articulo_id,
        tipo_movimiento: "Entrada",
        cantidad: parseInt(formData.cantidad, 10),
        fecha: new Date().toISOString(),
        ubicacion: formData.ubicacion,
        comentario: "Entrada de stock",
        motivo: formData.motivo || null,
      };

      const response = await api.post("/movimientos/", movimientoPayload);

      if (response.status === 201 || response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Entrada de stock registrada correctamente.",
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "center",
          background: "#F0FDF4",
          iconColor: "#10B981",
        });

        // Actualizar el stock actual en el formulario
        setStockActual((prevStock) => prevStock + parseInt(formData.cantidad, 10));

        // Actualizar el stock en el estado 'articulos'
        setArticulos((prevArticulos) =>
          prevArticulos.map((articulo) =>
            articulo.value === formData.articulo_id
              ? { ...articulo, stock: (articulo.stock || 0) + parseInt(formData.cantidad, 10) }
              : articulo
          )
        );

        resetForm();
      } else {
        const errorData = response.data;
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Hubo un error al registrar la entrada de stock: ${JSON.stringify(errorData)}`,
          position: "center",
          buttonsStyling: false,
          customClass: {
            confirmButton:
              "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
          },
        });
      }
    } catch (error) {
      console.error("Error al registrar la entrada de stock:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al comunicarse con el servidor.",
        position: "center",
        buttonsStyling: false,
        customClass: {
          confirmButton:
            "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar la acción de cancelar la entrada del producto
  const handleCancel = () => {
    Swal.fire({
      title: "¿Cancelar ingreso?",
      text: "Todos los datos ingresados se perderán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      confirmButtonColor: "#d33",
      cancelButtonText: "No, continuar",
      cancelButtonColor: "#3085d6",
      position: "center",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
        cancelButton:
          "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        Swal.fire({
          icon: "success",
          title: "Cancelado",
          text: "El ingreso fue cancelado.",
          timer: 1500,
          showConfirmButton: false,
          position: "center",
          background: "#FEF3C7",
          iconColor: "#F59E0B",
        });
      }
    });
  };

  // Reiniciar todos los campos del formulario
  const resetForm = () => {
    setFormData({
      nombre: "",
      articulo_id: "",
      categoria: "",
      cantidad: "",
      modelo: "",
      marca: "",
      numero_serie: "",
      codigo_minvu: "",
      codigo_interno: "",
      mac: "",
      descripcion: "",
      ubicacion: "",
      motivo: "",
    });
    setStockActual(null);
    setIsArticuloExistente(false);
  };

  return (
    <div className="flex">
      {/* Componente Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 p-6 sm:ml-64 bg-gray-100">
        <h1 className="text-2xl font-bold mb-6">Entrada de Producto</h1>

        {/* Formulario para registrar la entrada de un producto */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6 space-y-4"
        >
          {/* Primera fila: Nombre, Categoría, Cantidad y Stock Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Selector de Nombre del Artículo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <Select
                options={articulos}
                onChange={handleNombreChange}
                className="w-full"
                placeholder="Seleccionar Producto"
                isLoading={loading}
                value={
                  formData.articulo_id
                    ? articulos.find((art) => art.value === formData.articulo_id) || null
                    : null
                }
                isDisabled={isSubmitting}
                formatOptionLabel={(option) => (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-gray-400">Stock: {option.stock}</span>
                  </div>
                )}
                filterOption={(option, inputValue) =>
                  option.data.label.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </div>

            {/* Campo de Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <input
                type="text"
                value={
                  formData.categoria
                    ? categorias.find((c) => c.id === formData.categoria)?.nombre || ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {/* Campo de Cantidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                min="1"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Campo de Stock Actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Actual
              </label>
              <input
                type="text"
                value={stockActual !== null ? stockActual : "Sin información"}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* Segunda fila: Modelo, Marca y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Campo de Modelo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={
                  formData.modelo
                    ? modelos.find((m) => m.id === formData.modelo)?.nombre || ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {/* Campo de Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={
                  formData.marca
                    ? marcas.find((ma) => ma.id === formData.marca)?.nombre || ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {/* Campo de Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={
                  formData.ubicacion
                    ? ubicaciones.find((u) => u.id === formData.ubicacion)?.nombre || ""
                    : ""
                }
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* Tercera fila: Códigos y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Campo de Número de Serie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Serie
              </label>
              <input
                type="text"
                value={formData.numero_serie || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {/* Campo de MAC Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MAC Address
              </label>
              <input
                type="text"
                value={formData.mac || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {/* Campo de Código Interno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Interno
              </label>
              <input
                type="text"
                value={formData.codigo_interno || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>
          </div>

          {/* Cuarta fila: Código MINVU y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Campo de Código MINVU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código MINVU
              </label>
              <input
                type="text"
                value={formData.codigo_minvu || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            {/* Campo de Descripción */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion || ""}
                disabled
                className="w-full border-gray-300 rounded-lg bg-gray-100"
                rows="2"
              ></textarea>
            </div>
          </div>

          {/* Quinta fila: Motivo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo
            </label>
            <CreatableSelect
              name="motivo"
              options={motivos}
              onChange={handleMotivoChange}
              className="w-full"
              isClearable
              placeholder="Seleccionar o Crear Motivo"
              isLoading={loading}
              formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
              value={
                formData.motivo
                  ? motivos.find((motivo) => motivo.value === formData.motivo) || null
                  : null
              }
              isDisabled={isSubmitting}
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="mr-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 ${
                isSubmitting ? "bg-blue-300 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Registrando..." : "Registrar Entrada"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
