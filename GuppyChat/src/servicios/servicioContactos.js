import api from './api';

// Agregar contacto por correo
export const agregarContacto = (usuarioId, correo, nombrePersonalizado) => {
  return api.post('/api/contactos/agregar', {
    usuarioId,
    correo,
    nombrePersonalizado
  });
};

// Obtener lista de contactos
export const obtenerContactos = (usuarioId) => {
  return api.get(`/api/contactos/lista/${usuarioId}`);
};

// Buscar contactos por nombre
export const buscarContactos = (usuarioId, query) => {
  return api.get(`/api/contactos/buscar/${usuarioId}`, {
    params: { query }
  });
};

// Eliminar contacto
export const eliminarContacto = (contactoId) => {
  return api.delete(`/api/contactos/${contactoId}`);
};