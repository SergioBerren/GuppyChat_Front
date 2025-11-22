import '../estilos/estiloFooter.css';
import { useNavigate } from 'react-router-dom';

import { FaComments, FaUsers, FaUser } from 'react-icons/fa';

const FooterPrivado = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer-privado">
      <button onClick={() => navigate('/chats')}><FaComments /> Chat</button>
      <button onClick={() => navigate('/chats/grupos')}><FaUsers /> Grupos</button>
      <button onClick={() => navigate('/cuenta')}><FaUser /> Cuenta</button>
    </footer>
  );
};

export default FooterPrivado;