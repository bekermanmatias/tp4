(function () {
  const $ = (id) => document.getElementById(id);

  // PVI predefinidos: f(t,y), y(t) exacta, parámetros por defecto
  const PVIS = [
    {
      id: 'exp',
      name: "y' = y, y(0) = 1",
      f: (t, y) => y,
      exact: (t, { y0, t0 }) => y0 * Math.exp(t - t0),
      defaults: { t0: 0, tf: 2, y0: 1, h: 0.2 },
      desc: 'Crecimiento exponencial.<br><strong>Ecuación:</strong> \\(y\' = y\\)<br><strong>Solución exacta:</strong> \\(y(t) = y_0 e^{t-t_0}\\)'
    },
    {
      id: 'decay',
      name: "y' = -2 y, y(0) = 1",
      f: (t, y) => -2 * y,
      exact: (t, { y0, t0 }) => y0 * Math.exp(-2 * (t - t0)),
      defaults: { t0: 0, tf: 2, y0: 1, h: 0.2 },
      desc: 'Decaimiento exponencial.<br><strong>Ecuación:</strong> \\(y\' = -2y\\)<br><strong>Solución exacta:</strong> \\(y(t) = y_0 e^{-2(t-t_0)}\\)'
    },
    {
      id: 't_plus_y',
      name: "y' = t + y, y(0) = 1",
      f: (t, y) => t + y,
      // Exacta: y = -t - 1 + 2 e^t  (para y(0)=1)
      exact: (t, { y0, t0 }) => {
        // y = -t - 1 + C e^t; con y(t0)=y0 => C = (y0 + t0 + 1) e^{-t0}
        const C = (y0 + t0 + 1) * Math.exp(-t0);
        return -t - 1 + C * Math.exp(t);
      },
      defaults: { t0: 0, tf: 2, y0: 1, h: 0.2 },
      desc: 'Ecuación lineal no homogénea.<br><strong>Ecuación:</strong> \\(y\' = t + y\\)<br><strong>Solución exacta:</strong> \\(y(t) = -t - 1 + (y_0 + t_0 + 1)e^{t-t_0}\\)'
    },
    {
      id: 'sin_forced',
      name: "y' = -sin(t) + y, y(0) = 0",
      f: (t, y) => -Math.sin(t) + y,
      // Usamos factor integrante para exacta
      exact: (t, { y0, t0 }) => {
        // y' - y = -sin t => e^{-t} y = ∫ -sin t e^{-t} dt + C
        // Solución cerrada: y = (1/2)(sin t - cos t) + C e^{t}
        // Ajustar C con y(0) = y0
        // y(t0) = 0.5(sin t0 - cos t0) + C e^{t0} => C = (y0 - 0.5(sin t0 - cos t0)) e^{-t0}
        const C = (y0 - 0.5 * (Math.sin(t0) - Math.cos(t0))) * Math.exp(-t0);
        return 0.5 * (Math.sin(t) - Math.cos(t)) + C * Math.exp(t);
      },
      defaults: { t0: 0, tf: 6.28318, y0: 0, h: 0.1 },
      desc: 'Ecuación con forzamiento sinusoidal.<br><strong>Ecuación:</strong> \\(y\' = -\\sin(t) + y\\)<br><strong>Solución exacta:</strong> \\(y(t) = \\frac{1}{2}(\\sin t - \\cos t) + Ce^t\\)'
    },
    {
      id: 'logistic',
      name: "y' = y(1 - y), y(0) = 0.2",
      f: (t, y) => y * (1 - y),
      exact: (t, { y0, t0 }) => {
        // y(t) = 1 / (1 + A e^{-(t - t0)}), A = (1 - y0)/y0
        const A = (1 - y0) / y0;
        return 1 / (1 + A * Math.exp(-(t - t0)));
      },
      defaults: { t0: 0, tf: 10, y0: 0.2, h: 0.2 },
      desc: 'Crecimiento logístico.<br><strong>Ecuación:</strong> \\(y\' = y(1-y)\\)<br><strong>Solución exacta:</strong> \\(y(t) = \\frac{1}{1 + Ae^{-(t-t_0)}}\\) donde \\(A = \\frac{1-y_0}{y_0}\\)'
    },
    {
      id: 'poly2t',
      name: "y' = 2t, y(0) = 0",
      f: (t, y) => 2 * t,
      exact: (t, { y0, t0 }) => y0 + (t - t0) * (t + t0), // y = y0 + t^2 - t0^2
      defaults: { t0: 0, tf: 5, y0: 0, h: 0.2 },
      desc: 'Campo simple polinómico.<br><strong>Ecuación:</strong> \\(y\' = 2t\\)<br><strong>Solución exacta:</strong> \\(y(t) = y_0 + t^2 - t_0^2\\)'
    },
    {
      id: 'ysq',
      name: "y' = y^2, y(0) = 0.5",
      f: (t, y) => y * y,
      exact: (t, { y0, t0 }) => y0 / (1 - y0 * (t - t0)),
      defaults: { t0: 0, tf: 1.5, y0: 0.5, h: 0.05 },
      desc: 'No lineal con posible blow-up.<br><strong>Ecuación:</strong> \\(y\' = y^2\\)<br><strong>Solución exacta:</strong> \\(y(t) = \\frac{y_0}{1 - y_0(t-t_0)}\\)'
    },
    {
      id: 'lin_3y_2t',
      name: "y' = 3y + 2t, y(0) = 1",
      f: (t, y) => 3 * y + 2 * t,
      exact: (t, { y0, t0 }) => {
        // y = C e^{3t} - (2/3)t - 2/9, con y(t0)=y0 => C = (y0 + (2/3)t0 + 2/9) e^{-3 t0}
        const C = (y0 + (2 / 3) * t0 + 2 / 9) * Math.exp(-3 * t0);
        return C * Math.exp(3 * t) - (2 / 3) * t - 2 / 9;
      },
      defaults: { t0: 0, tf: 2, y0: 1, h: 0.1 },
      desc: 'Lineal con término en t.<br><strong>Ecuación:</strong> \\(y\' = 3y + 2t\\)<br><strong>Solución exacta:</strong> \\(y(t) = Ce^{3t} - \\frac{2}{3}t - \\frac{2}{9}\\)'
    },
    {
      id: 'cos_minus_y',
      name: "y' = cos t - y, y(0) = 0",
      f: (t, y) => Math.cos(t) - y,
      exact: (t, { y0, t0 }) => {
        // y = 0.5(sin t + cos t) + C e^{-t}; C = (y0 - 0.5(sin t0 + cos t0)) e^{t0}
        const C = (y0 - 0.5 * (Math.sin(t0) + Math.cos(t0))) * Math.exp(t0);
        return 0.5 * (Math.sin(t) + Math.cos(t)) + C * Math.exp(-t);
      },
      defaults: { t0: 0, tf: 6.28318, y0: 0, h: 0.1 },
      desc: 'Lineal estable con forzamiento cosenoidal.<br><strong>Ecuación:</strong> \\(y\' = \\cos(t) - y\\)<br><strong>Solución exacta:</strong> \\(y(t) = \\frac{1}{2}(\\sin t + \\cos t) + Ce^{-t}\\)'
    }
  ];

  // Métodos numéricos
  function euler({ f, t0, y0, h, n }) {
    const t = [t0];
    const y = [y0];
    for (let k = 0; k < n; k++) {
      const tk = t0 + k * h;
      const yk = y[y.length - 1];
      const yNext = yk + h * f(tk, yk);
      t.push(tk + h);
      y.push(yNext);
    }
    return { t, y };
  }

  function rk2({ f, t0, y0, h, n }) {
    const t = [t0];
    const y = [y0];
    for (let k = 0; k < n; k++) {
      const tk = t0 + k * h;
      const yk = y[y.length - 1];
      const k1 = f(tk, yk);
      const k2 = f(tk + h / 2, yk + (h / 2) * k1);
      const yNext = yk + h * k2;
      t.push(tk + h);
      y.push(yNext);
    }
    return { t, y };
  }

  // Utilidades
  function clampSteps(t0, tf, h) {
    const n = Math.max(1, Math.floor((tf - t0) / h + 1e-9));
    return { n, h: (tf - t0) / n };
  }

  function computeExactSeries(exact, tSeries, params) {
    if (!exact) return null;
    return tSeries.map((ti) => exact(ti, params));
  }

  function round6(x) {
    return Math.abs(x) < 1e-14 ? 0 : Math.round(x * 1e6) / 1e6;
  }

  function errorMetrics(yNum, yExact) {
    if (!yExact) return { max: null, rms: null };
    const n = Math.min(yNum.length, yExact.length);
    if (n === 0) return { max: null, rms: null };
    let maxErr = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const e = Math.abs(yNum[i] - yExact[i]);
      if (e > maxErr) maxErr = e;
      sumSq += e * e;
    }
    return { max: maxErr, rms: Math.sqrt(sumSq / n) };
  }

  // Estado y UI
  let chart;
  let errorChart;
  let animTimer = null;
  let animIdx = 0;
  let animData = null; // {t, eulerY, rk2Y, exactY, n, h}
  let animSpeed = 0.25; // 0.25x por defecto (velocidad mínima)

  function initPviSelect() {
    const sel = $('pviSelect');
    sel.innerHTML = '';
    for (const p of PVIS) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    }
    // Opción personalizada
    const optCustom = document.createElement('option');
    optCustom.value = 'custom';
    optCustom.textContent = 'Personalizado';
    sel.appendChild(optCustom);
  }

  function loadDefaults(pvi) {
    $('t0').value = pvi.defaults.t0;
    $('tf').value = pvi.defaults.tf;
    $('y0').value = pvi.defaults.y0;
    $('hRange').value = pvi.defaults.h;
    $('pviDesc').innerHTML = pvi.desc;
    syncNumberFromRange();
    renderMath();
  }

  function getSelectedPvi() {
    const id = $('pviSelect').value;
    if (id === 'custom') {
      return {
        id: 'custom',
        name: 'Personalizado',
        // f se definirá desde la expresión del usuario en run()
        f: (t, y) => y,
        exact: null,
        defaults: { t0: 0, tf: 2, y0: 1, h: 0.2 },
        desc: 'Define tu propia ecuación f(t, y). Opcionalmente, agrega la solución exacta y(t).'
      };
    }
    return PVIS.find((p) => p.id === id) || PVIS[0];
  }

  function readParams() {
    const pvi = getSelectedPvi();
    const t0 = parseFloat($('t0').value);
    const tf = parseFloat($('tf').value);
    const y0 = parseFloat($('y0').value);
    let h = Math.max(1e-6, Math.abs(parseFloat($('hRange').value)) || pvi.defaults.h);
    let a = Math.min(t0, tf), b = Math.max(t0, tf);
    const { n, h: hAdj } = clampSteps(a, b, h);
    h = hAdj;
    return { pvi, t0: a, tf: b, y0, h, n };
  }

  // Parsear f(t,y) de una expresión segura (usado para modo personalizado)
  function buildExplorerFunction(expr) {
    if (!expr || !expr.trim()) return null;
    // Normalizar ^ a **
    let source = expr.replace(/\^/g, '**');
    // Validar caracteres permitidos
    const ok = /^[0-9t y+*\-\/%^()\[\]{}.,!?<>=|&:;\n\r\t\\A-Za-z]*$/.test(source);
    if (!ok) return null;
    // Envolver con with(Math)
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('t', 'y', 'with (Math) { return (' + source + '); }');
      // Probar con un par de valores
      const test = fn(0.1, 0.2);
      if (!isFinite(test)) {
        // Aun así permitimos infinito; pero mejor regresar función
      }
      return (t, y) => {
        const v = fn(t, y);
        return Number(v);
      };
    } catch (e) {
      return null;
    }
  }

  // Parsear y(t) solución exacta (variables: t, y0, t0)
  function buildExactFunction(expr) {
    if (!expr || !expr.trim()) return null;
    let source = expr.replace(/\^/g, '**');
    const ok = /^[0-9t y0+*\-\/%^()\[\]{}.,!?<>=|&:;\n\r\t\\A-Za-z]*$/.test(source);
    if (!ok) return null;
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('t', 'params', 'with (Math) { const y0 = params.y0; const t0 = params.t0; return (' + source + '); }');
      // Probar
      const test = fn(1, { y0: 1, t0: 0 });
      if (!isFinite(test)) {
        // Permitir pero puede haber problemas
      }
      return (t, params) => {
        const v = fn(t, params);
        return Number(v);
      };
    } catch (e) {
      return null;
    }
  }

  function ensureChart() {
    if (chart) return chart;
    const ctx = $('chart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 't' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { title: { display: true, text: 'y(t)' }, grid: { color: 'rgba(255,255,255,0.06)' } }
        },
        plugins: {
          legend: { display: true, labels: { color: '#e8eaed' } },
          tooltip: { mode: 'index', intersect: false }
        },
        elements: { point: { radius: 0 } },
        animation: { duration: 250 },
      }
    });
    return chart;
  }

  function ensureErrorChart() {
    if (errorChart) return errorChart;
    const ctx = $('errorChart').getContext('2d');
    errorChart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 't' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { title: { display: true, text: '|error|' }, grid: { color: 'rgba(255,255,255,0.06)' } }
        },
        plugins: { legend: { display: true, labels: { color: '#e8eaed' } } },
        elements: { point: { radius: 0 } },
        animation: { duration: 200 }
      }
    });
    return errorChart;
  }

  function updateChart({ t, eulerY, rk2Y, exactY }) {
    const datasets = [];
    
    // Siempre mostrar Exacta si existe
    if (exactY) {
      datasets.push({
        label: 'Exacta',
        data: exactY,
        borderColor: '#7ae0c3',
        backgroundColor: 'rgba(122,224,195,0.2)',
        borderWidth: 2,
        tension: 0.15,
      });
    }
    
    // Siempre mostrar Euler
    datasets.push({
      label: 'Euler',
      data: eulerY,
      borderColor: '#6aa4ff',
      backgroundColor: 'rgba(106,164,255,0.15)',
      borderDash: [4, 3],
      borderWidth: 2,
      tension: 0.15,
    });
    
    // Siempre mostrar RK2
    datasets.push({
      label: 'RK2',
      data: rk2Y,
      borderColor: '#ffd166',
      backgroundColor: 'rgba(255,209,102,0.15)',
      borderWidth: 2,
      tension: 0.15,
    });

    const c = ensureChart();
    c.data.labels = t.map((v) => round6(v));
    c.data.datasets = datasets;
    c.update();
    renderMath();
  }

  function renderMetrics({ eulerY, rk2Y, exactY, n, h }) {
    const eulerErr = errorMetrics(eulerY, exactY);
    const rk2Err = errorMetrics(rk2Y, exactY);
    $('eulerMax').textContent = eulerErr.max == null ? '—' : round6(eulerErr.max);
    $('eulerRms').textContent = eulerErr.rms == null ? '—' : round6(eulerErr.rms);
    $('rk2Max').textContent = rk2Err.max == null ? '—' : round6(rk2Err.max);
    $('rk2Rms').textContent = rk2Err.rms == null ? '—' : round6(rk2Err.rms);
    $('stepsInfo').textContent = `Pasos: ${n}  |  h efectivo: ${round6(h)}`;
    // Coste
    $('costSteps').textContent = n;
    $('costEuler').textContent = n; // una evaluación por paso
    $('costRK2').textContent = 2 * n; // dos evaluaciones por paso
    // Gráfico de error por punto
    if (exactY) {
      const eulerAbs = eulerY.map((v, i) => Math.abs(v - exactY[i]));
      const rk2Abs = rk2Y.map((v, i) => Math.abs(v - exactY[i]));
      const ec = ensureErrorChart();
      ec.data.labels = chart?.data?.labels || eulerY.map((_, i) => i);
      ec.data.datasets = [
        { label: 'Error Euler', data: eulerAbs, borderColor: '#ff8a8a', backgroundColor: 'rgba(255,138,138,0.15)', borderWidth: 2, tension: 0.15 },
        { label: 'Error RK2', data: rk2Abs, borderColor: '#ffd166', backgroundColor: 'rgba(255,209,102,0.15)', borderWidth: 2, tension: 0.15 }
      ];
      ec.update();
    }
  }

  function stopAnimation() {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
    }
  }

  function resetAnimation() {
    stopAnimation();
    animIdx = 0;
  }

  function startAnimation() {
    if (!animData) return;
    stopAnimation();
    const baseDelay = 180; // ms
    const delay = Math.max(30, baseDelay / animSpeed);
    animTimer = setInterval(() => {
      if (!animData) { stopAnimation(); return; }
      const { t, eulerY, rk2Y, exactY, n, h } = animData;
      const upto = Math.min(animIdx, t.length - 1);
      const slice = {
        t: t.slice(0, upto + 1),
        eulerY: eulerY.slice(0, upto + 1),
        rk2Y: rk2Y.slice(0, upto + 1),
        exactY: exactY ? exactY.slice(0, upto + 1) : null
      };
      updateChart(slice);
      renderMetrics({ eulerY: slice.eulerY, rk2Y: slice.rk2Y, exactY: slice.exactY, n: upto, h });
      animIdx += 1;
      if (animIdx >= t.length) stopAnimation();
    }, delay);
  }

  function run() {
    const { pvi, t0, tf, y0, h, n } = readParams();
    let useExact = !!pvi.exact;
    let exactFunc = pvi.exact;
    let fImpl = pvi.f;
    
    if (pvi.id === 'custom') {
      const expr = $('customExpr').value;
      const fUser = buildExplorerFunction(expr);
      if (!fUser) {
        // Mostrar error y no actualizar resultados
        const err = $('customError');
        if (err) err.style.display = 'block';
        const ta = $('customExpr');
        if (ta) ta.style.borderColor = '#ff8a8a';
        return;
      }
      // Limpiar error si existe
      const err = $('customError');
      if (err) err.style.display = 'none';
      const ta = $('customExpr');
      if (ta) ta.style.borderColor = '';
      fImpl = fUser;
      
      // Intentar parsear solución exacta personalizada
      const exactExpr = $('customExact').value;
      if (exactExpr && exactExpr.trim()) {
        const exactUser = buildExactFunction(exactExpr);
        if (!exactUser) {
          // Mostrar error en solución exacta
          const errExact = $('exactError');
          if (errExact) errExact.style.display = 'block';
          const taExact = $('customExact');
          if (taExact) taExact.style.borderColor = '#ff8a8a';
          useExact = false;
          exactFunc = null;
        } else {
          // Limpiar error
          const errExact = $('exactError');
          if (errExact) errExact.style.display = 'none';
          const taExact = $('customExact');
          if (taExact) taExact.style.borderColor = '';
          useExact = true;
          exactFunc = exactUser;
        }
      } else {
        // No hay solución exacta - limpiar errores
        const errExact = $('exactError');
        if (errExact) errExact.style.display = 'none';
        const taExact = $('customExact');
        if (taExact) taExact.style.borderColor = '';
        useExact = false;
        exactFunc = null;
      }
    }
    
    const solverParams = { f: fImpl, t0, y0, h, n };
    const eul = euler(solverParams);
    const rk = rk2(solverParams);
    const exactY = useExact && exactFunc ? computeExactSeries(exactFunc, eul.t, { y0, t0 }) : null;

    animData = { t: eul.t, eulerY: eul.y, rk2Y: rk.y, exactY, n, h };
    resetAnimation();
    updateChart(animData);
    renderMetrics(animData);
  }

  function reset() {
    const pvi = getSelectedPvi();
    loadDefaults(pvi);
    run();
  }

  function wireEvents() {
    $('pviSelect').addEventListener('change', () => {
      const pvi = getSelectedPvi();
      // Mostrar/ocultar grupo personalizado y manejar exacta
      const isCustom = pvi.id === 'custom';
      const cg = $('customGroup');
      if (cg) cg.style.display = isCustom ? 'block' : 'none';
      // Limpiar mensajes/estilos al cambiar selección
      const err = $('customError');
      if (err) err.style.display = 'none';
      const ta = $('customExpr');
      if (ta) ta.style.borderColor = '';
      const errExact = $('exactError');
      if (errExact) errExact.style.display = 'none';
      const taExact = $('customExact');
      if (taExact) taExact.style.borderColor = '';
      loadDefaults(pvi);
      run();
    });
    $('t0').addEventListener('change', run);
    $('tf').addEventListener('change', run);
    $('y0').addEventListener('change', run);
    $('hRange').addEventListener('input', () => { syncNumberFromRange(); run(); });
    $('customExpr').addEventListener('input', () => { if (getSelectedPvi().id === 'custom') run(); });
    $('customExact').addEventListener('input', () => { if (getSelectedPvi().id === 'custom') run(); });
    $('resetBtn').addEventListener('click', reset);

    $('animPlay').addEventListener('click', () => { startAnimation(); });
    $('animPause').addEventListener('click', () => { stopAnimation(); });
    $('animReset').addEventListener('click', () => { resetAnimation(); updateChart({ t: animData.t.slice(0,1), eulerY: animData.eulerY.slice(0,1), rk2Y: animData.rk2Y.slice(0,1), exactY: animData.exactY ? animData.exactY.slice(0,1) : null }); renderMetrics({ eulerY: animData.eulerY.slice(0,1), rk2Y: animData.rk2Y.slice(0,1), exactY: animData.exactY ? animData.exactY.slice(0,1) : null, n: 1, h: animData.h }); });
    $('animSpeed').addEventListener('input', () => { animSpeed = parseFloat($('animSpeed').value) || 1; if (animTimer) startAnimation(); });
  }

  function syncRangeFromNumber() {
    const hv = Math.max(0.0001, parseFloat($('hRange').value) || 0.1);
    const badge = $('hVal'); 
    if (badge) badge.textContent = String(round6(hv));
  }
  
  function syncNumberFromRange() {
    const hv = parseFloat($('hRange').value);
    const badge = $('hVal'); 
    if (badge) badge.textContent = String(round6(hv));
  }

  // Renderizado matemático con KaTeX (auto-render)
  function renderMath() {
    if (typeof renderMathInElement !== 'function') {
      // Si aún no está cargado, intentar de nuevo
      setTimeout(renderMath, 100);
      return;
    }
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }

  // Init cuando el DOM y scripts estén listos
  function init() {
    initPviSelect();
    loadDefaults(PVIS[0]);
    syncRangeFromNumber();
    wireEvents();
    run();
    // Renderizar fórmulas después de cargar todo
    setTimeout(renderMath, 50);
  }

  // Esperar a que KaTeX esté disponible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Hide/Show header on scroll
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const currentScrollY = window.scrollY;

    if (currentScrollY < 100) {
      // Siempre mostrar en la parte superior
      header.classList.remove('hidden');
    } else if (currentScrollY > lastScrollY) {
      // Scrolling down - ocultar
      header.classList.add('hidden');
    } else {
      // Scrolling up - mostrar
      header.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // CASOS REALES INTERACTIVOS
  const REAL_WORLD_CASES = [
    {
      id: 'redes',
      title: 'Simulación de Tráfico de Red',
      description: 'Necesitas simular el tráfico de red en tiempo real para un sistema de monitoreo. Requieres alta precisión para detectar anomalías y evitar falsos positivos.',
      correct: 'rk2',
      icon: '🌐',
      feedback: {
        correct: '✓ Correcto. En sistemas de red críticos, RK2 ofrece la precisión necesaria para detectar patrones anómalos sin falsos positivos que sobrecarguen el sistema.',
        incorrect: '✗ Incorrecto. Los sistemas de red requieren precisión para evitar falsas alarmas. RK2 es necesario aquí.'
      }
    },
    {
      id: 'prototipo',
      title: 'Prototipo de Algoritmo',
      description: 'Estás desarrollando un prototipo de algoritmo de optimización. Necesitas validar rápidamente la idea antes de implementar la versión final.',
      correct: 'euler',
      icon: '💻',
      feedback: {
        correct: '✓ Correcto. En prototipos de software, la simplicidad y velocidad de Euler permiten validar ideas rápidamente. La optimización final puede usar métodos más precisos.',
        incorrect: '✗ Incorrecto. Para prototipos rápidos en software, Euler es más apropiado por su menor complejidad y velocidad de implementación.'
      }
    },
    {
      id: 'distribuido',
      title: 'Sistema Distribuido con Consenso',
      description: 'Simulando el comportamiento de un sistema distribuido que requiere consenso (blockchain, bases de datos distribuidas). La precisión es crítica para la consistencia.',
      correct: 'rk2',
      icon: '🔗',
      feedback: {
        correct: '✓ Correcto. En sistemas distribuidos, la precisión es esencial para garantizar consistencia y evitar estados inconsistentes. RK2 previene errores acumulados.',
        incorrect: '✗ Incorrecto. Los sistemas distribuidos requieren alta precisión para mantener consistencia. RK2 es esencial para evitar errores en cascada.'
      }
    },
    {
      id: 'game',
      title: 'Motor de Física para Videojuego',
      description: 'Desarrollando un motor de física básico para un videojuego indie. Necesitas cálculos rápidos que se ejecuten a 60 FPS sin afectar el rendimiento.',
      correct: 'euler',
      icon: '🎮',
      feedback: {
        correct: '✓ Correcto. En videojuegos, el rendimiento en tiempo real es prioritario. Euler es suficiente para física básica y mantiene alto FPS.',
        incorrect: '✗ Incorrecto. Para motores de física en tiempo real, Euler es preferible por su bajo coste computacional, permitiendo altos FPS.'
      }
    },
    {
      id: 'ml',
      title: 'Entrenamiento de Modelo de Machine Learning',
      description: 'Simulando la dinámica de optimización durante el entrenamiento de una red neuronal. Necesitas precisión para converger correctamente.',
      correct: 'rk2',
      icon: '🤖',
      feedback: {
        correct: '✓ Correcto. En entrenamiento de ML, RK2 proporciona la precisión necesaria para convergencia estable y evitar oscilaciones en el gradiente.',
        incorrect: '✗ Incorrecto. El entrenamiento de ML requiere precisión para convergencia estable. RK2 evita errores que pueden afectar el aprendizaje.'
      }
    },
    {
      id: 'scheduler',
      title: 'Planificador de Tareas del SO',
      description: 'Prototipando un algoritmo de planificación de procesos para un sistema operativo. Necesitas resultados rápidos para iterar y probar diferentes políticas.',
      correct: 'euler',
      icon: '⚙️',
      feedback: {
        correct: '✓ Correcto. En desarrollo de sistemas operativos, los prototipos requieren rapidez. Euler permite iterar rápidamente sobre diferentes políticas de scheduling.',
        incorrect: '✗ Incorrecto. Para prototipos de sistemas operativos donde se itera frecuentemente, Euler es más eficiente para desarrollo rápido.'
      }
    }
  ];

  function renderRealWorldCases() {
    const grid = document.getElementById('casesGrid');
    if (!grid) return;

    grid.innerHTML = '';

    REAL_WORLD_CASES.forEach((caseData, index) => {
      const card = document.createElement('div');
      card.className = 'case-card';
      card.dataset.caseId = caseData.id;
      card.dataset.correct = caseData.correct;

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="font-size: 32px;">${caseData.icon}</span>
          <h3 class="case-title">${caseData.title}</h3>
        </div>
        <p class="case-description">${caseData.description}</p>
        <div class="case-options">
          <button class="case-option" data-option="euler" data-case-id="${caseData.id}">Euler</button>
          <button class="case-option" data-option="rk2" data-case-id="${caseData.id}">RK2</button>
        </div>
        <div class="case-feedback" id="feedback-${caseData.id}"></div>
      `;

      grid.appendChild(card);
    });

    // Agregar event listeners a los botones
    document.querySelectorAll('.case-option').forEach(btn => {
      btn.addEventListener('click', handleCaseSelection);
    });
  }

  function handleCaseSelection(e) {
    const btn = e.target;
    const caseId = btn.dataset.caseId;
    const selectedOption = btn.dataset.option;
    const card = document.querySelector(`[data-case-id="${caseId}"]`);
    const correctAnswer = card.dataset.correct;
    const caseData = REAL_WORLD_CASES.find(c => c.id === caseId);
    
    if (!card || !caseData) return;

    // Deshabilitar todas las opciones de esta tarjeta
    card.querySelectorAll('.case-option').forEach(opt => {
      opt.style.pointerEvents = 'none';
    });

    // Marcar selección
    btn.classList.add('selected');

    // Verificar respuesta
    const isCorrect = selectedOption === correctAnswer;
    
    if (isCorrect) {
      card.classList.add('correct');
      btn.classList.add('correct-answer');
      showFeedback(caseId, caseData.feedback.correct, true);
    } else {
      card.classList.add('incorrect');
      btn.classList.add('wrong-answer');
      // Mostrar la respuesta correcta
      const correctBtn = card.querySelector(`[data-option="${correctAnswer}"]`);
      if (correctBtn) {
        correctBtn.classList.add('correct-answer');
      }
      showFeedback(caseId, caseData.feedback.incorrect, false);
    }

    // Actualizar puntuación
    updateScore();
  }

  function showFeedback(caseId, message, isCorrect) {
    const feedbackEl = document.getElementById(`feedback-${caseId}`);
    if (!feedbackEl) return;
    
    feedbackEl.textContent = message;
    feedbackEl.className = `case-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
  }

  function updateScore() {
    const cards = document.querySelectorAll('.case-card');
    let total = cards.length;
    let correct = 0;
    let answered = 0;

    cards.forEach(card => {
      if (card.classList.contains('correct')) {
        correct++;
        answered++;
      } else if (card.classList.contains('incorrect')) {
        answered++;
      }
    });

    const scoreEl = document.getElementById('casesScore');
    if (!scoreEl) return;

    // Mostrar puntuación cuando todos los casos han sido respondidos
    if (answered === total && total > 0) {
      scoreEl.style.display = 'block';
      document.getElementById('scoreCorrect').textContent = correct;
      document.getElementById('scoreTotal').textContent = total;
      
      const scoreText = document.getElementById('scoreText');
      const percentage = Math.round((correct / total) * 100);
      
      if (percentage === 100) {
        scoreText.textContent = '¡Perfecto! Dominas completamente cuándo usar cada método.';
      } else if (percentage >= 75) {
        scoreText.textContent = '¡Muy bien! Entiendes bien las diferencias entre los métodos.';
      } else if (percentage >= 50) {
        scoreText.textContent = 'Bien, pero puedes mejorar. Revisa las ventajas y desventajas de cada método.';
      } else {
        scoreText.textContent = 'Sigue practicando. Recuerda: Euler para rapidez, RK2 para precisión.';
      }

      // Scroll suave a la puntuación
      setTimeout(() => {
        scoreEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  function resetCases() {
    const grid = document.getElementById('casesGrid');
    const scoreEl = document.getElementById('casesScore');
    
    if (scoreEl) scoreEl.style.display = 'none';
    
    if (grid) {
      renderRealWorldCases();
    }
  }

  // Inicializar casos cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(renderRealWorldCases, 100);
    });
  } else {
    setTimeout(renderRealWorldCases, 100);
  }

  // Botón de reset
  document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('resetCases');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetCases);
    }
  });
})();


