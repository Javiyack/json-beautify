# Documento de Requisitos - Aplicación Web "json-beautify"

## 1. Introducción
Aplicación web ligera para validar, formatear (pretty-print / minify) y visualizar objetos JSON con resaltado de sintaxis y una paleta de colores moderna y "cool". Debe soportar anidamiento ilimitado y ofrecer una experiencia rápida, clara y agradable.

## 2. Objetivo
Proporcionar a desarrolladores y usuarios técnicos una herramienta inmediata para:
- Verificar si un texto es JSON válido.
- Formatear (embellecer) y minimizar JSON.
- Resaltar sintaxis con una paleta atractiva, accesible y consistente.
- Navegar estructuras profundas sin pérdida de rendimiento ni usabilidad.

## 3. Alcance
Incluye front-end web (SPA o micro app) ejecutándose completamente en el navegador (sin backend obligatorio para la lógica principal). Fuera de alcance: edición colaborativa en tiempo real, autenticación de usuarios (MVP), almacenamiento persistente en la nube.

## 4. Definiciones
- JSON válido: Cumple RFC 8259 / ECMA-404.
- Pretty print: Indentación legible configurable (2 / 4 espacios o tab).
- Minify: JSON sin espacios ni saltos innecesarios.
- Colour Theme: Conjunto definido de tokens -> colores.

## 5. Perfiles de Usuario
1. Dev Backend: Pega respuestas de APIs y valida estructura.
2. Dev Frontend: Ajusta payloads y verifica formato rápido.
3. QA / Tester: Inspecciona y compara respuestas.
4. Estudiante: Aprende estructura JSON.

## 6. Casos de Uso (Resumen)
- CU1: Pegar texto y validar automáticamente.
- CU2: Formatear JSON inválido muestra error detallado (posición / causa).
- CU3: Embellecer un JSON válido con indentación seleccionada.
- CU4: Minimizar JSON para copiar compacto.
- CU5: Resaltado sintáctico por tipo (clave, string, number, boolean, null, braces, brackets, coma, dos puntos).
- CU6: Colapsar / expandir nodos profundos (toggle recursivo).
- CU7: Búsqueda de claves / valores (simple, highlight matches).
- CU8: Copiar al portapapeles (pretty y minify).
- CU9: Cargar archivo `.json` local (drag & drop / file input).
- CU10: Exportar resultado formateado como archivo.

## 7. Requerimientos Funcionales
| ID | Descripción | Prioridad | Criterio de Aceptación |
|----|-------------|-----------|------------------------|
| F-001 | Validar texto introducido como JSON al teclear (debounce ≤400ms) | Alta | Si válido, marcar "Válido"; si no, mostrar mensaje con línea/columna. |
| F-002 | Botón "Formatear" aplica indentación seleccionada (2, 4, tab) | Alta | JSON renderizado con indentación y resaltado. |
| F-003 | Botón "Minificar" genera versión compacta | Alta | No contiene espacios extra ni saltos de línea. |
| F-004 | Resaltado sintáctico por token | Alta | Colores asignados según paleta definida. |
| F-005 | Soportar profundidad ilimitada (limitado solo por memoria navegador) | Alta | Estructuras de ≥ 500 niveles procesan sin bloqueo permanente (>5s). |
| F-006 | Colapsar / expandir nodos | Alta | Icono toggle; persistencia local del estado de expansión al refactorizar. |
| F-007 | Búsqueda interna (ctrl/cmd+f custom) | Media | Resalta coincidencias y permite navegar siguiente/anterior. |
| F-008 | Copiar al portapapeles (pretty/minify) | Alta | Portapapeles contiene exactamente el texto mostrado/calculado. |
| F-009 | Cargar archivo `.json` (drag & drop) | Media | Al soltar archivo válido se muestra formateado. |
| F-010 | Exportar JSON formateado como archivo | Media | Descarga un `.json` con nombre configurable. |
| F-011 | Mostrar tamaño (bytes) y número de claves totales | Baja | Datos visibles tras parseo exitoso. |
| F-012 | Mostrar tiempo de parseo (ms) | Baja | Métrica < 30ms para objetos medianos (≤1MB). |
| F-013 | Historia local de las últimas N (configurable, default 5) entradas | Baja | Persistencia en localStorage. |
| F-014 | Tema oscuro y claro | Media | Conmutador; paleta adaptada. |
| F-015 | Accesibilidad: navegación por teclado completa | Alta | Todas las acciones operables vía teclado. |

## 8. Requerimientos No Funcionales
### 8.1 Rendimiento
- R-Perf-001: Parsear un JSON de 5MB en < 800ms en equipo medio (Chrome actual). 
- R-Perf-002: Interacciones de expansión/collapse < 50ms percepción. 
- R-Perf-003: Debounce validación configurable (default 300-400ms). 

### 8.2 Usabilidad / UX
- Layout responsivo (≥320px ancho).
- Modo pantalla dividida: entrada izquierda, salida derecha (colapsable en móvil). 
- Mensajes de error claros ("Error de sintaxis: token inesperado '}' en línea 12, columna 8").

