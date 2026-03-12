/* ============================================
   Addern Investing — Main JavaScript
   Theme, Nav, Quizzes, Paper Trading, Charts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initScrollAnimations();
  initCourseSidebar();
  initQuizzes();
  initPaperTrading();
  initCalculators();
  initStockChart();
  initGlossarySearch();
  initNewsletterForm();
  initBlogRouting();
});

/* ---------- Theme Toggle ---------- */
function initTheme() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const saved = localStorage.getItem('aksje-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
  updateThemeIcon(toggle);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aksje-theme', next);
    updateThemeIcon(toggle);
  });
}

function updateThemeIcon(btn) {
  const theme = document.documentElement.getAttribute('data-theme');
  btn.setAttribute('aria-label', theme === 'light' ? 'Bytt til mork modus' : 'Bytt til lys modus');
}

/* ---------- Mobile Nav & Dropdowns ---------- */
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    hamburger.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    // Close all dropdowns when closing menu
    if (!isOpen) {
      navLinks.querySelectorAll('.has-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });

  // Mobile: toggle dropdowns on click
  navLinks.querySelectorAll('.has-dropdown > a').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parent = trigger.parentElement;
        const wasOpen = parent.classList.contains('open');
        navLinks.querySelectorAll('.has-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!wasOpen) parent.classList.add('open');
      }
    });
  });

  // Close menu when clicking a non-dropdown link
  navLinks.querySelectorAll('.nav-dropdown a, .nav-links > li:not(.has-dropdown) > a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('is-open');
      navLinks.querySelectorAll('.has-dropdown.open').forEach(d => d.classList.remove('open'));
    });
  });

  // Desktop: close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-links')) {
      navLinks.querySelectorAll('.has-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
}

/* ---------- Scroll Animations ---------- */
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* ---------- Course Sidebar ---------- */
function initCourseSidebar() {
  const sidebar = document.querySelector('.course-sidebar');
  if (!sidebar) return;

  const toggle = sidebar.querySelector('.sidebar-toggle');
  const nav = sidebar.querySelector('.sidebar-nav');
  const links = sidebar.querySelectorAll('.sidebar-nav a');
  const modules = document.querySelectorAll('.module-section');

  if (!links.length || !modules.length) return;

  // Load progress
  const courseId = document.body.dataset.course || 'course';
  const progress = JSON.parse(localStorage.getItem(`aksje-progress-${courseId}`) || '{}');

  // Apply completed state
  links.forEach((link, i) => {
    if (progress[i]) {
      link.classList.add('completed');
    }
  });

  updateProgressDisplay(courseId);

  // Sidebar toggle (mobile)
  if (toggle) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.textContent = nav.classList.contains('open') ? 'Skjul moduler \u25B2' : 'Vis moduler \u25BC';
    });
  }

  // Module switching
  function showModule(index) {
    modules.forEach(m => m.classList.remove('active'));
    links.forEach(l => l.classList.remove('active'));

    if (modules[index]) modules[index].classList.add('active');
    if (links[index]) links[index].classList.add('active');

    // Close mobile sidebar
    if (nav) nav.classList.remove('open');
    if (toggle) toggle.textContent = 'Vis moduler \u25BC';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  links.forEach((link, i) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showModule(i);
    });
  });

  // Module nav buttons
  document.querySelectorAll('[data-module-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.moduleNav);
      if (target >= 0 && target < modules.length) {
        showModule(target);
      }
    });
  });

  // Show first module
  showModule(0);
}

function markModuleComplete(courseId, moduleIndex) {
  const progress = JSON.parse(localStorage.getItem(`aksje-progress-${courseId}`) || '{}');
  progress[moduleIndex] = true;
  localStorage.setItem(`aksje-progress-${courseId}`, JSON.stringify(progress));

  const link = document.querySelectorAll('.sidebar-nav a')[moduleIndex];
  if (link) link.classList.add('completed');

  updateProgressDisplay(courseId);
}

function updateProgressDisplay(courseId) {
  const progress = JSON.parse(localStorage.getItem(`aksje-progress-${courseId}`) || '{}');
  const total = document.querySelectorAll('.module-section').length;
  const done = Object.keys(progress).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const bar = document.querySelector('.sidebar-progress-bar .fill');
  const text = document.querySelector('.sidebar-progress');
  if (bar) bar.style.width = pct + '%';
  if (text) text.textContent = `${done} av ${total} moduler fullf\u00F8rt (${pct}%)`;

  // Also update homepage cards if present
  document.querySelectorAll('[data-progress-course]').forEach(el => {
    const cid = el.dataset.progressCourse;
    const p = JSON.parse(localStorage.getItem(`aksje-progress-${cid}`) || '{}');
    const t = parseInt(el.dataset.progressTotal) || 1;
    const d = Object.keys(p).length;
    const fill = el.querySelector('.fill');
    if (fill) fill.style.width = Math.round((d / t) * 100) + '%';
  });
}

/* ---------- Quiz Engine ---------- */
function initQuizzes() {
  document.querySelectorAll('.quiz-container').forEach(quiz => {
    const options = quiz.querySelectorAll('.quiz-option');
    const feedback = quiz.querySelector('.quiz-feedback');
    const correct = quiz.dataset.correct;
    const courseId = document.body.dataset.course || 'course';
    const moduleIdx = quiz.dataset.module;

    let answered = false;

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        options.forEach(o => o.disabled = true);

        if (opt.dataset.answer === correct) {
          opt.classList.add('correct');
          feedback.className = 'quiz-feedback show correct';
          feedback.textContent = '\u2713 Riktig! ' + (quiz.dataset.explanation || '');
          if (moduleIdx !== undefined) {
            markModuleComplete(courseId, parseInt(moduleIdx));
          }
        } else {
          opt.classList.add('wrong');
          // Show correct answer
          options.forEach(o => {
            if (o.dataset.answer === correct) o.classList.add('correct');
          });
          feedback.className = 'quiz-feedback show wrong';
          feedback.textContent = '\u2717 Feil. ' + (quiz.dataset.explanation || '');
        }
      });
    });
  });
}

