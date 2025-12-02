import React, { useEffect, useState, useContext } from 'react';
import { obtenerUsuariosExcepto } from '../servicios/servicioUsuarios';
import { 
  enviarSolicitud, 
  aceptarSolicitud, 
  rechazarSolicitud, 
  obtenerSolicitudesPendientes,
  puedeChatear 
} from '../servicios/servicioSolicitudes';
import { bloquearUsuario, desbloquearUsuario, obtenerBloqueados } from '../servicios/servicioBloqueos';
import { agregarContacto, obtenerContactos, buscarContactos } from '../servicios/servicioContactos';
import ChatIndividual from './ChatIndividual';
import { ContextoAuth } from '../login/AuthProvider';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import '../estilos/estiloPaginaChats.css';

export default function PaginaChats() {
  const [usuarios, setUsuarios] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [contactosFiltrados, setContactosFiltrados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState([]);
  const [mostrarSolicitudes, setMostrarSolicitudes] = useState(false);
  const [mostrarBloqueados, setMostrarBloqueados] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { usuario } = useContext(ContextoAuth);

  useEffect(() => {
    if (usuario) {
      cargarDatos();
    }
  }, [usuario]);

  useEffect(() => {
    // Filtrar contactos en tiempo real
    if (busqueda.trim() === '') {
      setContactosFiltrados(contactos);
    } else {
      const filtrados = contactos.filter(c => 
        c.nombrePersonalizado.toLowerCase().includes(busqueda.toLowerCase())
      );
      setContactosFiltrados(filtrados);
    }
  }, [busqueda, contactos]);

  const cargarDatos = async () => {
    try {
      // Cargar usuarios (excepto el actual)
      const respUsuarios = await obtenerUsuariosExcepto(usuario.id);
      setUsuarios(respUsuarios.data);

      // Cargar contactos guardados
      const respContactos = await obtenerContactos(String(usuario.id));
      setContactos(respContactos.data);
      setContactosFiltrados(respContactos.data);

      // Cargar solicitudes pendientes
      const respSolicitudes = await obtenerSolicitudesPendientes(String(usuario.id));
      setSolicitudesPendientes(respSolicitudes.data);

      // Cargar usuarios bloqueados
      const respBloqueados = await obtenerBloqueados(String(usuario.id));
      setUsuariosBloqueados(respBloqueados.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const manejarEnviarMensaje = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Agregar nuevo contacto',
      html:
        '<input id="correo" class="swal2-input" placeholder="Correo del usuario">' +
        '<input id="nombre" class="swal2-input" placeholder="Nombre para guardar">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const correo = document.getElementById('correo').value;
        const nombre = document.getElementById('nombre').value;
        
        if (!correo || !nombre) {
          Swal.showValidationMessage('Por favor completa ambos campos');
          return false;
        }
        
        // Validar formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
          Swal.showValidationMessage('Por favor ingresa un correo válido');
          return false;
        }
        
        return { correo, nombre };
      }
    });

    // ✅ CORREGIDO: Solo agregar si el usuario confirmó (no canceló)
    if (formValues) {
      try {
        const respuesta = await agregarContacto(
          String(usuario.id),
          formValues.correo,
          formValues.nombre
        );
        
        toast.success('¡Contacto agregado! Se envió una solicitud automáticamente.');
        
        cargarDatos();
      } catch (error) {
        console.error('Error al agregar contacto:', error);
        const mensaje = error.response?.data?.error || 'No se pudo agregar el contacto';
        toast.error(mensaje);
      }
    }
    // Si formValues es undefined/null, significa que canceló - no hacemos nada
  };

  const manejarSeleccionContacto = async (contacto) => {
    try {
      // Verificar si puede chatear
      const resp = await puedeChatear(String(usuario.id), contacto.contactoId);
      const { puede, razon } = resp.data;

      if (puede) {
        // Crear objeto usuario para el chat
        const usuarioChat = {
          id: contacto.contactoId,
          nombreUsuario: contacto.nombrePersonalizado,
          correo: contacto.correo,
          clavePublica: contacto.clavePublica // Para cifrado E2EE
        };
        setSeleccionado(usuarioChat);
      } else {
        if (razon === 'bloqueado') {
          toast.error('No puedes chatear con este usuario porque existe un bloqueo.');
        } else if (razon === 'pendiente') {
          toast.info('Espera a que el usuario acepte tu solicitud.');
        }
      }
    } catch (error) {
      console.error('Error al seleccionar contacto:', error);
      toast.error('No se pudo verificar el estado del chat.');
    }
  };

  const manejarAceptarSolicitud = async (solicitud) => {
    try {
      await aceptarSolicitud(solicitud.id);
      toast.success('¡Solicitud aceptada! Ahora pueden chatear.');
      cargarDatos(); // Recargar para mostrar el nuevo contacto
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      toast.error('No se pudo aceptar la solicitud.');
    }
  };

  const manejarRechazarSolicitud = async (solicitud) => {
    const resultado = await Swal.fire({
      title: '¿Rechazar y bloquear?',
      text: 'Al rechazar la solicitud, el usuario será bloqueado automáticamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar y bloquear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });

    if (resultado.isConfirmed) {
      try {
        await rechazarSolicitud(solicitud.id);
        toast.success('Solicitud rechazada y usuario bloqueado.');
        cargarDatos();
      } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        toast.error('No se pudo rechazar la solicitud.');
      }
    }
  };

  const manejarBloquear = async (usuarioDestino) => {
    const resultado = await Swal.fire({
      title: '¿Bloquear usuario?',
      text: `¿Estás seguro de bloquear a ${usuarioDestino.nombreUsuario}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, bloquear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    });

    if (resultado.isConfirmed) {
      try {
        await bloquearUsuario(String(usuario.id), String(usuarioDestino.id));
        toast.success('Usuario bloqueado');
        setSeleccionado(null);
        cargarDatos();
      } catch (error) {
        console.error('Error al bloquear:', error);
        toast.error('No se pudo bloquear al usuario.');
      }
    }
  };

  const manejarDesbloquear = async (bloqueo) => {
    const resultado = await Swal.fire({
      title: '¿Desbloquear usuario?',
      text: 'Podrás recibir solicitudes de este usuario nuevamente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, desbloquear',
      cancelButtonText: 'Cancelar'
    });

    if (resultado.isConfirmed) {
      try {
        await desbloquearUsuario(String(usuario.id), bloqueo.bloqueadoId);
        toast.success('Usuario desbloqueado');
        cargarDatos();
      } catch (error) {
        console.error('Error al desbloquear:', error);
        toast.error('No se pudo desbloquear al usuario.');
      }
    }
  };

  // ✅ MEJORADO: Obtener información completa del usuario (nombre Y correo)
  const obtenerInfoUsuario = (usuarioId) => {
    const u = usuarios.find(usr => String(usr.id) === String(usuarioId));
    if (u) {
      return {
        nombre: u.nombreUsuario,
        correo: u.correo
      };
    }
    return {
      nombre: 'Usuario',
      correo: ''
    };
  };

  if (!usuario) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="pagina-chats">
      {/* Sidebar */}
      <div className="chats-sidebar">
        {/* Header del sidebar */}
        <div className="chats-sidebar-header">
          <h3>Chats</h3>
          
          {/* Botones de acción */}
          <div className="chats-botones-accion">
            <button
              onClick={() => setMostrarSolicitudes(!mostrarSolicitudes)}
              className={`btn-solicitudes ${mostrarSolicitudes ? 'activo' : ''}`}
            >
              Solicitudes
              {solicitudesPendientes.length > 0 && (
                <span className="badge-notificacion">
                  {solicitudesPendientes.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setMostrarBloqueados(!mostrarBloqueados)}
              className={`btn-bloqueados ${mostrarBloqueados ? 'activo' : ''}`}
            >
              Bloqueados
            </button>
            
            <button
              onClick={manejarEnviarMensaje}
              className="btn-nuevo-mensaje"
            >
              + Mensaje
            </button>
          </div>
          
          {/* Barra de búsqueda */}
          {!mostrarSolicitudes && !mostrarBloqueados && (
            <div className="chats-busqueda">
              <input
                type="text"
                placeholder="Buscar contacto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Lista de contenido */}
        <div className="chats-lista-contenido">
          {mostrarSolicitudes ? (
            // Mostrar solicitudes pendientes
            <div className="chats-lista-contenido-inner">
              <h4 className="chats-lista-titulo">Solicitudes pendientes</h4>
              {solicitudesPendientes.length === 0 ? (
                <p className="chats-lista-vacia">
                  No tienes solicitudes pendientes
                </p>
              ) : (
                solicitudesPendientes.map(sol => {
                  const infoUsuario = obtenerInfoUsuario(sol.emisorId);
                  return (
                    <div key={sol.id} className="chat-item solicitud-item">
                      <div className="solicitud-autor">
                        {infoUsuario.nombre}
                      </div>
                      {/* ✅ NUEVO: Mostrar el correo debajo */}
                      {infoUsuario.correo && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--texto)', 
                          opacity: 0.7,
                          marginBottom: '8px' 
                        }}>
                          {infoUsuario.correo}
                        </div>
                      )}
                      <div className="solicitud-botones">
                        <button
                          onClick={() => manejarAceptarSolicitud(sol)}
                          className="btn-aceptar"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => manejarRechazarSolicitud(sol)}
                          className="btn-rechazar"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : mostrarBloqueados ? (
            // Mostrar usuarios bloqueados
            <div className="chats-lista-contenido-inner">
              <h4 className="chats-lista-titulo">Usuarios bloqueados</h4>
              {usuariosBloqueados.length === 0 ? (
                <p className="chats-lista-vacia">
                  No tienes usuarios bloqueados
                </p>
              ) : (
                usuariosBloqueados.map(bloqueo => {
                  const infoUsuario = obtenerInfoUsuario(bloqueo.bloqueadoId);
                  return (
                    <div key={bloqueo.id} className="chat-item bloqueado-item">
                      <span className="bloqueado-nombre">
                        {infoUsuario.nombre}
                      </span>
                      <button
                        onClick={() => manejarDesbloquear(bloqueo)}
                        className="btn-desbloquear"
                      >
                        Desbloquear
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // Mostrar lista de contactos
            <div>
              {contactosFiltrados.length === 0 ? (
                <div className="chats-lista-vacia">
                  {busqueda ? 'No se encontraron contactos' : 'No tienes contactos. Agrega uno con el botón "+ Mensaje"'}
                </div>
              ) : (
                contactosFiltrados.map(contacto => (
                  <div
                    key={contacto.id}
                    onClick={() => manejarSeleccionContacto(contacto)}
                    className={`contacto-item ${seleccionado?.id === contacto.contactoId ? 'seleccionado' : ''}`}
                  >
                    <div className="contacto-nombre">{contacto.nombrePersonalizado}</div>
                    <div className="contacto-correo">{contacto.correo}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Área del chat */}
      <div className="chats-area-chat">
        {seleccionado ? (
          <ChatIndividual 
            chat={seleccionado} 
            usuarioActual={usuario} 
            onBloquear={() => manejarBloquear(seleccionado)}
          />
        ) : (
          <div className="chats-sin-seleccion">
            Selecciona un contacto para comenzar a chatear
          </div>
        )}
      </div>
    </div>
  );
}