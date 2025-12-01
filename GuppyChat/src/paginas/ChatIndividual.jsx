import React, { useEffect, useState, useRef } from 'react';
import { conectarWebSocket, enviarMensajeWebSocket } from '../servicios/servicioWebSocket';
import { obtenerConversacion } from '../servicios/servicioChats';
import { FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../estilos/estiloChatIndividual.css';

export default function ChatIndividual({ chat, usuarioActual, onBloquear }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const mensajesEndRef = useRef(null);

  // Cargar mensajes previos
  useEffect(() => {
    if (!usuarioActual || !chat) return;

    const cargarMensajesPrevios = async () => {
      setCargando(true);
      setError(null);
      try {
        console.log(`📖 Cargando conversación entre ${usuarioActual.id} y ${chat.id}`);
        
        const respuesta = await obtenerConversacion(
          String(usuarioActual.id), 
          String(chat.id)
        );
        
        setMensajes(respuesta.data || []);
        console.log(`✅ Mensajes cargados: ${respuesta.data?.length || 0}`);
      } catch (err) {
        console.error('❌ Error al cargar mensajes:', err);
        setError('No se pudieron cargar los mensajes previos');
        setMensajes([]);
        toast.error('Error al cargar mensajes previos');
      } finally {
        setCargando(false);
      }
    };

    cargarMensajesPrevios();
  }, [chat.id, usuarioActual]);

  // Conectar WebSocket
  useEffect(() => {
    if (!usuarioActual) return;

    console.log('🔌 Conectando WebSocket para usuario:', usuarioActual.id);
    
    conectarWebSocket(String(usuarioActual.id), (mensajeNuevo) => {
      console.log('📨 Mensaje nuevo recibido via WebSocket:', mensajeNuevo);
      
      const usuarioActualId = String(usuarioActual.id);
      const chatId = String(chat.id);
      const emisorId = String(mensajeNuevo.emisorId);
      const receptorId = String(mensajeNuevo.receptorId);
      
      const esDeEstaConversacion = 
        (emisorId === usuarioActualId && receptorId === chatId) ||
        (receptorId === usuarioActualId && emisorId === chatId);

      if (esDeEstaConversacion) {
        setMensajes(prev => {
          const existe = prev.some(m => m.id === mensajeNuevo.id);
          if (existe) {
            console.log('⚠️ Mensaje duplicado, ignorando');
            return prev;
          }
          
          // Mostrar notificación si el mensaje es de otra persona
          if (emisorId !== usuarioActualId) {
            toast.info(`💬 Nuevo mensaje de ${chat.nombreUsuario}`, {
              position: "top-right",
              autoClose: 3000,
            });
          }
          
          console.log('✅ Agregando mensaje nuevo a la lista');
          return [...prev, mensajeNuevo];
        });
      }
    });
  }, [usuarioActual, chat.id, chat.nombreUsuario]);

  // Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = () => {
    if (!texto.trim()) {
      console.warn('⚠️ Intento de enviar mensaje vacío');
      return;
    }

    const mensaje = {
      emisorId: String(usuarioActual.id),
      receptorId: String(chat.id),
      mensajeCifrado: texto.trim()
    };

    console.log('📤 Preparando envío de mensaje:', mensaje);
    
    const enviado = enviarMensajeWebSocket(mensaje);
    
    if (enviado) {
      console.log('✅ Mensaje enviado correctamente');
      setTexto('');
    } else {
      console.error('❌ No se pudo enviar el mensaje');
      toast.error('Error al enviar el mensaje. Verifica tu conexión.');
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
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>Chat con {chat.nombreUsuario}</h3>
          <div className="chat-ids">
            Tu ID: {usuarioActual.id} | Chat con: {chat.id}
          </div>
        </div>
        {onBloquear && (
          <button onClick={onBloquear}>
            🚫 Bloquear usuario
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="chat-mensajes">
        {cargando ? (
          <div className="chat-mensajes-cargando">
            Cargando mensajes...
          </div>
        ) : error ? (
          <div className="chat-mensajes-error">
            {error}
          </div>
        ) : mensajes.length === 0 ? (
          <div className="chat-mensajes-vacio">
            No hay mensajes. ¡Envía el primero!
          </div>
        ) : (
          mensajes.map((m, i) => {
            const esMio = String(m.emisorId) === String(usuarioActual.id);
            return (
              <div 
                key={m.id || i} 
                className={`mensaje-wrapper ${esMio ? 'mensaje-mio' : 'mensaje-otro'}`}
              >
                <div className={`mensaje-burbuja ${esMio ? 'mensaje-mio' : 'mensaje-otro'}`}>
                  <div className="mensaje-autor">
                    {esMio ? 'Tú' : chat.nombreUsuario}
                  </div>
                  <div className="mensaje-contenido">{m.mensajeCifrado}</div>
                  {m.fechaHora && (
                    <div className="mensaje-hora">
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

      {/* Input */}
      <div className="chat-input-container">
        <input 
          type="text"
          value={texto} 
          onChange={e => setTexto(e.target.value)}
          onKeyPress={manejarTecla}
          placeholder="Escribe un mensaje..."
        />
        <button 
          onClick={enviar}
          disabled={!texto.trim()}
        >
          <FaPaperPlane /> Enviar
        </button>
      </div>
    </div>
  );
}