/* ---------- Paper Trading Simulator ---------- */
const STOCKS = [
  { ticker: 'EQNR', name: 'Equinor', basePrice: 285.40 },
  { ticker: 'DNB', name: 'DNB', basePrice: 215.80 },
  { ticker: 'TEL', name: 'Telenor', basePrice: 128.60 },
  { ticker: 'YAR', name: 'Yara International', basePrice: 342.20 },
  { ticker: 'MOWI', name: 'Mowi', basePrice: 195.50 },
  { ticker: 'KOG', name: 'Kongsberg Gruppen', basePrice: 1048.00 },
  { ticker: 'AKRBP', name: 'Aker BP', basePrice: 268.30 },
  { ticker: 'NHY', name: 'Norsk Hydro', basePrice: 65.40 },
  { ticker: 'ORK', name: 'Orkla', basePrice: 84.50 },
  { ticker: 'GJF', name: 'Gjensidige Forsikring', basePrice: 178.20 },
  { ticker: 'STB', name: 'Storebrand', basePrice: 105.60 },
  { ticker: 'SALM', name: 'SalMar', basePrice: 578.00 },
  { ticker: 'SUBC', name: 'Subsea 7', basePrice: 172.40 },
  { ticker: 'TOM', name: 'Tomra Systems', basePrice: 164.80 },
  { ticker: 'SCATC', name: 'Scatec', basePrice: 74.30 },
  { ticker: 'CRAYN', name: 'Crayon Group', basePrice: 118.50 },
  { ticker: 'KAHOT', name: 'Kahoot!', basePrice: 24.80 },
  { ticker: 'RECSI', name: 'REC Silicon', basePrice: 11.60 },
  { ticker: 'FLNG', name: 'Flex LNG', basePrice: 278.90 },
  { ticker: 'FRONTL', name: 'Frontline', basePrice: 208.50 }
];

const DIFFICULTY = {
  easy:   { label: 'Enkel',     volatility: 0.005, bias: 0.52 },
  medium: { label: 'Medium',    volatility: 0.010, bias: 0.505 },
  hard:   { label: 'Vanskelig', volatility: 0.025, bias: 0.48 }
};

/* ---------- Market Events System ---------- */
const MARKET_EVENTS = [
  // Negative global events
  { id: 'crash',         name: 'Børskrakk!',                emoji: '📉', type: 'global', impact: -0.15, volatilityMult: 3.0,  durationTicks: 40, description: 'Panikksalg i markedet — aksjekursene stuper.' },
  { id: 'recession',     name: 'Resesjon',                  emoji: '🏚️', type: 'global', impact: -0.06, volatilityMult: 1.8,  durationTicks: 80, description: 'Økonomien krymper. Forbrukertillit er på bunn.' },
  { id: 'war',           name: 'Krig bryter ut',            emoji: '⚔️', type: 'global', impact: -0.10, volatilityMult: 2.5,  durationTicks: 60, description: 'Geopolitisk konflikt skaper usikkerhet i markedene.' },
  { id: 'pandemic',      name: 'Pandemi',                   emoji: '🦠', type: 'global', impact: -0.12, volatilityMult: 2.8,  durationTicks: 70, description: 'Global helsekrise. Reise og handel rammes hardt.' },
  { id: 'rate_hike',     name: 'Renteheving',               emoji: '🏦', type: 'global', impact: -0.04, volatilityMult: 1.5,  durationTicks: 30, description: 'Sentralbanken hever renten kraftig.' },
  { id: 'inflation',     name: 'Høy inflasjon',             emoji: '💸', type: 'global', impact: -0.03, volatilityMult: 1.4,  durationTicks: 50, description: 'Prisene stiger raskt. Kjøpekraften svekkes.' },
  { id: 'trade_war',     name: 'Handelskrig',               emoji: '🚢', type: 'global', impact: -0.05, volatilityMult: 1.6,  durationTicks: 45, description: 'Tollbarrierer og sanksjoner rammer verdenshandelen.' },
  { id: 'bank_crisis',   name: 'Bankkrise',                 emoji: '🏦', type: 'global', impact: -0.08, volatilityMult: 2.2,  durationTicks: 35, description: 'Flere banker sliter. Frykt for systemkollaps.' },
  // Positive global events
  { id: 'bull_run',      name: 'Bull-marked!',              emoji: '🐂', type: 'global', impact: +0.08, volatilityMult: 1.5,  durationTicks: 50, description: 'Optimisme i markedet — kursene stiger bredt.' },
  { id: 'rate_cut',      name: 'Rentekutt',                 emoji: '📈', type: 'global', impact: +0.04, volatilityMult: 1.3,  durationTicks: 30, description: 'Sentralbanken kutter renten. Billigere lån stimulerer.' },
  { id: 'stimulus',      name: 'Stimulanspakke',            emoji: '💰', type: 'global', impact: +0.05, volatilityMult: 1.4,  durationTicks: 40, description: 'Regjeringen sprøyter penger inn i økonomien.' },
  { id: 'peace_deal',    name: 'Fredsavtale',               emoji: '🕊️', type: 'global', impact: +0.06, volatilityMult: 1.2,  durationTicks: 25, description: 'Geopolitisk avspenning gir markedsoptimisme.' },
  { id: 'tech_boom',     name: 'Teknologiboom',             emoji: '🚀', type: 'global', impact: +0.07, volatilityMult: 1.6,  durationTicks: 45, description: 'Teknologisektoren eksploderer i verdi.' },
  // Neutral / mixed events
  { id: 'sideways',      name: 'Sidelengs marked',          emoji: '➡️', type: 'global', impact: 0.00,  volatilityMult: 0.3,  durationTicks: 60, description: 'Markedet beveger seg knapt. Investorer avventer.' },
  { id: 'high_vol',      name: 'Ekstrem volatilitet',       emoji: '🎢', type: 'global', impact: 0.00,  volatilityMult: 3.5,  durationTicks: 25, description: 'Ville svingninger — opp og ned i raskt tempo.' },
  // Sector-specific events
  { id: 'oil_crash',     name: 'Oljepris kollapser',        emoji: '🛢️', type: 'sector', tickers: ['EQNR','AKRBP','FLNG','FRONTL'], impact: -0.12, volatilityMult: 2.5, durationTicks: 40, description: 'Oljeprisen stuper. Energiaksjer rammes hardt.' },
  { id: 'oil_boom',      name: 'Oljepris skyter opp',       emoji: '🛢️', type: 'sector', tickers: ['EQNR','AKRBP','FLNG','FRONTL'], impact: +0.10, volatilityMult: 2.0, durationTicks: 35, description: 'Oljeprisen stiger kraftig. Energiaksjer boomer.' },
  { id: 'fish_disease',  name: 'Laksesykdom',               emoji: '🐟', type: 'sector', tickers: ['MOWI','SALM'], impact: -0.10, volatilityMult: 2.0, durationTicks: 30, description: 'Sykdom i oppdrettsanlegg. Lakseaksjer faller.' },
  { id: 'fish_demand',   name: 'Rekordsalg av laks',        emoji: '🐟', type: 'sector', tickers: ['MOWI','SALM'], impact: +0.08, volatilityMult: 1.5, durationTicks: 30, description: 'Global etterspørsel etter laks øker kraftig.' },
  { id: 'tech_scandal',  name: 'Teknologiskandale',         emoji: '💻', type: 'sector', tickers: ['KAHOT','CRAYN','TOM'], impact: -0.09, volatilityMult: 2.0, durationTicks: 25, description: 'Datatyveri og skandaler rammer tech-aksjer.' },
  { id: 'defense_spend', name: 'Økt forsvarsbudsjett',      emoji: '🛡️', type: 'sector', tickers: ['KOG'], impact: +0.12, volatilityMult: 1.8, durationTicks: 35, description: 'NATO øker forsvarsutgiftene. Kongsberg stiger.' },
  { id: 'green_shift',   name: 'Grønt skifte',              emoji: '🌱', type: 'sector', tickers: ['SCATC','RECSI','NHY'], impact: +0.09, volatilityMult: 1.6, durationTicks: 40, description: 'Nye klimaavtaler gir boost til grønne aksjer.' },
  { id: 'aluminium_drop',name: 'Aluminiumpris faller',      emoji: '🏭', type: 'sector', tickers: ['NHY'], impact: -0.08, volatilityMult: 1.8, durationTicks: 30, description: 'Kina dumper aluminium. Norsk Hydro rammes.' },
];

