# XAVIA SIDEC - Cliente Offline

Aplicación de escritorio (Electron) para la gestión de sujetos en ensayos clínicos, módulo de inclusión masiva del sistema XAVIA SIDEC. Funciona **100% offline** con almacenamiento local SQLite.

## Objetivo general

- Gestionar Pesquisaje y Sujetos
- Importar plantillas CRD desde Excel
- Reconstruir formularios dinámicamente y aplicar reglas de negocio
- Almacenar información localmente y preparar datos para futura sincronización con el sistema online

---

## Requisitos

- **Node.js 20 LTS** (`>=20.0.0 <21.0.0`). Se recomienda usar **Node 20** para evitar errores de instalación de Electron en Windows. Con Node 24 u otras versiones no soportadas puede aparecer *"Electron failed to install correctly"*.
- npm (incluido con Node.js)
- **Windows:** para compilar el módulo nativo `better-sqlite3` hace falta [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) con la carga "Desktop development with C++".

**Recomendación (Windows):** Clona o mueve el proyecto a una ruta **sin emojis ni caracteres especiales**, por ejemplo `C:\proyectos\xavia-sidec`. Rutas como `C:\Users\Nombre💕\Desktop\...` pueden dar problemas con módulos nativos y con scripts. Usa algo como `C:\proyectos\app` o `C:\dev\xavia-sidec`.

Comprobar versión de Node:

```bash
node -v
```

