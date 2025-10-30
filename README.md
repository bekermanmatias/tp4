# Comparativa de métodos: Euler vs RK2 (PVI)

Aplicación web minimalista e interactiva para comparar los métodos de Euler y Runge–Kutta de orden 2 (RK2) resolviendo varios Problemas de Valor Inicial (PVI) con solución exacta conocida.

## Características
- Interfaz limpia y responsive, lista para presentar en clase.
- PVI predefinidos con solución exacta: exponencial, decaimiento, lineal no homogénea, forzamiento sinusoidal y logístico.
- Controles para `t0`, `tf`, `y0` y paso `h`.
- Gráfica interactiva (Chart.js) con curvas: Euler, RK2 y Exacta.
- Métricas de error (máximo y RMS) respecto a la solución exacta.

## Uso
1. Abrir `index.html` en un navegador moderno (Chrome/Edge/Firefox).
2. Seleccionar un PVI y ajustar parámetros si es necesario.
3. Pulsar "Calcular" o modificar valores para actualizar automáticamente.
4. Alternar visibilidad de curvas con los toggles en la parte superior del panel de resultados.

Nota: La app usa Chart.js vía CDN. Si vas a presentar sin conexión, abre una vez con Internet para cachear o sustituye el script CDN por una copia local.

## Estructura del proyecto
- `index.html`: estructura y contenido principal de la página.
- `styles.css`: estilos minimalistas con tema oscuro.
- `app.js`: lógica de PVI, solvers (Euler, RK2), métricas y render de gráfico.

## PVI incluidos
- `y' = y, y(0) = 1` (exponencial)
- `y' = -2y, y(0) = 1` (decaimiento)
- `y' = t + y, y(0) = 1` (lineal no homogénea)
- `y' = -sin(t) + y, y(0) = 0` (forzamiento sinusoidal)
- `y' = y(1 - y), y(0) = 0.2` (logístico)

## Licencia
Uso académico.