let activeEvent = null;
let eventTicksLeft = 0;
let eventCooldown = 0;

function tryTriggerEvent() {
  if (activeEvent) {
    eventTicksLeft--;
    if (eventTicksLeft <= 0) {
      activeEvent = null;
      renderEventBanner();
    }
    return;
  }
  if (eventCooldown > 0) { eventCooldown--; return; }
  // ~0.5% chance per tick, plus cooldown after each event
  if (Math.random() < 0.005) {
    const event = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    activeEvent = { ...event };
    eventTicksLeft = event.durationTicks;
    eventCooldown = 80 + Math.floor(Math.random() * 120); // 80-200 tick cooldown after event ends
    // Apply instant shock to affected stocks
    applyEventShock(event);
    renderEventBanner();
  }
}

function applyEventShock(event) {
  tradingState.stocks.forEach(stock => {
    const affected = event.type === 'global' || (event.tickers && event.tickers.includes(stock.ticker));
    if (!affected) return;
    // Instant price shock (fraction of total impact)
    const shock = event.impact * (0.3 + Math.random() * 0.3);
    stock.price = Math.max(1, stock.price * (1 + shock));
    stock.price = Math.round(stock.price * 100) / 100;
  });
}

function getEventModifiers(stock) {
  if (!activeEvent) return { impactBias: 0, volMult: 1.0 };
  const affected = activeEvent.type === 'global' || (activeEvent.tickers && activeEvent.tickers.includes(stock.ticker));
  if (!affected) return { impactBias: 0, volMult: 1.0 };
  // Gradual impact per tick spread over remaining duration
  const perTickImpact = activeEvent.impact / activeEvent.durationTicks;
  return { impactBias: perTickImpact, volMult: activeEvent.volatilityMult };
}

function renderEventBanner() {
  let banner = document.getElementById('marketEventBanner');
  if (!activeEvent) {
    if (banner) banner.style.display = 'none';
    return;
  }
  if (!banner) {
    const container = document.querySelector('.trading-container');
    if (!container) return;
    banner = document.createElement('div');
    banner.id = 'marketEventBanner';
    banner.style.cssText = 'padding:12px 16px;border-radius:10px;margin-bottom:12px;font-size:0.95rem;font-weight:600;display:flex;align-items:center;gap:10px;animation:eventPulse 2s ease-in-out infinite;';
    container.insertBefore(banner, container.firstChild);
    // Add animation keyframes
    if (!document.getElementById('eventPulseStyle')) {
      const style = document.createElement('style');
      style.id = 'eventPulseStyle';
      style.textContent = `
        @keyframes eventPulse { 0%,100%{opacity:1} 50%{opacity:0.8} }
        #marketEventBanner.event-negative { background:linear-gradient(135deg,#ff4d4d22,#ff4d4d11); border:1px solid #ff4d4d55; color:#ff4d4d; }
        #marketEventBanner.event-positive { background:linear-gradient(135deg,#00c85322,#00c85311); border:1px solid #00c85355; color:#00c853; }
        #marketEventBanner.event-neutral  { background:linear-gradient(135deg,#ffab0022,#ffab0011); border:1px solid #ffab0055; color:#ffab00; }
        #marketEventBanner .event-timer { margin-left:auto; font-size:0.8rem; opacity:0.7; }
      `;
      document.head.appendChild(style);
    }
  }
  banner.style.display = 'flex';
  const cls = activeEvent.impact < -0.02 ? 'event-negative' : activeEvent.impact > 0.02 ? 'event-positive' : 'event-neutral';
  banner.className = cls;
  banner.innerHTML = `
    <span style="font-size:1.4rem;">${activeEvent.emoji}</span>
    <span>${activeEvent.name}: ${activeEvent.description}</span>
    <span class="event-timer">${eventTicksLeft} ticks igjen</span>
  `;
}

