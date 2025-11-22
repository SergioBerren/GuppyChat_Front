import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let cliente = null;
let suscripcionActual = null;

export const conectarWebSocket = (usuarioId, onMessage) => {
  // Si ya existe un cliente activo, solo actualizar la suscripción
  if (cliente && cliente.connected) {
    console.log('WebSocket ya conectado, actualizando suscripción...');
    suscribirseATopic(usuarioId, onMessage);
    return;
  }

  console.log('Creando nueva conexión WebSocket...');
  
  cliente = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws/chat'),
    debug: function(str) { 
      console.log('STOMP: ' + str); 
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  cliente.onConnect = () => {
    console.log('✅ Conectado a WebSocket');
    suscribirseATopic(usuarioId, onMessage);
  };

  cliente.onStompError = (frame) => {
    console.error('❌ Error STOMP:', frame.headers['message']);
    console.error('Detalles:', frame.body);
  };

  cliente.onWebSocketClose = (event) => {
    console.warn('⚠️ WebSocket cerrado:', event);
  };

  cliente.activate();
};

const suscribirseATopic = (usuarioId, onMessage) => {
  // Cancelar suscripción anterior si existe
  if (suscripcionActual) {
    console.log('Cancelando suscripción anterior...');
    suscripcionActual.unsubscribe();
  }

  // Suscribirse al topic del usuario (cambiar /tema/ por /topic/)
  console.log(`Suscribiéndose a /topic/${usuarioId}`);
  suscripcionActual = cliente.subscribe(`/topic/${usuarioId}`, (mensaje) => {
    console.log('📨 Mensaje recibido:', mensaje.body);
    try {
      const body = JSON.parse(mensaje.body);
      onMessage(body);
    } catch (error) {
      console.error('Error al parsear mensaje:', error);
    }
  });
};

export const enviarMensajeWebSocket = (mensaje) => {
  if (!cliente) {
    console.error('❌ Cliente WebSocket no inicializado');
    return false;
  }

  if (!cliente.connected) {
    console.warn('⚠️ WebSocket no conectado, intentando activar...');
    cliente.activate();
    
    // Esperar un momento y reintentar
    setTimeout(() => {
      if (cliente.connected) {
        enviarMensajeInmediato(mensaje);
      } else {
        console.error('❌ No se pudo conectar para enviar el mensaje');
      }
    }, 1000);
    return false;
  }

  return enviarMensajeInmediato(mensaje);
};

const enviarMensajeInmediato = (mensaje) => {
  try {
    console.log('📤 Enviando mensaje:', mensaje);
    cliente.publish({ 
      destination: '/app/chat.enviar', 
      body: JSON.stringify(mensaje) 
    });
    return true;
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    return false;
  }
};

export const desconectarWebSocket = () => {
  if (cliente) {
    console.log('Desconectando WebSocket...');
    if (suscripcionActual) {
      suscripcionActual.unsubscribe();
      suscripcionActual = null;
    }
    cliente.deactivate();
    cliente = null;
  }
};