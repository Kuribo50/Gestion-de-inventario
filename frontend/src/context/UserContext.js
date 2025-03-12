// src/context/UserContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api'; // Importar la configuración de la API para hacer solicitudes al backend

// Crear un contexto para almacenar y compartir datos del usuario a lo largo de la aplicación
const UserContext = createContext();

// Proveedor del contexto que envolverá a la aplicación o a partes de ella para proveer información de usuario
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Estado para almacenar la información del usuario autenticado
  const [loading, setLoading] = useState(true); // Estado para controlar la carga de información del usuario
  const [error, setError] = useState(null); // Estado para almacenar mensajes de error relacionados con la autenticación

  // useEffect que se ejecuta al montar el componente para cargar datos de usuario desde localStorage
  useEffect(() => {
    // Obtiene el usuario almacenado y el token de acceso desde localStorage
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');


    // Si hay un usuario y un token de acceso almacenados, actualiza el estado 'user'
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false); // Finaliza el estado de carga una vez finalizada la comprobación
  }, []);

  /**
   * Función para iniciar sesión con credenciales proporcionadas.
   * Realiza una solicitud al backend para obtener tokens y datos de usuario.
   * @param {string} username - Nombre de usuario.
   * @param {string} password - Contraseña.
   * @returns {boolean} - Indica si el login fue exitoso.
   */
  const login = async (username, password) => {
    setLoading(true); // Indica que se inicia el proceso de carga
    setError(null); // Resetea cualquier error previo

    try {
      // Solicita tokens de autenticación al backend usando las credenciales
      const tokenResponse = await api.post('/token/', { username, password });
      const { access, refresh } = tokenResponse.data;

      // Guarda los tokens en localStorage para mantener la sesión
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Solicita datos del usuario autenticado usando el token de acceso obtenido
      const userResponse = await api.get('/user/', {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      // Si la respuesta es exitosa, se procede a almacenar la información del usuario
      if (userResponse.status === 200) {
        const userData = userResponse.data;

        // Guarda los datos del usuario en localStorage y actualiza el estado 'user'
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Retorna true indicando que el login fue exitoso
        return true;
      } else {
        // Si no se puede obtener la información del usuario, lanza un error
        throw new Error('No se pudo obtener la información del usuario.');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Credenciales incorrectas o error en el servidor.'); // Actualiza el estado de error con un mensaje
      return false; // Retorna false indicando que el login falló
    } finally {
      setLoading(false); // Finaliza el estado de carga sin importar el resultado
    }
  };

  /**
   * Función para cerrar sesión.
   * Elimina tokens y datos de usuario del localStorage y resetea el estado 'user'.
   */
  const logout = () => {
    localStorage.removeItem('access_token');  // Elimina el token de acceso
    localStorage.removeItem('refresh_token'); // Elimina el token de refresco
    localStorage.removeItem('user');          // Elimina la información del usuario
    setUser(null);                            // Resetea el estado 'user' a null
    // Aquí se podrían agregar notificaciones o redirecciones tras cerrar sesión
  };

  // Provee el contexto con valores de usuario, estados de carga/error y funciones login/logout a sus hijos
  return (
    <UserContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook personalizado para acceder fácilmente al contexto del usuario
export const useUser = () => {
  return useContext(UserContext);
};
