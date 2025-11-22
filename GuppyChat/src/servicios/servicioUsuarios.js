import api from './api';

// Obtener todos los usuarios
export const obtenerUsuarios = () => api.get('/usuarios');

// Obtener usuarios excepto el actual
export const obtenerUsuariosExcepto = (usuarioId) => api.get(`/usuarios/excepto/${usuarioId}`);

// Obtener usuario por nombre
export const obtenerUsuarioPorNombre = (nombre) => api.get(`/usuarios/${nombre}`);