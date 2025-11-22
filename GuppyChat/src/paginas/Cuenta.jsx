import React, { useEffect, useState, useContext } from 'react';
import { ContextoAuth } from '../login/AuthProvider.jsx';
import api from '../servicios/api.js';
import Swal from 'sweetalert2';
import '../estilos/estiloCuenta.css';

// Iconos de react-icons
import { 
  FaEdit, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon, 
  FaSave, 
  FaTimes 
} from 'react-icons/fa';

export default function Cuenta() {
  const { usuario, actualizarUsuarioLocal, cerrarSesion } = useContext(ContextoAuth);
  const [datos, setDatos] = useState({ nombre: '', apellido: '' });
  const [editando, setEditando] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(false);

  // Cargar datos del usuario
  useEffect(() => {
    if (usuario) {
      setDatos({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || ''
      });
      
      // Aplicar modo oscuro del usuario
      const modoOscuroUsuario = usuario.modoOscuro || false;
      setModoOscuro(modoOscuroUsuario);
      document.body.classList.toggle('dark-mode', modoOscuroUsuario);
    }
  }, [usuario]);

  // Cambios de inputs
  const handleChange = (e) => {
    setDatos(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Actualizar datos
  const handleActualizar = async (e) => {
    e.preventDefault();
    try {
      const cambios = {};
      
      // Comparar solo nombre y apellido
      if (datos.nombre !== (usuario.nombre || '')) {
        cambios.nombre = datos.nombre;
        console.log(`Cambios: ${cambios.nombre}, datos: ${datos.nombre}, usuario: ${usuario.nombre}`);
      }
      if (datos.apellido !== (usuario.apellido || '')) {
        cambios.apellido = datos.apellido;
        console.log(`Cambios: ${cambios.apellido}, datos: ${datos.apellido} usuario: ${usuario.apellido}`);
      } else{
        cambios.apellido = null; // Permitir borrar apellido        
      }

      if (Object.keys(cambios).length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin cambios',
          text: 'No hay datos modificados para actualizar',
        });
        return;
      }

      // Corregir la URL - quitar duplicado /api
      // const response = await api.patch(`/usuarios/api/usuarios/${usuario.id}`, cambios);
      // const response = await api.patch(`/usuarios/${usuario.id}`, cambios);
      const response = await api.patch(`/api/usuarios/${usuario.id}`, cambios);

      actualizarUsuarioLocal(response.data);

      Swal.fire({
        icon: 'success',
        title: '¡Cuenta actualizada!',
        text: 'Tus datos se actualizaron correctamente',
        timer: 2000,
        showConfirmButton: false,
      });

      setEditando(false);

    } catch (err) {
      console.error(err);
      console.log("TOKEN FRONT:", localStorage.getItem("token"));
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: err.response?.data?.error || 'Algo salió mal',
      });
    }
  };

  // Toggle modo oscuro
  const toggleModo = () => {
    setModoOscuro(!modoOscuro);
    document.body.classList.toggle('dark-mode', !modoOscuro);
  };

  // Cerrar sesión
  const handleCerrarSesion = () => {
    cerrarSesion();
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Mi Cuenta</h2>

      <p><strong>Nombre de usuario:</strong> {usuario.nombreUsuario}</p>
      <p><strong>Nombre:</strong> {usuario.nombre || 'No especificado'}</p>
      <p><strong>Apellido:</strong> {usuario.apellido || 'No especificado'}</p>
      <p><strong>Email:</strong> {usuario.correo}</p>

      <button onClick={() => setEditando(!editando)}>
        {editando 
          ? (<><FaTimes style={{ marginRight: '6px' }} /> Cancelar</>) 
          : (<><FaEdit style={{ marginRight: '6px' }} /> Modificar datos</>)
        }
      </button>

      {editando && (
        <form onSubmit={handleActualizar} style={{ marginTop: '10px' }}>
          <input
            name="nombre"
            value={datos.nombre}
            onChange={handleChange}
            placeholder="Nombre"
          /><br />
          <input
            name="apellido"
            value={datos.apellido}
            onChange={handleChange}
            placeholder="Apellido"
          /><br />
          <button type="submit">
            <FaSave style={{ marginRight: '6px' }} /> Guardar cambios
          </button>
        </form>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={toggleModo}>
          {modoOscuro 
            ? (<><FaSun style={{ marginRight: '6px' }} /> Modo claro</>) 
            : (<><FaMoon style={{ marginRight: '6px' }} /> Modo oscuro</>)
          }
        </button>

        <button onClick={handleCerrarSesion} style={{ marginLeft: '10px' }}>
          <FaSignOutAlt style={{ marginRight: '6px' }} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}