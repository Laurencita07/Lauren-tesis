import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ROUTE_LABELS, type RouteId } from '../../../shared/constants';

interface LayoutProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  children: React.ReactNode;
  investigadorNombre?: string | null;
  onSalirInvestigador?: () => void;
}

export function Layout({ currentRoute, onNavigate, children, investigadorNombre, onSalirInvestigador }: LayoutProps) {
  const bannerTitle = ROUTE_LABELS[currentRoute as keyof typeof ROUTE_LABELS] ?? '';

  return (
    <div className="app-layout">
      <Header
        investigadorNombre={investigadorNombre ?? undefined}
        onSalirInvestigador={onSalirInvestigador}
        onNavigate={onNavigate}
      />
      <div className="app-body">
        <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
        <div className="app-content-folder">
          <main className="app-content">
            <div className="content-banner">{bannerTitle}</div>
            <div className="content-area">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
