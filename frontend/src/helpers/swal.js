// helpers/swal.js
import Swal from "sweetalert2";

/**
 * Muestra una alerta simple utilizando SweetAlert2 con estilos personalizados para el botón de confirmación.
 * @param {('error'|'warning'|'info'|'success')} icon - Tipo de icono que se mostrará en la alerta.
 * @param {string} title - Título de la alerta.
 * @param {string} text - Texto descriptivo de la alerta.
 */
export const showAlert = (icon, title, text) => {
  // Determina el color del botón en función del tipo de alerta
  let buttonColor = "bg-blue-600 hover:bg-blue-700"; // Color predeterminado: azul

  if (icon === "error") {
    buttonColor = "bg-red-600 hover:bg-red-700"; // Rojo para errores
  } else if (icon === "warning") {
    buttonColor = "bg-yellow-500 hover:bg-yellow-600"; // Amarillo para advertencias
  } else if (icon === "info") {
    buttonColor = "bg-blue-600 hover:bg-blue-700"; // Azul para información
  } else if (icon === "success") {
    buttonColor = "bg-green-600 hover:bg-green-700"; // Verde para éxito
  }

  // Configuración y despliegue de la alerta usando SweetAlert2
  Swal.fire({
    icon, // Icono según el tipo de alerta
    title, // Título de la alerta
    text, // Mensaje de la alerta
    position: "center", // Posición de la alerta en pantalla
    buttonsStyling: false, // Desactiva los estilos predeterminados de botones
    customClass: {
      // Aplica clases personalizadas para el botón de confirmación
      confirmButton: `${buttonColor} text-white font-bold py-2 px-4 rounded`,
    },
  });
};

/**
 * Muestra una confirmación de acción utilizando SweetAlert2 con botones de confirmación y cancelación estilizados.
 * @param {string} title - Título de la confirmación.
 * @param {string} text - Mensaje descriptivo de la confirmación.
 * @returns {Promise<SweetAlertResult>} - Promesa que se resuelve con la elección del usuario.
 */
export const showConfirmation = (title, text) => {
  // Configuración y despliegue de la alerta de confirmación
  return Swal.fire({
    title, // Título de la confirmación
    text, // Texto descriptivo
    icon: "warning", // Icono de advertencia para confirmar acción potencialmente destructiva
    showCancelButton: true, // Muestra un botón de cancelación
    confirmButtonText: "Sí, cancelar", // Texto del botón de confirmación
    cancelButtonText: "No, continuar", // Texto del botón de cancelación
    buttonsStyling: false, // Desactiva estilos predeterminados de botones
    customClass: {
      // Clases personalizadas para botones
      confirmButton: "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded",
      cancelButton: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded",
    },
    position: "center", // Posición de la alerta en la pantalla
  });
};
