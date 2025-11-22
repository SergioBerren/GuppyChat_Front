import { useEffect, useState, useRef } from 'react';
import { conectarWebSocket, enviarMensajeWebSocket } from '../servicios/servicioWebSocket';
import { obtenerConversacion } from '../servicios/servicioChats';
import { FaPaperPlane } from 'react-icons/fa';

const ChatGrupal = ({ chat, usuarioActual }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const mensajesEndRef = useRef(null);

  useEffect(() => {
    if (!usuarioActual || !chat) return;

    // Cargar mensajes previos
    const cargarMensajes = async () => {
      setCargando(true);
      try {
        // Nota: Los chats grupales necesitan implementación específica en el backend
        // Por ahora, mostraremos mensaje de "no implementado"
        console.warn('Chats grupales aún no implementados en el backend');
        setMensajes([]);
      } catch (error) {
        console.error('Error al cargar mensajes grupales:', error);
        setMensajes([]);
      } finally {
        setCargando(false);
      }
    };

    cargarMensajes();

    // Conectar WebSocket para mensajes en tiempo real
    conectarWebSocket(String(usuarioActual.id), (mensajeNuevo) => {
      // Verificar si el mensaje pertenece a este grupo
      if (mensajeNuevo.grupoId === chat.id) {
        setMensajes(prev => {
          const existe = prev.some(m => m.id === mensajeNuevo.id);
          if (existe) return prev;
          return [...prev, mensajeNuevo];
        });
      }
    });
  }, [chat, usuarioActual]);

  // Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = () => {
    if (!nuevoMensaje.trim()) return;

    // Nota: Necesitas implementar en el backend el manejo de grupos
    const mensaje = {
      emisorId: String(usuarioActual.id),
      grupoId: String(chat.id),
      mensajeCifrado: nuevoMensaje.trim()
    };

    console.log('Enviando mensaje grupal:', mensaje);
    
    const enviado = enviarMensajeWebSocket(mensaje);
    
    if (enviado) {
      setNuevoMensaje('');
    } else {
      alert('Error al enviar el mensaje grupal');
    }
  };

  const manejarTecla = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  if (!usuarioActual || !chat) {
    return <div>Selecciona un chat grupal</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        padding: '15px', 
        borderBottom: '1px solid #ccc',
        backgroundColor: '#f5f5f5'
      }}>
        <h3 style={{ margin: 0 }}>{chat.nombre} (Grupo)</h3>
        <small style={{ color: '#666' }}>⚠️ Funcionalidad de grupos en desarrollo</small>
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
                    {esMio ? 'Tú' : m.emisorNombre || 'Usuario'}
                  </div>
                  <div>{m.mensajeCifrado}</div>
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
          value={nuevoMensaje} 
          onChange={e => setNuevoMensaje(e.target.value)}
          onKeyPress={manejarTecla}
          placeholder="Escribe un mensaje al grupo..."
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '14px'
          }}
          disabled={true}  // Deshabilitado hasta implementar backend
        />
        <button 
          onClick={enviar}
          disabled={true}  // Deshabilitado hasta implementar backend
          style={{
            padding: '10px 20px',
            backgroundColor: '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'not-allowed',
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
};

export default ChatGrupal;