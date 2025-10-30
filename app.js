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
      desc: 'Crecimiento exponencial: solución exacta y(t) = y0 e^t.'
    },
    {
      id: 'decay',
      name: "y' = -2 y, y(0) = 1",
      f: (t, y) => -2 * y,
      exact: (t, { y0, t0 }) => y0 * Math.exp(-2 * (t - t0)),
      defaults: { t0: 0, tf: 2, y0: 1, h: 0.2 },
      desc: 'Decaimiento exponencial: solución y(t) = y0 e^{-2t}.'
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
      desc: 'Ecuación lineal no homogénea: y' + " = t + y; exacta y = -t - 1 + (y0+1)e^t."
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
      desc: 'Ecuación con forzamiento sinusoidal: solución exacta disponible.'
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
      desc: 'Crecimiento logístico: solución exacta cerrada.'
    },
    {
      id: 'poly2t',
      name: "y' = 2t, y(0) = 0",
      f: (t, y) => 2 * t,
      exact: (t, { y0, t0 }) => y0 + (t - t0) * (t + t0), // y = y0 + t^2 - t0^2
      defaults: { t0: 0, tf: 5, y0: 0, h: 0.2 },
      desc: 'Campo simple: solución polinómica y(t) = y0 + t^2 - t0^2.'
    },
    {
      id: 'ysq',
      name: "y' = y^2, y(0) = 0.5",
      f: (t, y) => y * y,
      exact: (t, { y0, t0 }) => y0 / (1 - y0 * (t - t0)),
      defaults: { t0: 0, tf: 1.5, y0: 0.5, h: 0.05 },
      desc: 'No lineal con posible blow-up: y(t) = y0 / (1 - y0(t - t0)).'
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
      desc: 'Lineal con término en t: particular polinómica, exacta cerrada.'
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
      desc: 'Lineal estable con forzamiento cosenoidal y decaimiento exponencial.'
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
      const k2 = f(tk + h, yk + h * k1);
      const yNext = yk + (h / 2) * (k1 + k2);
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
  let animSpeed = 1; // 1x por defecto

  function initPviSelect() {
    const sel = $('pviSelect');
    sel.innerHTML = '';
    for (const p of PVIS) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    }
  }

  function loadDefaults(pvi) {
    $('t0').value = pvi.defaults.t0;
    $('tf').value = pvi.defaults.tf;
    $('y0').value = pvi.defaults.y0;
    $('hRange').value = pvi.defaults.h;
    $('showExact').checked = true;
    $('toggleEuler').checked = true;
    $('toggleRK2').checked = true;
    $('toggleExact').checked = true;
    $('pviDesc').textContent = pvi.desc;
    syncNumberFromRange();
    renderMath();
  }

  function getSelectedPvi() {
    const id = $('pviSelect').value;
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

  // Explorador: parsear f(t,y) de una expresión segura
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
    const showEuler = $('toggleEuler').checked;
    const showRK2 = $('toggleRK2').checked;
    const showExact = $('toggleExact').checked && $('showExact').checked && !!exactY;

    const datasets = [];
    if (showExact && exactY) {
      datasets.push({
        label: 'Exacta',
        data: exactY,
        borderColor: '#7ae0c3',
        backgroundColor: 'rgba(122,224,195,0.2)',
        borderWidth: 2,
        tension: 0.15,
      });
    }
    if (showEuler) {
      datasets.push({
        label: 'Euler',
        data: eulerY,
        borderColor: '#6aa4ff',
        backgroundColor: 'rgba(106,164,255,0.15)',
        borderDash: [4, 3],
        borderWidth: 2,
        tension: 0.15,
      });
    }
    if (showRK2) {
      datasets.push({
        label: 'RK2',
        data: rk2Y,
        borderColor: '#ffd166',
        backgroundColor: 'rgba(255,209,102,0.15)',
        borderWidth: 2,
        tension: 0.15,
      });
    }

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
    let useExact = $('showExact').checked;
    let fImpl = pvi.f;
    if ($('explorerToggle').checked) {
      const expr = $('explorerExpr').value;
      const fUser = buildExplorerFunction(expr);
      if (fUser) {
        fImpl = fUser;
        useExact = false;
        $('toggleExact').checked = false;
      }
    }
    const solverParams = { f: fImpl, t0, y0, h, n };
    const eul = euler(solverParams);
    const rk = rk2(solverParams);
    const exactY = useExact ? computeExactSeries(pvi.exact, eul.t, { y0, t0 }) : null;

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
    $('pviSelect').addEventListener('change', () => { loadDefaults(getSelectedPvi()); run(); });
    $('t0').addEventListener('change', run);
    $('tf').addEventListener('change', run);
    $('y0').addEventListener('change', run);
    $('hRange').addEventListener('input', () => { syncNumberFromRange(); run(); });
    $('showExact').addEventListener('change', run);
    $('explorerToggle').addEventListener('change', () => { const on = $('explorerToggle').checked; $('pviSelect').disabled = on; $('showExact').disabled = on; run(); });
    $('explorerExpr').addEventListener('input', () => { if ($('explorerToggle').checked) run(); });
    $('runBtn').addEventListener('click', run);
    $('resetBtn').addEventListener('click', reset);
    $('toggleEuler').addEventListener('change', run);
    $('toggleRK2').addEventListener('change', run);
    $('toggleExact').addEventListener('change', run);

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
})();


