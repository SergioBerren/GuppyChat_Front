import React, { useEffect, useState, useRef } from 'react';
import { conectarWebSocket, enviarMensajeWebSocket } from '../servicios/servicioWebSocket';
import { obtenerConversacion } from '../servicios/servicioChats';
import { FaPaperPlane, FaLock, FaPaperclip, FaImage, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../estilos/estiloChatIndividual.css';

export default function ChatIndividual({ chat, usuarioActual, onBloquear }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const mensajesEndRef = useRef(null);
  const inputArchivoRef = useRef(null);

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
        console.log(`✅ ${respuesta.data?.length || 0} mensajes cargados`);
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
      console.log('📨 Mensaje nuevo recibido via WebSocket');
      
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
          if (existe) return prev;
          
          // Notificación
          if (emisorId !== usuarioActualId) {
            const notificacion = mensajeNuevo.tipoMensaje === 'imagen' 
              ? '🖼️ Imagen'
              : mensajeNuevo.tipoMensaje === 'archivo'
              ? '📎 Archivo'
              : mensajeNuevo.mensajeCifrado.substring(0, 50);
            
            toast.info(`💬 ${chat.nombreUsuario}: ${notificacion}`, {
              position: "top-right",
              autoClose: 3000,
            });
          }
          
          return [...prev, mensajeNuevo];
        });
      }
    });
  }, [usuarioActual, chat.id, chat.nombreUsuario]);

  // Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Manejar selección de archivo
  const manejarSeleccionArchivo = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setArchivoSeleccionado(archivo);
    toast.info(`Archivo seleccionado: ${archivo.name}`);
  };

  // Cancelar archivo seleccionado
  const cancelarArchivo = () => {
    setArchivoSeleccionado(null);
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = '';
    }
  };

  // Convertir archivo a Base64
  const archivoABase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Enviar mensaje de texto
  const enviarTexto = () => {
    if (!texto.trim()) return;

    const mensaje = {
      emisorId: String(usuarioActual.id),
      receptorId: String(chat.id),
      mensajeCifrado: texto.trim(),
      tipoMensaje: 'texto'
    };

    console.log('📤 Enviando mensaje de texto');
    
    const enviado = enviarMensajeWebSocket(mensaje);
    
    if (enviado) {
      setTexto('');
    } else {
      toast.error('Error al enviar el mensaje');
    }
  };

  // Enviar archivo
  const enviarArchivo = async () => {
    if (!archivoSeleccionado) return;

    try {
      console.log('📤 Enviando archivo:', archivoSeleccionado.name);
      
      // Convertir a Base64
      const base64 = await archivoABase64(archivoSeleccionado);
      
      // Determinar tipo de mensaje
      const tipoMensaje = archivoSeleccionado.type.startsWith('image/') ? 'imagen' : 'archivo';
      
      const mensaje = {
        emisorId: String(usuarioActual.id),
        receptorId: String(chat.id),
        tipoMensaje: tipoMensaje,
        archivoBase64: base64,
        nombreArchivo: archivoSeleccionado.name,
        tipoArchivo: archivoSeleccionado.type,
        tamanoArchivo: archivoSeleccionado.size,
        mensajeCifrado: texto.trim() || `Envió un ${tipoMensaje}`
      };

      const enviado = enviarMensajeWebSocket(mensaje);
      
      if (enviado) {
        toast.success(`${tipoMensaje === 'imagen' ? 'Imagen' : 'Archivo'} enviado`);
        cancelarArchivo();
        setTexto('');
      } else {
        toast.error('Error al enviar el archivo');
      }
    } catch (err) {
      console.error('Error al enviar archivo:', err);
      toast.error('Error al procesar el archivo');
    }
  };

  // Enviar (texto o archivo)
  const enviar = () => {
    if (archivoSeleccionado) {
      enviarArchivo();
    } else {
      enviarTexto();
    }
  };

  const manejarTecla = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !archivoSeleccionado) {
      e.preventDefault();
      enviar();
    }
  };

  // Descargar archivo
  const descargarArchivo = (mensaje) => {
    const link = document.createElement('a');
    link.href = mensaje.archivoBase64;
    link.download = mensaje.nombreArchivo;
    link.click();
  };

  if (!usuarioActual || !chat) {
    return <div>Selecciona un chat para comenzar</div>;
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>
            <FaLock style={{ color: '#28a745', fontSize: '18px', marginRight: '8px' }} />
            Chat con {chat.nombreUsuario}
          </h3>
          <div className="chat-ids">
            💬 Mensajes, imágenes y archivos
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
          <div className="chat-mensajes-cargando">Cargando mensajes...</div>
        ) : error ? (
          <div className="chat-mensajes-error">{error}</div>
        ) : mensajes.length === 0 ? (
          <div className="chat-mensajes-vacio">No hay mensajes. ¡Envía el primero!</div>
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
                    {esMio ? 'Tú' : chat.nombreUsuario} <FaLock style={{ fontSize: '10px' }} />
                  </div>
                  
                  {/* Contenido según tipo */}
                  {m.tipoMensaje === 'imagen' && m.archivoBase64 ? (
                    <div className="mensaje-imagen-container">
                      <img 
                        src={m.archivoBase64} 
                        alt={m.nombreArchivo}
                        style={{
                          maxWidth: '300px',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(m.archivoBase64, '_blank')}
                      />
                      {m.mensajeCifrado && m.mensajeCifrado !== 'Envió un imagen' && (
                        <div className="mensaje-contenido" style={{ marginTop: '8px' }}>
                          {m.mensajeCifrado}
                        </div>
                      )}
                    </div>
                  ) : m.tipoMensaje === 'archivo' && m.archivoBase64 ? (
                    <div className="mensaje-archivo-container">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '8px'
                      }}>
                        <FaPaperclip size={20} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{m.nombreArchivo}</div>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>
                            {(m.tamanoArchivo / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <button
                          onClick={() => descargarArchivo(m)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'inherit'
                          }}
                        >
                          <FaDownload size={18} />
                        </button>
                      </div>
                      {m.mensajeCifrado && m.mensajeCifrado !== 'Envió un archivo' && (
                        <div className="mensaje-contenido" style={{ marginTop: '8px' }}>
                          {m.mensajeCifrado}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mensaje-contenido">{m.mensajeCifrado}</div>
                  )}
                  
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

      {/* Preview de archivo seleccionado */}
      {archivoSeleccionado && (
        <div style={{
          padding: '10px',
          background: 'var(--header)',
          borderTop: '1px solid var(--borde)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaPaperclip />
          <span style={{ flex: 1 }}>{archivoSeleccionado.name}</span>
          <button onClick={cancelarArchivo} style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            ✕ Cancelar
          </button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-container">
        <input 
          type="file"
          ref={inputArchivoRef}
          onChange={manejarSeleccionArchivo}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />
        
        {/* ✅ Botón de adjuntar archivo sin estilos inline adicionales */}
        <button 
          onClick={() => inputArchivoRef.current?.click()}
          title="Adjuntar archivo o imagen"
        >
          <FaPaperclip />
        </button>
        
        <input 
          type="text"
          value={texto} 
          onChange={e => setTexto(e.target.value)}
          onKeyPress={manejarTecla}
          placeholder={archivoSeleccionado ? "Mensaje opcional..." : "Escribe un mensaje..."}
        />
        
        {/* ✅ Botón de enviar sin estilos inline adicionales */}
        <button 
          onClick={enviar}
          disabled={!texto.trim() && !archivoSeleccionado}
        >
          <FaPaperPlane /> Enviar
        </button>
      </div>
    </div>
  );
}