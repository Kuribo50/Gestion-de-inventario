// src/components/Dashboard/MovimientosRecientes.js

import { useState, useEffect, useRef } from "react";
import { fetchMovimientos, fetchArticulos } from "../../services/api"; // Importa funciones para obtener datos desde la API
import { 
  FaArrowCircleDown, 
  FaArrowCircleUp, 
  FaBoxOpen, 
  FaHandHolding, 
  FaUndoAlt, 
  FaExchangeAlt,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa"; // Importa íconos para representar distintos tipos de movimientos y flechas
import { IconContext } from "react-icons"; // Contexto para configurar estilos globales de los íconos

// Definición de tipos de pestañas para filtrar movimientos
const MOVIMIENTO_TABS = {
  RECENTES: "Recientes",
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  CAMBIO_ESTADO: "Cambio de Estado",
  NUEVO_ARTICULO: "Nuevo Articulo",
  PRESTAMO: "Prestamo",
  REGRESADO: "Regresado",
};

// Mapeo de íconos para cada tipo de movimiento
const ICONOS_MOVIMIENTO = {
  Entrada: <FaArrowCircleDown />,
  Salida: <FaArrowCircleUp />,
  "Nuevo Articulo": <FaBoxOpen />,
  Prestamo: <FaHandHolding />,
  Regresado: <FaUndoAlt />,
  "Cambio de Estado": <FaExchangeAlt />,
};

// Mapeo de clases de color para cada tipo de movimiento
const CLASES_COLORS = {
  Entrada: "green",
  Salida: "red",
  "Nuevo Articulo": "blue",
  Prestamo: "purple",
  Regresado: "orange",
  "Cambio de Estado": "yellow",
};

export default function MovimientosRecientes() {
  const [movimientos, setMovimientos] = useState([]); // Estado para almacenar lista de movimientos
  const [articulos, setArticulos] = useState([]); // Estado para almacenar lista de artículos
  const [error, setError] = useState(null); // Estado para almacenar errores
  const [activeTab, setActiveTab] = useState(MOVIMIENTO_TABS.RECENTES); // Pestaña activa para filtrar movimientos

  const tabsRef = useRef(null); // Referencia al contenedor de pestañas para scroll horizontal

  /**
   * Carga movimientos desde la API y ordena los más recientes primero.
   */
  const loadMovimientos = async () => {
    try {
      const data = await fetchMovimientos();
      // Ordena los movimientos por fecha descendente (más recientes primero)
      const movimientosOrdenados = data.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
      setMovimientos(movimientosOrdenados);
      setError(null);
    } catch (err) {
      console.error("Error al cargar movimientos:", err);
      setError(`Error al cargar los movimientos: ${err.message}`);
    }
  };

  /**
   * Carga artículos desde la API.
   */
  const loadArticulos = async () => {
    try {
      const data = await fetchArticulos();
      setArticulos(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar artículos:", err);
      setError(`Error al cargar los artículos: ${err.message}`);
    }
  };

  // useEffect para cargar datos iniciales y establecer un intervalo para actualizar periódicamente
  useEffect(() => {
    loadMovimientos();
    loadArticulos();

    // Actualiza movimientos y artículos cada 10 segundos
    const interval = setInterval(() => {
      loadMovimientos();
      loadArticulos();
    }, 10000);

    return () => clearInterval(interval); // Limpia el intervalo al desmontar el componente
  }, []);

  // useEffect para habilitar el desplazamiento horizontal con el scroll del mouse sobre las pestañas
  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (!tabsElement) return;

    const handleWheel = (e) => {
      // Si no hay desplazamiento vertical, no hace nada
      if (e.deltaY === 0) return;
      e.preventDefault();
      // Desplaza el contenedor horizontalmente basado en la dirección del scroll vertical
      tabsElement.scrollBy({
        left: e.deltaY < 0 ? -100 : 100,
        behavior: "smooth",
      });
    };

    tabsElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      tabsElement.removeEventListener("wheel", handleWheel);
    };
  }, []);

  /**
   * Filtra los movimientos según la pestaña activa.
   * Si se selecciona una pestaña específica, filtra por ese tipo y toma los primeros 5.
   * Si la pestaña es "Recientes", simplemente toma los primeros 5 movimientos.
   */
  const getFilteredMovimientos = () => {
    switch (activeTab) {
      case MOVIMIENTO_TABS.ENTRADA:
      case MOVIMIENTO_TABS.SALIDA:
      case MOVIMIENTO_TABS.CAMBIO_ESTADO:
      case MOVIMIENTO_TABS.NUEVO_ARTICULO:
      case MOVIMIENTO_TABS.PRESTAMO:
      case MOVIMIENTO_TABS.REGRESADO:
        return movimientos
          .filter((mov) => mov.tipo_movimiento === activeTab)
          .slice(0, 5);
      case MOVIMIENTO_TABS.RECENTES:
      default:
        return movimientos.slice(0, 5);
    }
  };

  const filteredMovimientos = getFilteredMovimientos();

  /**
   * Obtiene el nombre del artículo dado su ID buscando en la lista de artículos.
   * @param {number|string} articuloId - ID del artículo
   * @returns {string} - Nombre del artículo o "Desconocido" si no se encuentra
   */
  const getArticuloNombre = (articuloId) => {
    const articulo = articulos.find((art) => art.id === articuloId);
    return articulo ? articulo.nombre : "Desconocido";
  };

  /**
   * Obtiene el estado del artículo dado su ID.
   * @param {number|string} articuloId - ID del artículo
   * @returns {string} - Estado del artículo ("Bueno", "Malo", "De Baja" o "Desconocido")
   */
  const getArticuloEstado = (articuloId) => {
    const articulo = articulos.find((art) => art.id === articuloId);
    if (articulo) {
      switch (articulo.estado) {
        case 1:
          return "Bueno";
        case 2:
          return "Malo";
        case 3:
          return "De Baja";
        default:
          return "Desconocido";
      }
    }
    return "Desconocido";
  };

  /**
   * Retorna la clase de color CSS basada en el estado del artículo.
   * @param {string} estado - Estado del artículo ("Bueno", "Malo", "De Baja", etc.)
   * @returns {string} - Clase de Tailwind CSS para el color de texto correspondiente al estado
   */
  const getArticuloEstadoColor = (estado) => {
    switch (estado) {
      case "Bueno":
        return "text-green-500";
      case "Malo":
        return "text-red-500";
      case "De Baja":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  /**
   * Retorna la clase de color CSS para un tipo de movimiento.
   * @param {string} tipoMovimiento - Tipo de movimiento
   * @returns {string} - Clase de color asociada o "text-gray-500" por defecto
   */
  const getMovimientoColor = (tipoMovimiento) => {
    return CLASES_COLORS[tipoMovimiento] || "text-gray-500";
  };

  /**
   * Retorna el ícono correspondiente a un tipo de movimiento.
   * @param {string} tipoMovimiento - Tipo de movimiento
   * @returns {JSX.Element} - Ícono asociado al tipo de movimiento
   */
  const getMovimientoIcon = (tipoMovimiento) => {
    return ICONOS_MOVIMIENTO[tipoMovimiento] || <FaExchangeAlt />;
  };

  // Función para desplazar las pestañas hacia la izquierda
  const scrollTabsLeft = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: -150,
        behavior: "smooth",
      });
    }
  };

  // Función para desplazar las pestañas hacia la derecha
  const scrollTabsRight = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: 150,
        behavior: "smooth",
      });
    }
  };

  // Si hay un error, se muestra un mensaje de error
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow h-full relative">
      <h3 className="text-lg font-semibold mb-4">Movimientos</h3>

      {/* Contenedor de las pestañas (tabs) con flechas para desplazamiento */}
      <div className="relative mb-4">
        {/* Botón para desplazar las pestañas a la izquierda */}
        <button
          onClick={scrollTabsLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 text-black rounded-full p-1 shadow focus:outline-none"
          style={{ top: '50%', left: '-15px' }}
          aria-label="Desplazar hacia la izquierda"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Contenedor de pestañas con desplazamiento horizontal */}
        <div 
          className="flex flex-nowrap overflow-x-auto no-scrollbar cursor-grab"
          ref={tabsRef}
        >
          {/* Generación de botones de pestañas para cada categoría en MOVIMIENTO_TABS */}
          {Object.values(MOVIMIENTO_TABS).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)} // Cambia la pestaña activa al hacer clic
              className={`flex items-center px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab
                  ? (CLASES_COLORS[tab]
                      ? `border-b-2 text-${CLASES_COLORS[tab]}-600 border-${CLASES_COLORS[tab]}-600`
                      : "text-blue-600 border-blue-600")
                  : "text-gray-600 hover:text-blue-600"
              }`}
              aria-label={`Mostrar movimientos de ${tab}`}
            >
              {/* Mostrar ícono correspondiente */}
              <IconContext.Provider value={{ className: "mr-2" }}>
                {getMovimientoIcon(tab)}
              </IconContext.Provider>
              {tab} {/* Nombre de la pestaña */}
            </button>
          ))}
        </div>

        {/* Botón para desplazar las pestañas a la derecha */}
        <button
          onClick={scrollTabsRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 text-black rounded-full p-1 shadow focus:outline-none"
          style={{ top: '50%', right: '-15px' }}
          aria-label="Desplazar hacia la derecha"
        >
          <FaChevronRight size={14} />
        </button>
      </div>

      {/* Lista de movimientos filtrados */}
      <div className="overflow-y-auto max-h-60 md:max-h-80">
        <ul className="divide-y divide-gray-200">
          {filteredMovimientos.length > 0 ? (
            filteredMovimientos.map((mov, index) => (
              <li
                key={mov.id || index}
                className="flex justify-between items-center py-2"
              >
                <div className="flex items-center">
                  {/* Muestra el ícono del movimiento con un color basado en su tipo */}
                  <IconContext.Provider value={{ className: `mr-3 text-${CLASES_COLORS[mov.tipo_movimiento] || 'gray'}-500` }}>
                    {getMovimientoIcon(mov.tipo_movimiento)}
                  </IconContext.Provider>
                  <div>
                    <p className="font-medium">
                      {/* Muestra el nombre del artículo asociado al movimiento */}
                      {getArticuloNombre(mov.articulo)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {/* Muestra el tipo de movimiento y la fecha formateada */}
                      {`${mov.tipo_movimiento} - ${new Date(
                        mov.fecha
                      ).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                    </p>
                  </div>
                </div>
                {/* Si el movimiento es de "Cambio de Estado", muestra el estado del artículo con su color correspondiente */}
                {mov.tipo_movimiento === MOVIMIENTO_TABS.CAMBIO_ESTADO ? (
                  <p
                    className={`text-lg font-semibold ${getArticuloEstadoColor(
                      getArticuloEstado(mov.articulo)
                    )}`}
                  >
                    {getArticuloEstado(mov.articulo)}
                  </p>
                ) : (
                  // Para otros tipos de movimiento, muestra la cantidad asociada con un color específico
                  <p
                    className={`text-lg font-semibold ${getMovimientoColor(
                      mov.tipo_movimiento
                    )}`}
                  >
                    {mov.cantidad || 0}
                  </p>
                )}
              </li>
            ))
          ) : (
            // Mensaje si no hay movimientos en la categoría seleccionada
            <li className="text-gray-500 text-sm text-center py-4">
              No hay movimientos en esta categoría.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
