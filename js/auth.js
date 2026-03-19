/* ============================================
   Addern Investing — Auth & Cloud Sync
   Supabase magic link auth + progress sync
   ============================================ */

const SUPABASE_URL = 'https://clqjkjdzjlbfbkmijdgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscWpramR6amxiZmJrbWlqZGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDEwNTMsImV4cCI6MjA4OTQxNzA1M30.cge1QXtK-jLRKuZzwDuDkHJMVWYi15JMeNbX9KdR5hI';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Global auth state ---------- */
window.aksjeAuth = {
  user: null,
  profile: null,
  ready: false,

  async syncModule(courseId, moduleIndex) {
    if (!this.user) return;
    try {
      await _supabase.from('course_progress').upsert({
        user_id: this.user.id,
        course_id: courseId,
        module_index: moduleIndex,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,course_id,module_index' });
    } catch (e) {
      console.warn('Cloud sync failed:', e);
    }
  },

  async loadAndMergeProgress(courseId) {
    if (!this.user) return;
    try {
      const { data } = await _supabase
        .from('course_progress')
        .select('module_index')
        .eq('user_id', this.user.id)
        .eq('course_id', courseId);

      if (!data || !data.length) return;

      const local = JSON.parse(localStorage.getItem(`aksje-progress-${courseId}`) || '{}');
      let changed = false;

      data.forEach(row => {
        if (!local[row.module_index]) {
          local[row.module_index] = true;
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem(`aksje-progress-${courseId}`, JSON.stringify(local));
        const links = document.querySelectorAll('.sidebar-nav a');
        links.forEach((link, i) => {
          if (local[i]) link.classList.add('completed');
        });
        if (typeof updateProgressDisplay === 'function') {
          updateProgressDisplay(courseId);
        }
      }

      const cloudSet = new Set(data.map(r => r.module_index));
      for (const idx of Object.keys(local)) {
        if (!cloudSet.has(parseInt(idx))) {
          await this.syncModule(courseId, parseInt(idx));
        }
      }
    } catch (e) {
      console.warn('Cloud progress load failed:', e);
    }
  }
};

/* ---------- Auth gate (require login) ---------- */
function createAuthGate() {
  if (window.location.pathname.includes('admin.html')) return;

  const gate = document.createElement('div');
  gate.id = 'auth-gate';
  gate.className = 'auth-gate';
  gate.innerHTML = `
    <div class="auth-gate-inner">
      <span class="auth-logo">A</span>
      <h1>Velkommen til Addern Investing</h1>
      <p>Logg inn for å få tilgang til kurs, verktøy og artikler.</p>
      <button class="auth-submit" id="auth-gate-btn">Logg inn med e-post</button>
      <p class="auth-hint">Gratis konto — vi sender deg en innloggingslenke.</p>
    </div>
  `;
  document.body.appendChild(gate);
  gate.querySelector('#auth-gate-btn').addEventListener('click', openAuthModal);
}

function showAuthGate() {
  const gate = document.getElementById('auth-gate');
  if (gate) gate.classList.add('active');
}

function hideAuthGate() {
  const gate = document.getElementById('auth-gate');
  if (gate) gate.classList.remove('active');
}

/* ---------- Auth modal ---------- */
function createAuthModal() {
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-modal-backdrop"></div>
    <div class="auth-modal-content">
      <button class="auth-modal-close" aria-label="Lukk">&times;</button>
      <div class="auth-modal-header">
        <span class="auth-logo">A</span>
        <h2>Logg inn</h2>
        <p>Få tilgang til kursfremdrift, lagring i skyen og mer.</p>
      </div>
      <form id="auth-form" class="auth-form">
        <div class="auth-input-group">
          <label for="auth-email">E-postadresse</label>
          <input type="email" id="auth-email" placeholder="din@epost.no" required autocomplete="email">
        </div>
        <button type="submit" class="auth-submit">Send innloggingslenke</button>
        <p class="auth-hint">Vi sender deg en magisk lenke — ingen passord nødvendig.</p>
      </form>
      <div id="auth-success" class="auth-success" style="display:none">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--accent-green)" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
        <h3>Sjekk e-posten din!</h3>
        <p>Vi har sendt en innloggingslenke til <strong id="auth-sent-email"></strong></p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.auth-modal-backdrop').addEventListener('click', closeAuthModal);
  modal.querySelector('.auth-modal-close').addEventListener('click', closeAuthModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });
  modal.querySelector('#auth-form').addEventListener('submit', handleLogin);
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  modal.querySelector('#auth-form').style.display = '';
  modal.querySelector('#auth-success').style.display = 'none';
  modal.querySelector('#auth-email').value = '';
  setTimeout(() => modal.querySelector('#auth-email').focus(), 100);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  if (!email) return;

  const btn = document.querySelector('.auth-submit');
  btn.textContent = 'Sender...';
  btn.disabled = true;

  const { error } = await _supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname }
  });

  if (error) {
    btn.textContent = 'Send innloggingslenke';
    btn.disabled = false;
    alert('Noe gikk galt: ' + error.message);
    return;
  }

  document.getElementById('auth-form').style.display = 'none';
  document.getElementById('auth-sent-email').textContent = email;
  document.getElementById('auth-success').style.display = '';
}

