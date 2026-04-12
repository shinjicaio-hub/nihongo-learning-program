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
  const VALID_TAB_IDS = ['inicio', 'kana', 'licoes', 'historico', 'banco'];

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

  function renderLessonCard(lesson) {
    const lessonId = getEntityId((lesson && (lesson._id || lesson.id)) || '');
    const isFavorite = cachedFavoriteLessonIds.has(lessonId);
    return (
      '<article class="licao-card" data-id="' + escapeHtml(lessonId) + '">' +
        getFavoriteButtonMarkup(lessonId, isFavorite, 'licao-card-favorite') +
        '<button type="button" class="licao-card-open" data-id="' + escapeHtml(lessonId) + '">' +
          '<h4>' + escapeHtml((lesson && lesson.title) || 'Sem título') + '</h4>' +
          '<span class="meta">' + escapeHtml([lesson && lesson.level, lesson && lesson.category].filter(Boolean).join(' · ')) + '</span>' +
        '</button>' +
      '</article>'
    );
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

    activityTimestamps.forEach(timestamp => {
      const date = startOfLocalDay(timestamp);
      if (!date || date < windowStart || date > today) return;
      const dayKey = getDayKey(date);
      if (dayKey) activeDayKeys.add(dayKey);
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
      mostRecentDay
    };
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
  async function loadLicoes() {
    const listEl = document.getElementById('licoes-list');
    const detailEl = document.getElementById('licao-detail');
    listEl.hidden = false;
    detailEl.hidden = true;
    listEl.innerHTML = '<p class="muted">Carregando lições...</p>';
    try {
      const data = getToken();
      const [lessonsRes, favoritesRes] = await Promise.all([
        api('/api/lessons'),
        data && data.token
          ? api('/api/progress/favorites').catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: false, data: [] })
      ]);
      const lessons = (lessonsRes.data && lessonsRes.data.lessons) ? lessonsRes.data.lessons : [];
      cachedFavoriteLessonIds = buildFavoriteLessonIdSet(
        favoritesRes && favoritesRes.success && Array.isArray(favoritesRes.data) ? favoritesRes.data : []
      );

      if (lessons.length === 0) {
        listEl.innerHTML = '<p class="empty">Nenhuma lição no banco. Rode <code>node populate-database.js</code> para dados de exemplo.</p>';
        return;
      }
      listEl.innerHTML = lessons.map(renderLessonCard).join('');
      bindLessonCardActions(listEl);
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

      const meta = [
        lesson.level ? formatDisplayLabel(lesson.level) : '',
        lesson.category ? formatDisplayLabel(lesson.category) : '',
        progress && progress.last_accessed ? 'Último acesso: ' + formatDateTime(progress.last_accessed) : ''
      ].filter(Boolean).join(' • ');

      let html = '<div class="licao-detail-header">';
      html += '<div class="licao-detail-heading">';
      html += '<h3>' + escapeHtml(lesson.title || 'Lição') + '</h3>';
      if (meta) html += '<p class="licao-detail-meta">' + escapeHtml(meta) + '</p>';
      html += '</div>';
      html += getFavoriteButtonMarkup(lessonId, isFavorite, 'licao-detail-favorite');
      html += '</div>';
      if (lesson.description) html += '<p>' + escapeHtml(lesson.description) + '</p>';
      if (lesson.content && lesson.content.length) {
        html += '<ul class="content-list">' + lesson.content.map(c => '<li>' + escapeHtml(c) + '</li>').join('') + '</ul>';
      }
      if (vocabulary.length) {
        html += '<h4>Vocabulário</h4><div class="vocab-list">' + vocabulary.map(v => '<div class="vocab-item"><span class="jp">' + escapeHtml(v.japanese || '') + '</span> <span class="romaji">' + escapeHtml(v.romaji || '') + '</span> — ' + escapeHtml(v.portuguese || '') + '</div>').join('') + '</div>';
      }
      contentEl.innerHTML = html;
      bindFavoriteButtons(contentEl);
    } catch (e) {
      contentEl.innerHTML = '<p class="error-msg">Erro: ' + (e.body?.message || e.message) + '</p>';
    }
  }

  document.getElementById('licao-back-btn').addEventListener('click', () => {
    document.getElementById('licoes-list').hidden = false;
    document.getElementById('licao-detail').hidden = true;
  });

  // --- Meu histórico
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
      const [progressRes, statsRes] = await Promise.all([
        api('/api/progress/my-progress').catch(() => ({ success: false, data: [] })),
        api('/api/progress/stats').catch(() => ({ success: false, data: {} }))
      ]);
      const list = (progressRes.success && progressRes.data) ? progressRes.data : [];
      const stats = (statsRes.success && statsRes.data) ? statsRes.data : {};

      statsEl.innerHTML = `
        <div class="stat-card"><span class="value">${stats.completedLessons ?? 0}</span><span class="label">Concluídas</span></div>
        <div class="stat-card"><span class="value">${stats.inProgressLessons ?? 0}</span><span class="label">Em progresso</span></div>
        <div class="stat-card"><span class="value">${stats.averageScore != null ? Math.round(stats.averageScore) : '-'}</span><span class="label">Nota média</span></div>
      `;

      if (list.length === 0) {
        listEl.innerHTML = '<p class="empty">Nenhum registro de progresso ainda. Suas lições e notas aparecerão aqui.</p>';
      } else {
        listEl.innerHTML = '<pre>' + JSON.stringify(list, null, 2) + '</pre>';
      }
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