Si no es v20.x, instala Node 20 LTS desde [nodejs.org](https://nodejs.org/) (versión LTS) o con [nvm-windows](https://github.com/coreybutler/nvm-windows).

---

## Instalación

### Pasos recomendados (instalación limpia)

Si es la primera vez o si ves errores de módulos nativos (por ejemplo *"NODE_MODULE_VERSION 115/125"* o *"better_sqlite3.node was compiled against a different Node.js version"*):

1. **Borrar** la carpeta `node_modules` (y opcionalmente `package-lock.json` y `dist`).
2. **Instalar** dependencias (el script `postinstall` recompilará `better-sqlite3` para Electron):

   ```bash
   npm install
   ```

3. Si el error persiste, **recompilar** manualmente los módulos nativos para la versión de Electron:

   ```bash
   npm run rebuild:native
   ```

4. **Compilar y arrancar** la app:

   ```bash
   npm run start
   ```

Resumen en una sola secuencia (desde la raíz del proyecto):

```bash
# Opcional: limpieza total
rmdir /s /q node_modules
del package-lock.json

npm install
npm run rebuild:native
npm run start
```

### Si aparece "Electron failed to install correctly"

1. Asegúrate de usar **Node 20 LTS** (`node -v` → v20.x.x).
2. Ejecuta la reinstalación limpia:

```bash
npm run reinstall
```

Eso borra `node_modules`, `package-lock.json` y `dist`, y vuelve a ejecutar `npm install` (y `postinstall` hará el rebuild de `better-sqlite3`).

---

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila TypeScript y el renderer (Vite). |
| `npm run start` | Compila y abre la aplicación (Electron). |
| `npm run start:run` | Abre la app sin compilar (usa `dist/` ya generado). |
| `npm run rebuild:native` | Recompila `better-sqlite3` para la versión de Electron (soluciona NODE_MODULE_VERSION). |
| `npm run clean` | Borra la carpeta `dist/`. |
| `npm run clean:all` | Borra `dist/` y `node_modules/`. |
| `npm run reinstall` | Limpieza completa y reinstalación (ver más abajo). |

---

## Reinstalación limpia (Windows)

Si Electron o otras dependencias fallan al instalar:

```powershell
npm run reinstall
```

El script `scripts/reinstall.ps1`:

1. Elimina `node_modules`
2. Elimina `package-lock.json`
3. Elimina `dist/`
4. Ejecuta `npm install`

Para ejecutarlo directamente en PowerShell (si `npm run reinstall` da problemas de política de ejecución):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
.\scripts\reinstall.ps1
```

---

## Documentación de requisitos

En **docs/REQUIREMENTS.md** se recogen el modelo conceptual (Estudio, Sujeto, Pesquisaje, Inclusión, Usuario, Auditoría, PlantillaCRD, HojaCRD), los requisitos funcionales, los no funcionales (RnF) y su trazabilidad con el código y la base de datos.

## Estructura del proyecto

```
src/
├── main/                 # Proceso principal (Electron)
│   ├── index.ts          # Entrada, creación de ventana e IPC
│   ├── window.ts         # Configuración de la ventana principal
│   ├── database/         # SQLite
│   │   ├── index.ts      # Conexión y ruta userData
│   │   └── schema.ts     # Tablas: estudios, sujetos, plantillas_crd, hojas_crd
│   └── ipc/              # Handlers IPC (app:getVersion, db:ping, etc.)
├── preload/
│   └── index.ts          # contextBridge: expone electronAPI al renderer
├── renderer/             # Interfaz de usuario (React)
│   ├── index.html
│   ├── index.tsx         # Punto de entrada React
│   ├── App.tsx            # Estado de ruta y layout
│   ├── styles/
│   │   └── theme.css     # Tema verde clínico (Header, Sidebar, Content)
│   ├── components/
│   │   └── layout/       # Header, Sidebar, Layout
│   └── pages/            # Módulos: Pesquisaje, Sujetos, Importar CRD, Sincronización
├── shared/
│   ├── constants.ts      # ROUTES, ROUTE_LABELS, APP_NAME
│   └── types.ts          # UsuarioLocal, Estudio, Sujeto
└── scripts/
    └── reinstall.ps1     # Reinstalación limpia (Windows)
docs/
└── REQUIREMENTS.md       # Modelo conceptual, RF, RnF y trazabilidad
```

## Descripción por capas

### Proceso principal (Main)

- **index.ts**: Arranque de la app, registro de IPC y creación de la ventana; cierre de la base de datos al salir.
- **window.ts**: Crea `BrowserWindow` con `preload` y carga `renderer/index.html`; `contextIsolation: true`, sin `nodeIntegration` en el renderer.
- **database/**: Usa `better-sqlite3`; el archivo `.db` se guarda en `app.getPath('userData')`. El esquema define tablas para estudios, sujetos, plantillas CRD y hojas CRD.
- **ipc/**: Handlers `app:getVersion` y `db:ping`; aquí se irán añadiendo los correspondientes a TemplateService, SubjectService y CrdService.

### Renderer

- **Layout**: Header (título "Ensayos Clínicos", Conducción, búsqueda, usuario, Salir) + Sidebar (Menú con enlaces a los cuatro módulos) + Content (banner verde con nombre del módulo + área de contenido).
- **Navegación**: Estado `currentRoute` en `App`; al elegir un ítem del menú se actualiza la ruta y se muestra la página correspondiente (por ahora placeholders).
- **Tema**: CSS con variables (`--header-bg`, `--accent-solid`, etc.) para el estilo verde tipo sistema clínico.

### Preload

- Expone `window.electronAPI` con `getVersion()` y `dbPing()` para que el renderer no acceda directamente a Node ni a `ipcRenderer` sin pasar por esta API.

### Persistencia

- SQLite en `userData`; esquema con estudios, sujetos, plantillas CRD y hojas CRD; preparado para UUID locales y futura sincronización.

## Próximos pasos (fuera de esta fase)

- Implementar **TemplateService** (ExcelJS/XLSX) e IPC para importar plantillas CRD.
- Implementar **SubjectService** e IPC para CRUD de sujetos y validación de identificador lógico único.
- Implementar **CrdService** para reconstrucción dinámica de formularios y reglas de negocio.
- Completar pantallas de cada módulo (búsqueda, listado, formularios, exportación).

## Licencia

Uso interno / tesis. No distribuido bajo licencia pública.
