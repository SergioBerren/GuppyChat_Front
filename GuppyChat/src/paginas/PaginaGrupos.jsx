import React, { useEffect, useState } from 'react';
import { obtenerChats } from '../servicios/servicioChats';

export default function PaginaGrupos() {
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const resp = await obtenerChats();
        const soloGrupos = resp.data.filter(chat => chat.participantes && chat.participantes.length > 2);
        setGrupos(soloGrupos);
      } catch (err) {
        console.error('Error al cargar grupos:', err);
      }
    };
    cargarGrupos();
  }, []);

  return (
    <div>
      <h2>Grupos</h2>
      {grupos.length === 0 ? (
        <p>No hay grupos disponibles.</p>
      ) : (
        <ul>
          {grupos.map(grupo => (
            <li key={grupo.id}>
              {grupo.nombre} — {grupo.participantes.length} participantes
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}