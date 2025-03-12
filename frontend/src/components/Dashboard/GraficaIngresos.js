// src/components/Dashboard/GraficaIngresos.js

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  format, 
  isWithinInterval, 
  startOfWeek, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { es } from 'date-fns/locale'; // Importar la localización en español para formateo de fechas

// Registro de componentes de Chart.js para habilitar diferentes tipos de escalas, elementos, etc.
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Filtra los movimientos para incluir solo aquellos de lunes a viernes.
 * Excluye los movimientos de tipo "Cambio de Estado".
 * Agrupa y suma las cantidades de movimientos por tipo y día dentro de la semana.
 * @param {Array} movimientos - Lista completa de movimientos
 * @returns {Object} - Objeto con labels para días de la semana y datasets por tipo de movimiento
 */
const filtrarMovimientosDiaADia = (movimientos) => {
  // Obtiene los días de la semana actual (lunes a domingo)
  const diasSemana = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Inicia en lunes
    end: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), // Termina en domingo
  }).filter(date => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Filtra solo días de lunes a viernes
  });

  // Crea etiquetas para los días de la semana en formato "lunes 01/04", etc.
  const diasLabels = diasSemana.map(date => format(date, 'EEEE dd/MM', { locale: es }));

  // Define los tipos de movimiento que se desean analizar
  const tiposMovimiento = ['Entrada', 'Salida', 'Nuevo Articulo', 'Prestamo', 'Regresado'];

  // Inicializar un objeto para almacenar los datos por tipo y por día
  const datos = {};
  tiposMovimiento.forEach(tipo => {
    datos[tipo] = diasLabels.map(() => 0); // Inicializa un array con ceros para cada día de la semana por tipo
  });

  // Recorre cada movimiento para agrupar y sumar las cantidades
  movimientos.forEach(mov => {
    // Excluir movimientos que no son de los tipos especificados
    if (!tiposMovimiento.includes(mov.tipo_movimiento)) {
      return;
    }

    const fechaMov = new Date(mov.fecha);
    // Determina el lunes de la semana en que ocurrió el movimiento
    const inicioSemana = startOfWeek(fechaMov, { weekStartsOn: 1 });
    // Obtiene los días de lunes a viernes de la semana en cuestión
    const diasSemanaActual = eachDayOfInterval({
      start: inicioSemana,
      end: addDays(inicioSemana, 6), // Domingo
    }).filter(date => {
      const day = date.getDay();
      return day >= 1 && day <= 5;
    });

    // Encuentra el índice del día en que ocurrió el movimiento dentro de la semana
    const indiceDia = diasSemanaActual.findIndex(date => 
      format(date, 'yyyy-MM-dd') === format(fechaMov, 'yyyy-MM-dd')
    );

    // Si el movimiento ocurrió en un día entre lunes y viernes, suma su cantidad
    if (indiceDia !== -1) {
      datos[mov.tipo_movimiento][indiceDia] += mov.cantidad;
    }
  });

  // Asigna colores específicos para cada tipo de movimiento en la gráfica
  const colores = {
    'Entrada': 'rgba(75, 192, 192, 0.7)',       // Verde
    'Salida': 'rgba(255, 99, 132, 0.7)',        // Rojo
    'Nuevo Articulo': 'rgba(54, 162, 235, 0.7)', // Azul
    'Prestamo': 'rgba(153, 102, 255, 0.7)',     // Morado
    'Regresado': 'rgba(255, 159, 64, 0.7)',     // Naranja
  };

  // Crea datasets para Chart.js, cada uno correspondiente a un tipo de movimiento con sus datos y color
  const datasets = tiposMovimiento.map(tipo => ({
    label: tipo,
    data: datos[tipo],
    backgroundColor: colores[tipo] || 'rgba(0, 0, 0, 0.7)', // Color por defecto si no se encuentra
  }));

  // Retorna la estructura de datos con etiquetas de días y conjuntos de datos (datasets) para la gráfica
  return {
    labels: diasLabels,
    datasets,
  };
};

/**
 * Componente que renderiza una gráfica de barras con los ingresos diarios (movimientos) de lunes a viernes.
 * @param {Object} props
 * @param {Array} props.movimientos - Lista de movimientos a analizar y graficar
 */
export default function GraficaIngresos({ movimientos }) {
  // Usa useMemo para memorizar los datos agrupados, recalculándolos solo si "movimientos" cambia
  const datosAgrupados = useMemo(() => filtrarMovimientosDiaADia(movimientos), [movimientos]);

  // Estructura de datos para la gráfica de barras
  const data = {
    labels: datosAgrupados.labels,
    datasets: datosAgrupados.datasets,
  };

  // Configuraciones para la gráfica de barras
  const options = {
    responsive: true, // La gráfica se adapta al tamaño del contenedor
    maintainAspectRatio: false, // Permite que la gráfica ajuste su altura según el contenedor
    plugins: {
      legend: { position: 'top' }, // Posición de la leyenda
      title: {
        display: true,
        text: 'Movimientos Diarios (Lunes a Viernes)', // Título de la gráfica
      },
      tooltip: {
        callbacks: {
          // Personaliza el texto del tooltip cuando se pasa el cursor sobre una barra
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true, // El eje Y inicia en cero
        title: {
          display: true,
          text: 'Cantidad', // Título del eje Y
        },
      },
      x: {
        title: {
          display: true,
          text: 'Día', // Título del eje X
        },
      },
    },
  };

  return (
    // Contenedor de la gráfica con estilos para fondo, padding, etc.
    <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: '500px' }}>
      <Bar data={data} options={options} /> {/* Renderiza la gráfica de barras con los datos y opciones configuradas */}
    </div>
  );
}
