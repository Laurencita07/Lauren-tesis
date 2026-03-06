# Requisitos del módulo de inclusión masiva offline – XAVIA SIDEC

Este documento recoge el modelo conceptual, los requisitos funcionales (RF) y no funcionales (RnF) del módulo, y su trazabilidad con el código del cliente offline.

---

## 0. Descripción general – Cliente offline y sistema online (Requisito tutor #1)

El **cliente offline** debe **replicar la lógica actual del sistema online**, en el que existen **dos funcionalidades claramente diferenciadas**:

1. **Gestionar la búsqueda (pesquisaje)**  
   Gestión del pesquisaje: registro de candidatos, listado de pendientes, cumplimiento de criterios de inclusión y resultado (aprobado / no aprobado).

2. **Gestionar el sujeto**  
   Gestión del sujeto una vez en el estudio: listado, búsqueda, estados y acciones posteriores (p. ej. Evaluación Inicial).

Dentro de la **gestión del sujeto**, los sujetos pueden llegar por:

- **Inclusión directa:** registro completo sin pasar por pesquisaje (estudios sin pesquisaje).
- **Inclusión aprobada:** el sujeto pasó por pesquisaje, cumplió criterios y fue aprobado (Incluido); entonces aparece en la gestión de sujetos.

El **flujo offline** debe **respetar esta separación funcional** para integrarse de forma fluida en el proceso (y, en su momento, con el sistema online).

### Correspondencia en el cliente offline actual

| Requisito general | Implementación en el cliente offline |
|------------------|--------------------------------------|
| Replicar lógica del sistema online | Misma separación: **Gestionar Pesquisaje** y **Gestionar Sujetos** como pantallas y flujos distintos (menú, rutas, servicios). |
| Dos funcionalidades diferenciadas | **Gestionar Pesquisaje:** lista pendientes, incluir por iniciales, hoja CRD Pesquisaje, resultado Incluido/No Incluido. **Gestionar Sujetos:** lista todos (pendiente/incluido/no incluido), inclusión directa, Evaluación Inicial. |
| Sujetos por inclusión directa o aprobada | **Directa:** desde Gestionar Sujetos → Adicionar sujeto → formulario completo → estado Incluido. **Aprobada:** desde Gestionar Pesquisaje → pesquisaje → Resultado Incluido → el sujeto pasa a Gestionar Sujetos. |
| Respetar la separación para integración fluida | Flujo claro: Pesquisaje (solo candidatos y resultado) → si aprobado, el sujeto aparece en Sujetos; Inclusión directa solo en Sujetos. Preparado para sincronización diferida con el sistema online. |

---

## 1. Objetivo del módulo

El módulo es una respuesta a las limitaciones del proceso actual de inclusión de sujetos cuando la conectividad es inestable o inexistente (campañas de vacunación, estudios comunitarios, pesquisaje poblacional). Objetivos:

- **Continuidad y confiabilidad** del proceso de inclusión.
- **Trazabilidad** y cumplimiento de requisitos regulatorios.
- **Offline-first:** captura y gestión local; datos preparados para sincronización diferida con el servidor XAVIA SIDEC.

---

## 2. Modelo conceptual (clases principales)

| # | Clase | Descripción | En código / BD |
|---|--------|-------------|----------------|
| 1 | **Estudio** | Ensayo clínico donde se realiza la inclusión. | `estudios` |
| 2 | **Sujeto** | Participante potencial o incluido; asociado a un estudio. | `sujetos` |
| 3 | **Pesquisaje** | Evaluación inicial para criterios de inclusión. Un sujeto puede tener 0 o 1 pesquisaje. | `pesquisaje` |
| 4 | **Inclusión** | Incorporación formal al estudio (aceptado). Un sujeto puede tener registros de inclusión. | `inclusiones` |
| 5 | **Usuario** | Profesional autorizado que registra/modifica datos y ejecuta acciones. | `usuarios` (local) |
| 6 | **Auditoría** | Trazabilidad de acciones (qué, quién, cuándo). | `auditoria` |
| 7 | **PlantillaCRD** | Estructura base de formularios clínicos electrónicos (campos, secciones, reglas). | `plantillas_crd` |
| 8 | **HojaCRD** | Instancia de formulario aplicado a un sujeto (datos de evaluaciones/pesquisajes). | `hojas_crd` |
| 9 | **VariableCRD** | Campo del formulario (puede tener validación o listas de valores). | Definición en `plantillas_crd.definicion_json` / tabla opcional |
| 10 | **ValorCRD** | Dato introducido en una variable para un sujeto. | `valores_crd` o dentro de `hojas_crd.datos_json` |

