import '../estilos/estiloTerminosYCondiciones.css';


const TerminosYCondiciones = () => {
return (
<div className="terminos-container">
<h2 className="titulo-terminos">Términos y Condiciones</h2>
<p className="texto-terminos">
Bienvenido a nuestra aplicación de mensajería. Al usar esta aplicación, aceptas los siguientes términos:
</p>
<ul className="lista-terminos">
<li>No compartir contenido ilegal.</li>
<li>Respetar a otros usuarios.</li>
<li>La información enviada puede almacenarse en nuestro servidor para funcionamiento de la app.</li>
<li>No utilizar la aplicación para spam o publicidad no autorizada.</li>
</ul>
<p className="texto-terminos">
Estos términos pueden actualizarse periódicamente, por lo que recomendamos revisarlos con frecuencia.
</p>
</div>
);
};


{/* Botón para volver a Cuenta */}
<div className="volver-cuenta-container">
<a href="/cuenta" className="boton-volver-cuenta">Volver a mi cuenta</a>
</div>

export default TerminosYCondiciones;