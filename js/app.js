// ============================================================
// BODORO - Main App Controller
// ============================================================

const App = {
  _mode: 'client',      // 'client' | 'admin'
  _clientTab: 'accueil', // 'accueil' | 'menu' | 'contact'
  _adminTab: 'dashboard',

  async init() {
    // Dark mode immédiatement (localStorage, pas besoin d'attendre Firestore)
    DB.initDarkMode();
    this._updateDarkModeIcon();

    // Afficher l'écran de chargement
    this._showLoader();

    // Charger toutes les données depuis Firestore
    await DB.loadAll();

    // Seeder si la base est vide (premier lancement)
    if (!DB.isSeeded()) await seedDatabase();

    // Masquer l'écran de chargement
    this._hideLoader();

    // Load saved mode
    this._mode = DB.getMode();
    if (this._mode === 'admin' && !DB.validateAdminToken()) {
      this._mode = 'client';
      DB.setMode('client');
    }

    // Event listeners
    this._setupEvents();

    // Cart drawer overlay close
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) overlay.addEventListener('click', () => CartDrawer.close());

    // Generic modal overlay close
    const modalOverlay = document.getElementById('generic-modal');
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) Modal.close();
    });

    // Checkout modal overlay close
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) CheckoutModal.close();
    });

    // Floating cart button
    const cartBtn = document.getElementById('floating-cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', () => CartDrawer.open());

    // Back to top
    window.addEventListener('scroll', () => {
      const btn = document.getElementById('back-to-top');
      if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    });
    const backTop = document.getElementById('back-to-top');
    if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Checkout button in cart drawer
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
      CartDrawer.close();
      CheckoutModal.open();
    });

    // Delivery type toggle in checkout
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delivery-option')) {
        document.querySelectorAll('.delivery-option').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const addressGroup = document.getElementById('checkout-address-group');
        if (addressGroup) {
          addressGroup.style.display = e.target.dataset.type === 'livraison' ? 'block' : 'none';
        }
      }
    });

    // Checkout form submit
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('click', (e) => {
        if (e.target.id === 'checkout-submit-btn') {
          e.preventDefault();
          CartManager.checkout();
        }
      });
    }

    // Render initial state
    CartDrawer.render();
    this.render();
    this._updateRestaurantStatus();
    this._updateFooterInfo();
    // Refresh status every minute
    setInterval(() => this._updateRestaurantStatus(), 60000);
  },

  _setupEvents() {
    // Dark mode toggle
    const darkToggle = document.getElementById('dark-mode-toggle');
    if (darkToggle) darkToggle.addEventListener('click', () => this.toggleDarkMode());

    // Mode toggle
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) modeToggle.addEventListener('click', () => this.toggleMode());

    // Admin sidebar navigation
    document.querySelectorAll('#admin-sidebar .sidebar-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => this.setAdminTab(item.dataset.tab));
    });

    // Logout button
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

    // Client tabs
    document.querySelectorAll('.client-tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => this.setClientTab(tab.dataset.tab));
    });

    // Announcement banner close
    const bannerClose = document.getElementById('banner-close');
    if (bannerClose) bannerClose.addEventListener('click', () => {
      document.getElementById('announcement-banner').style.display = 'none';
      document.body.classList.remove('banner-open');
    });
  },

  toggleDarkMode() {
    const isDark = DB.toggleDarkMode();
    this._updateDarkModeIcon();
  },

  _updateDarkModeIcon() {
    const icon = document.getElementById('dark-mode-icon');
    if (icon) icon.textContent = DB.isDarkMode() ? '☀️' : '🌙';
  },

  toggleMode() {
    if (this._mode === 'client') {
      this._mode = 'admin';
      DB.setMode('admin');
    } else {
      this._mode = 'client';
      DB.setMode('client');
    }
    this.render();
    this._updateModeButton();
  },

  _updateModeButton() {
    const btn = document.getElementById('mode-toggle');
    if (btn) {
      btn.textContent = this._mode === 'client' ? '⚙️ Mode Admin' : '🍽️ Mode Client';
    }
  },

  logout() {
    DB.adminLogout();
    this._mode = 'client';
    DB.setMode('client');
    this._updateModeButton();
    this.render();
    Toast.success('Déconnexion réussie');
  },

  setClientTab(tab) {
    this._clientTab = tab;
    this._mode = 'client';
    DB.setMode('client');
    this._updateModeButton();

    // Update tab buttons
    document.querySelectorAll('.client-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Show/hide pages
    document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-' + tab);
    if (page) page.classList.remove('hidden');

    // Hide admin section
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('client-section').classList.remove('hidden');

    // Render the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'accueil') ClientPages.renderAccueil();
    else if (tab === 'menu') ClientPages.renderMenu();
    else if (tab === 'contact') ClientPages.renderContact();

    // Adjust hero visibility
    const hero = document.querySelector('.hero');
    if (hero) hero.style.display = tab === 'accueil' ? 'block' : 'none';
  },

  setAdminTab(tab) {
    this._adminTab = tab;

    // Update sidebar
    document.querySelectorAll('#admin-sidebar .sidebar-item[data-tab]').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    // Render the page directly into admin-content
    window.scrollTo({ top: 0, behavior: 'smooth' });
    AdminPages.render(tab);
  },

  render() {
    if (this._mode === 'client') {
      document.getElementById('client-section').classList.remove('hidden');
      document.getElementById('admin-section').classList.add('hidden');
      this.setClientTab(this._clientTab);
    } else {
      document.getElementById('client-section').classList.add('hidden');
      document.getElementById('admin-section').classList.remove('hidden');
      this.setAdminTab(this._adminTab);
    }
    this._updateModeButton();
  },

  _updateRestaurantStatus() {
    const badge = document.getElementById('restaurant-status');
    if (!badge) return;
    const config = DB.getConfig();
    try {
      const now = new Date();
      const [openH, openM] = (config.openingTime || '08:00').split(':').map(Number);
      const [closeH, closeM] = (config.closingTime || '22:00').split(':').map(Number);
      const openMins = openH * 60 + openM;
      const closeMins = closeH * 60 + closeM;
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const isOpen = nowMins >= openMins && nowMins < closeMins;
      badge.style.display = 'inline-block';
      if (isOpen) {
        badge.textContent = '🟢 Ouvert';
        badge.style.background = 'var(--success-bg)';
        badge.style.color = 'var(--bodoro)';
        badge.style.border = '1px solid var(--bodoro)';
      } else {
        badge.textContent = '🔴 Fermé';
        badge.style.background = 'var(--danger-bg)';
        badge.style.color = 'var(--danger)';
        badge.style.border = '1px solid var(--danger)';
      }
    } catch(e) { badge.style.display = 'none'; }
  },

  _updateFooterInfo() {
    const config = DB.getConfig();
    const phone = document.getElementById('footer-phone');
    const addr = document.getElementById('footer-address');
    if (phone) phone.textContent = '📞 ' + (config.phone1 || '');
    if (addr) addr.textContent = '📍 ' + (config.address || 'Yamoussoukro');
  },

  _showLoader() {
    let loader = document.getElementById('app-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'app-loader';
      loader.innerHTML = `
        <div style="position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg, #f5f8f6);gap:20px">
          <img src="assets/logo.jpg" alt="Bodoro" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #c9973a;animation:logo-pulse 1.5s ease infinite">
          <div style="font-size:1.125rem;font-weight:700;color:#084d34">La Côte d'Émeraude</div>
          <div style="display:flex;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:#c9973a;animation:dot-bounce 1s ease infinite"></div>
            <div style="width:8px;height:8px;border-radius:50%;background:#c9973a;animation:dot-bounce 1s ease 0.15s infinite"></div>
            <div style="width:8px;height:8px;border-radius:50%;background:#c9973a;animation:dot-bounce 1s ease 0.3s infinite"></div>
          </div>
        </div>`;
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
  },

  _hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.4s';
      setTimeout(() => loader.remove(), 400);
    }
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => App.init());
