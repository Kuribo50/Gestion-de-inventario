import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Al montar el componente, se realiza una redirección automática al Dashboard.
    router.replace('/dashboard');
  }, [router]); // Se depende de 'router' para asegurar que esté inicializado.

  return null; // No se renderiza nada en esta página, se podría mostrar un spinner o mensaje de "Cargando" mientras se realiza la redirección.
}
