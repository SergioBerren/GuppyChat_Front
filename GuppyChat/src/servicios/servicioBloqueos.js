import api from './api';

// Bloquear usuario
export const bloquearUsuario = (bloqueadorId, bloqueadoId) => {
  return api.post('/api/bloqueos/bloquear', { bloqueadorId, bloqueadoId });
};

// Desbloquear usuario
export const desbloquearUsuario = (bloqueadorId, bloqueadoId) => {
  return api.delete(`/api/bloqueos/desbloquear/${bloqueadorId}/${bloqueadoId}`);
};

// Obtener lista de bloqueados
export const obtenerBloqueados = (usuarioId) => {
  return api.get(`/api/bloqueos/lista/${usuarioId}`);
};