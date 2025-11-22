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
import '../estilos/estiloChat.css';

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

    if (formValues) {
      try {
        const respuesta = await agregarContacto(
          String(usuario.id),
          formValues.correo,
          formValues.nombre
        );
        
        Swal.fire({
          icon: 'success',
          title: '¡Contacto agregado!',
          text: 'Se ha enviado una solicitud de chat automáticamente.',
          timer: 2000
        });
        
        cargarDatos();
      } catch (error) {
        console.error('Error al agregar contacto:', error);
        const mensaje = error.response?.data?.error || 'No se pudo agregar el contacto';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensaje
        });
      }
    }
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
          correo: contacto.correo
        };
        setSeleccionado(usuarioChat);
      } else {
        if (razon === 'bloqueado') {
          Swal.fire({
            icon: 'error',
            title: 'Usuario bloqueado',
            text: 'No puedes chatear con este usuario porque existe un bloqueo.',
          });
        } else if (razon === 'pendiente') {
          Swal.fire({
            icon: 'info',
            title: 'Solicitud pendiente',
            text: 'Espera a que el usuario acepte tu solicitud.',
          });
        }
      }
    } catch (error) {
      console.error('Error al seleccionar contacto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo verificar el estado del chat.'
      });
    }
  };

  const manejarAceptarSolicitud = async (solicitud) => {
    try {
      await aceptarSolicitud(solicitud.id);
      Swal.fire({
        icon: 'success',
        title: '¡Solicitud aceptada!',
        text: 'Ahora puedes chatear con este usuario.',
        timer: 2000
      });
      cargarDatos();
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo aceptar la solicitud.'
      });
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
        Swal.fire({
          icon: 'success',
          title: 'Solicitud rechazada',
          text: 'El usuario ha sido bloqueado.',
          timer: 2000
        });
        cargarDatos();
      } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo rechazar la solicitud.'
        });
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
        Swal.fire({
          icon: 'success',
          title: 'Usuario bloqueado',
          timer: 2000
        });
        setSeleccionado(null);
        cargarDatos();
      } catch (error) {
        console.error('Error al bloquear:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo bloquear al usuario.'
        });
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
        Swal.fire({
          icon: 'success',
          title: 'Usuario desbloqueado',
          timer: 2000
        });
        cargarDatos();
      } catch (error) {
        console.error('Error al desbloquear:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo desbloquear al usuario.'
        });
      }
    }
  };

  const obtenerNombreUsuario = (usuarioId) => {
    const u = usuarios.find(usr => String(usr.id) === String(usuarioId));
    return u ? u.nombreUsuario : 'Usuario';
  };

  if (!usuario) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '320px', 
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        {/* Header del sidebar */}
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Chats</h3>
          
          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => setMostrarSolicitudes(!mostrarSolicitudes)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: mostrarSolicitudes ? '#007bff' : '#e9ecef',
                color: mostrarSolicitudes ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '11px',
                position: 'relative'
              }}
            >
              Solicitudes
              {solicitudesPendientes.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px'
                }}>
                  {solicitudesPendientes.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setMostrarBloqueados(!mostrarBloqueados)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: mostrarBloqueados ? '#dc3545' : '#e9ecef',
                color: mostrarBloqueados ? 'white' : 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Bloqueados
            </button>
            
            <button
              onClick={manejarEnviarMensaje}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              + Mensaje
            </button>
          </div>
          
          {/* Barra de búsqueda */}
          <input
            type="text"
            placeholder="Buscar contacto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Lista de contenido */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {mostrarSolicitudes ? (
            // Mostrar solicitudes pendientes
            <div style={{ padding: '10px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                Solicitudes pendientes
              </h4>
              {solicitudesPendientes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
                  No tienes solicitudes pendientes
                </p>
              ) : (
                solicitudesPendientes.map(sol => (
                  <div key={sol.id} style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      {obtenerNombreUsuario(sol.emisorId)}
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => manejarAceptarSolicitud(sol)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => manejarRechazarSolicitud(sol)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : mostrarBloqueados ? (
            // Mostrar usuarios bloqueados
            <div style={{ padding: '10px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                Usuarios bloqueados
              </h4>
              {usuariosBloqueados.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
                  No tienes usuarios bloqueados
                </p>
              ) : (
                usuariosBloqueados.map(bloqueo => (
                  <div key={bloqueo.id} style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {obtenerNombreUsuario(bloqueo.bloqueadoId)}
                    </span>
                    <button
                      onClick={() => manejarDesbloquear(bloqueo)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Desbloquear
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Mostrar lista de contactos
            <div>
              {contactosFiltrados.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  {busqueda ? 'No se encontraron contactos' : 'No tienes contactos. Agrega uno con el botón "+ Mensaje"'}
                </div>
              ) : (
                contactosFiltrados.map(contacto => (
                  <div
                    key={contacto.id}
                    onClick={() => manejarSeleccionContacto(contacto)}
                    style={{
                      padding: '15px 20px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      backgroundColor: seleccionado?.id === contacto.contactoId ? '#e7f3ff' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (seleccionado?.id !== contacto.contactoId) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (seleccionado?.id !== contacto.contactoId) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '500' }}>{contacto.nombrePersonalizado}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{contacto.correo}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Área del chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {seleccionado ? (
          <ChatIndividual 
            chat={seleccionado} 
            usuarioActual={usuario} 
            onBloquear={() => manejarBloquear(seleccionado)}
          />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '18px'
          }}>
            Selecciona un contacto para comenzar a chatear
          </div>
        )}
      </div>
    </div>
  );
}