const START_BALANCE = 500000;
let tradingState = null;
let priceInterval = null;
let currentDifficulty = localStorage.getItem('aksje-difficulty') || 'medium';
let currentSpeed = parseInt(localStorage.getItem('aksje-speed')) || 3000;
let stockChartData = {};
let candleCounter = 0;

function initPaperTrading() {
  const container = document.querySelector('.trading-container');
  if (!container) return;

  const saved = localStorage.getItem('aksje-trading');
  if (saved) {
    tradingState = JSON.parse(saved);
    // Migrate: add any new stocks not in saved state
    const existingTickers = tradingState.stocks.map(s => s.ticker);
    STOCKS.forEach(s => {
      if (!existingTickers.includes(s.ticker)) {
        tradingState.stocks.push({ ...s, price: s.basePrice, prevPrice: s.basePrice });
      }
    });
    tradingState.stocks.forEach(s => {
      const def = STOCKS.find(d => d.ticker === s.ticker);
      if (def) s.name = def.name;
    });
  } else {
    tradingState = {
      balance: START_BALANCE,
      holdings: {},
      history: [],
      stocks: STOCKS.map(s => ({ ...s, price: s.basePrice, prevPrice: s.basePrice }))
    };
  }

  // Generate chart history for each stock
  tradingState.stocks.forEach(stock => {
    stockChartData[stock.ticker] = generateStockHistory(stock.basePrice || stock.price, 90);
  });

  // Difficulty selector
  const diffSelect = document.getElementById('difficultySelect');
  if (diffSelect) {
    diffSelect.value = currentDifficulty;
    diffSelect.addEventListener('change', (e) => {
      currentDifficulty = e.target.value;
      localStorage.setItem('aksje-difficulty', currentDifficulty);
      startPriceUpdates();
    });
  }

  // Speed selector
  const speedSelect = document.getElementById('speedSelect');
  if (speedSelect) {
    speedSelect.value = currentSpeed;
    speedSelect.addEventListener('change', (e) => {
      currentSpeed = parseInt(e.target.value);
      localStorage.setItem('aksje-speed', currentSpeed);
      startPriceUpdates();
    });
  }

  renderTrading();
  startPriceUpdates();
}

function generateStockHistory(basePrice, days) {
  const data = [];
  let price = basePrice * (0.85 + Math.random() * 0.15);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const vol = 0.015;
    const change = (Math.random() - 0.50) * price * vol * 2;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * vol;
    const low = Math.min(open, close) - Math.random() * price * vol;
    const volume = Math.floor(200000 + Math.random() * 3000000);

    data.push({
      date,
      label: date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }),
      open: Math.round(open * 100) / 100,
      close: Math.round(close * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      volume
    });
    price = close;
  }
  return data;
}

function startPriceUpdates() {
  if (priceInterval) clearInterval(priceInterval);
  const diff = DIFFICULTY[currentDifficulty] || DIFFICULTY.medium;
  const interval = currentSpeed || 3000;

  priceInterval = setInterval(() => {
    candleCounter++;
    tryTriggerEvent();
    tradingState.stocks.forEach(stock => {
      stock.prevPrice = stock.price;
      const { impactBias, volMult } = getEventModifiers(stock);
      const effectiveVol = diff.volatility * volMult;
      const effectiveBias = diff.bias - impactBias * 10;

      // Per-stock random drift that shifts every ~50 ticks (some stocks trend down)
      if (!stock._drift || candleCounter % 50 === 0) {
        stock._drift = (Math.random() - 0.55) * 0.002; // slight negative skew
      }

      // Mean reversion: if price is far above base, pull it down (and vice versa)
      const base = stock.basePrice || stock.price;
      const deviation = (stock.price - base) / base;
      const meanRevert = -deviation * 0.003;

      const randomChange = (Math.random() - effectiveBias) * stock.price * effectiveVol;
      const change = randomChange + stock.price * stock._drift + stock.price * meanRevert;
      stock.price = Math.max(1, stock.price + change);
      stock.price = Math.round(stock.price * 100) / 100;

      // Update latest candle
      const history = stockChartData[stock.ticker];
      if (history && history.length > 0) {
        const last = history[history.length - 1];
        last.close = stock.price;
        last.high = Math.max(last.high, stock.price);
        last.low = Math.min(last.low, stock.price);
      }
    });

    // Every ~20 ticks, create a new candle
    if (candleCounter % 20 === 0) {
      tradingState.stocks.forEach(stock => {
        const history = stockChartData[stock.ticker];
        if (history) {
          const now = new Date();
          history.push({
            date: now,
            label: now.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }),
            open: stock.price, close: stock.price,
            high: stock.price, low: stock.price,
            volume: Math.floor(200000 + Math.random() * 3000000)
          });
          if (history.length > 200) history.shift();
        }
      });
    }

    renderStockPrices();
    renderEventBanner();
    saveTrading();

    // Redraw chart if modal visible
    const chartModal = document.getElementById('stockChartModal');
    if (chartModal && chartModal.classList.contains('show')) {
      const ticker = chartModal.dataset.ticker;
      if (ticker) drawPerStockChart(ticker);
    }
    // Redraw main chart if visible
    if (typeof drawMainChart === 'function' && document.getElementById('stockChart')) {
      drawMainChart();
    }
  }, interval);
}

function saveTrading() {
  if (tradingState) {
    localStorage.setItem('aksje-trading', JSON.stringify(tradingState));
  }
}

function renderTrading() {
  renderStockList();
  renderPortfolio();
}

