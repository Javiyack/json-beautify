# Roadmap Técnico "json-beautify" (Versión 0.1)

## Objetivo
Descomponer los requerimientos en entregables técnicos iterativos, definiendo arquitectura, módulos, herramientas, estándares de calidad y métricas de control.

## Stack Propuesto
- Runtime: 100% cliente (Browser). Opcional futuro: Service Worker (PWA) + Web Worker.
- Lenguaje: TypeScript (ES2020 target). 
- Build: Vite (rápido, HMR, tree-shaking). 
- UI: Lightweight (sin framework pesado) o Preact si se requiere componente estado. MVP: librería propia de componentes funcionales + DOM diff mínimo (evaluar). 
- Estilos: CSS Modules / PostCSS + Design Tokens (CSS variables). 
- Testing: Vitest + @testing-library/dom + c8 cobertura. 
- Lint/Format: ESLint (flat config) + Prettier + Stylelint (opcional). 
- Accesibilidad: axe-core (tests). 
- Performance Audits: Lighthouse CI script manual (posterior). 

## Arquitectura Alta
```
src/
  core/
    parse.ts           (wrapper robusto JSON.parse + métricas + errores)
    stringify.ts       (pretty & minify)
    types.ts           (tipos internos)
    analyzer.ts        (profundidad, conteos, tamaño)
  workers/
    parser.worker.ts   (parseo > umbral tamaño)
  highlight/
    tokenizer.ts       (tokenizar JSON string -> tokens tipados)
    theme.ts           (design tokens & mapping token->class)
  render/
    treeBuilder.ts     (convierte objeto JS -> estructura nodos virtuales)
    virtualDom.ts      (render incremental diffs)
    collapseState.ts   (gestión estado de colapso)
  ui/
    components/        (Toolbar, EditorPane, OutputPane, SearchBar, NodeView, ErrorBanner)
    hooks/             (useDebounce, useClipboard, useWorker)
    styles/            (tokens.css, theme-dark.css, theme-light.css)
  utils/
    perf.ts            (marcas de tiempo)
    accessibility.ts   (roles ARIA helpers)
    storage.ts         (historial localStorage)
  app.ts               (bootstrap)
  index.html
```

## Módulos Clave y Contratos
1. parse.ts
   - Input: string JSON, options { tolerant?: boolean }
   - Output: { data: any, metrics: { parseTimeMs, depth, sizeBytes }, error?: ParseError }
   - Errores tipados: { message, line, column, snippet }
2. tokenizer.ts
   - Input: string JSON ya formateado o minificado
   - Output: Token[] ({ type, value, position })
   - Tipos: key, string, number, boolean, null, punctuation, brace, bracket, colon, comma
3. treeBuilder.ts
   - Input: objeto JS
   - Output: NodoRaiz (estructura { kind: 'object'|'array'|'value', children?, path, preview })
4. collapseState.ts
   - API: toggle(path), isCollapsed(path), serialize(), restore()
5. stringify.ts
   - pretty(obj, indent) & minify(obj)
6. analyzer.ts
   - depth(obj), countKeys(obj), sizeUtf8(str)

## Estrategia Rendimiento
- Umbral Web Worker: si input > 1MB o > 50k líneas -> usar parser.worker.
- Tokenización streaming (cursor lineal) vs. regex global pesada. Implementación incremental: versión simple primero, optimización si TTFB > objetivo.
- Render perezoso de nodos colapsados: no crear DOM completo para ramas ocultas.
- Medición: perf.mark/measure en parse + render; exponer en UI para debug (modo dev).

## Estrategia Accesibilidad
- Estructura árbol con role="tree" y nodos con role="treeitem" + aria-expanded.
- Teclas: ↑ ↓ navegar hermanos, → expandir, ← colapsar. Enter toggle.
- Focus management: un solo tabindex=0 dinámico.

## Estrategia Colores / Theming
- tokens.css: define --color-bg, --color-key, etc.
- Dos capas: Design Tokens base + Theme override (dark/light).
- Adaptable: clase en <html data-theme="dark|light">.
- Validación contraste: script test que calcule ratio claves vs fondo.

## Métricas de Calidad Iniciales
- Lint: sin warnings críticos (error level) antes de merge.
- Coverage utils/core/highlight ≥ 80% líneas.
- Bundle inicial (gzip) < 200KB (monitorear con vite-bundle-visualizer).
- Parse 5MB < 800ms (test sintético con fixture generada).

## Estrategia Testing
- Unit: core (parse, analyzer, tokenizer, treeBuilder, collapseState).
- Integration: flujo parse->render->collapse.
- E2E ligero (posterior): Playwright (fase posterior Sprint 3+).
- Snapshot tokens y render virtual para regresiones.

