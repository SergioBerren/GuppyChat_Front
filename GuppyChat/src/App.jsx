import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ContextoAuth } from './login/AuthProvider';
import { useContext } from 'react';

// Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Rutas públicas
import PaginaLogin from './login/PaginaLogin';
import FormularioRegistro from './login/FormularioRegistro';
import TerminosYCondiciones from './paginas/TerminosYCondiciones';

// Rutas privadas
import PaginaChats from './paginas/PaginaChats';
import PaginaGrupos from './paginas/PaginaGrupos';
import ChatGrupal from './paginas/ChatGrupal';
import Cuenta from './paginas/Cuenta';

// Componentes globales
import Header from './componentes/Header';
import FooterPublico from './componentes/FooterPublico';
import FooterPrivado from './componentes/FooterPrivado';

// Estilos globales
import './estilos/estiloGlobal.css';

function App() {
  return (
    <AuthProvider>
      <Router>

        {/* 🔔 Toastify */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />

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
        {/* 🟦 Rutas públicas */}
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/registro" element={<FormularioRegistro />} />
        <Route path="/terminosycondiciones" element={<TerminosYCondiciones />} />

        {/* 🟥 Rutas privadas */}
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

        {/* Redirección global */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>

      {/* Footer cambia según sesión */}
      {usuario ? <FooterPrivado /> : <FooterPublico />}
    </>
  );
}

// 🔐 Rutas privadas
const RutaPrivada = ({ children }) => {
  const { usuario } = ContextoAuth._currentValue;
  return usuario ? children : <Navigate to="/login" />;
};

export default App;