function renderStockList() {
  const list = document.querySelector('.stock-list');
  if (!list) return;

  const rows = tradingState.stocks.map((stock, i) => {
    const change = stock.price - stock.prevPrice;
    const changePct = stock.prevPrice ? ((change / stock.prevPrice) * 100).toFixed(2) : '0.00';
    const cls = change >= 0 ? 'positive' : 'negative';
    const sign = change >= 0 ? '+' : '';
    const held = tradingState.holdings[stock.ticker]?.qty || 0;
    return `<tr class="stock-row">
      <td class="stock-name"><span class="stock-name-text">${stock.name}</span><br><span class="ticker">${stock.ticker}</span>${held > 0 ? '<br><span class="ticker" style="color:var(--accent-green);">Eier: ' + held + '</span>' : ''}</td>
      <td class="stock-price">${stock.price.toFixed(2)} kr</td>
      <td class="stock-change ${cls}">${sign}${changePct}%</td>
      <td class="stock-actions">
        <button class="btn btn-primary btn-sm" onclick="quickTrade(${i},'buy',1)">+1</button>
        <button class="btn btn-primary btn-sm" onclick="quickTrade(${i},'buy',10)">+10</button>
        <button class="btn btn-primary btn-sm" onclick="quickTrade(${i},'buy',100)">+100</button>
        <button class="btn btn-primary btn-sm" onclick="quickTrade(${i},'buy',1000)">+1k</button>
        ${held > 0 ? '<button class="btn btn-secondary btn-sm" onclick="quickTrade('+i+',\'sell\',1)">-1</button>' : ''}
        ${held >= 10 ? '<button class="btn btn-secondary btn-sm" onclick="quickTrade('+i+',\'sell\',10)">-10</button>' : ''}
        ${held >= 100 ? '<button class="btn btn-secondary btn-sm" onclick="quickTrade('+i+',\'sell\',100)">-100</button>' : ''}
        ${held >= 1000 ? '<button class="btn btn-secondary btn-sm" onclick="quickTrade('+i+',\'sell\',1000)">-1k</button>' : ''}
        ${held > 0 ? '<button class="btn btn-secondary btn-sm" onclick="quickTrade('+i+',\'sell\',' + held + ')">Selg alt</button>' : ''}
      </td>
    </tr>`;
  }).join('');

  list.innerHTML = `<table class="stock-table"><colgroup>
    <col style="width:28%"><col style="width:14%"><col style="width:10%"><col style="width:48%">
  </colgroup><tbody>${rows}</tbody></table>`;
}

function renderStockPrices() {
  const rows = document.querySelectorAll('tr.stock-row');
  tradingState.stocks.forEach((stock, i) => {
    if (!rows[i]) return;
    const priceEl = rows[i].querySelector('.stock-price');
    const changeEl = rows[i].querySelector('.stock-change');
    if (priceEl) priceEl.textContent = stock.price.toFixed(2) + ' kr';
    if (changeEl) {
      const change = stock.price - stock.prevPrice;
      const changePct = stock.prevPrice ? ((change / stock.prevPrice) * 100).toFixed(2) : '0.00';
      const cls = change >= 0 ? 'positive' : 'negative';
      const sign = change >= 0 ? '+' : '';
      changeEl.className = `stock-change ${cls}`;
      changeEl.textContent = `${sign}${changePct}%`;
    }
  });
  renderPortfolio();
}

function renderPortfolio() {
  const balanceEl = document.querySelector('.balance-display');
  const holdingsEl = document.querySelector('.holdings-list');
  const historyEl = document.querySelector('.history-list');

  if (balanceEl) {
    const totalValue = getTotalPortfolioValue();
    const cash = tradingState.balance;
    const invested = totalValue - cash;
    const pl = totalValue - START_BALANCE;
    const plSign = pl >= 0 ? '+' : '';
    const plColor = pl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    balanceEl.innerHTML =
      '<div style="font-size:0.85rem;color:var(--text-muted);font-weight:400;">Kontanter</div>' +
      '<div>' + formatNOK(cash) + '</div>' +
      (invested > 0 ? '<div style="font-size:0.85rem;color:var(--text-muted);font-weight:400;margin-top:6px;">Investert: ' + formatNOK(invested) + '</div>' : '') +
      '<div style="font-size:0.85rem;color:var(--text-muted);font-weight:400;margin-top:2px;">Totalt: ' + formatNOK(totalValue) +
      ' <span style="color:' + plColor + '">' + plSign + formatNOK(pl) + '</span></div>';
  }

  if (holdingsEl) {
    const entries = Object.entries(tradingState.holdings).filter(([,v]) => v.qty > 0);
    if (entries.length === 0) {
      holdingsEl.innerHTML = '<p class="text-muted" style="font-size:0.85rem;">Ingen beholdninger enn\u00E5</p>';
    } else {
      holdingsEl.innerHTML = entries.map(([ticker, h]) => {
        const stock = tradingState.stocks.find(s => s.ticker === ticker);
        const currentVal = stock ? stock.price * h.qty : 0;
        const pl = currentVal - (h.avgPrice * h.qty);
        const plCls = pl >= 0 ? 'text-green' : 'text-red';
        const plSign = pl >= 0 ? '+' : '';
        return `
          <div class="holding-item">
            <div><strong>${ticker}</strong> ${h.qty} aksjer @ ${h.avgPrice.toFixed(2)} kr</div>
            <div class="${plCls}">${plSign}${formatNOK(pl)}</div>
          </div>
        `;
      }).join('');
    }
  }

  if (historyEl) {
    const recent = tradingState.history.slice(-10).reverse();
    historyEl.innerHTML = recent.map(h => `
      <div class="history-item">
        <span>${h.type === 'buy' ? 'Kjop' : 'Salg'} ${h.qty}x ${h.ticker}</span>
        <span>${formatNOK(h.total)}</span>
      </div>
    `).join('') || '<p class="text-muted" style="font-size:0.85rem;">Ingen transaksjoner</p>';
  }
}

function getTotalPortfolioValue() {
  let total = tradingState.balance;
  Object.entries(tradingState.holdings).forEach(([ticker, h]) => {
    const stock = tradingState.stocks.find(s => s.ticker === ticker);
    if (stock) total += stock.price * h.qty;
  });
  return total;
}

function formatNOK(val) {
  return val.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
}

