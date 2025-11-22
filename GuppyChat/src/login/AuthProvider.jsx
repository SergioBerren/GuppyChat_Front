import React, { createContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { iniciarSesion as apiLogin, registrarUsuario as apiRegistrar } from '../servicios/servicioAuth';
import { desconectarWebSocket } from '../servicios/servicioWebSocket';

export const ContextoAuth = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('usuario');
    
    // Solo mantener sesión si hay token y usuario
    if (token && u) {
      try {
        setUsuario(JSON.parse(u));
        console.log('Sesión restaurada:', JSON.parse(u));
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
      }
    }
    setCargando(false);
  }, []);

  const login = async (email, password) => {
    try {
      const respuesta = await apiLogin(email, password);
      const { token, user } = respuesta.data;

      // Guardar token y usuario en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(user));
      setUsuario(user);

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Has iniciado sesión como ${user.nombreUsuario}`,
        timer: 2000,
        showConfirmButton: false
      });

      return user;

    } catch (error) {
      console.error('Error en login:', error);

      let mensaje = 'Error al iniciar sesión';
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          mensaje = error.response.data?.error || 'Usuario o contraseña incorrectos';
        } else if (error.response.status === 500) {
          mensaje = 'Error del servidor. Inténtalo más tarde';
        }
      } else if (error.request) {
        mensaje = 'No se pudo conectar con el servidor';
      }

      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: mensaje,
      });

      throw error;
    }
  };

  const registrar = async (datosUsuario) => {
    try {
      const respuesta = await apiRegistrar(datosUsuario);

      Swal.fire({
        icon: 'success',
        title: 'Usuario registrado',
        text: 'Ahora puedes iniciar sesión',
        timer: 2000,
        showConfirmButton: false
      });

      return respuesta;
    } catch (error) {
      console.error('Error en registro:', error);

      let mensaje = 'Error al registrar usuario';
      if (error.response) {
        if (error.response.status === 400) {
          mensaje = error.response.data?.error || 'Datos inválidos o usuario ya existe';
        }
      } else if (error.request) {
        mensaje = 'No se pudo conectar con el servidor';
      }

      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: mensaje,
      });

      throw error;
    }
  };

  const cerrarSesion = () => {
    // Desconectar WebSocket antes de cerrar sesión
    desconectarWebSocket();
    
    // Limpiar modo oscuro al cerrar sesión
    document.body.classList.remove('dark-mode');
    
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);

    Swal.fire({
      icon: 'success',
      title: 'Sesión cerrada',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const actualizarUsuarioLocal = (nuevosDatos) => {
    const usuarioActualizado = { ...usuario, ...nuevosDatos };
    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    setUsuario(usuarioActualizado);
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  return (
    <ContextoAuth.Provider value={{ usuario, login, registrar, cerrarSesion, actualizarUsuarioLocal }}>
      {children}
    </ContextoAuth.Provider>
  );
};