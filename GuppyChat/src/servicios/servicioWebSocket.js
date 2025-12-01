import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let cliente = null;
let suscripcionActual = null;

export const conectarWebSocket = (usuarioId, onMessage) => {
  // Si ya existe un cliente activo, solo actualizar la suscripción
  if (cliente && cliente.connected) {
    console.log('✅ WebSocket ya conectado, actualizando suscripción...');
    suscribirseATopic(usuarioId, onMessage);
    return;
  }

  console.log('🔌 Creando nueva conexión WebSocket...');
  
  cliente = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws/chat'),
    debug: function(str) { 
      console.log('🔍 STOMP:', str); 
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  cliente.onConnect = () => {
    console.log('✅ CONECTADO a WebSocket');
    suscribirseATopic(usuarioId, onMessage);
  };

  cliente.onStompError = (frame) => {
    console.error('❌ Error STOMP:', frame.headers['message']);
    console.error('📄 Detalles:', frame.body);
  };

  cliente.onWebSocketClose = (event) => {
    console.warn('⚠️ WebSocket cerrado:', event);
  };

  cliente.onWebSocketError = (event) => {
    console.error('❌ Error en WebSocket:', event);
  };

  cliente.activate();
};

const suscribirseATopic = (usuarioId, onMessage) => {
  // Cancelar suscripción anterior si existe
  if (suscripcionActual) {
    console.log('🔄 Cancelando suscripción anterior...');
    try {
      suscripcionActual.unsubscribe();
    } catch (err) {
      console.warn('⚠️ Error al cancelar suscripción:', err);
    }
  }

  const topic = `/topic/${usuarioId}`;
  console.log(`📡 Suscribiéndose a: ${topic}`);
  
  try {
    suscripcionActual = cliente.subscribe(topic, (mensaje) => {
      console.log('📨 Mensaje WebSocket recibido RAW:', mensaje.body);
      try {
        const body = JSON.parse(mensaje.body);
        console.log('📦 Mensaje parseado:', body);
        onMessage(body);
      } catch (error) {
        console.error('❌ Error al parsear mensaje:', error);
        console.error('📄 Body recibido:', mensaje.body);
      }
    });
    console.log('✅ Suscripción exitosa a', topic);
  } catch (err) {
    console.error('❌ Error al suscribirse:', err);
  }
};

export const enviarMensajeWebSocket = (mensaje) => {
  if (!cliente) {
    console.error('❌ Cliente WebSocket no inicializado');
    return false;
  }

  if (!cliente.connected) {
    console.warn('⚠️ WebSocket no conectado, intentando activar...');
    cliente.activate();
    
    setTimeout(() => {
      if (cliente.connected) {
        return enviarMensajeInmediato(mensaje);
      } else {
        console.error('❌ No se pudo conectar para enviar el mensaje');
        alert('No hay conexión. Por favor, recarga la página.');
      }
    }, 1000);
    return false;
  }

  return enviarMensajeInmediato(mensaje);
};

const enviarMensajeInmediato = (mensaje) => {
  try {
    const mensajeValidado = {
      emisorId: String(mensaje.emisorId),
      receptorId: String(mensaje.receptorId),
      mensajeCifrado: mensaje.mensajeCifrado
    };
    
    console.log('📤 Enviando mensaje via WebSocket:', mensajeValidado);
    
    cliente.publish({ 
      destination: '/app/chat.enviar', 
      body: JSON.stringify(mensajeValidado) 
    });
    
    console.log('✅ Mensaje publicado en /app/chat.enviar');
    return true;
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    return false;
  }
};

export const desconectarWebSocket = () => {
  if (cliente) {
    console.log('🔌 Desconectando WebSocket...');
    if (suscripcionActual) {
      try {
        suscripcionActual.unsubscribe();
      } catch (err) {
        console.warn('⚠️ Error al desuscribirse:', err);
      }
      suscripcionActual = null;
    }
    try {
      cliente.deactivate();
    } catch (err) {
      console.warn('⚠️ Error al desactivar cliente:', err);
    }
    cliente = null;
    console.log('✅ WebSocket desconectado');
  }
};