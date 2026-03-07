# Plantilla Excel para CRD (Pesquisaje / Evaluación inicial)

Para que el formulario genere **automáticamente** los controles correctos (TextBox, TextArea, CheckBox, ComboBox, RadioButton, etc.), el Excel debe incluir las columnas indicadas a continuación.

## Columnas requeridas / recomendadas

| Columna (Excel) | Uso | Valores / Notas |
|-----------------|-----|------------------|
| **codigo** o **id** | Identificador de la variable | Texto único por fila |
| **etiqueta** o **label** | Texto que ve el usuario | Ej: "Nombre", "Fecha de nacimiento" |
| **tipo** o **type** | **IMPORTANTE**: define el control que se genera | Ver tabla de tipos abajo |
| **opciones** | Para ComboBox y RadioButton | Lista separada por comas, punto y coma o \| (ej: `Sí,No` o `Opción A;Opción B`) |
| **seccion** | Agrupación en pestañas | Ej: "Datos generales", "Antecedentes" |
| **orden** | Orden de aparición en el formulario | Número (1, 2, 3...) |
| **columnas** o **columna** | Ancho en el formulario | `1` = media columna, `2` = ancho completo |
| **obligatorio** o **required** | Campo obligatorio | Si, Sí, Yes, True, 1, X |
| **resultado** | Solo Pesquisaje: marca el campo "Resultado" (Incluido/No Incluido) | Si en la fila correspondiente |

## Valores de la columna **tipo** (por qué a veces solo ves cuadros de texto)

Si en el Excel **no existe la columna "tipo"** o está vacía, **todas las variables se tratan como TextBox** (cuadro de texto). Para obtener otros controles, escribe en la columna **tipo** uno de estos valores:

| Valor en Excel | Control generado |
|----------------|------------------|
| TextBox, text, texto | Cuadro de texto (TextBox) |
| TextArea, text area, texto área | Área de texto (TextArea) |
| CheckBox, checkbox, casilla | Casilla de verificación (CheckBox) |
| ComboBox, combo, select, lista, desplegable | Lista desplegable (ComboBox); debe haber **opciones** |
| RadioButton, radio, opción | Botones de opción (RadioButton); debe haber **opciones** |
| number, numero, número | Campo numérico |
| date, fecha | Campo fecha |

**Nota:** Si dejas "tipo" vacío pero rellenas la columna **opciones**, el sistema interpreta la variable como **ComboBox**.

## Ejemplo de filas en Excel

| codigo | etiqueta           | tipo      | opciones   | seccion        | orden | columnas | obligatorio |
|--------|--------------------|-----------|------------|----------------|-------|----------|-------------|
| nombre | Nombre completo    | TextBox   |            | Datos generales| 1     | 2        | Si          |
| sexo   | Sexo               | ComboBox  | Masculino,Femenino,Otro | Datos generales | 2 | 1 | Si |
| fumador| ¿Es fumador?       | CheckBox  |            | Antecedentes   | 3     | 1        |             |
| obs    | Observaciones      | TextArea  |            | Antecedentes   | 4     | 2        |             |
| resultado | Resultado de Evaluación | (dejar o texto) | | Pesquisaje | 99 | 2 | Si | + columna **resultado** = Si |

- Nombre de la hoja del Excel: debe contener **"Pesquisaje"** o **"Evaluación inicial"** según el tipo de plantilla.

## Resumen

- **Solo ves cuadros de texto** → Revisa que exista la columna **tipo** (o **type**) y que en cada fila pongas **TextBox**, **TextArea**, **CheckBox**, **ComboBox**, **RadioButton**, etc.
- **ComboBox/RadioButton** → Rellena también la columna **opciones** (valores separados por coma, punto y coma o \|).
- **Distribución por columnas** → Usa la columna **columnas** (1 = media columna, 2 = ancho completo).
- **Secciones y orden** → Usa **seccion** y **orden** para agrupar y ordenar como en la hoja original.