/* ---------- Nav auth UI ---------- */
function injectNavAuth() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  const loginBtn = document.createElement('button');
  loginBtn.className = 'nav-auth-btn';
  loginBtn.id = 'nav-login-btn';
  loginBtn.textContent = 'Logg inn';
  loginBtn.addEventListener('click', openAuthModal);
  navActions.insertBefore(loginBtn, navActions.firstChild);

  const userEl = document.createElement('div');
  userEl.className = 'nav-user';
  userEl.id = 'nav-user';
  userEl.style.display = 'none';
  userEl.innerHTML = `
    <button class="nav-user-btn">
      <span class="nav-user-avatar"></span>
      <span class="nav-user-name"></span>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="nav-user-dropdown">
      <div class="nav-user-email"></div>
      <a href="#" class="nav-user-item" id="nav-admin-link" style="display:none">Admin-panel</a>
      <button class="nav-user-item nav-logout-btn">Logg ut</button>
    </div>
  `;
  navActions.insertBefore(userEl, navActions.firstChild);

  userEl.querySelector('.nav-user-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    userEl.classList.toggle('open');
  });
  document.addEventListener('click', () => userEl.classList.remove('open'));

  userEl.querySelector('.nav-logout-btn').addEventListener('click', async () => {
    await _supabase.auth.signOut();
    window.aksjeAuth.user = null;
    window.aksjeAuth.profile = null;
    updateNavState(null);
    showAuthGate();
  });
}

function updateNavState(user) {
  const loginBtn = document.getElementById('nav-login-btn');
  const userEl = document.getElementById('nav-user');
  if (!loginBtn || !userEl) return;

  if (user) {
    loginBtn.style.display = 'none';
    userEl.style.display = '';
    const name = window.aksjeAuth.profile?.display_name || user.email.split('@')[0];
    userEl.querySelector('.nav-user-avatar').textContent = name.charAt(0).toUpperCase();
    userEl.querySelector('.nav-user-name').textContent = name;
    userEl.querySelector('.nav-user-email').textContent = user.email;

    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink && window.aksjeAuth.profile?.is_admin) {
      adminLink.style.display = '';
      const isInKurs = window.location.pathname.includes('/kurs/');
      adminLink.href = isInKurs ? '../admin.html' : 'admin.html';
    }
  } else {
    loginBtn.style.display = '';
    userEl.style.display = 'none';
  }
}

/* ---------- Session handling ---------- */
async function loadProfile(userId) {
  const { data } = await _supabase
    .from('profiles')
    .select('display_name, email, is_admin')
    .eq('id', userId)
    .single();
  return data;
}

async function handleSession(session) {
  if (session?.user) {
    window.aksjeAuth.user = session.user;
    window.aksjeAuth.profile = await loadProfile(session.user.id);

    if (window.aksjeAuth.profile && !window.aksjeAuth.profile.email) {
      await _supabase.from('profiles')
        .update({ email: session.user.email })
        .eq('id', session.user.id);
    }

    updateNavState(session.user);
    hideAuthGate();

    const courseId = document.body.dataset.course;
    if (courseId) {
      await window.aksjeAuth.loadAndMergeProgress(courseId);
    }
  } else {
    window.aksjeAuth.user = null;
    window.aksjeAuth.profile = null;
    updateNavState(null);
    showAuthGate();
  }
  window.aksjeAuth.ready = true;
}

/* ---------- Init ---------- */
// Hide page immediately while checking auth (prevents flash)
if (!window.location.pathname.includes('admin.html')) {
  document.documentElement.style.visibility = 'hidden';
}

document.addEventListener('DOMContentLoaded', async () => {
  createAuthGate();
  createAuthModal();
  injectNavAuth();

  const { data: { session } } = await _supabase.auth.getSession();
  await handleSession(session);

  // Reveal page — either content or gate is now showing
  document.documentElement.style.visibility = '';

  _supabase.auth.onAuthStateChange(async (event, session) => {
    await handleSession(session);
    if (event === 'SIGNED_IN') closeAuthModal();
  });
});
