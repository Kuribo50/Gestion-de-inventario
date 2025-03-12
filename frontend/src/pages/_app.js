// pages/_app.js
import Head from 'next/head'; 
import '../styles/globals.css'; 
import { Chart as ChartJS, registerables } from 'chart.js'; 
import { NextUIProvider } from '@nextui-org/react'; 
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { UserProvider } from '@/context/UserContext'; // Importar el UserProvider para contexto de usuario

// Registrar los elementos de Chart.js globalmente para su uso en la aplicación
ChartJS.register(...registerables);

function MyApp({ Component, pageProps }) {
  return (
    // Proveedor de NextUI para aplicar estilos y temas globalmente
    <NextUIProvider>
      {/* Proveedor de contexto de usuario para manejar autenticación y datos del usuario globalmente */}
      <UserProvider> 
        {/* Head se usa para definir elementos globales del documento HTML */}
        <Head>
          <title>Sistema Bodega</title> {/* Título predeterminado de la aplicación */}
          <link rel="icon" href="/favicon.ico" /> {/* Favicon para la aplicación */}
          <meta name="viewport" content="width=device-width, initial-scale=1" /> {/* Configuración de viewport para dispositivos móviles */}
          <meta charSet="utf-8" /> {/* Codificación de caracteres */}
        </Head>
        {/* Renderiza el componente de la página actual con sus props */}
        <Component {...pageProps} />
        {/* El ToastContainer puede colocarse aquí si se desea mostrar notificaciones globales */}
        <ToastContainer />
      </UserProvider>
    </NextUIProvider>
  );
}

export default MyApp;
