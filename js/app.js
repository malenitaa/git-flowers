/**
 * Orquestacion de la app: formulario, parametro de URL, selector de anio,
 * boton de compartir y tooltip sobre el canvas.
 */
window.GF = window.GF || {};

(function () {
  let dom = {};
  let appState = { username: null, apiData: null };

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(message, kind) {
    dom.status.textContent = message || '';
    dom.status.className = 'status' + (kind ? ' status--' + kind : '');
  }

  function usernameFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    if (user && GF.github.isValidUsername(user)) return user;
    return null;
  }

  function updateUrl(username) {
    const url = new URL(window.location.href);
    url.searchParams.set('user', username);
    window.history.replaceState({}, '', url.toString());
  }

  function stageLabel(stage) {
    return GF.config.STAGE_NAMES[stage] || '';
  }

  const weekFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });

  function renderYear(year) {
    const days = GF.garden.daysForYear(appState.apiData, year);
    if (days.length === 0) {
      setStatus('No contribution data for ' + year + '.', 'error');
      return;
    }
    const plots = GF.garden.buildPlots(days);
    const plantTypeIndex = GF.garden.plantTypeForUsername(appState.username);
    const plantType = GF.sprites.getPlantType(plantTypeIndex);

    GF.render.render(dom.canvas, plots, plantType);

    const totalCommits = plots.reduce((sum, p) => sum + p.commits, 0);
    dom.legend.textContent =
      'Species: ' + plantType.name + ' · ' + totalCommits + ' commits in ' + year;

    dom.canvasWrap.hidden = false;
    dom.shareBtn.hidden = false;
  }

  function populateYearSelect(years, selected) {
    while (dom.yearSelect.firstChild) {
      dom.yearSelect.removeChild(dom.yearSelect.firstChild);
    }
    years.forEach((year) => {
      const opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      if (year === selected) opt.selected = true;
      dom.yearSelect.appendChild(opt);
    });
    dom.yearSelect.hidden = years.length <= 1;
  }

  async function loadGarden(username) {
    setStatus('Growing ' + username + '\'s garden...', 'loading');
    dom.canvasWrap.hidden = true;
    dom.shareBtn.hidden = true;
    dom.yearSelect.hidden = true;

    try {
      const data = await GF.github.fetchContributions(username);
      const years = GF.garden.extractYears(data);
      if (years.length === 0) {
        setStatus('That user has no public contributions recorded.', 'error');
        return;
      }
      appState.username = username;
      appState.apiData = data;

      const currentYear = String(new Date().getFullYear());
      const defaultYear = years.includes(currentYear) ? currentYear : years[0];

      populateYearSelect(years, defaultYear);
      renderYear(defaultYear);
      updateUrl(username);
      setStatus('', null);
    } catch (err) {
      setStatus(err.message || 'An unexpected error occurred.', 'error');
    }
  }

  function setupTooltip() {
    dom.canvas.addEventListener('mousemove', (ev) => {
      const rect = dom.canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const index = GF.render.plotIndexAt(x, y);
      GF.render.setHover(index);

      if (index === -1) {
        dom.tooltip.hidden = true;
        return;
      }
      const plot = GF.render.getPlot(index);
      if (!plot) {
        dom.tooltip.hidden = true;
        return;
      }
      dom.tooltip.hidden = false;
      dom.tooltip.style.left = ev.clientX + 14 + 'px';
      dom.tooltip.style.top = ev.clientY + 14 + 'px';
      const from = weekFormatter.format(plot.startDate);
      const to = weekFormatter.format(plot.endDate);
      dom.tooltip.textContent =
        'Week of ' + from + ' to ' + to +
        ' — ' + plot.commits + (plot.commits === 1 ? ' commit' : ' commits') +
        ' (' + stageLabel(plot.stage) + ')' +
        (plot.inLongStreak ? ' · long streak' : '');
    });

    dom.canvas.addEventListener('mouseleave', () => {
      GF.render.setHover(-1);
      dom.tooltip.hidden = true;
    });
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback para navegadores sin API de clipboard / permisos denegados.
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e2) {
        ok = false;
      }
      document.body.removeChild(textarea);
      return ok;
    }
  }

  function setupForm() {
    dom.form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const value = dom.usernameInput.value.trim();
      if (!GF.github.isValidUsername(value)) {
        setStatus('That doesn\'t look like a valid GitHub username.', 'error');
        return;
      }
      loadGarden(value);
    });

    dom.yearSelect.addEventListener('change', () => {
      renderYear(dom.yearSelect.value);
    });

    dom.shareBtn.addEventListener('click', async () => {
      const url = new URL(window.location.href);
      url.searchParams.set('user', appState.username);
      const ok = await copyToClipboard(url.toString());
      dom.shareBtn.textContent = ok ? 'Copied ✓' : 'Could not copy';
      setTimeout(() => {
        dom.shareBtn.textContent = 'Share garden';
      }, 1800);
    });
  }

  function init() {
    dom = {
      form: $('gardenForm'),
      usernameInput: $('usernameInput'),
      status: $('status'),
      yearSelect: $('yearSelect'),
      shareBtn: $('shareBtn'),
      canvasWrap: $('canvasWrap'),
      canvas: $('gardenCanvas'),
      legend: $('legend'),
      tooltip: $('tooltip'),
    };

    setupForm();
    setupTooltip();

    const urlUser = usernameFromUrl();
    if (urlUser) {
      dom.usernameInput.value = urlUser;
      loadGarden(urlUser);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