window.openTradeModal = function(stockIndex, type) {
  const stock = tradingState.stocks[stockIndex];
  const modal = document.getElementById('tradeModal');
  if (!modal) return;

  const overlay = modal.closest('.modal-overlay') || modal.parentElement;
  overlay.classList.add('show');

  document.getElementById('tradeType').textContent = type === 'buy' ? 'Kjop' : 'Selg';
  document.getElementById('tradeStock').textContent = `${stock.name} (${stock.ticker})`;
  document.getElementById('tradePrice').textContent = stock.price.toFixed(2) + ' kr';

  const qtyInput = document.getElementById('tradeQty');
  const maxQty = type === 'buy'
    ? Math.floor(tradingState.balance / stock.price)
    : (tradingState.holdings[stock.ticker]?.qty || 0);
  qtyInput.value = 1;
  qtyInput.max = maxQty;
  qtyInput.removeAttribute('max'); // allow typing large numbers

  updateTradeTotal(stock.price);
  qtyInput.oninput = () => updateTradeTotal(stock.price);

  // Quick quantity buttons
  const quickBtns = document.getElementById('quickQtyBtns');
  if (quickBtns) {
    const amounts = [1, 10, 50, 100, 500];
    quickBtns.innerHTML = amounts.map(n =>
      `<button class="btn btn-ghost btn-sm" onclick="document.getElementById('tradeQty').value=${Math.min(n, maxQty)};document.getElementById('tradeQty').dispatchEvent(new Event('input'))">${n}</button>`
    ).join('') +
    `<button class="btn btn-ghost btn-sm" onclick="document.getElementById('tradeQty').value=${maxQty};document.getElementById('tradeQty').dispatchEvent(new Event('input'))">Maks</button>`;
  }

  document.getElementById('confirmTrade').onclick = () => {
    const qty = parseInt(qtyInput.value) || 0;
    if (qty <= 0) return;

    if (type === 'buy') {
      const cost = stock.price * qty;
      if (cost > tradingState.balance) {
        alert('Ikke nok midler!');
        return;
      }
      tradingState.balance -= cost;
      if (!tradingState.holdings[stock.ticker]) {
        tradingState.holdings[stock.ticker] = { qty: 0, avgPrice: 0 };
      }
      const h = tradingState.holdings[stock.ticker];
      h.avgPrice = ((h.avgPrice * h.qty) + cost) / (h.qty + qty);
      h.qty += qty;
      tradingState.history.push({ type: 'buy', ticker: stock.ticker, qty, price: stock.price, total: cost, time: Date.now() });
    } else {
      const holding = tradingState.holdings[stock.ticker];
      if (!holding || holding.qty < qty) {
        alert('Ikke nok aksjer!');
        return;
      }
      const revenue = stock.price * qty;
      tradingState.balance += revenue;
      holding.qty -= qty;
      tradingState.history.push({ type: 'sell', ticker: stock.ticker, qty, price: stock.price, total: revenue, time: Date.now() });
    }

    saveTrading();
    renderTrading();
    overlay.classList.remove('show');
  };

  document.getElementById('cancelTrade').onclick = () => overlay.classList.remove('show');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };
};

window.quickTrade = function(stockIndex, type, qty) {
  const stock = tradingState.stocks[stockIndex];
  if (!stock || qty <= 0) return;

  if (type === 'buy') {
    const cost = stock.price * qty;
    if (cost > tradingState.balance) { alert('Ikke nok midler!'); return; }
    tradingState.balance -= cost;
    if (!tradingState.holdings[stock.ticker]) tradingState.holdings[stock.ticker] = { qty: 0, avgPrice: 0 };
    const h = tradingState.holdings[stock.ticker];
    h.avgPrice = ((h.avgPrice * h.qty) + cost) / (h.qty + qty);
    h.qty += qty;
    tradingState.history.push({ type: 'buy', ticker: stock.ticker, qty, price: stock.price, total: cost, time: Date.now() });
  } else {
    const holding = tradingState.holdings[stock.ticker];
    if (!holding || holding.qty < qty) { alert('Ikke nok aksjer!'); return; }
    tradingState.balance += stock.price * qty;
    holding.qty -= qty;
    tradingState.history.push({ type: 'sell', ticker: stock.ticker, qty, price: stock.price, total: stock.price * qty, time: Date.now() });
  }
  saveTrading();
  renderTrading();
};

function updateTradeTotal(price) {
  const qty = parseInt(document.getElementById('tradeQty').value) || 0;
  document.getElementById('tradeTotal').textContent = formatNOK(price * qty);
}

