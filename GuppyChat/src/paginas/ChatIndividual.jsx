import React, { useEffect, useState, useRef } from 'react';
import { conectarWebSocket, enviarMensajeWebSocket } from '../servicios/servicioWebSocket';
import { obtenerConversacion } from '../servicios/servicioChats';
import { FaPaperPlane } from 'react-icons/fa';

export default function ChatIndividual({ chat, usuarioActual, onBloquear }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const mensajesEndRef = useRef(null);

  // Cargar mensajes previos cuando se abre el chat
  useEffect(() => {
    if (!usuarioActual || !chat) return;

    const cargarMensajesPrevios = async () => {
      setCargando(true);
      setError(null);
      try {
        console.log(`Cargando conversación entre ${usuarioActual.id} y ${chat.id}`);
        const respuesta = await obtenerConversacion(
          String(usuarioActual.id), 
          String(chat.id)
        );
        setMensajes(respuesta.data || []);
        console.log('Mensajes cargados:', respuesta.data?.length || 0);
      } catch (err) {
        console.error('Error al cargar mensajes:', err);
        setError('No se pudieron cargar los mensajes previos');
        setMensajes([]);
      } finally {
        setCargando(false);
      }
    };

    cargarMensajesPrevios();
  }, [chat.id, usuarioActual]);

  // Conectar WebSocket y suscribirse a mensajes nuevos
  useEffect(() => {
    if (!usuarioActual) return;

    console.log('Conectando WebSocket para usuario:', usuarioActual.id);
    
    conectarWebSocket(String(usuarioActual.id), (mensajeNuevo) => {
      console.log('Mensaje nuevo recibido:', mensajeNuevo);
      
      // Solo agregar si es parte de esta conversación
      const esDeEstaConversacion = 
        (mensajeNuevo.emisorId === String(usuarioActual.id) && mensajeNuevo.receptorId === String(chat.id)) ||
        (mensajeNuevo.receptorId === String(usuarioActual.id) && mensajeNuevo.emisorId === String(chat.id));

      if (esDeEstaConversacion) {
        setMensajes(prev => {
          // Evitar duplicados
          const existe = prev.some(m => m.id === mensajeNuevo.id);
          if (existe) return prev;
          return [...prev, mensajeNuevo];
        });
      }
    });
  }, [usuarioActual, chat.id]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = () => {
    if (!texto.trim()) return;

    const mensaje = {
      emisorId: String(usuarioActual.id),
      receptorId: String(chat.id),
      mensajeCifrado: texto.trim()
    };

    console.log('Enviando mensaje:', mensaje);
    
    const enviado = enviarMensajeWebSocket(mensaje);
    
    if (enviado) {
      // No agregamos el mensaje localmente aquí porque llegará por WebSocket
      setTexto('');
    } else {
      console.error('No se pudo enviar el mensaje');
      alert('Error al enviar el mensaje. Verifica tu conexión.');
    }
  };

  const manejarTecla = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  if (!usuarioActual || !chat) {
    return <div>Selecciona un chat para comenzar</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        padding: '15px', 
        borderBottom: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Chat con {chat.nombreUsuario}</h3>
        {onBloquear && (
          <button
            onClick={onBloquear}
            style={{
              padding: '8px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🚫 Bloquear usuario
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto', 
        padding: '20px',
        backgroundColor: '#fafafa'
      }}>
        {cargando ? (
          <div style={{ textAlign: 'center', color: '#666' }}>
            Cargando mensajes...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#d32f2f' }}>
            {error}
          </div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999' }}>
            No hay mensajes. ¡Envía el primero!
          </div>
        ) : (
          mensajes.map((m, i) => {
            const esMio = m.emisorId === String(usuarioActual.id);
            return (
              <div 
                key={m.id || i} 
                style={{ 
                  marginBottom: '10px',
                  textAlign: esMio ? 'right' : 'left'
                }}
              >
                <div style={{
                  display: 'inline-block',
                  maxWidth: '70%',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  backgroundColor: esMio ? '#007bff' : '#e0e0e0',
                  color: esMio ? 'white' : 'black',
                  wordBreak: 'break-word'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    opacity: 0.8
                  }}>
                    {esMio ? 'Tú' : chat.nombreUsuario}
                  </div>
                  <div>{m.mensajeCifrado}</div>
                  {m.fechaHora && (
                    <div style={{ 
                      fontSize: '10px', 
                      marginTop: '5px',
                      opacity: 0.7
                    }}>
                      {new Date(m.fechaHora).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={mensajesEndRef} />
      </div>

      {/* Input de envío */}
      <div style={{ 
        padding: '15px', 
        borderTop: '1px solid #ccc',
        backgroundColor: 'white',
        display: 'flex',
        gap: '10px'
      }}>
        <input 
          type="text"
          value={texto} 
          onChange={e => setTexto(e.target.value)}
          onKeyPress={manejarTecla}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '14px'
          }}
        />
        <button 
          onClick={enviar}
          disabled={!texto.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: texto.trim() ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: texto.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <FaPaperPlane /> Enviar
        </button>
      </div>
    </div>
  );
}