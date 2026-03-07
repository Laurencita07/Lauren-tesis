import React from 'react';
import { ROUTES, ROUTE_LABELS, type RouteId } from '../../../shared/constants';

// Iconos: base de datos (3 óvalos apilados) para Pesquisaje; grupo de 3 personas para Sujetos
const icons: Record<RouteId, string> = {
  [ROUTES.PESQUISAJE]: 'M12 3C7.58 3 4 4.69 4 7s3.58 4 8 4 8-1.69 8-4-3.58-4-8-4zM4 9c0 2.21 3.58 4 8 4s8-1.79 8-4v2c0 2.21-3.58 4-8 4s-8-1.79-8-4V9zm0 6v2c0 2.21 3.58 4 8 4s8-1.79 8-4v-2c0 2.21-3.58 4-8 4s-8-1.79-8-4z',
  [ROUTES.SUJETOS]: 'M12 12c1.65 0 3-1.35 3-3s-1.35-3-3-3-3 1.35-3 3 1.35 3 3 3zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4zm5.5 0c.25 0 .5.04.75.09.64.14 1.23.41 1.72.81.5.41.88.93 1.13 1.5.25.57.38 1.21.38 1.87v1h4v-1c0-1.5-.72-2.83-1.83-3.71-.57-.45-1.23-.79-1.94-1.01-.36-.11-.74-.17-1.13-.17-1.3 0-2.49.53-3.33 1.39-.84.86-1.33 2.01-1.33 3.22v.39zm-11 0c.25 0 .5.04.75.09.64.14 1.23.41 1.72.81.5.41.88.93 1.13 1.5.25.57.38 1.21.38 1.87v1h4v-1c0-1.5-.72-2.83-1.83-3.71-.57-.45-1.23-.79-1.94-1.01-.36-.11-.74-.17-1.13-.17-1.3 0-2.49.53-3.33 1.39-.84.86-1.33 2.01-1.33 3.22v.39z',
  [ROUTES.IMPORTAR_CRD]: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
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
