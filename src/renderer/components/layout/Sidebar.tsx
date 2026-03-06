import React from 'react';
import { ROUTES, ROUTE_LABELS, type RouteId } from '../../../shared/constants';

const icons: Record<RouteId, string> = {
  [ROUTES.PESQUISAJE]: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  [ROUTES.SUJETOS]: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  [ROUTES.IMPORTAR_CRD]: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  [ROUTES.SINCRONIZACION]: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
};

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="app-sidebar__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

interface SidebarProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
}

export function Sidebar({ currentRoute, onNavigate }: SidebarProps) {
  const items = (Object.keys(ROUTE_LABELS) as RouteId[]).map((id) => ({
    id,
    label: ROUTE_LABELS[id],
    icon: icons[id],
  }));

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__header">Menú</div>
      <nav className="app-sidebar__nav" aria-label="Navegación principal">
        {items.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`app-sidebar__link ${currentRoute === id ? 'app-sidebar__link--active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <NavIcon d={icon} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
