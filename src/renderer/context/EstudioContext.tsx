import React, { createContext, useContext, useEffect, useState } from 'react';

interface EstudioContextValue {
  estudioId: string | null;
  nombreEstudio: string;
  loading: boolean;
  refresh: () => void;
}

const EstudioContext = createContext<EstudioContextValue>({
  estudioId: null,
  nombreEstudio: '',
  loading: true,
  refresh: () => {},
});

export function EstudioProvider({ children }: { children: React.ReactNode }) {
  const [estudioId, setEstudioId] = useState<string | null>(null);
  const [nombreEstudio, setNombreEstudio] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    window.electronAPI?.estudio?.obtenerOCrearDefault?.()
      .then((r: unknown) => {
        if (
          r &&
          typeof r === 'object' &&
          'id' in r &&
          'nombre' in r &&
          !('canceled' in r)
        ) {
          setEstudioId((r as { id: string; nombre: string }).id);
          setNombreEstudio((r as { id: string; nombre: string }).nombre);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <EstudioContext.Provider value={{ estudioId, nombreEstudio, loading, refresh }}>
      {children}
    </EstudioContext.Provider>
  );
}

export function useEstudio() {
  return useContext(EstudioContext);
}
