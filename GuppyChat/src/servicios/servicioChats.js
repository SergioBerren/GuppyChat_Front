import api from './api';

// Obtener todos los chats del usuario actual
export const obtenerChats = (usuarioId) => {
  return api.get(`/chats/${usuarioId}`);
};

// Obtener la conversación entre dos usuarios
export const obtenerConversacion = (usuarioId, otroUsuarioId) => {
  return api.get(`/chats/${usuarioId}/conversacion/${otroUsuarioId}`);
};

// Nota: El envío de mensajes se hace por WebSocket, no por HTTP