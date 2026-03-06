import React, { useState, useCallback, useEffect } from 'react';
import { EstudioProvider } from './context/EstudioContext';
import { Layout } from './components/layout/Layout';
import { GestionarPesquisaje } from './pages/GestionarPesquisaje';
import { GestionarSujetos } from './pages/GestionarSujetos';
import { ImportarPlantillaCRD } from './pages/ImportarPlantillaCRD';
import { Sincronizacion } from './pages/Sincronizacion';
import { IdentificarInvestigador } from './pages/IdentificarInvestigador';
import { ROUTES, type RouteId } from '../shared/constants';

const PAGES: Record<RouteId, React.ReactNode> = {
  [ROUTES.PESQUISAJE]: <GestionarPesquisaje />,
  [ROUTES.SUJETOS]: <GestionarSujetos />,
  [ROUTES.IMPORTAR_CRD]: <ImportarPlantillaCRD />,
  [ROUTES.SINCRONIZACION]: <Sincronizacion />,
};

export function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteId>(ROUTES.IMPORTAR_CRD);
  const [investigador, setInvestigador] = useState<string | null>(null);

  const handleNavigate = useCallback((route: RouteId) => {
    setCurrentRoute(route);
  }, []);

  // Cargar nombre de investigador desde almacenamiento local
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('xavia-investigador-nombre');
      if (saved) setInvestigador(saved);
    } catch {
      // ignorar errores de localStorage
    }
  }, []);

  const handleIdentificarInvestigador = useCallback((nombre: string) => {
    setInvestigador(nombre);
    try {
      window.localStorage.setItem('xavia-investigador-nombre', nombre);
    } catch {
      // ignorar errores de localStorage
    }
  }, []);

  const handleSalirInvestigador = useCallback(() => {
    setInvestigador(null);
    try {
      window.localStorage.removeItem('xavia-investigador-nombre');
    } catch {
      // ignorar errores de localStorage
    }
  }, []);

  // Exponer navegación sencilla en window para que algunas pantallas (como ImportarPlantillaCRD)
  // puedan redirigir al usuario después de ciertas acciones (p. ej. abrir Gestionar Pesquisaje).
  useEffect(() => {
    (window as any).xaviaNavigate = (route: RouteId) => {
      setCurrentRoute(route);
    };
    return () => {
      if ((window as any).xaviaNavigate) {
        delete (window as any).xaviaNavigate;
      }
    };
  }, []);

  if (!investigador) {
    return <IdentificarInvestigador onIdentificar={handleIdentificarInvestigador} />;
  }

  return (
    <EstudioProvider>
      <Layout
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        investigadorNombre={investigador}
        onSalirInvestigador={handleSalirInvestigador}
      >
        {PAGES[currentRoute]}
      </Layout>
    </EstudioProvider>
  );
}
