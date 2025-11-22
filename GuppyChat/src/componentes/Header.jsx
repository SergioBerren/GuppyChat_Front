import React from 'react';
import '../estilos/estiloHeader.css';
import logo from '../imagenes/logo-guppych.png'; // Importa la imagen

export default function Header() {
  return (
    <header className="header">
      <div className="logo-titulo">
        <img src={logo} alt="GuppyChat Logo" className="logo-header" />
        <h1 className="titulo-header">GuppyChat</h1>
      </div>
    </header>
  );
}
