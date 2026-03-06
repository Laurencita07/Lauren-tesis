# Flujo de inclusión de sujetos – Cumplimiento con requisitos del profesor

Este documento relaciona lo implementado en el cliente offline con la especificación "Inclusión de Sujetos desde el Cliente Offline". La **descripción general** (cliente offline replica lógica online; dos funcionalidades: pesquisaje y gestión de sujeto; inclusión directa o aprobada) está recogida en **REQUIREMENTS.md**, sección **0. Descripción general – Cliente offline y sistema online (Requisito tutor #1)**.

---

## 1. Descripción general (resumen)

- **Gestionar Pesquisaje** y **Gestionar Sujetos** están separados en el menú y en la lógica (SubjectService, listas por estado).
- El flujo offline replica la separación del sistema online e integra transición automática según resultado del pesquisaje.
- Dentro de la gestión del sujeto se contemplan **inclusión directa** (sin pesquisaje) e **inclusión aprobada** (vía pesquisaje → Incluido).

---

## 2. Modalidades de inclusión

- **Estudios con Pesquisaje:** registro inicial por Iniciales → lista en Gestionar Pesquisaje → hoja CRD Pesquisaje → Resultado Incluido/No Incluido → si Incluido, el sujeto pasa a Gestionar Sujetos.
- **Estudios sin Pesquisaje (inclusión directa):** desde Gestionar Sujetos → Adicionar sujeto → formulario con Iniciales, Fecha de inclusión, Número de inclusión, Grupo, Hora (e iniciales del centro) → el sujeto queda en estado Incluido.

**Importación de plantillas (antes de inclusión):**

- En **Importar plantilla CRD** se puede importar plantilla de **Pesquisaje** y/o de **Evaluación Inicial**.
- TemplateService valida: existencia del archivo, extensión .xlsx/.xls, existencia de pestañas, filas en hoja de variables, y opcionalmente que la plantilla de Pesquisaje tenga campo de resultado.
- En caso de error se muestra mensaje al usuario (errores de estructura o advertencias).

---

## 3. Flujo para estudios CON Pesquisaje

### 3.1 Paso 1 – Registro inicial

- En **Gestionar Pesquisaje**, botón **"+ Incluir sujeto"** abre un modal.
- Campo mínimo: **Iniciales**.
- Botón **"Incluir sujeto → siguiente"**: registra un sujeto y deja el modal abierto para repetir (inclusión masiva secuencial).
- Los sujetos registrados aparecen en la lista de Gestionar Pesquisaje con estado **pendiente** (aún no incluidos formalmente).

### 3.2 Paso 2 – Gestión de Pesquisaje

- En la lista se elige un sujeto y **"Gestionar hoja CRD"**.
- Se carga la plantilla de Pesquisaje importada y se reconstruye el formulario dinámicamente (TextBox, TextArea, CheckBox, ComboBox, RadioButton, etc.).
- Cintillo superior: nombre de la hoja, identificador del sujeto, momento de seguimiento (Pesquisaje), nombre del estudio.
- Campo clave **Resultado de Evaluación:** Incluido / No Incluido (según definición de la plantilla o variable marcada como resultado).

### 3.3 Evaluación del resultado

- **Resultado = Incluido:** el sujeto pasa a la lista de Gestionar Sujetos, estado **Incluido**, y se asigna número de inclusión (temporal si no se indica otro).
- **Resultado = No Incluido:** el sujeto permanece registrado con estado **No Incluido**, no pasa a Gestionar Sujetos, no se asigna código ni grupo.

---

## 4. Flujo para estudios SIN Pesquisaje (Inclusión directa)

- Se usa solo **Gestionar Sujetos**.
- **Adicionar sujeto** abre el formulario de inclusión directa con: Iniciales, Fecha de inclusión, Número de inclusión, Grupo de sujetos, Hora de inclusión, Iniciales del centro.
- El sujeto queda en estado **Incluido** de inmediato.

---

## 5. Paso posterior obligatorio – Evaluación Inicial

- Para todos los sujetos **incluidos** (por pesquisaje aprobado o por inclusión directa), desde **Gestionar Sujetos** se puede abrir **Evaluación Inicial**.
- Se selecciona el sujeto y **"Evaluación Inicial"** → se carga la plantilla de Evaluación Inicial, se reconstruye el formulario dinámicamente, se aplican los tipos de campo y se guardan los datos en la hoja CRD.

---

## 6. Implementación en el cliente Offline

### 6.1 Inclusión masiva

- Registro consecutivo desde el modal "Incluir sujeto → siguiente" en Gestionar Pesquisaje.
- Listas con estados diferenciados: **No Incluido** (solo en flujo con pesquisaje, no se muestran en Gestionar Sujetos) e **Incluido** (en Gestionar Sujetos).

### 6.2 Validación del identificador del sujeto

- Identificador lógico: **Estudio + Iniciales + Código de inclusión** (numero_inclusion).
- Reglas en SubjectService: no se permite repetir la combinación (estudio_id, iniciales, numero_inclusion) en el mismo estudio; misma combinación → mensaje de error.
- Validación en entorno offline antes de crear inclusión directa o de confirmar resultado Incluido en pesquisaje.

### 6.3 Identificación del sujeto en entorno Offline

- **ID temporal local:** UUID (v4) para cada sujeto.
- **Fecha de creación offline:** `created_at` en la tabla sujetos.
- **Usuario creador:** campo usuario_id en pesquisaje/inclusiones; en la UI se puede ampliar para identificar al usuario actual.
- El ID local se sustituye por el ID definitivo del sistema online en la futura sincronización.

---

## 7. Exportación de hoja CRD

- Desde el formulario de **Evaluación Inicial** (y en general desde cualquier hoja CRD cuando corresponda) se puede:
  - **Exportar JSON:** estructura y valores en un archivo JSON.
  - **Exportar Excel:** misma estructura (columnas Codigo, Etiqueta, Tipo) más columna **Valor** con el dato introducido; la hoja se protege contra edición (protección de hoja ExcelJS).

---

## 8. Resultado esperado

- Separación clara entre **Gestionar Pesquisaje** y **Gestionar Sujetos**.
- Transición automática entre listas según resultado del pesquisaje (Incluido → Gestionar Sujetos).
- Integridad del identificador (estudio + iniciales + número de inclusión) validada en offline.
- Reglas de negocio aplicadas (estados pendiente, no_incluido, incluido; inclusión directa con todos los campos).
- Datos y sujetos listos para una futura sincronización con el sistema online (sincronizado = 0, paquete preparable desde el módulo Sincronización).

---

## Archivos clave

| Área | Archivos |
|------|----------|
| Servicios | `src/main/services/SubjectService.ts`, `TemplateService.ts`, `CrdService.ts` |
| IPC | `src/main/ipc/handlers/subject.ts`, `template.ts`, `crd.ts`, `estudio.ts` |
| UI Pesquisaje | `src/renderer/pages/GestionarPesquisaje.tsx` |
| UI Sujetos | `src/renderer/pages/GestionarSujetos.tsx` |
| Formulario dinámico | `src/renderer/components/crd/FormularioCRD.tsx` |
| Importar plantilla | `src/renderer/pages/ImportarPlantillaCRD.tsx` |
| BD | `src/main/database/schema.ts` (sujetos, pesquisaje, plantillas_crd, hojas_crd) |
