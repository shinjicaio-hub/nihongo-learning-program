(function () {
  const API_BASE = ''; // mesma origem (backend serve este HTML)

  function getToken() {
    try {
      const data = localStorage.getItem('nihongo_user');
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  }

  function setToken(data) {
    localStorage.setItem('nihongo_user', JSON.stringify(data));
  }

  function clearToken() {
    localStorage.removeItem('nihongo_user');
  }

  function authHeaders() {
    const data = getToken();
    return {
      'Content-Type': 'application/json',
      ...(data && data.token ? { Authorization: 'Bearer ' + data.token } : {})
    };
  }

  async function api(path, options = {}) {
    const url = (path.startsWith('http') ? path : API_BASE + path);
    const res = await fetch(url, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) }
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {}
    if (!res.ok) {
      const err = new Error(json?.message || res.statusText || 'Erro na requisição');
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  }

  // --- Login
  const loginScreen = document.getElementById('login-screen');
  const loggedApp = document.getElementById('logged-app');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const ACTIVE_TAB_STORAGE_KEY = 'nihongo_active_tab';
  const VALID_TAB_IDS = ['inicio', 'kana', 'licoes', 'classes', 'vocabulario', 'historico', 'banco'];

  function showLogin() {
    loginScreen.hidden = false;
    loggedApp.hidden = true;
    clearToken();
    cachedFavoriteLessonIds = new Set();
    inicioResumeLessonId = '';
  }

  function getSavedTab() {
    try {
      const tabId = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      return VALID_TAB_IDS.includes(tabId) ? tabId : 'inicio';
    } catch (_) {
      return 'inicio';
    }
  }

  function saveActiveTab(tabId) {
    if (!VALID_TAB_IDS.includes(tabId)) return;
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tabId);
    } catch (_) {}
  }

  function showLoggedApp(user) {
    loginScreen.hidden = true;
    loggedApp.hidden = false;
    document.getElementById('user-email').textContent = user.email || '';
    switchTab(getSavedTab());
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) return;
    loginBtn.disabled = true;
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.success && res.data) {
        setToken({ token: res.data.token, user: res.data.user });
        showLoggedApp(res.data.user);
      }
    } catch (err) {
      loginError.textContent = err.body?.message || err.message || 'Falha no login';
      loginError.hidden = false;
    } finally {
      loginBtn.disabled = false;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', showLogin);

  // --- Abas
  function switchTab(tabId) {
    const nextTabId = VALID_TAB_IDS.includes(tabId) ? tabId : 'inicio';
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === nextTabId));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + nextTabId));
    saveActiveTab(nextTabId);
    const activeTabBtn = document.querySelector('.tab[data-tab="' + nextTabId + '"]');
    if (activeTabBtn && typeof activeTabBtn.scrollIntoView === 'function') {
      activeTabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    if (nextTabId === 'inicio') loadInicio();
    if (nextTabId === 'historico') loadHistorico();
    if (nextTabId === 'banco') loadBanco();
    if (nextTabId === 'kana') renderKana();
    if (nextTabId === 'licoes') loadLicoes();
    if (nextTabId === 'vocabulario') resetVocabTab();
    if (nextTabId === 'classes' && typeof window.loadClassesTab === 'function') window.loadClassesTab();
  }

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const MANUAL_STREAK_STORAGE_KEY = 'nihongo_manual_streak_days';
  const MAX_MANUAL_STREAK_DAYS = 30;
  let inicioTestControlsBound = false;
  let inicioLoadRequestId = 0;
  let inicioResumeLessonId = '';
  let cachedFavoriteLessonIds = new Set();
  let cachedLessonsList = [];
  let cachedLessonProgressById = new Map();
  let activeLessonsFilter = 'all';
  let licoesFiltersBound = false;

  function getManualStreakDays() {
    try {
      const raw = localStorage.getItem(MANUAL_STREAK_STORAGE_KEY);
      if (raw == null || raw === '') return null;
      const value = parseInt(raw, 10);
      if (Number.isNaN(value) || value < 0) return null;
      return Math.min(value, MAX_MANUAL_STREAK_DAYS);
    } catch (_) {
      return null;
    }
  }

  function setManualStreakDays(value) {
    const safeValue = Math.max(0, Math.min(Number(value) || 0, MAX_MANUAL_STREAK_DAYS));
    localStorage.setItem(MANUAL_STREAK_STORAGE_KEY, String(safeValue));
  }

  function clearManualStreakDays() {
    localStorage.removeItem(MANUAL_STREAK_STORAGE_KEY);
  }

  function setInicioTestStatus(message, isError = false) {
    const statusEl = document.getElementById('inicio-streak-test-status');
    if (!statusEl) return;
    if (!message) {
      statusEl.hidden = true;
      statusEl.textContent = '';
      statusEl.className = 'muted';
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.className = isError ? 'error-msg' : 'muted';
  }

  function syncInicioTestControls() {
    const inputEl = document.getElementById('inicio-streak-manual-input');
    if (!inputEl) return;
    const manualStreak = getManualStreakDays();
    inputEl.value = manualStreak == null ? '' : String(manualStreak);
  }

  function getManualStreakNote(days) {
    if (days === 0) {
      return 'Modo de teste ativo: ofensiva zerada manualmente para demonstração. Use "Voltar ao automático" para restaurar o cálculo real.';
    }
    if (days === 1) {
      return 'Modo de teste ativo: ofensiva ajustada manualmente para 1 dia consecutivo. Use "Voltar ao automático" para restaurar o cálculo real.';
    }
    return 'Modo de teste ativo: ofensiva ajustada manualmente para ' + days + ' dias consecutivos. Use "Voltar ao automático" para restaurar o cálculo real.';
  }

  function renderManualStreak(days) {
    setInicioTestStatus('Modo de teste ativo. A ofensiva exibida está usando o valor manual.');
    setInicioStreakState(days, getManualStreakNote(days), days === 0 ? 'empty' : '');
    renderEmptyHeatmap('Modo de teste ativo: heatmap pausado.');
  }

  function bindInicioTestControls() {
    if (inicioTestControlsBound) return;
    inicioTestControlsBound = true;
    const inputEl = document.getElementById('inicio-streak-manual-input');
    const applyBtn = document.getElementById('inicio-streak-manual-apply');
    const resetBtn = document.getElementById('inicio-streak-manual-reset');
    if (!inputEl || !applyBtn || !resetBtn) return;

    const applyManualValue = () => {
      const value = parseInt(inputEl.value, 10);
      if (Number.isNaN(value) || value < 0 || value > MAX_MANUAL_STREAK_DAYS) {
        setInicioTestStatus('Informe um número inteiro entre 0 e ' + MAX_MANUAL_STREAK_DAYS + '.', true);
        inputEl.focus();
        return;
      }
      setManualStreakDays(value);
      syncInicioTestControls();
      loadInicio();
    };

    applyBtn.addEventListener('click', applyManualValue);
    resetBtn.addEventListener('click', () => {
      clearManualStreakDays();
      syncInicioTestControls();
      setInicioTestStatus('');
      loadInicio();
    });
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyManualValue();
      }
    });
    syncInicioTestControls();
  }

  function getEntityId(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      if (value.$oid) return String(value.$oid);
      if (typeof value.toHexString === 'function') return value.toHexString();
      if (typeof value.toString === 'function') {
        const parsed = value.toString();
        if (parsed && parsed !== '[object Object]') return parsed;
      }
      if (value._id) return getEntityId(value._id);
    }
    return '';
  }

  function formatDisplayLabel(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function buildFavoriteLessonIdSet(progressList) {
    const favoriteIds = new Set();
    (progressList || []).forEach(progress => {
      if (!progress || !progress.favorite) return;
      const lessonId = getEntityId(progress.lesson_id || progress.lessonId);
      if (lessonId) favoriteIds.add(lessonId);
    });
    return favoriteIds;
  }

  function setFavoriteInCache(lessonId, isFavorite) {
    const normalizedId = getEntityId(lessonId);
    if (!normalizedId) return;
    if (isFavorite) cachedFavoriteLessonIds.add(normalizedId);
    else cachedFavoriteLessonIds.delete(normalizedId);
  }

  function updateFavoriteButton(buttonEl, isFavorite, isLoading = false) {
    if (!buttonEl) return;
    buttonEl.classList.toggle('active', isFavorite);
    buttonEl.classList.toggle('is-loading', isLoading);
    buttonEl.disabled = Boolean(isLoading);
    buttonEl.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
    buttonEl.title = isFavorite ? 'Desfavoritar lição' : 'Favoritar lição';
    const iconEl = buttonEl.querySelector('.favorite-icon');
    const textEl = buttonEl.querySelector('.favorite-text');
    if (iconEl) iconEl.textContent = isFavorite ? '★' : '☆';
    if (textEl) textEl.textContent = isFavorite ? 'Favorita' : 'Favoritar';
  }

  function syncFavoriteButtons(lessonId, isFavorite, isLoading = false) {
    const normalizedId = getEntityId(lessonId);
    if (!normalizedId) return;
    document.querySelectorAll('.favorite-toggle[data-id="' + normalizedId + '"]').forEach(buttonEl => {
      updateFavoriteButton(buttonEl, isFavorite, isLoading);
    });
  }

  function getFavoriteButtonMarkup(lessonId, isFavorite, extraClass = '') {
    const normalizedId = getEntityId(lessonId);
    const classes = ['favorite-toggle'];
    if (extraClass) classes.push(extraClass);
    if (isFavorite) classes.push('active');
    return (
      '<button type="button" class="' + classes.join(' ') + '" data-id="' + escapeHtml(normalizedId) + '" aria-pressed="' + (isFavorite ? 'true' : 'false') + '" title="' + (isFavorite ? 'Desfavoritar lição' : 'Favoritar lição') + '">' +
        '<span class="favorite-icon" aria-hidden="true">' + (isFavorite ? '★' : '☆') + '</span>' +
        '<span class="favorite-text">' + (isFavorite ? 'Favorita' : 'Favoritar') + '</span>' +
      '</button>'
    );
  }

  function bindFavoriteButtons(containerEl) {
    if (!containerEl) return;
    containerEl.querySelectorAll('.favorite-toggle').forEach(buttonEl => {
      if (buttonEl.dataset.bound) return;
      buttonEl.dataset.bound = '1';
      buttonEl.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await toggleLessonFavorite(buttonEl.dataset.id);
      });
    });
  }

  async function toggleLessonFavorite(lessonId) {
    const normalizedId = getEntityId(lessonId);
    if (!normalizedId) return;
    const nextFavorite = !cachedFavoriteLessonIds.has(normalizedId);
    syncFavoriteButtons(normalizedId, nextFavorite, true);
    try {
      const res = await api('/api/progress/lesson/' + normalizedId + '/favorite', {
        method: 'PUT',
        body: JSON.stringify({ favorite: nextFavorite })
      });
      const actualFavorite = Boolean(res && res.data && res.data.favorite);
      setFavoriteInCache(normalizedId, actualFavorite);
      syncFavoriteButtons(normalizedId, actualFavorite, false);
    } catch (e) {
      const currentFavorite = cachedFavoriteLessonIds.has(normalizedId);
      syncFavoriteButtons(normalizedId, currentFavorite, false);
      alert('Não foi possível atualizar o favorito: ' + (e.body?.message || e.message));
    }
  }

  function getLessonStatusInfo(progress) {
    if (!progress) return { status: 'not_started', label: 'Não iniciada' };
    if (progress.status === 'completed') return { status: 'completed', label: 'Concluída' };
    if (progress.status === 'in_progress') return { status: 'in_progress', label: 'Em andamento' };
    return { status: 'not_started', label: 'Não iniciada' };
  }

  function renderLessonCard(lesson) {
    const lessonId = getEntityId((lesson && (lesson._id || lesson.id)) || '');
    const isFavorite = cachedFavoriteLessonIds.has(lessonId);
    const progress = cachedLessonProgressById.get(lessonId);
    const statusInfo = getLessonStatusInfo(progress);
    const scoreSuffix = progress && typeof progress.score === 'number' && progress.score > 0
      ? ' · Nota ' + Math.round(progress.score)
      : '';
    return (
      '<article class="licao-card" data-id="' + escapeHtml(lessonId) + '">' +
        getFavoriteButtonMarkup(lessonId, isFavorite, 'licao-card-favorite') +
        '<button type="button" class="licao-card-open" data-id="' + escapeHtml(lessonId) + '">' +
          '<h4>' + escapeHtml((lesson && lesson.title) || 'Sem título') + '</h4>' +
          '<span class="meta">' + escapeHtml([lesson && lesson.level, lesson && lesson.category].filter(Boolean).join(' · ')) + '</span>' +
          '<span class="licao-status status-' + statusInfo.status + '">' + escapeHtml(statusInfo.label + scoreSuffix) + '</span>' +
        '</button>' +
      '</article>'
    );
  }

  function bindLicoesFilters() {
    if (licoesFiltersBound) return;
    licoesFiltersBound = true;
    document.querySelectorAll('.licoes-filter').forEach(buttonEl => {
      buttonEl.addEventListener('click', () => {
        activeLessonsFilter = buttonEl.dataset.filter || 'all';
        document.querySelectorAll('.licoes-filter').forEach(b => {
          const isActive = b === buttonEl;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        applyLessonsFilter();
      });
    });
  }

  function applyLessonsFilter() {
    const listEl = document.getElementById('licoes-list');
    const emptyEl = document.getElementById('licoes-empty-filter');
    if (!listEl) return;
    let filtered = cachedLessonsList;
    if (activeLessonsFilter === 'favorites') {
      filtered = cachedLessonsList.filter(lesson => {
        const id = getEntityId((lesson && (lesson._id || lesson.id)) || '');
        return cachedFavoriteLessonIds.has(id);
      });
    } else if (activeLessonsFilter === 'in_progress') {
      filtered = cachedLessonsList.filter(lesson => {
        const id = getEntityId((lesson && (lesson._id || lesson.id)) || '');
        const progress = cachedLessonProgressById.get(id);
        return progress && progress.status === 'in_progress';
      });
    } else if (activeLessonsFilter === 'completed') {
      filtered = cachedLessonsList.filter(lesson => {
        const id = getEntityId((lesson && (lesson._id || lesson.id)) || '');
        const progress = cachedLessonProgressById.get(id);
        return progress && progress.status === 'completed';
      });
    }

    if (filtered.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = activeLessonsFilter === 'favorites'
          ? 'Nenhuma lição favoritada ainda. Toque na estrela para favoritar.'
          : activeLessonsFilter === 'in_progress'
            ? 'Nenhuma lição em andamento. Abra uma lição para começar.'
            : activeLessonsFilter === 'completed'
              ? 'Nenhuma lição concluída ainda. Marque uma como concluída para vê-la aqui.'
              : 'Nenhuma lição encontrada.';
      }
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    listEl.innerHTML = filtered.map(renderLessonCard).join('');
    bindLessonCardActions(listEl);
  }

  function bindLessonCardActions(listEl) {
    if (!listEl) return;
    listEl.querySelectorAll('.licao-card-open').forEach(buttonEl => {
      if (buttonEl.dataset.bound) return;
      buttonEl.dataset.bound = '1';
      buttonEl.addEventListener('click', () => showLicaoDetail(buttonEl.dataset.id));
    });
    bindFavoriteButtons(listEl);
  }

  function setInicioResumeState({ title, description, meta = '', actionLabel = 'Explorar lições', lessonId = '', state = '' }) {
    const cardEl = document.getElementById('inicio-resume-card');
    const titleEl = document.getElementById('inicio-resume-title');
    const metaEl = document.getElementById('inicio-resume-meta');
    const descriptionEl = document.getElementById('inicio-resume-description');
    const actionBtn = document.getElementById('inicio-resume-btn');
    if (!cardEl || !titleEl || !metaEl || !descriptionEl || !actionBtn) return;
    inicioResumeLessonId = getEntityId(lessonId);
    cardEl.hidden = false;
    cardEl.classList.toggle('is-empty', state === 'empty');
    cardEl.classList.toggle('is-error', state === 'error');
    titleEl.textContent = title;
    descriptionEl.textContent = description;
    metaEl.hidden = !meta;
    metaEl.textContent = meta || '';
    actionBtn.textContent = actionLabel;
    actionBtn.disabled = false;
  }

  function setInicioResumeLoadingState() {
    const actionBtn = document.getElementById('inicio-resume-btn');
    setInicioResumeState({
      title: 'Continuar de onde parou',
      description: 'Buscando sua lição mais recente em andamento...',
      actionLabel: 'Carregando...'
    });
    if (actionBtn) actionBtn.disabled = true;
  }

  function bindInicioResumeButton() {
    const actionBtn = document.getElementById('inicio-resume-btn');
    if (!actionBtn || actionBtn.dataset.bound) return;
    actionBtn.dataset.bound = '1';
    actionBtn.addEventListener('click', () => {
      switchTab('licoes');
      if (inicioResumeLessonId) showLicaoDetail(inicioResumeLessonId);
    });
  }

  async function loadInicioResume(progressList, requestId) {
    if (!Array.isArray(progressList)) {
      setInicioResumeState({
        title: 'Não foi possível carregar sua retomada',
        description: 'Tente novamente em instantes ou abra a aba de lições para continuar estudando.',
        actionLabel: 'Abrir lições',
        state: 'error'
      });
      return;
    }

    const currentProgress = progressList.find(progress => progress && progress.status === 'in_progress');
    if (!currentProgress) {
      setInicioResumeState({
        title: 'Nenhuma lição em andamento',
        description: 'Abra uma lição para começar. Na próxima visita, ela aparecerá aqui para você retomar rapidamente.',
        actionLabel: 'Explorar lições',
        state: 'empty'
      });
      return;
    }

    const lessonId = getEntityId(currentProgress.lesson_id || currentProgress.lessonId);
    if (!lessonId) {
      setInicioResumeState({
        title: 'Retomar estudos',
        description: 'Encontramos uma lição em andamento, mas não foi possível identificar qual é.',
        actionLabel: 'Abrir lições',
        state: 'error'
      });
      return;
    }

    try {
      const lessonRes = await api('/api/lessons/' + lessonId);
      if (requestId !== inicioLoadRequestId) return;
      const data = lessonRes.data || {};
      const lesson = data.lesson || data;
      const meta = [
        lesson.level ? formatDisplayLabel(lesson.level) : '',
        lesson.category ? formatDisplayLabel(lesson.category) : '',
        currentProgress.last_accessed ? 'Último acesso: ' + formatDateTime(currentProgress.last_accessed) : ''
      ].filter(Boolean).join(' • ');

      setInicioResumeState({
        title: lesson.title || 'Retomar lição',
        description: lesson.description || 'Continue exatamente do ponto em que você parou.',
        meta,
        actionLabel: 'Continuar agora',
        lessonId
      });
    } catch (_) {
      if (requestId !== inicioLoadRequestId) return;
      setInicioResumeState({
        title: 'Retomar estudos',
        description: 'Há uma lição em andamento, mas não foi possível carregar seus detalhes agora.',
        meta: currentProgress.last_accessed ? 'Último acesso: ' + formatDateTime(currentProgress.last_accessed) : '',
        actionLabel: 'Abrir lição',
        lessonId,
        state: 'error'
      });
    }
  }

  function startOfLocalDay(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function shiftLocalDay(baseDate, days) {
    const date = startOfLocalDay(baseDate);
    if (!date) return null;
    date.setDate(date.getDate() + days);
    return date;
  }

  function getDayKey(value) {
    const date = startOfLocalDay(value);
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function calculateActivitySummary(activityTimestamps, windowDays = 30) {
    const today = startOfLocalDay(new Date());
    const windowStart = shiftLocalDay(today, -(windowDays - 1));
    const activeDayKeys = new Set();
    const dayCounts = new Map();

    activityTimestamps.forEach(timestamp => {
      const date = startOfLocalDay(timestamp);
      if (!date || date < windowStart || date > today) return;
      const dayKey = getDayKey(date);
      if (!dayKey) return;
      activeDayKeys.add(dayKey);
      dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
    });

    let mostRecentDay = null;
    for (let offset = 0; offset < windowDays; offset++) {
      const candidate = shiftLocalDay(today, -offset);
      if (activeDayKeys.has(getDayKey(candidate))) {
        mostRecentDay = candidate;
        break;
      }
    }

    let streak = 0;
    let cursor = mostRecentDay;
    while (cursor && activeDayKeys.has(getDayKey(cursor)) && streak < windowDays) {
      streak++;
      cursor = shiftLocalDay(cursor, -1);
    }

    return {
      streak,
      activeDays: activeDayKeys.size,
      mostRecentDay,
      dayCounts
    };
  }

  function intensityForCount(count) {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    return 3;
  }

  function renderActivityHeatmap(dayCounts, windowDays = 30) {
    const grid = document.getElementById('inicio-heatmap-grid');
    const summaryEl = document.getElementById('inicio-heatmap-summary');
    if (!grid) return;
    grid.innerHTML = '';
    const today = startOfLocalDay(new Date());
    let activeDays = 0;
    let totalEvents = 0;
    for (let offset = windowDays - 1; offset >= 0; offset--) {
      const day = shiftLocalDay(today, -offset);
      if (!day) continue;
      const key = getDayKey(day);
      const count = dayCounts && dayCounts.get ? (dayCounts.get(key) || 0) : 0;
      if (count > 0) {
        activeDays++;
        totalEvents += count;
      }
      const cell = document.createElement('div');
      cell.className = 'home-heatmap-cell level-' + intensityForCount(count);
      cell.setAttribute('role', 'listitem');
      const label = day.toLocaleDateString('pt-BR') +
        (count ? ' · ' + count + (count === 1 ? ' atividade' : ' atividades') : ' · sem atividade');
      cell.title = label;
      cell.setAttribute('aria-label', label);
      grid.appendChild(cell);
    }
    if (summaryEl) {
      if (totalEvents === 0) {
        summaryEl.textContent = 'Nenhuma atividade nos últimos ' + windowDays + ' dias.';
      } else {
        summaryEl.textContent = activeDays + (activeDays === 1 ? ' dia ativo' : ' dias ativos') +
          ' · ' + totalEvents + (totalEvents === 1 ? ' atividade' : ' atividades');
      }
    }
  }

  function renderEmptyHeatmap(message) {
    const grid = document.getElementById('inicio-heatmap-grid');
    const summaryEl = document.getElementById('inicio-heatmap-summary');
    if (grid) {
      grid.innerHTML = '';
      for (let i = 0; i < 30; i++) {
        const cell = document.createElement('div');
        cell.className = 'home-heatmap-cell level-0';
        cell.setAttribute('role', 'listitem');
        grid.appendChild(cell);
      }
    }
    if (summaryEl) summaryEl.textContent = message || '—';
  }

  function setInicioStreakState(value, note, state = '') {
    const cardEl = document.getElementById('inicio-streak-card');
    const valueEl = document.getElementById('inicio-streak-value');
    const noteEl = document.getElementById('inicio-streak-note');
    if (!cardEl || !valueEl || !noteEl) return;
    const numericValue = Number(value);
    const rangeState = !state && Number.isFinite(numericValue) && numericValue > 0
      ? (numericValue <= 10 ? 'low' : (numericValue <= 20 ? 'mid' : 'high'))
      : '';
    cardEl.classList.toggle('is-empty', state === 'empty');
    cardEl.classList.toggle('is-error', state === 'error');
    cardEl.classList.toggle('is-low', rangeState === 'low');
    cardEl.classList.toggle('is-mid', rangeState === 'mid');
    cardEl.classList.toggle('is-high', rangeState === 'high');
    valueEl.textContent = String(value);
    noteEl.textContent = note;
  }

  async function loadInicio() {
    const requestId = ++inicioLoadRequestId;
    syncInicioTestControls();
    const manualStreak = getManualStreakDays();
    if (manualStreak != null) {
      renderManualStreak(manualStreak);
    } else {
      setInicioTestStatus('');
    }

    const data = getToken();
    if (!data || !data.token) {
      if (manualStreak == null) {
        setInicioStreakState('--', 'Faça login para acompanhar sua ofensiva.', 'empty');
      }
      renderEmptyHeatmap('Faça login para ver sua atividade.');
      setInicioResumeState({
        title: 'Faça login para retomar seus estudos',
        description: 'Suas lições em andamento aparecem aqui para você continuar depois.',
        actionLabel: 'Abrir lições',
        state: 'empty'
      });
      return;
    }

    setInicioResumeLoadingState();
    if (manualStreak == null) {
      setInicioStreakState('...', 'Carregando atividade dos últimos 30 dias...');
    }

    try {
      const [progressRes, kanaRes] = await Promise.all([
        api('/api/progress/my-progress').catch(() => ({ success: false, data: null })),
        manualStreak == null
          ? api('/api/kana/activity?days=30').catch(() => ({ success: false, data: null }))
          : Promise.resolve({ success: false, data: null })
      ]);
      if (requestId !== inicioLoadRequestId) return;

      const manualOverride = getManualStreakDays();
      if (manualOverride != null) {
        syncInicioTestControls();
        renderManualStreak(manualOverride);
      } else {
        setInicioTestStatus('');
      }

      const progressList = progressRes && progressRes.success && Array.isArray(progressRes.data) ? progressRes.data : null;
      await loadInicioResume(progressList, requestId);
      if (requestId !== inicioLoadRequestId) return;

      if (manualOverride != null) return;

      const kanaSessions = kanaRes && kanaRes.success && kanaRes.data && Array.isArray(kanaRes.data.sessions) ? kanaRes.data.sessions : null;

      if (!progressList && !kanaSessions) {
        throw new Error('activity_unavailable');
      }

      const activityTimestamps = [
        ...(progressList || []).map(item => item && item.last_accessed).filter(Boolean),
        ...(kanaSessions || []).map(session => session && session.createdAt).filter(Boolean)
      ];
      const summary = calculateActivitySummary(activityTimestamps, 30);
      renderActivityHeatmap(summary.dayCounts, 30);

      if (summary.streak === 0) {
        setInicioStreakState(0, 'Nenhuma atividade registrada nos últimos 30 dias. Complete uma atividade para iniciar sua ofensiva.', 'empty');
        return;
      }

      let note = summary.streak === 1
        ? '1 dia consecutivo com atividade.'
        : summary.streak + ' dias consecutivos com atividade.';

      if (summary.activeDays === 1) {
        note += ' 1 dia ativo registrado no período.';
      } else {
        note += ' ' + summary.activeDays + ' dias ativos registrados no período.';
      }

      if (summary.mostRecentDay) {
        note += ' Última atividade: ' + summary.mostRecentDay.toLocaleDateString('pt-BR') + '.';
      }

      setInicioStreakState(summary.streak, note);
    } catch (_) {
      if (requestId !== inicioLoadRequestId) return;
      if (getManualStreakDays() == null) {
        setInicioStreakState('--', 'Não foi possível carregar a ofensiva agora.', 'error');
      }
      renderEmptyHeatmap('Não foi possível carregar a atividade agora.');
      setInicioResumeState({
        title: 'Não foi possível carregar sua retomada',
        description: 'Tente novamente em instantes ou abra a aba de lições para continuar estudando.',
        actionLabel: 'Abrir lições',
        state: 'error'
      });
    }
  }

  // --- Kana (Hiragana e Katakana)
  // Opções de sílabas para customização (ordem igual às linhas das tabelas; última é ん)
  const KANA_ROW_OPTIONS = [
    { key: 'Vogais', label: 'Vogais' }, { key: 'K', label: 'K' }, { key: 'S', label: 'S' }, { key: 'T', label: 'T' },
    { key: 'N', label: 'N' }, { key: 'H', label: 'H' }, { key: 'M', label: 'M' }, { key: 'Y', label: 'Y' },
    { key: 'R', label: 'R' }, { key: 'W', label: 'W' }, { key: 'ん', label: 'ん' }
  ];
  const HIRAGANA = [
    { row: 'Vogais', chars: ['あ', 'い', 'う', 'え', 'お'], romaji: ['a', 'i', 'u', 'e', 'o'] },
    { row: 'K', chars: ['か', 'き', 'く', 'け', 'こ'], romaji: ['ka', 'ki', 'ku', 'ke', 'ko'] },
    { row: 'S', chars: ['さ', 'し', 'す', 'せ', 'そ'], romaji: ['sa', 'shi', 'su', 'se', 'so'] },
    { row: 'T', chars: ['た', 'ち', 'つ', 'て', 'と'], romaji: ['ta', 'chi', 'tsu', 'te', 'to'] },
    { row: 'N', chars: ['な', 'に', 'ぬ', 'ね', 'の'], romaji: ['na', 'ni', 'nu', 'ne', 'no'] },
    { row: 'H', chars: ['は', 'ひ', 'ふ', 'へ', 'ほ'], romaji: ['ha', 'hi', 'fu', 'he', 'ho'] },
    { row: 'M', chars: ['ま', 'み', 'む', 'め', 'も'], romaji: ['ma', 'mi', 'mu', 'me', 'mo'] },
    { row: 'Y', chars: ['や', '', 'ゆ', '', 'よ'], romaji: ['ya', '', 'yu', '', 'yo'] },
    { row: 'R', chars: ['ら', 'り', 'る', 'れ', 'ろ'], romaji: ['ra', 'ri', 'ru', 're', 'ro'] },
    { row: 'W', chars: ['わ', '', '', '', 'を'], romaji: ['wa', '', '', '', 'wo'] },
    { row: 'N', chars: ['ん'], romaji: ['n'] }
  ];
  const KATAKANA = [
    { row: 'Vogais', chars: ['ア', 'イ', 'ウ', 'エ', 'オ'], romaji: ['a', 'i', 'u', 'e', 'o'] },
    { row: 'K', chars: ['カ', 'キ', 'ク', 'ケ', 'コ'], romaji: ['ka', 'ki', 'ku', 'ke', 'ko'] },
    { row: 'S', chars: ['サ', 'シ', 'ス', 'セ', 'ソ'], romaji: ['sa', 'shi', 'su', 'se', 'so'] },
    { row: 'T', chars: ['タ', 'チ', 'ツ', 'テ', 'ト'], romaji: ['ta', 'chi', 'tsu', 'te', 'to'] },
    { row: 'N', chars: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'], romaji: ['na', 'ni', 'nu', 'ne', 'no'] },
    { row: 'H', chars: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'], romaji: ['ha', 'hi', 'fu', 'he', 'ho'] },
    { row: 'M', chars: ['マ', 'ミ', 'ム', 'メ', 'モ'], romaji: ['ma', 'mi', 'mu', 'me', 'mo'] },
    { row: 'Y', chars: ['ヤ', '', 'ユ', '', 'ヨ'], romaji: ['ya', '', 'yu', '', 'yo'] },
    { row: 'R', chars: ['ラ', 'リ', 'ル', 'レ', 'ロ'], romaji: ['ra', 'ri', 'ru', 're', 'ro'] },
    { row: 'W', chars: ['ワ', '', '', '', 'ヲ'], romaji: ['wa', '', '', '', 'wo'] },
    { row: 'N', chars: ['ン'], romaji: ['n'] }
  ];

  function buildKanaTable(data) {
    const vowels = ['a', 'i', 'u', 'e', 'o'];
    let html = '<table class="kana-table"><thead><tr><th></th>' + vowels.map(v => '<th>' + v + '</th>').join('') + '</tr></thead><tbody>';
    data.forEach(r => {
      if (r.chars.length === 1) {
        html += '<tr><td>' + r.row + '</td><td colspan="5"><span class="char">' + r.chars[0] + '</span> <span class="romaji">(' + r.romaji[0] + ')</span></td></tr>';
      } else {
        html += '<tr><td>' + r.row + '</td>';
        r.chars.forEach((c, i) => {
          html += '<td>' + (c ? '<span class="char">' + c + '</span><br><span class="romaji">' + (r.romaji[i] || '') + '</span>' : '') + '</td>';
        });
        html += '</tr>';
      }
    });
    html += '</tbody></table>';
    return html;
  }

  function renderKana() {
    const hiraganaEl = document.getElementById('hiragana-table');
    const katakanaEl = document.getElementById('katakana-table');
    if (hiraganaEl) hiraganaEl.innerHTML = buildKanaTable(HIRAGANA);
    if (katakanaEl) katakanaEl.innerHTML = buildKanaTable(KATAKANA);
    renderKanaSyllablesCheckboxes();
    initKanaPractice();
  }

  function renderKanaSyllablesCheckboxes() {
    const container = document.getElementById('kana-syllables');
    if (!container) return;
    if (container.children.length) return;
    container.innerHTML = KANA_ROW_OPTIONS.map(opt =>
      '<label class="syllable-cb"><input type="checkbox" name="kana-syllable" value="' + escapeHtml(opt.key) + '"> ' + escapeHtml(opt.label) + '</label>'
    ).join('');
    const selectAllBtn = document.getElementById('kana-select-all');
    if (selectAllBtn && !selectAllBtn.dataset.bound) {
      selectAllBtn.dataset.bound = '1';
      selectAllBtn.addEventListener('click', () => {
        container.querySelectorAll('input[name="kana-syllable"]').forEach(cb => { cb.checked = true; });
      });
    }
  }

  // --- Prática: aparece um kana, escrever o romaji certo (com rowLabel para filtrar por sílaba)
  function buildKanaList() {
    const list = [];
    HIRAGANA.forEach((r, rowIndex) => {
      const rowLabel = (rowIndex === HIRAGANA.length - 1 && r.row === 'N' && r.chars.length === 1) ? 'ん' : r.row;
      r.chars.forEach((c, i) => {
        if (c && r.romaji[i]) list.push({ char: c, romaji: r.romaji[i].toLowerCase(), type: 'hiragana', rowLabel });
      });
    });
    KATAKANA.forEach((r, rowIndex) => {
      const rowLabel = (rowIndex === KATAKANA.length - 1 && r.row === 'N' && r.chars.length === 1) ? 'ん' : r.row;
      r.chars.forEach((c, i) => {
        if (c && r.romaji[i]) list.push({ char: c, romaji: r.romaji[i].toLowerCase(), type: 'katakana', rowLabel });
      });
    });
    return list;
  }

  const ALL_KANAS = buildKanaList();

  function getKanaPracticePool(alphabet, selectedSyllables) {
    let pool = ALL_KANAS;
    if (alphabet === 'hiragana') pool = pool.filter(k => k.type === 'hiragana');
    else if (alphabet === 'katakana') pool = pool.filter(k => k.type === 'katakana');
    if (selectedSyllables && selectedSyllables.length > 0) {
      pool = pool.filter(k => selectedSyllables.includes(k.rowLabel));
    }
    return pool;
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRandomFromPool(pool) {
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function normalizeRomaji(s) {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  let currentPracticeKana = null;
  let practiceCorrect = 0;
  let practiceTotal = 0;
  let currentKanaCounted = false; // cada kana conta só uma vez no total
  let kanaPracticePool = [];
  let kanaSessionDeck = []; // baralho: todos os kanas da sessão, sem repetir até esgotar; depois reembaralha
  let kanaSessionStartTime = 0;
  let kanaAlphabet = 'both';
  let kanaSyllables = [];

  function getSelectedSyllables() {
    const checked = document.querySelectorAll('input[name="kana-syllable"]:checked');
    return Array.from(checked).map(cb => cb.value);
  }

  function getSelectedAlphabet() {
    const r = document.querySelector('input[name="kana-alphabet"]:checked');
    return r ? r.value : 'both';
  }

  function showKanaScreen(which) {
    document.getElementById('kana-customize').hidden = (which !== 'customize');
    document.getElementById('kana-activity').hidden = (which !== 'activity');
    document.getElementById('kana-summary').hidden = (which !== 'summary');
  }

  let kanaPracticeInitialized = false;
  function initKanaPractice() {
    if (kanaPracticeInitialized) return;
    kanaPracticeInitialized = true;
    const charEl = document.getElementById('practice-char');
    const inputEl = document.getElementById('practice-answer');
    const feedbackEl = document.getElementById('practice-feedback');
    const scoreEl = document.getElementById('practice-score');
    const checkBtn = document.getElementById('practice-check-btn');
    const nextBtn = document.getElementById('practice-next-btn');
    const startBtn = document.getElementById('kana-start-btn');
    const finishBtn = document.getElementById('kana-finish-btn');
    const newActivityBtn = document.getElementById('kana-new-activity');

    if (!charEl || !inputEl) return;

    let enterCooldownUntil = 0;
    let isTransitioning = false;
    let wrongTimeoutId = null;

    function showNextInSession() {
      if (wrongTimeoutId) clearTimeout(wrongTimeoutId);
      wrongTimeoutId = null;
      isTransitioning = false;
      inputEl.disabled = false;
      if (kanaSessionDeck.length === 0) kanaSessionDeck = shuffleArray([...kanaPracticePool]);
      currentPracticeKana = kanaSessionDeck.shift() || null;
      currentKanaCounted = false;
      charEl.textContent = currentPracticeKana ? currentPracticeKana.char : '?';
      inputEl.value = '';
      inputEl.focus();
      if (feedbackEl) {
        feedbackEl.hidden = true;
        feedbackEl.className = 'practice-feedback';
      }
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (!currentPracticeKana || isTransitioning) return;
        const answer = normalizeRomaji(inputEl.value);
        if (!answer) return;
        let correct = currentPracticeKana.romaji === answer;
        if (!correct && (currentPracticeKana.romaji === 'wo' || currentPracticeKana.char === 'を' || currentPracticeKana.char === 'ヲ')) {
          if (answer === 'o' || answer === 'wo') correct = true;
        }
        if (!currentKanaCounted) {
          currentKanaCounted = true;
          practiceTotal++;
        }
        if (correct) practiceCorrect++;
        if (feedbackEl) {
          feedbackEl.hidden = false;
          if (correct) {
            feedbackEl.textContent = 'Correto!';
            feedbackEl.className = 'practice-feedback correct';
          } else {
            feedbackEl.textContent = 'Errado. Resposta: ' + currentPracticeKana.romaji;
            feedbackEl.className = 'practice-feedback wrong';
            isTransitioning = true;
            inputEl.disabled = true;
            if (wrongTimeoutId) clearTimeout(wrongTimeoutId);
            wrongTimeoutId = setTimeout(showNextInSession, 1400);
          }
        }
        if (scoreEl) scoreEl.textContent = 'Acertos: ' + practiceCorrect + ' / ' + practiceTotal;
        if (correct) {
          isTransitioning = true;
          setTimeout(showNextInSession, 500);
        }
      });
    }
    if (nextBtn) nextBtn.addEventListener('click', () => {
      if (wrongTimeoutId) clearTimeout(wrongTimeoutId);
      wrongTimeoutId = null;
      if (currentPracticeKana && !currentKanaCounted) {
        currentKanaCounted = true;
        practiceTotal++;
        if (scoreEl) scoreEl.textContent = 'Acertos: ' + practiceCorrect + ' / ' + practiceTotal;
      }
      showNextInSession();
    });
    if (inputEl) inputEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (feedbackEl && !feedbackEl.hidden) {
        if (wrongTimeoutId) clearTimeout(wrongTimeoutId);
        wrongTimeoutId = null;
        nextBtn.click();
        return;
      }
      const trimmed = normalizeRomaji(inputEl.value);
      if (!trimmed) return;
      if (Date.now() < enterCooldownUntil) return;
      enterCooldownUntil = Date.now() + 450;
      checkBtn.click();
    });

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        kanaAlphabet = getSelectedAlphabet();
        kanaSyllables = getSelectedSyllables();
        kanaPracticePool = getKanaPracticePool(kanaAlphabet, kanaSyllables.length ? kanaSyllables : null);
        if (kanaPracticePool.length === 0) {
          alert('Marque pelo menos uma sílaba para praticar (ou deixe todas marcadas).');
          return;
        }
        kanaSessionDeck = shuffleArray([...kanaPracticePool]);
        practiceCorrect = 0;
        practiceTotal = 0;
        currentKanaCounted = false;
        kanaSessionStartTime = Date.now();
        showKanaScreen('activity');
        showNextInSession();
      });
    }

    if (finishBtn) {
      finishBtn.addEventListener('click', async () => {
        const durationSeconds = Math.round((Date.now() - kanaSessionStartTime) / 1000);
        const payload = {
          alphabet: kanaAlphabet,
          syllables: kanaSyllables,
          score: practiceCorrect,
          total: practiceTotal,
          durationSeconds
        };
        try {
          await api('/api/kana/session', { method: 'POST', body: JSON.stringify(payload) });
          document.getElementById('kana-summary-text').textContent =
            'Salvo no banco: ' + practiceCorrect + ' acertos de ' + practiceTotal + ' (tempo: ' + durationSeconds + ' s).';
        } catch (e) {
          document.getElementById('kana-summary-text').textContent =
            'Resultado: ' + practiceCorrect + ' / ' + practiceTotal + ' (' + durationSeconds + ' s). Não foi possível salvar (faça login para registrar).';
        }
        showKanaScreen('summary');
      });
    }

    if (newActivityBtn) {
      newActivityBtn.addEventListener('click', () => { showKanaScreen('customize'); });
    }

    showKanaScreen('customize');
  }

  document.querySelectorAll('.kana-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.kana-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.kana-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.kana === 'hiragana' ? 'kana-hiragana' : 'kana-katakana';
      document.getElementById(id).classList.add('active');
    });
  });

  // --- Lições
  function buildLessonProgressIndex(progressList) {
    const index = new Map();
    (progressList || []).forEach(progress => {
      if (!progress) return;
      const lessonId = getEntityId(progress.lesson_id || progress.lessonId);
      if (!lessonId) return;
      index.set(lessonId, progress);
    });
    return index;
  }

  async function loadLicoes() {
    bindLicoesFilters();
    const listEl = document.getElementById('licoes-list');
    const detailEl = document.getElementById('licao-detail');
    const emptyEl = document.getElementById('licoes-empty-filter');
    listEl.hidden = false;
    detailEl.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    listEl.innerHTML = '<p class="muted">Carregando lições...</p>';
    try {
      const data = getToken();
      const isAuthed = Boolean(data && data.token);
      const [lessonsRes, favoritesRes, progressRes] = await Promise.all([
        api('/api/lessons'),
        isAuthed
          ? api('/api/progress/favorites').catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: false, data: [] }),
        isAuthed
          ? api('/api/progress/my-progress').catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: false, data: [] })
      ]);
      const lessons = (lessonsRes.data && lessonsRes.data.lessons) ? lessonsRes.data.lessons : [];
      cachedFavoriteLessonIds = buildFavoriteLessonIdSet(
        favoritesRes && favoritesRes.success && Array.isArray(favoritesRes.data) ? favoritesRes.data : []
      );
      cachedLessonProgressById = buildLessonProgressIndex(
        progressRes && progressRes.success && Array.isArray(progressRes.data) ? progressRes.data : []
      );
      cachedLessonsList = lessons;

      if (lessons.length === 0) {
        listEl.innerHTML = '<p class="empty">Nenhuma lição no banco. Rode <code>node populate-database.js</code> para dados de exemplo.</p>';
        return;
      }
      applyLessonsFilter();
    } catch (e) {
      listEl.innerHTML = '<p class="error-msg">Erro ao carregar lições: ' + (e.body?.message || e.message) + '</p>';
    }
  }

  async function showLicaoDetail(id) {
    const lessonId = getEntityId(id);
    if (!lessonId) return;
    const listEl = document.getElementById('licoes-list');
    const detailEl = document.getElementById('licao-detail');
    const contentEl = document.getElementById('licao-detail-content');
    listEl.hidden = true;
    detailEl.hidden = false;
    contentEl.innerHTML = '<p class="muted">Carregando...</p>';
    try {
      const [res, progressRes] = await Promise.all([
        api('/api/lessons/' + lessonId),
        api('/api/progress/lesson/' + lessonId, {
          method: 'POST',
          body: JSON.stringify({})
        }).catch(() => ({ success: false, data: null }))
      ]);
      const data = res.data || {};
      const lesson = data.lesson || data;
      const vocabulary = data.vocabulary || [];
      const progress = progressRes && progressRes.success ? progressRes.data : null;
      const isFavorite = progress && typeof progress.favorite === 'boolean'
        ? progress.favorite
        : cachedFavoriteLessonIds.has(lessonId);
      setFavoriteInCache(lessonId, isFavorite);

      if (progress) {
        cachedLessonProgressById.set(lessonId, progress);
      }

      const meta = [
        lesson.level ? formatDisplayLabel(lesson.level) : '',
        lesson.category ? formatDisplayLabel(lesson.category) : '',
        progress && progress.last_accessed ? 'Último acesso: ' + formatDateTime(progress.last_accessed) : ''
      ].filter(Boolean).join(' • ');

      const statusInfo = getLessonStatusInfo(progress);
      const initialScore = progress && typeof progress.score === 'number' ? Math.round(progress.score) : 0;

      let html = '<div class="licao-detail-header">';
      html += '<div class="licao-detail-heading">';
      html += '<h3>' + escapeHtml(lesson.title || 'Lição') + '</h3>';
      if (meta) html += '<p class="licao-detail-meta">' + escapeHtml(meta) + '</p>';
      html += '</div>';
      html += getFavoriteButtonMarkup(lessonId, isFavorite, 'licao-detail-favorite');
      html += '</div>';
      if (lesson.description) html += '<p>' + escapeHtml(lesson.description) + '</p>';

      html += '<section class="licao-progress-card" data-lesson-id="' + escapeHtml(lessonId) + '">';
      html += '<div class="licao-progress-row">';
      html += '<span class="licao-progress-label">Status</span>';
      html += '<span class="licao-status status-' + statusInfo.status + '">' + escapeHtml(statusInfo.label) + '</span>';
      html += '</div>';
      html += '<div class="licao-progress-row licao-progress-score">';
      html += '<span class="licao-progress-label">Pontuação</span>';
      html += '<input type="range" min="0" max="100" step="1" value="' + initialScore + '" id="licao-progress-score-input">';
      html += '<span class="licao-progress-score-value" id="licao-progress-score-value">' + initialScore + '</span>';
      html += '</div>';
      html += '<div class="licao-progress-actions">';
      html += '<button type="button" class="btn-secondary" id="licao-progress-save-score">Salvar pontuação</button>';
      html += '<button type="button" class="btn-primary" id="licao-progress-mark-completed"' + (statusInfo.status === 'completed' ? ' disabled' : '') + '>Marcar como concluída</button>';
      html += '</div>';
      html += '<p class="licao-progress-feedback" id="licao-progress-feedback"></p>';
      html += '</section>';

      if (lesson.content && lesson.content.length) {
        html += '<ul class="content-list">' + lesson.content.map(c => '<li>' + escapeHtml(c) + '</li>').join('') + '</ul>';
      }
      if (vocabulary.length) {
        html += '<h4>Vocabulário</h4><div class="vocab-list">' + vocabulary.map(v => '<div class="vocab-item"><span class="jp">' + escapeHtml(v.japanese || '') + '</span> <span class="romaji">' + escapeHtml(v.romaji || '') + '</span> — ' + escapeHtml(v.portuguese || '') + '</div>').join('') + '</div>';
      }
      contentEl.innerHTML = html;
      bindFavoriteButtons(contentEl);
      bindLessonProgressControls(contentEl, lessonId);
    } catch (e) {
      contentEl.innerHTML = '<p class="error-msg">Erro: ' + (e.body?.message || e.message) + '</p>';
    }
  }

  function showProgressFeedback(message, kind) {
    const feedbackEl = document.getElementById('licao-progress-feedback');
    if (!feedbackEl) return;
    feedbackEl.textContent = message || '';
    feedbackEl.className = 'licao-progress-feedback' + (kind ? ' ' + kind : '');
  }

  function updateLessonProgressUI(lessonId, progress) {
    if (progress) cachedLessonProgressById.set(lessonId, progress);
    const card = document.querySelector('.licao-progress-card[data-lesson-id="' + lessonId + '"]');
    if (!card) return;
    const statusEl = card.querySelector('.licao-status');
    const completeBtn = card.querySelector('#licao-progress-mark-completed');
    const scoreInput = card.querySelector('#licao-progress-score-input');
    const scoreValueEl = card.querySelector('#licao-progress-score-value');
    const info = getLessonStatusInfo(progress);
    if (statusEl) {
      statusEl.className = 'licao-status status-' + info.status;
      statusEl.textContent = info.label;
    }
    if (completeBtn) {
      completeBtn.disabled = info.status === 'completed';
    }
    if (progress && typeof progress.score === 'number' && scoreInput && scoreValueEl) {
      const value = Math.round(progress.score);
      scoreInput.value = String(value);
      scoreValueEl.textContent = String(value);
    }
  }

  function bindLessonProgressControls(containerEl, lessonId) {
    if (!containerEl) return;
    const scoreInput = containerEl.querySelector('#licao-progress-score-input');
    const scoreValueEl = containerEl.querySelector('#licao-progress-score-value');
    const saveBtn = containerEl.querySelector('#licao-progress-save-score');
    const completeBtn = containerEl.querySelector('#licao-progress-mark-completed');

    if (scoreInput && scoreValueEl) {
      scoreInput.addEventListener('input', () => {
        scoreValueEl.textContent = String(scoreInput.value);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        if (!scoreInput) return;
        const value = parseInt(scoreInput.value, 10);
        if (Number.isNaN(value) || value < 0 || value > 100) {
          showProgressFeedback('Pontuação deve ficar entre 0 e 100.', 'error');
          return;
        }
        saveBtn.disabled = true;
        try {
          const res = await api('/api/progress/lesson/' + lessonId + '/score', {
            method: 'PUT',
            body: JSON.stringify({ score: value })
          });
          updateLessonProgressUI(lessonId, res && res.data ? res.data : null);
          showProgressFeedback('Pontuação salva: ' + value + '.', 'success');
        } catch (e) {
          showProgressFeedback('Não foi possível salvar a pontuação: ' + (e.body?.message || e.message), 'error');
        } finally {
          saveBtn.disabled = false;
        }
      });
    }

    if (completeBtn) {
      completeBtn.addEventListener('click', async () => {
        const value = scoreInput ? parseInt(scoreInput.value, 10) : 100;
        const score = Number.isNaN(value) ? 100 : Math.min(Math.max(value, 0), 100);
        completeBtn.disabled = true;
        try {
          const res = await api('/api/progress/lesson/' + lessonId + '/complete', {
            method: 'PUT',
            body: JSON.stringify({ score })
          });
          updateLessonProgressUI(lessonId, res && res.data ? res.data : null);
          showProgressFeedback('Lição marcada como concluída!', 'success');
        } catch (e) {
          showProgressFeedback('Não foi possível concluir: ' + (e.body?.message || e.message), 'error');
          completeBtn.disabled = false;
        }
      });
    }
  }

  document.getElementById('licao-back-btn').addEventListener('click', () => {
    document.getElementById('licoes-list').hidden = false;
    document.getElementById('licao-detail').hidden = true;
  });

  // --- Vocabulário (prática livre / revisão / teste / modo prova)
  const vocabTypingState = { mode: 'practice', words: [], index: 0, correct: 0, wrong: 0, skipped: 0, startedAt: 0, level: '', category: '' };
  const vocabTestState = {
    mode: 'test',
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    startedAt: 0,
    level: '',
    category: '',
    examPoints: 0,
    examTotalSeconds: 0,
    examTimerId: null,
    examTimeLeftMs: 0,
    examEndsAt: 0
  };
  let vocabBound = false;

  function normalizeAnswer(s) {
    return (s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }

  function matchesVocabAnswer(input, word, answerType) {
    const n = normalizeAnswer(input);
    if (!n) return false;
    let accepted;
    if (answerType === 'romaji') {
      accepted = [word.romaji];
    } else {
      accepted = [
        word.portuguese,
        word.english,
        ...(Array.isArray(word.tags) ? word.tags : [])
      ];
    }
    return accepted.some(value => value && normalizeAnswer(value) === n);
  }

  function showVocabPanels(phase) {
    const setupEl = document.getElementById('vocab-setup');
    const typingEl = document.getElementById('vocab-typing');
    const testEl = document.getElementById('vocab-test');
    const summaryEl = document.getElementById('vocab-summary');
    if (setupEl) setupEl.hidden = phase !== 'setup';
    if (typingEl) typingEl.hidden = phase !== 'typing';
    if (testEl) testEl.hidden = phase !== 'test';
    if (summaryEl) summaryEl.hidden = phase !== 'summary';
  }

  function getSelectedVocabMode() {
    const checked = document.querySelector('input[name="vocab-mode"]:checked');
    return checked ? checked.value : 'practice';
  }

  function getSelectedVocabAnswerType() {
    const checked = document.querySelector('input[name="vocab-answer-type"]:checked');
    return checked && checked.value === 'romaji' ? 'romaji' : 'portuguese';
  }

  function syncVocabExamFieldVisibility() {
    const fieldEl = document.getElementById('vocab-exam-time-field');
    if (!fieldEl) return;
    fieldEl.hidden = getSelectedVocabMode() !== 'exam';
  }

  function vocabQueryParams() {
    const level = document.getElementById('vocab-level').value.trim();
    const category = document.getElementById('vocab-category').value.trim();
    let limit = parseInt(document.getElementById('vocab-limit').value, 10);
    if (Number.isNaN(limit) || limit < 5) limit = 5;
    if (limit > 50) limit = 50;
    const answerType = getSelectedVocabAnswerType();
    const q = new URLSearchParams();
    q.set('limit', String(limit));
    if (level) q.set('level', level);
    if (category) q.set('category', category);
    q.set('answerType', answerType);
    return { qs: q.toString(), level, category, limit, answerType };
  }

  function getExamSeconds() {
    let seconds = parseInt(document.getElementById('vocab-exam-time').value, 10);
    if (Number.isNaN(seconds) || seconds < 20) seconds = 20;
    if (seconds > 600) seconds = 600;
    return seconds;
  }

  function clearExamTimer() {
    if (vocabTestState.examTimerId) {
      clearInterval(vocabTestState.examTimerId);
      vocabTestState.examTimerId = null;
    }
  }

  function updateExamTimerUI() {
    const timeLeftEl = document.getElementById('vocab-exam-time-left');
    const fillEl = document.getElementById('vocab-exam-progress-fill');
    if (!timeLeftEl || !fillEl) return;
    const remainingMs = Math.max(0, vocabTestState.examEndsAt - Date.now());
    vocabTestState.examTimeLeftMs = remainingMs;
    const totalMs = vocabTestState.examTotalSeconds * 1000;
    const seconds = Math.ceil(remainingMs / 1000);
    timeLeftEl.textContent = seconds + 's';
    timeLeftEl.classList.toggle('is-low', seconds <= 10);
    const consumedRatio = totalMs > 0 ? Math.min(1, 1 - remainingMs / totalMs) : 1;
    const fillRight = Math.max(0, 100 - consumedRatio * 100);
    fillEl.style.inset = '0 ' + fillRight + '% 0 0';
    fillEl.classList.toggle('is-low', seconds <= 10);
  }

  function startExamTimer(seconds) {
    clearExamTimer();
    vocabTestState.examTotalSeconds = seconds;
    vocabTestState.examEndsAt = Date.now() + seconds * 1000;
    updateExamTimerUI();
    vocabTestState.examTimerId = setInterval(() => {
      updateExamTimerUI();
      if (vocabTestState.examTimeLeftMs <= 0) {
        clearExamTimer();
        finishVocabExam('time-up');
      }
    }, 250);
  }

  function setVocabSummary(message, statusMessage = '') {
    document.getElementById('vocab-summary-text').textContent = message;
    document.getElementById('vocab-summary-status').textContent = statusMessage || '';
    showVocabPanels('summary');
  }

  async function persistVocabSession({ mode, score, total, durationSeconds, examPoints, level, category, answerType }) {
    const tok = getToken();
    if (!tok || !tok.token) return { saved: false, reason: 'unauthenticated' };
    try {
      await api('/api/vocabulary/session', {
        method: 'POST',
        body: JSON.stringify({ mode, score, total, durationSeconds, examPoints, level, category, answerType })
      });
      return { saved: true };
    } catch (e) {
      return { saved: false, reason: 'error', message: e.body?.message || e.message };
    }
  }

  function resetVocabTab() {
    clearExamTimer();
    vocabTypingState.words = [];
    vocabTypingState.index = 0;
    vocabTypingState.correct = 0;
    vocabTypingState.wrong = 0;
    vocabTypingState.skipped = 0;
    vocabTestState.questions = [];
    vocabTestState.index = 0;
    vocabTestState.score = 0;
    vocabTestState.answered = false;
    vocabTestState.examPoints = 0;
    vocabTestState.examTotalSeconds = 0;
    vocabTestState.examTimeLeftMs = 0;
    vocabTestState.examEndsAt = 0;
    const setupMsg = document.getElementById('vocab-setup-msg');
    if (setupMsg) setupMsg.hidden = true;
    const answerEl = document.getElementById('vocab-answer');
    if (answerEl) answerEl.value = '';
    const typingFeedback = document.getElementById('vocab-typing-feedback');
    if (typingFeedback) typingFeedback.hidden = true;
    const testFeedback = document.getElementById('vocab-test-feedback');
    if (testFeedback) testFeedback.hidden = true;
    const testNext = document.getElementById('vocab-test-next');
    if (testNext) testNext.hidden = true;
    const examBar = document.getElementById('vocab-exam-bar');
    if (examBar) examBar.hidden = true;
    showVocabPanels('setup');
    syncVocabExamFieldVisibility();
    bindVocabHandlers();
  }

  function renderTypingCard() {
    const words = vocabTypingState.words;
    const i = vocabTypingState.index;
    const fb = document.getElementById('vocab-typing-feedback');
    const ans = document.getElementById('vocab-answer');
    const progressEl = document.getElementById('vocab-typing-progress');
    const promptEl = document.getElementById('vocab-typing-prompt');
    const hintEl = document.getElementById('vocab-romaji-hint');
    const answerType = vocabTypingState.answerType || 'portuguese';
    if (fb) fb.hidden = true;
    if (ans) ans.value = '';
    if (i >= words.length) {
      finishVocabTyping('done');
      return;
    }
    const w = words[i];
    document.getElementById('vocab-jp').textContent = w.japanese || '—';
    if (promptEl) {
      promptEl.textContent = answerType === 'romaji'
        ? 'Escreva a leitura em romaji desta palavra.'
        : 'Escreva a tradução em português (aceita inglês também).';
    }
    if (ans) {
      ans.placeholder = answerType === 'romaji' ? 'Ex.: konnichiwa' : 'Ex.: olá';
    }
    if (hintEl) {
      const rom = (w.romaji || '').trim();
      // Se a resposta esperada é o romaji, não dar o romaji como dica.
      hintEl.textContent = answerType === 'romaji' ? '' : (rom ? 'Romaji: ' + rom : '');
    }
    if (progressEl) {
      progressEl.textContent = 'Cartão ' + (i + 1) + ' de ' + words.length;
    }
    document.getElementById('vocab-typing-score').textContent =
      'Acertos: ' + vocabTypingState.correct + ' · Erros: ' + vocabTypingState.wrong +
      (vocabTypingState.skipped ? ' · Pulos: ' + vocabTypingState.skipped : '');
    if (ans) ans.focus();
  }

  function vocabCheckTyping() {
    const words = vocabTypingState.words;
    const i = vocabTypingState.index;
    if (i >= words.length) return;
    const w = words[i];
    const input = document.getElementById('vocab-answer').value;
    const fb = document.getElementById('vocab-typing-feedback');
    if (!fb) return;
    const answerType = vocabTypingState.answerType || 'portuguese';
    fb.hidden = false;
    if (matchesVocabAnswer(input, w, answerType)) {
      fb.textContent = 'Correto!';
      fb.className = 'practice-feedback correct';
      vocabTypingState.correct++;
      vocabTypingState.index++;
      setTimeout(renderTypingCard, 450);
    } else {
      const expected = answerType === 'romaji' ? (w.romaji || '—') : (w.portuguese || '—');
      const extra = answerType === 'romaji'
        ? (w.portuguese ? ' · Tradução: ' + w.portuguese : '')
        : (w.romaji ? ' · Romaji: ' + w.romaji : '');
      fb.textContent = 'Resposta esperada: ' + expected + extra;
      fb.className = 'practice-feedback wrong';
      vocabTypingState.wrong++;
      vocabTypingState.index++;
      setTimeout(renderTypingCard, 1300);
    }
  }

  function vocabSkipTyping() {
    const words = vocabTypingState.words;
    const i = vocabTypingState.index;
    if (i >= words.length) return;
    vocabTypingState.skipped++;
    vocabTypingState.index++;
    renderTypingCard();
  }

  async function finishVocabTyping(reason) {
    const t = vocabTypingState;
    const total = t.correct + t.wrong + t.skipped;
    const durationSeconds = t.startedAt ? Math.round((Date.now() - t.startedAt) / 1000) : 0;
    const summaryMsg = (reason === 'done' ? 'Sessão concluída! ' : 'Sessão encerrada. ') +
      'Acertos: ' + t.correct + ' · Erros: ' + t.wrong +
      (t.skipped ? ' · Pulos: ' + t.skipped : '') +
      (total ? ' · Cartões: ' + total : '') +
      (durationSeconds ? ' · Tempo: ' + durationSeconds + 's' : '');

    const persistResult = total > 0
      ? await persistVocabSession({
          mode: t.mode,
          score: t.correct,
          total,
          durationSeconds,
          level: t.level,
          category: t.category,
          answerType: t.answerType
        })
      : { saved: false, reason: 'empty' };

    let statusMessage = '';
    if (persistResult.saved) {
      statusMessage = 'Resultado salvo no histórico.';
    } else if (persistResult.reason === 'unauthenticated') {
      statusMessage = 'Faça login para registrar essa sessão no histórico.';
    } else if (persistResult.reason === 'error') {
      statusMessage = 'Não foi possível salvar no histórico: ' + (persistResult.message || 'erro');
    }

    setVocabSummary(summaryMsg, statusMessage);
  }

  function renderVocabTestQuestion() {
    const q = vocabTestState.questions[vocabTestState.index];
    const fb = document.getElementById('vocab-test-feedback');
    const nextBtn = document.getElementById('vocab-test-next');
    const promptEl = document.getElementById('vocab-test-prompt');
    if (fb) fb.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    vocabTestState.answered = false;
    if (!q) {
      if (vocabTestState.mode === 'exam') {
        finishVocabExam('done');
      } else {
        finishVocabTest('done');
      }
      return;
    }
    document.getElementById('vocab-test-jp').textContent = q.question || '—';
    const at = q.answerType || vocabTestState.answerType || 'portuguese';
    if (promptEl) {
      promptEl.textContent = at === 'romaji'
        ? 'Qual é a leitura em romaji?'
        : 'Qual é a tradução em português?';
    }
    const progressEl = document.getElementById('vocab-test-progress');
    if (progressEl) {
      progressEl.textContent = 'Questão ' + (vocabTestState.index + 1) + ' de ' + vocabTestState.questions.length +
        (vocabTestState.mode === 'test' ? ' · Acertos: ' + vocabTestState.score : '');
    }
    const optsEl = document.getElementById('vocab-test-options');
    if (!optsEl) return;
    optsEl.innerHTML = '';
    (q.options || []).forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt;
      btn.addEventListener('click', () => onVocabTestPick(btn, opt, q));
      optsEl.appendChild(btn);
    });
  }

  function onVocabTestPick(buttonEl, opt, question) {
    if (vocabTestState.answered) return;
    vocabTestState.answered = true;
    const correct = opt === question.correctAnswer;
    if (correct) vocabTestState.score++;

    if (vocabTestState.mode === 'exam') {
      vocabTestState.examPoints += correct ? 10 : -3;
      const pointsEl = document.getElementById('vocab-exam-points');
      if (pointsEl) pointsEl.textContent = String(vocabTestState.examPoints);
    }

    const fb = document.getElementById('vocab-test-feedback');
    if (fb) {
      fb.hidden = false;
      fb.className = 'practice-feedback ' + (correct ? 'correct' : 'wrong');
      fb.textContent = correct ? 'Correto!' : 'Correto: ' + question.correctAnswer;
    }

    document.querySelectorAll('#vocab-test-options button').forEach(b => {
      b.disabled = true;
      if (b.textContent === question.correctAnswer) b.classList.add('correct-pick');
      else if (b === buttonEl && !correct) b.classList.add('wrong-pick');
    });

    if (vocabTestState.mode === 'exam') {
      setTimeout(() => {
        if (!vocabTestState.examTimerId) return;
        vocabTestState.index++;
        renderVocabTestQuestion();
      }, 700);
    } else {
      const nextBtn = document.getElementById('vocab-test-next');
      if (nextBtn) nextBtn.hidden = false;
    }
  }

  async function finishVocabTest(reason) {
    const t = vocabTestState;
    const total = t.questions.length;
    const durationSeconds = t.startedAt ? Math.round((Date.now() - t.startedAt) / 1000) : 0;
    const baseMsg = (reason === 'done' ? 'Teste concluído! ' : 'Teste encerrado. ') +
      'Acertos: ' + t.score + ' de ' + total +
      (durationSeconds ? ' · Tempo: ' + durationSeconds + 's' : '');

    const persistResult = total > 0 ? await persistVocabSession({
      mode: 'test',
      score: t.score,
      total,
      durationSeconds,
      level: t.level,
      category: t.category,
      answerType: t.answerType
    }) : { saved: false, reason: 'empty' };

    let statusMessage = '';
    if (persistResult.saved) statusMessage = 'Resultado salvo no histórico.';
    else if (persistResult.reason === 'unauthenticated') statusMessage = 'Faça login para registrar no histórico.';
    else if (persistResult.reason === 'error') statusMessage = 'Não foi possível salvar: ' + (persistResult.message || 'erro');

    setVocabSummary(baseMsg, statusMessage);
  }

  async function finishVocabExam(reason) {
    clearExamTimer();
    const t = vocabTestState;
    const totalAnswered = Math.min(t.index + (t.answered ? 1 : 0), t.questions.length);
    const durationSeconds = t.startedAt ? Math.round((Date.now() - t.startedAt) / 1000) : 0;
    const reasonMsg = reason === 'time-up'
      ? 'Tempo esgotado! '
      : reason === 'done'
        ? 'Banco de questões esgotado! '
        : 'Modo prova encerrado. ';
    const baseMsg = reasonMsg +
      'Pontos: ' + t.examPoints +
      ' · Acertos: ' + t.score + ' / ' + totalAnswered +
      ' (de ' + t.questions.length + ' questões disponíveis)' +
      (durationSeconds ? ' · Tempo: ' + durationSeconds + 's' : '');

    const persistResult = totalAnswered > 0 ? await persistVocabSession({
      mode: 'exam',
      score: t.score,
      total: totalAnswered,
      durationSeconds,
      examPoints: t.examPoints,
      level: t.level,
      category: t.category,
      answerType: t.answerType
    }) : { saved: false, reason: 'empty' };

    let statusMessage = '';
    if (persistResult.saved) statusMessage = 'Resultado da prova salvo no histórico.';
    else if (persistResult.reason === 'unauthenticated') statusMessage = 'Faça login para registrar a prova no histórico.';
    else if (persistResult.reason === 'error') statusMessage = 'Não foi possível salvar: ' + (persistResult.message || 'erro');

    setVocabSummary(baseMsg, statusMessage);
  }

  async function startVocabSession() {
    const msgEl = document.getElementById('vocab-setup-msg');
    if (msgEl) msgEl.hidden = true;
    const mode = getSelectedVocabMode();
    const tok = getToken();
    const { qs, level, category } = vocabQueryParams();

    if ((mode === 'review' || mode === 'test' || mode === 'exam') && (!tok || !tok.token)) {
      if (msgEl) {
        msgEl.textContent = 'Faça login para usar revisão, teste ou modo prova.';
        msgEl.hidden = false;
      }
      return;
    }

    try {
      if (mode === 'test' || mode === 'exam') {
        const res = await api('/api/vocabulary/test/session?' + qs);
        const data = res.data || {};
        const questions = data.testQuestions || [];
        if (!questions.length) {
          if (msgEl) {
            msgEl.textContent = 'Sem palavras suficientes para o teste. Verifique os filtros ou popule o banco.';
            msgEl.hidden = false;
          }
          return;
        }
        vocabTestState.mode = mode;
        vocabTestState.questions = questions;
        vocabTestState.index = 0;
        vocabTestState.score = 0;
        vocabTestState.answered = false;
        vocabTestState.startedAt = Date.now();
        vocabTestState.level = level;
        vocabTestState.category = category;
        vocabTestState.answerType = data.answerType || getSelectedVocabAnswerType();
        vocabTestState.examPoints = 0;
        const modeTagEl = document.getElementById('vocab-test-mode');
        if (modeTagEl) modeTagEl.textContent = mode === 'exam' ? 'Modo prova' : 'Teste';
        const examBar = document.getElementById('vocab-exam-bar');
        if (examBar) examBar.hidden = mode !== 'exam';
        if (mode === 'exam') {
          const seconds = getExamSeconds();
          const pointsEl = document.getElementById('vocab-exam-points');
          if (pointsEl) pointsEl.textContent = '0';
          startExamTimer(seconds);
        }
        showVocabPanels('test');
        renderVocabTestQuestion();
        return;
      }

      const path = mode === 'review'
        ? '/api/vocabulary/review/session?' + qs
        : '/api/vocabulary/random/practice?' + qs;
      const res = await api(path);
      const payload = res.data;
      const words = Array.isArray(payload)
        ? payload
        : (payload && payload.vocabulary)
          ? payload.vocabulary
          : [];
      if (!words.length) {
        if (msgEl) {
          msgEl.textContent = 'Nenhuma palavra encontrada. Tente outros filtros ou popule o banco.';
          msgEl.hidden = false;
        }
        return;
      }
      vocabTypingState.mode = mode;
      vocabTypingState.words = words;
      vocabTypingState.index = 0;
      vocabTypingState.correct = 0;
      vocabTypingState.wrong = 0;
      vocabTypingState.skipped = 0;
      vocabTypingState.startedAt = Date.now();
      vocabTypingState.level = level;
      vocabTypingState.category = category;
      vocabTypingState.answerType = getSelectedVocabAnswerType();
      const tagEl = document.getElementById('vocab-typing-mode');
      if (tagEl) tagEl.textContent = mode === 'review' ? 'Revisão' : 'Prática livre';
      showVocabPanels('typing');
      renderTypingCard();
    } catch (e) {
      if (msgEl) {
        msgEl.textContent = e.body?.message || e.message || 'Erro ao iniciar sessão.';
        msgEl.hidden = false;
      }
    }
  }

  function bindVocabHandlers() {
    if (vocabBound) return;
    const startBtn = document.getElementById('vocab-start-btn');
    if (!startBtn) return;
    vocabBound = true;

    document.querySelectorAll('input[name="vocab-mode"]').forEach(input => {
      input.addEventListener('change', syncVocabExamFieldVisibility);
    });

    startBtn.addEventListener('click', startVocabSession);

    const checkBtn = document.getElementById('vocab-check-btn');
    if (checkBtn) checkBtn.addEventListener('click', vocabCheckTyping);
    const skipBtn = document.getElementById('vocab-skip-btn');
    if (skipBtn) skipBtn.addEventListener('click', vocabSkipTyping);
    const ansEl = document.getElementById('vocab-answer');
    if (ansEl) {
      ansEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          vocabCheckTyping();
        }
      });
    }
    const typingFinishBtn = document.getElementById('vocab-typing-finish');
    if (typingFinishBtn) typingFinishBtn.addEventListener('click', () => finishVocabTyping('manual'));

    const nextBtn = document.getElementById('vocab-test-next');
    if (nextBtn) nextBtn.addEventListener('click', () => {
      vocabTestState.index++;
      renderVocabTestQuestion();
    });

    const testFinishBtn = document.getElementById('vocab-test-finish');
    if (testFinishBtn) testFinishBtn.addEventListener('click', () => {
      if (vocabTestState.mode === 'exam') finishVocabExam('manual');
      else finishVocabTest('manual');
    });

    const summaryOk = document.getElementById('vocab-summary-ok');
    if (summaryOk) summaryOk.addEventListener('click', () => {
      resetVocabTab();
      switchTab('inicio');
    });
  }

  // --- Meu histórico
  function vocabModeLabel(mode) {
    if (mode === 'review') return 'Revisão';
    if (mode === 'test') return 'Teste';
    if (mode === 'exam') return 'Modo prova';
    return 'Prática livre';
  }

  async function loadHistorico() {
    const statsEl = document.getElementById('historico-stats');
    const listEl = document.getElementById('historico-list');
    statsEl.innerHTML = '';
    listEl.innerHTML = '<p class="muted">Carregando...</p>';
    const data = getToken();
    if (!data || !data.token) {
      listEl.innerHTML = '<p class="empty">Faça login para ver seu histórico.</p>';
      return;
    }
    try {
      const [progressRes, statsRes, vocabSessionsRes, lessonsRes] = await Promise.all([
        api('/api/progress/my-progress').catch(() => ({ success: false, data: [] })),
        api('/api/progress/stats').catch(() => ({ success: false, data: {} })),
        api('/api/vocabulary/my-sessions?limit=25').catch(() => ({ success: false, data: [] })),
        api('/api/lessons').catch(() => ({ success: false, data: { lessons: [] } }))
      ]);
      const list = (progressRes.success && progressRes.data) ? progressRes.data : [];
      const stats = (statsRes.success && statsRes.data) ? statsRes.data : {};
      const vocabSessions = (vocabSessionsRes && vocabSessionsRes.success && Array.isArray(vocabSessionsRes.data))
        ? vocabSessionsRes.data
        : [];
      const lessons = (lessonsRes && lessonsRes.data && lessonsRes.data.lessons) ? lessonsRes.data.lessons : [];
      const lessonTitleById = new Map();
      lessons.forEach(lesson => {
        const id = getEntityId(lesson && (lesson._id || lesson.id));
        if (id) lessonTitleById.set(id, lesson.title || 'Lição sem título');
      });

      statsEl.innerHTML = `
        <div class="stat-card"><span class="value">${stats.completedLessons ?? 0}</span><span class="label">Concluídas</span></div>
        <div class="stat-card"><span class="value">${stats.inProgressLessons ?? 0}</span><span class="label">Em progresso</span></div>
        <div class="stat-card"><span class="value">${stats.averageScore != null ? Math.round(stats.averageScore) : '-'}</span><span class="label">Nota média</span></div>
        <div class="stat-card"><span class="value">${vocabSessions.length}</span><span class="label">Sessões de vocabulário</span></div>
      `;

      let html = '';
      html += '<section class="historico-section">';
      html += '<h3>Lições</h3>';
      if (list.length === 0) {
        html += '<p class="empty">Nenhum registro de progresso ainda.</p>';
      } else {
        html += '<div class="historico-card-list">';
        list.slice(0, 25).forEach(progress => {
          const lessonId = getEntityId(progress.lesson_id || progress.lessonId);
          const title = lessonTitleById.get(lessonId) || 'Lição';
          const info = getLessonStatusInfo(progress);
          const meta = [
            info.label,
            progress.last_accessed ? 'Último acesso: ' + formatDateTime(progress.last_accessed) : '',
            progress.favorite ? 'Favorita' : ''
          ].filter(Boolean).join(' · ');
          const score = typeof progress.score === 'number' ? Math.round(progress.score) : 0;
          html += '<article class="historico-card">';
          html += '<div><div class="historico-card-title">' + escapeHtml(title) + '</div>';
          html += '<div class="historico-card-meta">' + escapeHtml(meta) + '</div></div>';
          html += '<span class="historico-card-score">' + score + '</span>';
          html += '</article>';
        });
        html += '</div>';
      }
      html += '</section>';

      html += '<section class="historico-section">';
      html += '<h3>Sessões de vocabulário</h3>';
      if (vocabSessions.length === 0) {
        html += '<p class="empty">Nenhuma sessão de vocabulário registrada ainda.</p>';
      } else {
        html += '<div class="historico-card-list">';
        vocabSessions.slice(0, 25).forEach(session => {
          const total = session.total || 0;
          const score = session.score || 0;
          const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
          const titleParts = [vocabModeLabel(session.mode), session.level || '', session.category || ''].filter(Boolean);
          const meta = [
            session.createdAt ? formatDateTime(session.createdAt) : '',
            total ? score + '/' + total + ' (' + accuracy + '%)' : 'Sem cartões',
            session.durationSeconds != null ? 'Tempo: ' + session.durationSeconds + 's' : '',
            session.examPoints != null ? 'Pontos: ' + session.examPoints : ''
          ].filter(Boolean).join(' · ');
          html += '<article class="historico-card">';
          html += '<div><div class="historico-card-title">' + escapeHtml(titleParts.join(' · ')) + '</div>';
          html += '<div class="historico-card-meta">' + escapeHtml(meta) + '</div></div>';
          const display = session.examPoints != null ? session.examPoints : accuracy + '%';
          html += '<span class="historico-card-score">' + escapeHtml(String(display)) + '</span>';
          html += '</article>';
        });
        html += '</div>';
      }
      html += '</section>';

      listEl.innerHTML = html;
    } catch (e) {
      listEl.innerHTML = '<p class="error-msg">Erro ao carregar histórico: ' + (e.body?.message || e.message) + '</p>';
    }
  }

  // --- Banco de Dados
  async function loadBanco() {
    const statusEl = document.getElementById('db-status');
    const statusText = document.getElementById('db-status-text');
    const adminOnly = document.getElementById('banco-admin-only');
    const notAdmin = document.getElementById('banco-not-admin');

    statusEl.className = 'status-box';
    statusText.textContent = 'verificando...';
    adminOnly.hidden = true;
    notAdmin.hidden = true;

    try {
      const health = await api('/health');
      const connected = health.database && health.database.connected;
      statusEl.classList.add(connected ? 'ok' : 'err');
      statusText.textContent = connected ? 'MongoDB conectado' : (health.database?.error || 'MongoDB desconectado');
    } catch (_) {
      statusEl.classList.add('err');
      statusText.textContent = 'Não foi possível verificar (API offline?)';
    }

    const data = getToken();
    if (!data || !data.user) {
      notAdmin.hidden = false;
      return;
    }
    if (data.user.role !== 'admin') {
      notAdmin.hidden = false;
      return;
    }

    adminOnly.hidden = false;
    const listEl = document.getElementById('collections-list');
    const detailEl = document.getElementById('collection-detail');
    listEl.innerHTML = 'Carregando coleções...';
    detailEl.hidden = true;

    try {
      const res = await api('/api/admin/collections');
      if (res.success && res.collections) {
        listEl.innerHTML = res.collections.map(c => 
          '<button type="button" class="collection-btn" data-name="' + c.name + '">' + c.name + ' (' + c.count + ')</button>'
        ).join('');
        listEl.querySelectorAll('.collection-btn').forEach(btn => {
          btn.addEventListener('click', () => showCollection(btn.dataset.name));
        });
      } else {
        listEl.innerHTML = '<p class="empty">Nenhuma coleção listada.</p>';
      }
    } catch (e) {
      listEl.innerHTML = '<p class="error-msg">Erro: ' + (e.body?.message || e.message) + '</p>';
    }
  }

  async function showCollection(name) {
    const titleEl = document.getElementById('collection-detail-title');
    const docsEl = document.getElementById('collection-docs');
    const detailEl = document.getElementById('collection-detail');
    titleEl.textContent = 'Coleção: ' + name;
    detailEl.hidden = false;
    docsEl.innerHTML = 'Carregando...';
    try {
      const res = await api('/api/admin/collections/' + encodeURIComponent(name) + '?limit=50');
      if (res.success && res.data && res.data.length) {
        const keys = [...new Set(res.data.flatMap(d => Object.keys(d)))];
        let html = '<table class="docs-table"><thead><tr>' + keys.map(k => '<th>' + k + '</th>').join('') + '</tr></thead><tbody>';
        res.data.forEach(doc => {
          html += '<tr>' + keys.map(k => {
            let v = doc[k];
            if (v === null || v === undefined) return '<td>—</td>';
            if (typeof v === 'object' && v !== null && (v.constructor.name === 'Object' || Array.isArray(v))) {
              v = JSON.stringify(v);
            }
            if (String(v).length > 80) v = String(v).slice(0, 80) + '…';
            return '<td>' + escapeHtml(String(v)) + '</td>';
          }).join('') + '</tr>';
        });
        html += '</tbody></table>';
        docsEl.innerHTML = html;
      } else {
        docsEl.innerHTML = '<p class="empty">Nenhum documento nesta coleção.</p>';
      }
    } catch (e) {
      docsEl.innerHTML = '<p class="error-msg">Erro: ' + (e.body?.message || e.message) + '</p>';
    }
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // --- Inicialização
  (function init() {
    bindInicioTestControls();
    bindInicioResumeButton();
    const data = getToken();
    if (data && data.token && data.user) {
      showLoggedApp(data.user);
    } else {
      showLogin();
    }
  })();
})();
