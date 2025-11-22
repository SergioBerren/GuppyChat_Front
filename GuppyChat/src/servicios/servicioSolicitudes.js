import api from './api';

// Enviar solicitud de chat
export const enviarSolicitud = (emisorId, receptorId) => {
  return api.post('/api/solicitudes/enviar', { emisorId, receptorId });
};

// Aceptar solicitud
export const aceptarSolicitud = (solicitudId) => {
  return api.post(`/api/solicitudes/${solicitudId}/aceptar`);
};

// Rechazar solicitud (bloquear automáticamente)
export const rechazarSolicitud = (solicitudId) => {
  return api.post(`/api/solicitudes/${solicitudId}/rechazar`);
};

// Obtener solicitudes pendientes
export const obtenerSolicitudesPendientes = (usuarioId) => {
  return api.get(`/api/solicitudes/pendientes/${usuarioId}`);
};

// Verificar si puede chatear con alguien
export const puedeChatear = (usuario1, usuario2) => {
  return api.get(`/api/solicitudes/puede-chatear/${usuario1}/${usuario2}`);
};