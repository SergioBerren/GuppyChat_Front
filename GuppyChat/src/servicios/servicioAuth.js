import api from './api';

export const registrarUsuario = (datosUsuario) => {
  return api.post('/api/auth/register', {
    nombreUsuario: datosUsuario.nombre,
    nombre: datosUsuario.nombre,
    apellido: datosUsuario.apellido,
    correo: datosUsuario.email,
    password: datosUsuario.password
  });
};

export const iniciarSesion = (email, password) => {
  return api.post('/api/auth/login', { email, password });
};

// ✅ NUEVO: Eliminar cuenta
export const eliminarCuenta = (correo, password) => {
  return api.delete('/api/auth/eliminar-cuenta', {
    data: {
      correo,
      password
    }
  });
};