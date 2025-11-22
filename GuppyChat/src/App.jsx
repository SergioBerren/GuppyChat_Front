import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ContextoAuth } from './login/AuthProvider';

import PaginaLogin from './login/PaginaLogin';
import FormularioRegistro from './login/FormularioRegistro';
import PaginaChats from './paginas/PaginaChats';
import ChatGrupal from './paginas/ChatGrupal';
import Cuenta from './paginas/Cuenta';
import TerminosYCondiciones from './paginas/TerminosYCondiciones';
import PaginaGrupos from './paginas/PaginaGrupos';

import Header from './componentes/Header';
import FooterPublico from './componentes/FooterPublico';
import FooterPrivado from './componentes/FooterPrivado';

import { useContext } from 'react';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ContenidoApp />
      </Router>
    </AuthProvider>
  );
}

function ContenidoApp() {
  const { usuario } = useContext(ContextoAuth);

  return (
    <>
      {/* Header solo si hay sesión */}
      {usuario && <Header />}

      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/registro" element={<FormularioRegistro />} />
        <Route path="/terminosycondiciones" element={<TerminosYCondiciones />} />

        {/* Rutas privadas */}
        <Route
          path="/chats"
          element={
            <RutaPrivada>
              <PaginaChats />
            </RutaPrivada>
          }
        />
        <Route
          path="/chats/grupos"
          element={
            <RutaPrivada>
              <PaginaGrupos />
            </RutaPrivada>
          }
        />
        <Route
          path="/chats/grupal/:id"
          element={
            <RutaPrivada>
              <ChatGrupal />
            </RutaPrivada>
          }
        />
        <Route
          path="/cuenta"
          element={
            <RutaPrivada>
              <Cuenta />
            </RutaPrivada>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>

      {/* Footer: cambia según si hay sesión o no */}
      {usuario ? <FooterPrivado /> : <FooterPublico />}
    </>
  );
}

// Proteger rutas privadas
const RutaPrivada = ({ children }) => {
  const { usuario } = ContextoAuth._currentValue;
  return usuario ? children : <Navigate to="/login" />;
};

export default App;