/* Per-stock chart modal */
window.showStockChart = function(ticker) {
  let modal = document.getElementById('stockChartModal');
  if (!modal) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'stockChartModal';
    overlay.innerHTML = `
      <div class="modal" style="max-width:820px;width:95%;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 id="chartModalTitle" style="margin:0;"></h3>
          <button class="btn btn-ghost btn-sm" id="closeChartModal" style="font-size:1.2rem;">✕</button>
        </div>
        <div class="chart-controls" style="margin-bottom:12px;">
          <button data-chart-action="line" class="active">Linje</button>
          <button data-chart-action="candlestick">Candlestick</button>
        </div>
        <div style="position:relative;">
          <canvas id="perStockCanvas" style="width:100%;height:350px;"></canvas>
          <div class="chart-tooltip" id="perStockTooltip"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    modal = overlay;

    document.getElementById('closeChartModal').onclick = () => modal.classList.remove('show');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };

    modal.querySelectorAll('[data-chart-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('[data-chart-action]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        modal.dataset.chartType = btn.dataset.chartAction;
        drawPerStockChart(modal.dataset.ticker);
      });
    });
  }

  const stock = tradingState.stocks.find(s => s.ticker === ticker);
  document.getElementById('chartModalTitle').textContent = stock ? `${stock.name} (${stock.ticker}) — ${stock.price.toFixed(2)} kr` : ticker;
  modal.dataset.ticker = ticker;
  modal.dataset.chartType = modal.dataset.chartType || 'line';
  modal.classList.add('show');

  const activeType = modal.dataset.chartType;
  modal.querySelectorAll('[data-chart-action]').forEach(b => {
    b.classList.toggle('active', b.dataset.chartAction === activeType);
  });

  setTimeout(() => drawPerStockChart(ticker), 50);
};

function drawPerStockChart(ticker) {
  const canvas = document.getElementById('perStockCanvas');
  const modal = document.getElementById('stockChartModal');
  if (!canvas || !modal) return;

  const data = stockChartData[ticker];
  if (!data || data.length === 0) return;

  const chartType = modal.dataset.chartType || 'line';
  drawChartOnCanvas(canvas, data, chartType, document.getElementById('perStockTooltip'), 350);
}

function drawChartOnCanvas(canvas, data, chartType, tooltip, height) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width;
  const h = height || 400;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  const pad = { top: 20, right: 20, bottom: 30, left: 65 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const allPrices = data.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...allPrices) * 0.98;
  const maxPrice = Math.max(...allPrices) * 1.02;

  ctx.clearRect(0, 0, w, h);

  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--text-muted').trim() || '#64748b';
  const greenColor = style.getPropertyValue('--accent-green').trim() || '#00d4aa';
  const redColor = style.getPropertyValue('--accent-red').trim() || '#ef4444';

  // Grid
  ctx.strokeStyle = textColor;
  ctx.globalAlpha = 0.12;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (plotH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Y labels
  ctx.fillStyle = textColor;
  ctx.font = '11px DM Sans, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const val = maxPrice - ((maxPrice - minPrice) / 5) * i;
    const y = pad.top + (plotH / 5) * i;
    ctx.fillText(val.toFixed(1), pad.left - 8, y + 4);
  }

  const barW = plotW / data.length;
  const priceToY = p => pad.top + plotH - ((p - minPrice) / (maxPrice - minPrice)) * plotH;

  if (chartType === 'candlestick') {
    data.forEach((d, i) => {
      const x = pad.left + barW * i + barW / 2;
      const bullish = d.close >= d.open;
      const color = bullish ? greenColor : redColor;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(d.high));
      ctx.lineTo(x, priceToY(d.low));
      ctx.stroke();

      const bodyTop = priceToY(Math.max(d.open, d.close));
      const bodyBot = priceToY(Math.min(d.open, d.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - barW * 0.35, bodyTop, barW * 0.7, bodyH);
    });
  } else {
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + barW * i + barW / 2;
      const y = priceToY(d.close);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = greenColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    const lastX = pad.left + barW * (data.length - 1) + barW / 2;
    ctx.lineTo(lastX, pad.top + plotH);
    ctx.lineTo(pad.left + barW / 2, pad.top + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, h);
    grad.addColorStop(0, greenColor + '30');
    grad.addColorStop(1, greenColor + '03');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // X labels
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  const labelStep = Math.max(1, Math.floor(data.length / 8));
  data.forEach((d, i) => {
    if (i % labelStep === 0) {
      const x = pad.left + barW * i + barW / 2;
      ctx.fillText(d.label, x, h - 6);
    }
  });

  // Tooltip
  if (tooltip) {
    canvas.onmousemove = (e) => {
      const cr = canvas.getBoundingClientRect();
      const mx = e.clientX - cr.left;
      const idx = Math.floor((mx - pad.left) / barW);
      const d = data[idx];
      if (d && mx > pad.left && mx < w - pad.right) {
        tooltip.style.display = 'block';
        tooltip.style.left = (mx + 12) + 'px';
        tooltip.style.top = (e.clientY - cr.top - 20) + 'px';
        tooltip.innerHTML = `
          <div style="font-weight:700;margin-bottom:4px;">${d.label}</div>
          <div>Apning: ${d.open.toFixed(2)}</div>
          <div>Hoy: ${d.high.toFixed(2)}</div>
          <div>Lav: ${d.low.toFixed(2)}</div>
          <div>Lukk: ${d.close.toFixed(2)}</div>
          <div>Volum: ${d.volume.toLocaleString('nb-NO')}</div>
        `;
      } else {
        tooltip.style.display = 'none';
      }
    };
    canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
  }
}

window.resetTrading = function() {
  if (!confirm('Er du sikker pa at du vil nullstille papirhandelen?')) return;
  localStorage.removeItem('aksje-trading');
  tradingState = {
    balance: START_BALANCE,
    holdings: {},
    history: [],
    stocks: STOCKS.map(s => ({ ...s, price: s.basePrice, prevPrice: s.basePrice }))
  };
  tradingState.stocks.forEach(stock => {
    stockChartData[stock.ticker] = generateStockHistory(stock.basePrice, 90);
  });
  renderTrading();
};

/* ---------- Calculators ---------- */
function initCalculators() {
  const compoundBtn = document.getElementById('calcCompound');
  if (compoundBtn) {
    compoundBtn.addEventListener('click', calculateCompound);
  }

  const dividendBtn = document.getElementById('calcDividend');
  if (dividendBtn) {
    dividendBtn.addEventListener('click', calculateDividend);
  }
}

function calculateCompound() {
  const principal = parseFloat(document.getElementById('principal').value) || 0;
  const rate = parseFloat(document.getElementById('rate').value) || 0;
  const years = parseFloat(document.getElementById('years').value) || 0;
  const monthly = parseFloat(document.getElementById('monthly').value) || 0;

  const r = rate / 100;
  let total = principal;
  const dataPoints = [total];

  for (let y = 1; y <= years; y++) {
    total = (total + monthly * 12) * (1 + r);
    dataPoints.push(Math.round(total));
  }

  const totalContributed = principal + (monthly * 12 * years);
  const interest = total - totalContributed;

  document.getElementById('compoundResult').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;">
      <div><div class="result-value">${formatNOK(total)}</div><div class="result-label">Sluttverdi</div></div>
      <div><div class="result-value" style="color:var(--accent-blue)">${formatNOK(totalContributed)}</div><div class="result-label">Totalt innskudd</div></div>
      <div><div class="result-value" style="color:var(--accent-green)">${formatNOK(interest)}</div><div class="result-label">Renteinntekt</div></div>
    </div>
  `;

  drawCalcChart('compoundChart', dataPoints, years);
}