## Seguridad / Sanitización
- Nunca usar innerHTML con partes no escapadas.
- Copiado: usar navigator.clipboard.writeText.
- No persistir JSON completo salvo en historial local (sólo último N, configurable, truncar > 2MB).

## Riesgos Técnicos y Mitigación
| Riesgo | Mitigación |
|--------|------------|
| Tokenizador lento | Profiler early, fallback a JSON.stringify + regex mínima. |
| Bloqueo UI con JSON profundo | Algoritmo iterativo (stack manual) + yield microtasks si > X nodos. |
| Exceso memoria en árbol virtual | Lazy children: almacenar referencias y construir bajo demanda. |
| Workers complican debugging | Flag para forzar modo sync en dev. |

## Plan Iterativo (Sprints de ~1 semana)
### Sprint 1 (Core Parsing & Pretty Print)
- Configuración build (Vite + TS + ESLint + Prettier).
- Implementar parse.ts (sin tolerant mode). 
- Implementar stringify.pretty / minify.
- UI mínima: textarea input + textarea output + botón Formatear/Minificar.
- Tests unit parse / stringify.
- Métricas parseTimeMs.

Entrega: JSON válido formateado y minificado; errores con línea/columna.

### Sprint 2 (Tokenización + Resaltado + Theming)
- tokenizer.ts (versión básica).
- theme.ts + tokens CSS variables (dark base).
- Highlighter: transformar tokens -> spans.
- UI panel dividido: input izquierda, salida derecha.
- Tests tokenizer (tipos, posiciones básicas).
- Accesibilidad inicial foco paneles.

Entrega: Resaltado sintáctico y tema oscuro "cool".

### Sprint 3 (Árbol Navegable + Collapse + Copiar)
- treeBuilder iterativo.
- collapseState + UI NodeView.
- Teclas de navegación básicas (↑ ↓ → ← Enter toggle).
- Botones Copiar Pretty / Minify.
- Métricas profundidad y conteo claves.
- Tests treeBuilder & collapseState.

Entrega: Navegación jerárquica estable y copia al portapapeles.

### Sprint 4 (Búsqueda + Carga/Descarga + Historial)
- Búsqueda palabras clave (resalta coincidencias en tokens / nodos).
- Historial localStorage (últimas 5 entradas).
- Drag & drop archivo .json + export .json.
- Tema claro (light) + toggle persistente.
- Tests search + storage.

Entrega: Funcionalidades de productividad y dual theme.

### Sprint 5 (Performance & Worker & Accesibilidad AA)
- Integrar Web Worker para parse > 1MB.
- Lazy render para ramas colapsadas.
- Pruebas contraste automático.
- Roles ARIA árbol completos + navegación teclado avanzada.
- Script medición bundle y reporte.

Entrega: Performance escalable y AA compliance base.

### Sprint 6 (Optimización / Hardening)
- Refactor tokenizer para streaming si necesario.
- Lighthouse audit & fixes.
- Mejora mensajes error (snippet + sugerencias).
- Documentación README + guía contribución.

Entrega: Versión candidata estable.

## Backlog Técnico Futuro
- Modo tolerante (strip comments, trailing commas) usando preprocesador.
- JSON Schema validation (ajuste modular). 
- Diff JSON (algoritmo O(n) basado en rutas). 
- PWA offline + cache theme.

## Criterios de Hecho (Definition of Done)
- Código revisado (peer review) y CI verde (lint + test + coverage).
- Documentado (comentarios contrato o README sección API interna si aplica).
- No degradación en métricas clave (parse < objetivo previo, bundle size). 

## Métricas a Monitorear por Sprint
| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| Coverage líneas core | ≥80% | Vitest + c8 |
| Tamaño bundle inicial | <200KB gzip | Vite build + gzip-size |
| Parse 1MB JSON | <160ms | Perf test script | 
| Interacción collapse | <50ms | User timing API |

## Scripts Propuestos (package.json)
- dev: vite
- build: vite build
- preview: vite preview
- test: vitest run
- test:watch: vitest
- lint: eslint . --max-warnings=0
- format: prettier --write .
- analyze: vite build --report

## Estrategia de Versionado
- SemVer: 0.y.z hasta primera release estable. 
- Rama main protegida; feature branches + PR.

## Observaciones
- Mantener dependencia externa mínima (evitar highlight.js para control granular y peso).
- Evaluar fallback a JSON.parse try/catch vs. parser incremental sólo si métricas justifican.

---
Versión: 0.1 (Borrador inicial Roadmap Técnico)