---

## 3. Requisitos funcionales y trazabilidad

| Id | Nombre | Descripción | Prioridad | Estado | Módulo / nota |
|----|--------|-------------|-----------|--------|----------------|
| **RF-1** | Identificar investigador | Identificación del investigador en el cliente offline. | Media | Pendiente | Header / sesión local; tabla `usuarios` |
| **RF-2** | Registrar sujeto para pesquisaje | Registrar candidatos con datos mínimos; estado “pendiente de pesquisaje”. | Alta | Pendiente | SubjectService; `sujetos` + `pesquisaje` |
| **RF-3** | Registrar inclusión directa | Registro directo sin pesquisaje: iniciales, fecha de inclusión, número de inclusión, grupo, estado de inclusión, iniciales del centro, hora de inclusión. | Alta | Pendiente | SubjectService; `sujetos` + `inclusiones` |
| **RF-4** | Generar identificador temporal | Identificador local único por sujeto (UUID) hasta sincronización. | Alta | Parcial | `sujetos.id` UUID; falta exponer “identificador temporal” en UI |
| **RF-5** | Buscar sujeto registrado | Filtrar por: iniciales, número de inclusión, grupo, estado de inclusión, iniciales del centro, hora de inclusión. | Alta | Pendiente | Gestionar Sujetos; SubjectService |
| **RF-6** | Buscar sujeto por identificador | Búsqueda por campo Identificador (caja de texto + Buscar). | Alta | Pendiente | SubjectService + UI |
| **RF-7** | Editar sujeto registrado | Editar nombre, apellidos, sexo, edad/fecha nacimiento, dirección, teléfono, observaciones; solo si no sincronizado. | Alta | Pendiente | SubjectService + UI |
| **RF-8** | Eliminar sujeto | Eliminación lógica: marcar “anulado” + motivo de anulación. | Media | Pendiente | SubjectService; campo `anulado`, `motivo_anulacion` |
| **RF-9** | Listar sujetos registrados | Listar con al menos: CI/ID, Nombre, Apellidos, Fecha de inclusión, Estado del registro, tipo de inclusión. | Alta | Pendiente | Gestionar Sujetos; SubjectService |
| **RF-10** | Mostrar estado del sujeto | Estado en el proceso: pendiente, incluido, no incluido, anulado. | Alta | Pendiente | `sujetos.estado_inclusion` + UI |
| **RF-11** | Actualizar estado de monitoreo | Estado de monitoreo (Iniciado / Pendiente / Cerrado) según permisos y reglas. | Media | Pendiente | SubjectService; `sujetos.estado_monitoreo` |
| **RF-12** | Actualizar estado de tratamiento | Estado de tratamiento (Iniciado / Seguimiento / Interrupción) según estudio. | Media | Pendiente | SubjectService; `sujetos.estado_tratamiento` |
| **RF-13** | Detectar duplicados en tiempo real | Alerta ante coincidencia con registros existentes (datos clave). | Alta | Pendiente | SubjectService; reglas de unicidad y búsqueda |
| **RF-14** | Mostrar lista para pesquisaje | Listar sujetos pendientes de pesquisaje. | Alta | Pendiente | Gestionar Pesquisaje; SubjectService |
| **RF-15** | Registrar resultado del pesquisaje | Registrar si cumple o no criterios de inclusión. | Alta | Pendiente | CrdService / SubjectService; `pesquisaje` |
| **RF-16** | Actualizar estado del sujeto | Actualizar estado de forma controlada según resultado del pesquisaje o decisiones clínicas. | Alta | Pendiente | SubjectService |
| **RF-17** | Revertir inclusión antes de sincronizar | Revertir estado “Incluido” por inconsistencia en pesquisaje, solo antes de sincronizar. | Media | Pendiente | SubjectService |
| **RF-18** | Mostrar confirmación de registro exitoso | Mensaje de confirmación al guardar correctamente. | Media | Pendiente | UI (toast / modal) |
| **RF-19** | Registrar historial de cambios | Registrar qué cambió, quién y cuándo. | Media | Pendiente | Tabla `auditoria` + SubjectService |
| **RF-20** | Exportar listado de sujetos | Exportar listado (CSV/Excel/JSON) filtrado o completo. | Media | Pendiente | Exportación; ExcelJS / CSV |
| **RF-21** | Importar plantilla CRD | Importar plantillas para la estructura de formularios por estudio. | Alta | Pendiente | TemplateService; `plantillas_crd` (RF-21) |
| **RF-22** | Preparar paquete de sincronización | Armar paquete con sujetos y datos asociados para sincronización con sistema online. | Alta | Pendiente | Módulo Sincronización; servicio de empaquetado |

