import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContextoAuth } from '../login/AuthProvider.jsx';
import api from '../servicios/api.js';
import { eliminarCuenta } from '../servicios/servicioAuth.js';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import '../estilos/estiloCuenta.css';
import '../estilos/estiloButtons.css';
import '../estilos/estiloInputs.css';

import { 
  FaEdit, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon, 
  FaSave, 
  FaTimes,
  FaKey,
  FaFileContract,
  FaTrash
} from 'react-icons/fa';

export default function Cuenta() {
  const { usuario, actualizarUsuarioLocal, cerrarSesion } = useContext(ContextoAuth);
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ nombre: '', apellido: '', nombreUsuario: '' });
  const [editando, setEditando] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(false);
  
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNueva: '',
    passwordNuevaConfirm: ''
  });

  useEffect(() => {
    if (usuario) {
      setDatos({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        nombreUsuario: usuario.nombreUsuario || ''
      });

      const modoOscuroUsuario = usuario.modoOscuro === true || usuario.modoOscuro === "true";
      setModoOscuro(modoOscuroUsuario);
      document.body.classList.toggle('dark-mode', modoOscuroUsuario);
    }
  }, [usuario]);

  const handleChange = (e) => {
    setDatos(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleActualizar = async (e) => {
    e.preventDefault();

    if (!datos.nombreUsuario.trim() || !datos.nombre.trim() || !datos.apellido.trim()) {
      toast.error('El nombre de usuario, nombre y apellido son obligatorios');
      return;
    }

    try {
      const cambios = {};
      if (datos.nombre !== usuario.nombre) cambios.nombre = datos.nombre.trim();
      if (datos.apellido !== usuario.apellido) cambios.apellido = datos.apellido.trim();
      if (datos.nombreUsuario !== usuario.nombreUsuario) cambios.nombreUsuario = datos.nombreUsuario.trim();

      if (Object.keys(cambios).length === 0) {
        toast.info('No hay cambios para actualizar');
        return;
      }

      const response = await api.patch(`/usuarios/${usuario.id}`, cambios);
      actualizarUsuarioLocal(response.data);
      toast.success('¡Cuenta actualizada correctamente!');
      setEditando(false);

    } catch (err) {
      console.error('❌ Error al actualizar:', err);
      toast.error(err.response?.data?.error || 'Error al actualizar los datos');
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (!passwordData.passwordActual || !passwordData.passwordNueva || !passwordData.passwordNuevaConfirm) {
      toast.error('Debes completar todos los campos');
      return;
    }
    if (passwordData.passwordNueva !== passwordData.passwordNuevaConfirm) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwordData.passwordNueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await api.post('/api/auth/cambiar-password', {
        correo: usuario.correo,
        passwordActual: passwordData.passwordActual,
        passwordNueva: passwordData.passwordNueva
      });
      toast.success('¡Contraseña cambiada exitosamente!');
      setMostrarCambiarPassword(false);
      setPasswordData({
        passwordActual: '',
        passwordNueva: '',
        passwordNuevaConfirm: ''
      });
    } catch (err) {
      console.error('❌ Error al cambiar contraseña:', err);
      toast.error(err.response?.data?.error || 'Error al cambiar la contraseña');
    }
  };

  const handleEliminarCuenta = async () => {
    const resultado = await Swal.fire({
      title: '⚠️ ¿Eliminar cuenta permanentemente?',
      html: `
        <div style="text-align: left; padding: 0 20px;">
          <p style="margin-bottom: 15px; font-weight: bold;">Esta acción es IRREVERSIBLE y eliminará:</p>
          <ul style="margin-left: 20px; line-height: 1.8;">
            <li>Tu perfil completo</li>
            <li>Todos tus chats y mensajes</li>
            <li>Tus contactos y solicitudes</li>
            <li>Tus bloqueos</li>
          </ul>
          <p style="margin-top: 15px; color: #d33; font-weight: bold;">
            No podrás recuperar esta información
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar mi cuenta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true
    });

    if (!resultado.isConfirmed) return;

    const { value: password } = await Swal.fire({
      title: 'Confirma tu contraseña',
      input: 'password',
      inputLabel: 'Para confirmar la eliminación, ingresa tu contraseña:',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Eliminar cuenta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar tu contraseña';
        }
      }
    });

    if (!password) return;

    try {
      await eliminarCuenta(usuario.correo, password);
      
      Swal.fire({
        icon: 'success',
        title: 'Cuenta eliminada',
        text: 'Tu cuenta ha sido eliminada permanentemente',
        timer: 2000,
        showConfirmButton: false
      });

      setTimeout(() => {
        cerrarSesion();
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('❌ Error al eliminar cuenta:', err);
      const mensaje = err.response?.data?.error || 'Error al eliminar la cuenta';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje
      });
    }
  };

  const toggleModo = async () => {
    const nuevoModo = !modoOscuro;
    setModoOscuro(nuevoModo);
    document.body.classList.toggle('dark-mode', nuevoModo);

    try {
      const response = await api.patch(`/usuarios/${usuario.id}`, {
        modoOscuro: nuevoModo
      });
      actualizarUsuarioLocal(response.data);
    } catch (err) {
      console.error('❌ Error al guardar modo oscuro:', err);
      toast.error('No se pudo guardar el modo oscuro');
    }
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="cuenta-container">
      <h2>Mi Cuenta</h2>

      <div className="cuenta-info">
        <p><strong>Nombre de usuario:</strong> {usuario.nombreUsuario}</p>
        <p><strong>Nombre:</strong> {usuario.nombre || 'No especificado'}</p>
        <p><strong>Apellido:</strong> {usuario.apellido || 'No especificado'}</p>
        <p><strong>Email:</strong> {usuario.correo}</p>
      </div>

      <button onClick={() => navigate('/terminosycondiciones')} className="boton-terminos">
        <FaFileContract /> Términos y Condiciones
      </button>

      {!editando && (
        <button onClick={() => setEditando(true)}>
          <FaEdit /> Modificar datos
        </button>
      )}

      {editando && (
        <form onSubmit={handleActualizar} className="formulario-edicion">
          <input 
            name="nombreUsuario" 
            value={datos.nombreUsuario} 
            onChange={handleChange} 
            placeholder="Nombre de usuario"
          />
          <input 
            name="nombre" 
            value={datos.nombre} 
            onChange={handleChange} 
            placeholder="Nombre"
          />
          <input 
            name="apellido" 
            value={datos.apellido} 
            onChange={handleChange} 
            placeholder="Apellido"
          />
          
          <button type="submit">
            <FaSave /> Guardar cambios
          </button>
          <button type="button" onClick={() => setEditando(false)}>
            <FaTimes /> Cancelar
          </button>
        </form>
      )}

      {!mostrarCambiarPassword && (
        <button onClick={() => setMostrarCambiarPassword(true)}>
          <FaKey /> Cambiar contraseña
        </button>
      )}

      {mostrarCambiarPassword && (
        <form onSubmit={handleCambiarPassword} className="formulario-edicion">
          <input 
            type="password" 
            name="passwordActual" 
            value={passwordData.passwordActual} 
            onChange={handlePasswordChange} 
            placeholder="Contraseña actual"
          />
          <input 
            type="password" 
            name="passwordNueva" 
            value={passwordData.passwordNueva} 
            onChange={handlePasswordChange} 
            placeholder="Nueva contraseña"
          />
          <input 
            type="password" 
            name="passwordNuevaConfirm" 
            value={passwordData.passwordNuevaConfirm} 
            onChange={handlePasswordChange} 
            placeholder="Confirmar nueva contraseña"
          />
          
          <button type="submit">
            <FaSave /> Cambiar contraseña
          </button>
          <button type="button" onClick={() => setMostrarCambiarPassword(false)}>
            <FaTimes /> Cancelar
          </button>
        </form>
      )}

      {/* Botón de modo oscuro */}
      <button onClick={toggleModo}>
        {modoOscuro ? (
          <>
            <FaSun /> Modo claro
          </>
        ) : (
          <>
            <FaMoon /> Modo oscuro
          </>
        )}
      </button>

      {/* Botón de cerrar sesión */}
      <button onClick={handleCerrarSesion}>
        <FaSignOutAlt /> Cerrar sesión
      </button>

      {/* ✅ Botón de eliminar cuenta - AHORA SEPARADO */}
      <button onClick={handleEliminarCuenta} className="boton-eliminar-cuenta">
        <FaTrash /> Eliminar cuenta
      </button>
    </div>
  );
}