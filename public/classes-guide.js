/**
 * Aba Classes — mapa visual das 品詞 (partes da fala) + exemplos do vocabulário.
 */
(function () {
  const GRAMMAR_CLASSES = [
    {
      id: 'meishi',
      jp: '名詞',
      pt: 'Substantivo',
      color: '#7c3aed',
      icon: '名',
      desc: 'Nomeia coisas, pessoas, lugares e ideias. Em geral não flexiona como verbo.',
      categories: ['substantivos', 'familia', 'comida', 'bebida', 'numeros', 'cotidiano', 'natureza', 'lugar', 'pessoas', 'cores', 'tempo', 'transporte', 'tecnologia', 'emprestimos', 'cumprimentos'],
      staticExamples: [
        { japanese: '水', romaji: 'mizu', portuguese: 'água' },
        { japanese: '学校', romaji: 'gakkou', portuguese: 'escola' }
      ]
    },
    {
      id: 'doushi',
      jp: '動詞',
      pt: 'Verbo',
      color: '#dc2626',
      icon: '動',
      desc: 'Expressa ação ou estado. Dividido em grupos de conjugação (五段, 一段, 不规则).',
      categories: ['verbos'],
      staticExamples: [
        { japanese: '食べる', romaji: 'taberu', portuguese: 'comer', tag: '一段 (る)' },
        { japanese: '行く', romaji: 'iku', portuguese: 'ir', tag: '五段 (う)' },
        { japanese: '来る', romaji: 'kuru', portuguese: 'vir', tag: '不规则' }
      ]
    },
    {
      id: 'keiyoushi-i',
      jp: 'い形容詞',
      pt: 'Adjetivo em -i',
      color: '#059669',
      icon: 'い',
      desc: 'Descreve qualidades; termina em い (ex.: たかい = caro). Conjuga como verbo.',
      categories: [],
      staticExamples: [
        { japanese: 'たかい', romaji: 'takai', portuguese: 'caro / alto' },
        { japanese: 'あつい', romaji: 'atsui', portuguese: 'quente' }
      ]
    },
    {
      id: 'keiyoushi-na',
      jp: 'な形容詞',
      pt: 'Adjetivo em -na',
      color: '#0d9488',
      icon: 'な',
      desc: 'Descritor + な antes de substantivo (ex.: しずかなへや).',
      categories: [],
      staticExamples: [
        { japanese: 'しずか', romaji: 'shizuka', portuguese: 'silencioso' },
        { japanese: 'げんき', romaji: 'genki', portuguese: 'bem / saudável' }
      ]
    },
    {
      id: 'fukushi',
      jp: '副詞',
      pt: 'Advérbio',
      color: '#d97706',
      icon: '副',
      desc: 'Modifica verbo, adjetivo ou outro advérbio (como, quando, quanto).',
      categories: [],
      staticExamples: [
        { japanese: 'とても', romaji: 'totemo', portuguese: 'muito' },
        { japanese: 'ゆっくり', romaji: 'yukkuri', portuguese: 'devagar' }
      ]
    },
    {
      id: 'joshi',
      jp: '助詞',
      pt: 'Partícula',
      color: '#2563eb',
      icon: '助',
      desc: 'Marcadores gramaticais após substantivos/verbos (は, が, を, に…). Não traduzem sozinhas.',
      categories: [],
      staticExamples: [
        { japanese: 'は', romaji: 'wa', portuguese: 'tópico (contraste com が)' },
        { japanese: 'を', romaji: 'o', portuguese: 'objeto direto' },
        { japanese: 'に', romaji: 'ni', portuguese: 'tempo / destino / indireto' }
      ]
    }
  ];

  const VERB_GROUPS = [
    { id: 'godan', label: '五段', sub: 'Grupo 1 (u)', color: '#f97316', example: '書く · 飲む · 行く' },
    { id: 'ichidan', label: '一段', sub: 'Grupo 2 (ru)', color: '#8b5cf6', example: '食べる · 見る' },
    { id: 'fukisoku', label: '不规则', sub: 'Exceções', color: '#64748b', example: '来る · する' }
  ];

  let classesRendered = false;
  let cachedWords = [];

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildDiagramSvg() {
    const nodes = GRAMMAR_CLASSES.map((c, i) => {
      const x = 40 + (i % 3) * 280;
      const y = 30 + Math.floor(i / 3) * 100;
      return `
        <g class="classes-diagram-node" data-class-id="${c.id}" role="button" tabindex="0" aria-label="${escapeHtml(c.jp)} — ${escapeHtml(c.pt)}">
          <rect x="${x}" y="${y}" width="240" height="72" rx="14" fill="${c.color}" opacity="0.92"/>
          <text x="${x + 36}" y="${y + 32}" fill="#fff" font-size="18" font-weight="700">${escapeHtml(c.jp)}</text>
          <text x="${x + 36}" y="${y + 54}" fill="rgba(255,255,255,0.9)" font-size="13">${escapeHtml(c.pt)}</text>
          <circle cx="${x + 20}" cy="${y + 36}" r="14" fill="rgba(255,255,255,0.25)"/>
          <text x="${x + 20}" y="${y + 41}" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">${c.icon}</text>
        </g>`;
    }).join('');

    return `
      <svg class="classes-diagram-svg" viewBox="0 0 900 260" role="img" aria-label="Mapa das classes gramaticais japonesas">
        <defs>
          <linearGradient id="classes-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc"/>
            <stop offset="100%" style="stop-color:#eef2ff"/>
          </linearGradient>
        </defs>
        <rect width="900" height="260" fill="url(#classes-bg)" rx="16"/>
        <text x="450" y="22" text-anchor="middle" fill="#475569" font-size="14" font-weight="600">品詞 — Partes da fala (classes)</text>
        <path d="M450 40 L450 55" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4"/>
        ${nodes}
      </svg>`;
  }

  function buildVerbChartHtml() {
    return `
      <div class="classes-verb-chart" role="img" aria-label="Grupos de verbos japoneses">
        ${VERB_GROUPS.map(g => `
          <div class="classes-verb-group" style="--verb-color:${g.color}">
            <span class="classes-verb-group-jp">${g.label}</span>
            <span class="classes-verb-group-sub">${g.sub}</span>
            <span class="classes-verb-group-ex">${g.example}</span>
          </div>
        `).join('')}
        <div class="classes-verb-flow" aria-hidden="true">
          <span>動詞</span>
          <span class="classes-verb-arrow">→</span>
          <span>conjugação</span>
        </div>
      </div>`;
  }

  function wordsForClass(grammarClass) {
    const fromDb = cachedWords.filter(w => {
      const cat = (w.category || '').toLowerCase();
      return grammarClass.categories.some(c => cat === c || cat.includes(c));
    });
    const merged = [...fromDb];
    const seen = new Set(merged.map(w => w.japanese));
    (grammarClass.staticExamples || []).forEach(ex => {
      if (!seen.has(ex.japanese)) merged.unshift(ex);
    });
    return merged.slice(0, 6);
  }

  function renderClassCards(activeId) {
    const grid = document.getElementById('classes-cards-grid');
    if (!grid) return;
    const list = activeId
      ? GRAMMAR_CLASSES.filter(c => c.id === activeId)
      : GRAMMAR_CLASSES;

    grid.innerHTML = list.map(c => {
      const examples = wordsForClass(c);
      const exHtml = examples.length
        ? examples.map(ex => `
            <li class="classes-example-item">
              <span class="classes-ex-jp">${escapeHtml(ex.japanese)}</span>
              <span class="classes-ex-romaji">${escapeHtml(ex.romaji || '')}</span>
              <span class="classes-ex-pt">${escapeHtml(ex.portuguese || ex.english || '')}</span>
              ${ex.tag ? `<span class="classes-ex-tag">${escapeHtml(ex.tag)}</span>` : ''}
            </li>`).join('')
        : '<li class="classes-example-item muted">Sem exemplos no banco ainda — rode <code>npm run seed</code>.</li>';

      return `
        <article class="classes-card" style="--class-color:${c.color}" id="classes-card-${c.id}">
          <header class="classes-card-head">
            <span class="classes-card-icon">${c.icon}</span>
            <div>
              <h3>${c.jp} <span class="classes-card-pt">${c.pt}</span></h3>
            </div>
          </header>
          <p class="classes-card-desc">${c.desc}</p>
          <ul class="classes-examples">${exHtml}</ul>
          <button type="button" class="btn-secondary classes-practice-btn" data-goto="vocabulario">Praticar vocabulário</button>
        </article>`;
    }).join('');

    grid.querySelectorAll('.classes-practice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.goto;
        document.querySelector('.tab[data-tab="' + tab + '"]')?.click();
      });
    });
  }

  function renderChips() {
    const wrap = document.getElementById('classes-filter-chips');
    if (!wrap) return;
    wrap.innerHTML = `
      <button type="button" class="classes-chip active" data-class-id="" aria-selected="true">Todas</button>
      ${GRAMMAR_CLASSES.map(c => `
        <button type="button" class="classes-chip" data-class-id="${c.id}" style="--chip-color:${c.color}" aria-selected="false">${c.jp}</button>
      `).join('')}`;

    wrap.querySelectorAll('.classes-chip').forEach(chip => {
      chip.addEventListener('click', () => selectClassFilter(chip.dataset.classId || ''));
    });
  }

  function selectClassFilter(classId) {
    const wrap = document.getElementById('classes-filter-chips');
    if (!wrap) return;
    wrap.querySelectorAll('.classes-chip').forEach(c => {
      const active = (c.dataset.classId || '') === classId;
      c.classList.toggle('active', active);
      c.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    renderClassCards(classId || null);
    if (classId) {
      document.getElementById('classes-card-' + classId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function bindDiagramClicks() {
    document.querySelectorAll('.classes-diagram-node').forEach(node => {
      node.style.cursor = 'pointer';
      const activate = () => {
        const id = node.getAttribute('data-class-id');
        if (id) selectClassFilter(id);
      };
      node.addEventListener('click', activate);
      node.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  async function loadVocabularySamples() {
    const statusEl = document.getElementById('classes-load-status');
    try {
      const res = await fetch('/api/vocabulary/random/practice?limit=50');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Falha na API');
      const words = Array.isArray(json.data) ? json.data : [];
      if (words.length) {
        cachedWords = words;
        if (statusEl) {
          statusEl.textContent = words.length + ' palavras do banco usadas como exemplos.';
          statusEl.hidden = false;
        }
      } else if (statusEl) {
        statusEl.textContent = 'Banco vazio — exemplos fixos apenas. Rode npm run seed.';
        statusEl.hidden = false;
      }
    } catch (_) {
      if (statusEl) {
        statusEl.textContent = 'Não foi possível carregar o vocabulário; usando exemplos fixos.';
        statusEl.hidden = false;
      }
    }
  }

  function renderShell() {
    const panel = document.getElementById('tab-classes');
    if (!panel || classesRendered) return;

    panel.innerHTML = `
      <header class="classes-hero">
        <p class="classes-hero-kicker">Material de referência · estilo sala de aula</p>
        <h2>Classes — gramática japonesa</h2>
        <p class="muted">Mapa das <strong>品詞</strong> (partes da fala em japonês) com exemplos do vocabulário do projeto.</p>
      </header>

      <section class="classes-section">
        <h3>Partes da fala em japonês (品詞)</h3>
      </section>
      <div class="classes-diagram-wrap">${buildDiagramSvg()}</div>
      <p class="classes-diagram-hint muted">Clique em um bloco do diagrama para filtrar os cartões abaixo.</p>

      <section class="classes-section">
        <h3>Grupos de verbos (動詞)</h3>
        ${buildVerbChartHtml()}
      </section>

      <section class="classes-section classes-howto">
        <h3>Como estudar com este projeto</h3>
        <ol class="classes-steps">
          <li><strong>Consulte</strong> o mapa e os cartões para entender a classe gramatical.</li>
          <li><strong>Pratique</strong> na aba Vocabulário (tradução ou romaji).</li>
          <li><strong>Fixe</strong> hiragana/katakana na aba Kana antes de verbos longos.</li>
          <li><strong>Avance</strong> nas Lições e marque progresso + favoritos.</li>
        </ol>
        <p class="muted classes-note">Resumo didático para consulta rápida. Para incluir mais tópicos ou exemplos do material da turma, edite <code>public/classes-guide.js</code> (array <code>GRAMMAR_CLASSES</code>).</p>
      </section>

      <div id="classes-filter-chips" class="classes-chips" role="tablist" aria-label="Filtrar por classe gramatical"></div>
      <p id="classes-load-status" class="classes-load-status muted" hidden></p>
      <div id="classes-cards-grid" class="classes-cards-grid"></div>
    `;

    classesRendered = true;
    renderChips();
    bindDiagramClicks();
    renderClassCards(null);
  }

  window.loadClassesTab = async function loadClassesTab() {
    renderShell();
    await loadVocabularySamples();
    const active = document.querySelector('.classes-chip.active');
    const id = active?.dataset.classId || '';
    renderClassCards(id || null);
  };
})();
