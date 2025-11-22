import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContextoAuth } from './AuthProvider';
import {FaCheck, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../estilos/estiloRegistro.css';


export default function FormularioRegistro() {
  const { registrar } = useContext(ContextoAuth);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    try {
      await registrar({ nombre, apellido, email, password });

      // SweetAlert al registrar
      Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: `Bienvenido ${nombre} ${apellido}`,
        timer: 2000,
        showConfirmButton: false,
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      if(err = "Request failed with status code 400"){
        Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: err.message || 'El email ya está asociado a una cuenta',
      });
      } else {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: err.message || 'Algo salió mal',
      });
    }}
  };

const irALogin = () => navigate('/login');

  return (
    <div>
      <h2>Registro</h2>
      <form onSubmit={handleRegistro}>
        <input placeholder="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required />
        <input placeholder="Apellido" value={apellido} onChange={e=>setApellido(e.target.value)} required />
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit"><FaCheck />Registrarse</button>
        <button type="button" onClick={irALogin}><FaArrowLeft />Iniciar Sesión</button>
      </form>
    </div>
  );
}