function calculateDividend() {
  const investment = parseFloat(document.getElementById('divInvestment').value) || 0;
  const yieldPct = parseFloat(document.getElementById('divYield').value) || 0;
  const sharePrice = parseFloat(document.getElementById('divSharePrice').value) || 1;

  const annualDiv = investment * (yieldPct / 100);
  const monthlyDiv = annualDiv / 12;
  const shares = Math.floor(investment / sharePrice);

  document.getElementById('dividendResult').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;">
      <div><div class="result-value">${formatNOK(annualDiv)}</div><div class="result-label">Arlig utbytte</div></div>
      <div><div class="result-value" style="color:var(--accent-blue)">${formatNOK(monthlyDiv)}</div><div class="result-label">Manedlig</div></div>
      <div><div class="result-value" style="color:var(--accent-green)">${shares}</div><div class="result-label">Antall aksjer</div></div>
    </div>
  `;
}

function drawCalcChart(canvasId, data, years) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 250 * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '250px';
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 250;
  const padding = { top: 20, right: 20, bottom: 30, left: 70 };
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const maxVal = Math.max(...data);

  ctx.clearRect(0, 0, w, h);

  // Grid lines
  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--text-muted').trim() || '#64748b';
  const greenColor = style.getPropertyValue('--accent-green').trim() || '#00d4aa';

  ctx.strokeStyle = textColor;
  ctx.globalAlpha = 0.15;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Y labels
  ctx.fillStyle = textColor;
  ctx.font = '11px DM Sans, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = maxVal - (maxVal / 4) * i;
    const y = padding.top + (plotH / 4) * i;
    ctx.fillText(Math.round(val).toLocaleString('nb-NO') + ' kr', padding.left - 8, y + 4);
  }

  // X labels
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(data.length / 6));
  for (let i = 0; i < data.length; i += step) {
    const x = padding.left + (plotW / (data.length - 1)) * i;
    ctx.fillText('Ar ' + i, x, h - 6);
  }

  // Area
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = padding.left + (plotW / (data.length - 1)) * i;
    const y = padding.top + plotH - (val / maxVal) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + plotW, padding.top + plotH);
  ctx.lineTo(padding.left, padding.top + plotH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padding.top, 0, h);
  grad.addColorStop(0, greenColor + '40');
  grad.addColorStop(1, greenColor + '05');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = padding.left + (plotW / (data.length - 1)) * i;
    const y = padding.top + plotH - (val / maxVal) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = greenColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

/* ---------- Stock Chart (Per-Stock Viewer) ---------- */
let mainChartType = 'line';

function drawMainChart() {
  const canvas = document.getElementById('stockChart');
  if (!canvas || !tradingState) return;

  const select = document.getElementById('chartStockSelect');
  const ticker = select ? select.value : STOCKS[0].ticker;
  const data = stockChartData[ticker];
  if (!data || data.length === 0) return;

  drawChartOnCanvas(canvas, data, mainChartType, document.querySelector('#aksjekart .chart-tooltip'), 400);
}

function initStockChart() {
  const canvas = document.getElementById('stockChart');
  if (!canvas) return;

  // Add stock selector
  const controls = document.querySelector('#aksjekart .chart-controls');
  if (controls && !document.getElementById('chartStockSelect')) {
    const select = document.createElement('select');
    select.id = 'chartStockSelect';
    select.style.cssText = 'padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);font-size:0.85rem;margin-right:8px;cursor:pointer;';
    STOCKS.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.ticker;
      opt.textContent = `${s.ticker} — ${s.name}`;
      select.appendChild(opt);
    });
    controls.insertBefore(select, controls.firstChild);
    select.addEventListener('change', drawMainChart);
  }

  // Controls
  document.querySelectorAll('#aksjekart .chart-controls button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'line' || action === 'candlestick') {
        mainChartType = action;
        document.querySelectorAll('#aksjekart .chart-controls button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      drawMainChart();
    });
  });

  // Initial draw after small delay to let trading data load
  setTimeout(drawMainChart, 200);
  window.addEventListener('resize', drawMainChart);
}

/* ---------- Glossary Search ---------- */
function initGlossarySearch() {
  const input = document.getElementById('glossarySearch');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('.glossary-term').forEach(term => {
      const text = term.textContent.toLowerCase();
      term.style.display = text.includes(q) ? '' : 'none';
    });

    // Show/hide sections with no visible terms
    document.querySelectorAll('.glossary-section').forEach(section => {
      const hiddenAll = Array.from(section.querySelectorAll('.glossary-term')).every(t => t.style.display === 'none');
      section.style.display = hiddenAll ? 'none' : '';
    });
  });
}

/* ---------- Blog Routing ---------- */
function initBlogRouting() {
  const listing = document.getElementById('article-listing');
  const detail = document.getElementById('article-detail');
  if (!listing || !detail) return;

  function showArticle() {
    const hash = location.hash.slice(1);
    if (hash) {
      const article = document.getElementById(hash);
      if (article && article.classList.contains('article-full')) {
        listing.style.display = 'none';
        detail.style.display = 'block';
        detail.innerHTML = '';
        const titleEl = article.querySelector('h2');
        const title = titleEl ? titleEl.textContent : hash;
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'blog-breadcrumbs';
        breadcrumb.innerHTML = '<a href="index.html">Hjem</a><span class="separator">&rsaquo;</span><a href="blogg.html">Artikler</a><span class="separator">&rsaquo;</span><span>' + title + '</span>';
        detail.appendChild(breadcrumb);
        const clone = article.cloneNode(true);
        clone.style.display = 'block';
        detail.appendChild(clone);
        window.scrollTo({ top: 0 });
        return;
      }
    }
    listing.style.display = 'block';
    detail.style.display = 'none';
  }

  showArticle();
  window.addEventListener('hashchange', showArticle);
}

/* ---------- Newsletter Form ---------- */
function initNewsletterForm() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (input && input.value) {
      alert('Takk for pameldingen! Du vil motta vart nyhetsbrev snart.');
      input.value = '';
    }
  });
}
