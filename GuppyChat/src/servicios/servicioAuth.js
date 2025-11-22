import api from './api';

export const registrarUsuario = (datosUsuario) => {
  // nombre -> nombreUsuario en backend
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
