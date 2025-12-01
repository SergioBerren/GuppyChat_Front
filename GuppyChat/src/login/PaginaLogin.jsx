import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContextoAuth } from './AuthProvider';
import '../estilos/estiloLogin.css';
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';

export default function PaginaLogin() {
  const { login } = useContext(ContextoAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/chats');
    } catch (err) {
      setError('Error en inicio de sesión');
      console.error(err);
    }
  };

  const irARegistro = () => navigate('/registro');

  return (
    <div className="contenedorLogin">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <div>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div>{error}</div>}
        <div>
          <button type="submit"><FaSignInAlt /> Iniciar sesión</button>
          <button type="button" onClick={irARegistro}><FaUserPlus /> Crear cuenta</button>
        </div>
      </form>
    </div>
  );
}