---

## 4. Requisitos no funcionales (resumen)

| Grupo | Id | Requisito | Nota en implementación |
|-------|----|-----------|------------------------|
| **Usabilidad** | RnF 1.1 | Uso por personal con conocimientos básicos de informática. | UI clara; mensajes en español. |
| | RnF 1.2 | Captura rápida en jornadas de inclusión masiva. | Formularios optimizados; RF-18. |
| | RnF 1.3 | Mensajes de error y validación claros. | Validaciones en servicios + UI. |
| | RnF 1.4 | Coherencia visual con XAVIA SIDEC online. | Tema verde clínico (Header, Sidebar, Content). |
| **Rendimiento** | RnF 2.1 | Registro de sujeto en &lt; 3 s. | Índices BD; lógica ligera. |
| | RnF 2.2 | Navegación entre formularios &lt; 1 s. | React + rutas locales. |
| | RnF 2.3 | Registro continuo sin degradación. | Transacciones y buenas prácticas. |
| | RnF 2.4 | Al menos 1000 sujetos locales. | SQLite; índices en búsquedas. |
| **Seguridad** | RnF 3.1 | Autenticación del usuario. | RF-1; sesión local. |
| | RnF 3.2 | Protección de datos locales. | Electron en entorno controlado; opcional cifrado. |
| | RnF 3.3 | Integridad de datos exportados. | Validación en exportación. |
| **Integridad** | RnF 4.1 | Unicidad de identificadores de sujetos. | UNIQUE(estudio_id, identificador_logico); RF-13. |
| | RnF 4.2 | Historial de cambios. | RF-19; tabla `auditoria`. |
| **Compatibilidad** | RnF 5.1 | Windows, Linux, macOS. | Electron. |
| | RnF 5.2 | Uso en portátiles de campo. | Sin dependencia de red. |
| | RnF 5.3 | Resoluciones de pantalla comunes. | CSS adaptable. |
| **Mantenimiento** | RnF 6.1–6.3 | Actualizaciones sin pérdida de datos; nuevas funcionalidades; código mantenible. | Migraciones de BD; arquitectura en capas (main/renderer/servicios). |

---

## 5. Correspondencia con el código actual

- **Proceso main:** ventana, IPC, SQLite (`src/main`).
- **Renderer:** layout (Header, Sidebar, Content), rutas (Gestionar Pesquisaje, Gestionar Sujetos, Importar plantilla CRD, Sincronización), tema verde clínico.
- **Persistencia:** `estudios`, `sujetos`, `plantillas_crd`, `hojas_crd`; esquema extendido con `usuarios`, `pesquisaje`, `inclusiones`, `auditoria` y campos adicionales en `sujetos`.
- **Servicios previstos:** TemplateService (RF-21), SubjectService (RF-2 a RF-20, RF-22), CrdService (formularios dinámicos, pesquisaje).

Este documento sirve como referencia única para la tesis y para priorizar las siguientes fases de implementación (por ejemplo: RF-2, RF-3, RF-4, RF-6, RF-9, RF-10 y RF-21 como primer bloque).
