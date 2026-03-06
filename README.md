# XAVIA SIDEC Offline – Módulo de inclusión masiva

App de escritorio (Electron + React) para gestionar sujetos en ensayos clínicos. Es el módulo de inclusión masiva de XAVIA SIDEC y funciona todo en local con SQLite, sin internet.

Qué hace: pesquisaje, gestión de sujetos, importar plantillas CRD desde Excel, formularios dinámicos y guardar todo local para luego sincronizar cuando toque.

---

## Qué necesitas

- **Node 20** (LTS). Con Node 24 u otras versiones raras a veces Electron no instala bien y sale el error de "Electron failed to install correctly". Mejor quedarse en v20.
- npm (viene con Node).
- En **Windows**, para compilar `better-sqlite3`: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) con "Desktop development with C++".

**Tip:** Si puedes, pon el proyecto en una ruta sin emojis ni caracteres raros (ej. `C:\proyectos\xavia-sidec`). En rutas tipo `Desktop\Nombre💕\...` a veces los módulos nativos dan guerra.

Para ver tu versión de Node:

```bash
node -v
```

Si no es 20.x, instala Node 20 LTS desde [nodejs.org](https://nodejs.org/) o con nvm-windows.

---

## Cómo arrancar

Primera vez o si ves errores de módulos nativos (NODE_MODULE_VERSION, better_sqlite3, etc.):

1. Borra `node_modules` (y si quieres `package-lock.json` y `dist`).
2. Instala de nuevo:

   ```bash
   npm install
   ```

   El postinstall recompila better-sqlite3 para Electron.

3. Si sigue fallando, recompila a mano:

   ```bash
   npm run rebuild:native
   ```

4. Arranca:

   ```bash
   npm run start
   ```

Todo en uno (desde la raíz):

```bash
rmdir /s /q node_modules
del package-lock.json

npm install
npm run rebuild:native
npm run start
```

Si te sale "Electron failed to install correctly", usa Node 20 y luego:

```bash
npm run reinstall
```

Ese script limpia todo y vuelve a instalar.

---

## Scripts que uso

| Comando | Para qué |
|--------|----------|
| `npm run build` | Compila (TS + Vite). |
| `npm run start` | Compila y abre la app. |
| `npm run start:run` | Abre sin compilar (usa el `dist` que ya tengas). |
| `npm run rebuild:native` | Recompila better-sqlite3 para Electron (cuando cambia la versión de Node/Electron). |
| `npm run clean` | Borra `dist/`. |
| `npm run clean:all` | Borra `dist/` y `node_modules/`. |
| `npm run reinstall` | Limpieza total y npm install. |

---

## Reinstalación limpia (Windows)

Cuando Electron o las dependencias se rompen:

```powershell
npm run reinstall
```

El script borra `node_modules`, `package-lock.json`, `dist` y hace `npm install` de nuevo.

Si PowerShell no te deja ejecutar scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
.\scripts\reinstall.ps1
```

---

## Documentación y estructura

En **docs/REQUIREMENTS.md** está el modelo (Estudio, Sujeto, Pesquisaje, PlantillaCRD, etc.), requisitos funcionales y no funcionales y cómo se mapean al código y a la BD.

Estructura del repo:

```
src/
├── main/           # Electron: ventana, BD, IPC
│   ├── index.ts
│   ├── window.ts
│   ├── database/   # SQLite (better-sqlite3)
│   └── ipc/        # Handlers (subject, template, crd, estudio)
├── preload/        # contextBridge → electronAPI
├── renderer/       # React: App, Layout, Header, Sidebar, páginas
│   ├── pages/      # Gestionar Pesquisaje, Sujetos, Importar CRD, Sincronización, Identificación
│   ├── components/
│   └── styles/
├── shared/         # constants, types
└── scripts/
    └── reinstall.ps1
docs/
└── REQUIREMENTS.md
```

Main: arranque, ventana, SQLite en userData, handlers IPC que llaman a los servicios. Renderer: layout con header XAVIA SIDEC, menú lateral, contenido en “carpeta”, pantallas por ruta. Preload expone solo lo que el renderer puede usar vía `window.electronAPI`.

---

## Licencia

Uso interno / tesis. No es software público.