### 8.3 Accesibilidad (WCAG 2.1 AA)
- Contraste mínimo 4.5:1 para texto normal; 3:1 para tokens decorativos.
- Focus visible en todos los elementos interactivos.
- Soporte lector de pantalla: roles ARIA para árbol JSON.

### 8.4 Seguridad
- No enviar datos de JSON a servidores (todo local) en MVP.
- Sanitizar texto para evitar inyección en DOM (escape). 

### 8.5 Compatibilidad
- Navegadores: Últimas 2 versiones de Chrome, Firefox, Edge, Safari. 
- Sin dependencias que rompan ES2020 (transpilación opcional). 

### 8.6 Mantenibilidad
- Arquitectura modular (parser wrapper, highlighter, tree renderer, UI capa). 
- 80% mínimo de cobertura en funciones puras (parser utils). 

### 8.7 Observabilidad
- (Opt-in) Métricas locales: tiempos de parseo, tamaño, profundidad máxima. 

### 8.8 Internacionalización
- MVP sólo español; preparado para i18n (diccionario claves). 

## 9. Reglas de Negocio
- Aceptar únicamente JSON estándar (sin comentarios, sin trailing commas) en modo estricto.
- (Opcional futuro) Modo tolerante: eliminar comentarios // y /* */ y corregir comas finales.

## 10. Flujos Principales
1. Introducir / pegar JSON -> validación automática -> resaltado / error.
2. Clic en "Formatear" -> re-render con indentación elegida.
3. Colapsar nodos para navegar grandes estructuras: se muestran placeholders con conteo (e.g. `{ … 12 claves }`).
4. Buscar término -> resaltar coincidencias y mostrar contador (x/y).

## 11. Validaciones JSON y Errores
- Detectar: comillas sin cerrar, llaves/paréntesis desbalanceados, coma extra, valor inválido (NaN, Infinity), caracteres no UTF-8 válidos.
- Reportar: posición (línea, columna), extracto contextual (máx 40 chars), sugerencia breve.

## 12. Paleta de Colores (Borrador)
Se definirá un tema base (oscuro) + derivaciones claras. Ejemplo (hex provisionales):
- Fondo base oscuro: #0F141A
- Panel secundario: #16202A
- Texto primario: #E6EDF3
- Claves: #4FC1FF
- Strings: #A5D6FF / modo claro #005A8E
- Números: #F78C6C
- Boolean / null: #C792EA
- Brackets / punctuation: #89DDFF
- Errores: #FF5370
- Selección: rgba(79,193,255,0.25)
(Se ajustará contraste y se añadirá modo claro análogo.)

## 13. Métricas de Calidad
- Tiempo de primera interacción < 1s (TTI). 
- Tamaño bundle inicial < 200KB gzip (MVP). 
- Lighthouse Performance ≥ 90. 
- Cobertura tests utilidades ≥ 80%. 

## 14. Riesgos y Mitigación
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| JSON muy grande bloquea UI | Alto | Web Worker para parseo >1MB. |
| Colores sin contraste suficiente | Medio | Test automatizado contrast ratio. |
| Crecimiento del bundle | Medio | Code splitting y dependencias mínimas. |
| Profundidad extrema produce stack recursion | Alto | Render iterativo (stack manual). |

## 15. Supuestos
- Usuario tiene navegador moderno con JS habilitado.
- No requiere login (MVP).
- Acceso offline aceptable tras primer load (considerar PWA futuro).

## 16. Fuera de Alcance (MVP)
- Comparación lado a lado de dos JSON.
- Diff visual.
- Compartir enlaces con JSON embebido.
- Autocompletado de esquemas.

## 17. Roadmap (Tentativo)
- Sprint 1: Validación + Formateo + Resaltado básico (F-001..F-004).
- Sprint 2: Colapso nodos, búsqueda, copiar, minify (F-003, F-006..F-008).
- Sprint 3: Carga/descarga archivos, métricas, tema claro (F-009..F-015 parcial).
- Sprint 4: Optimización rendimiento, Web Worker, accesibilidad AA.

## 18. Criterios de Aceptación Clave
- F-001: Dado un texto inválido, cuando se parsea, entonces se muestra mensaje con línea/columna y se marca borde del área en color error. 
- F-002: Dado un JSON válido y selección indent=4, al pulsar Formatear, la salida contiene saltos y 4 espacios por nivel. 
- F-006: Dado un objeto con 20 claves hijo, al colapsarlo se muestra una línea resumida y al expandirlo reaparecen las claves previas en el mismo orden. 
- F-008: Al pulsar Copiar Pretty el portapapeles contiene exactamente el texto visible (sin truncar). 

## 19. Próximas Extensiones (Futuro)
- Validación contra JSON Schema.
- Vista Diff entre versiones.
- Compartir gist anónimo (requiere backend / API). 
- Modo oscuro automático (prefers-color-scheme).

## 20. Anexos
- RFC 8259 (referencia estándar JSON).
- Paleta será refinada con pruebas de contraste (ferramentas: axe, Lighthouse). 

---
Versión: 0.1 (Borrador Inicial)
