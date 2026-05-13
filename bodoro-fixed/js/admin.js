// ============================================================
// BODORO - Admin Panel Module
// ============================================================

const FOOD_EMOJIS = [
  '🍛','🍗','🐟','🥩','🍖','🥘','🍲','🍔',
  '🍕','🌯','🌮','🍝','🍣','🦐','🥗','🍳',
  '🥪','🍜','🍚','🥧','🧁','🍰','🍮','🍦',
  '🥤','🍺','🍹','🍸','🥥','🍌','🍎','🍍',
  '🥚','🥓','🌮','🫔','🥙'
];

const AdminPages = {

  // ---- Internal State ----
  _dashDays: 30,
  _charts: {},

  // Articles state
  _artPage: 1,
  _artSearch: '',
  _artCat: '',
  _artAvail: 'tous',

  // Orders state
  _ordPage: 1,
  _ordStatus: 'toutes',
  _ordSearch: '',

  // Config state
  _configDirty: false,

  // ================================================================
  // 1. LOGIN
  // ================================================================
  renderLogin() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:70vh">
        <div class="card" style="max-width:420px;width:100%;text-align:center;padding:48px 32px">
          <img src="assets/logo.jpg" alt="Bodoro" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid var(--gold);box-shadow:var(--shadow-md);margin-bottom:16px">
          <h2 style="font-weight:800;font-size:1.5rem;margin-bottom:4px">Administration</h2>
          <p style="color:var(--bodoro);font-weight:600;font-size:0.875rem;margin-bottom:8px">La Côte d'Émeraude Chez Bodoro</p>
          <p style="color:var(--text-muted);margin-bottom:32px;font-size:0.875rem">Connectez-vous pour accéder au tableau de bord</p>
          <div style="text-align:left;margin-bottom:24px">
            <label style="display:block;font-weight:600;margin-bottom:8px;font-size:0.875rem">Mot de passe</label>
            <div style="position:relative">
              <input type="password" id="admin-password" placeholder="Entrez le mot de passe..."
                style="width:100%;padding:12px 44px 12px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:1rem;background:var(--bg);box-sizing:border-box;transition:border-color 0.2s"
                onkeydown="if(event.key==='Enter')AdminPages.login()">
              <button type="button" id="login-pwd-toggle"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;padding:4px;line-height:1"
                onclick="(function(){var i=document.getElementById('admin-password');var b=document.getElementById('login-pwd-toggle');if(i.type==='password'){i.type='text';b.textContent='🙈';}else{i.type='password';b.textContent='👁️';}})()">👁️</button>
            </div>
            <p id="login-error-msg" style="color:#e53e3e;font-size:0.8125rem;margin-top:6px;display:none">Mot de passe incorrect. Vérifiez et réessayez.</p>
          </div>
          <button class="btn btn-primary" style="width:100%;padding:14px;font-size:1rem;font-weight:700" onclick="AdminPages.login()">
            🔓 Se connecter
          </button>
        </div>
      </div>`;
    setTimeout(() => {
      const input = document.getElementById('admin-password');
      if (input) input.focus();
    }, 100);
  },

  login() {
    const rawVal = document.getElementById('admin-password')?.value;
    const password = (rawVal || '').trim();
    if (!password) { Toast.error('Veuillez entrer le mot de passe'); return; }
    const result = DB.adminLogin(password);
    if (result.success) {
      Toast.success('Connexion réussie !');
      AdminPages._dashDays = 30;
      // Show admin section then render dashboard
      document.getElementById('client-section').classList.add('hidden');
      document.getElementById('admin-section').classList.remove('hidden');
      App._mode = 'admin';
      DB.setMode('admin');
      App._updateModeButton();
      App.setAdminTab('dashboard');
    } else {
      // Shake the input to indicate error
      const input = document.getElementById('admin-password');
      if (input) {
        input.value = '';
        input.style.borderColor = 'var(--danger, #e53e3e)';
        input.style.animation = 'shake 0.4s ease';
        const errMsg = document.getElementById('login-error-msg');
        if (errMsg) errMsg.style.display = 'block';
        setTimeout(() => { input.style.borderColor = ''; input.style.animation = ''; input.focus(); }, 500);
      }
      Toast.error('Mot de passe incorrect. Vérifiez et réessayez.');
    }
  },

  // ================================================================
  // 2. DASHBOARD
  // ================================================================
  renderDashboard() {
    AdminPages._destroyCharts();
    const container = document.getElementById('admin-content');
    const stats = DB.getStats(AdminPages._dashDays);
    const orders = DB.getOrders();
    const recentOrders = orders.slice(0, 5);

    let html = '<div class="page-enter">';

    // Header + date range filter
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <h1 style="font-weight:800;font-size:1.5rem">Tableau de bord</h1>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm ${AdminPages._dashDays===7?'btn-primary':'btn-outline'}" onclick="AdminPages._setDashDays(7)">7j</button>
        <button class="btn btn-sm ${AdminPages._dashDays===30?'btn-primary':'btn-outline'}" onclick="AdminPages._setDashDays(30)">30j</button>
        <button class="btn btn-sm ${AdminPages._dashDays===90?'btn-primary':'btn-outline'}" onclick="AdminPages._setDashDays(90)">90j</button>
      </div>
    </div>`;

    // 4 stat cards
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px">
      <div class="card" style="background:var(--success-bg);border-left:4px solid #0d6e4a">
        <div style="font-size:1.5rem;margin-bottom:8px">🍽️</div>
        <div style="font-size:0.8125rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Articles</div>
        <div style="font-size:1.75rem;font-weight:800">${stats.totalArticles}</div>
      </div>
      <div class="card" style="background:var(--warning-bg,#fef3c7);border-left:4px solid #c9973a">
        <div style="font-size:1.5rem;margin-bottom:8px">📋</div>
        <div style="font-size:0.8125rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Commandes</div>
        <div style="font-size:1.75rem;font-weight:800">${stats.totalOrders}</div>
      </div>
      <div class="card" style="background:var(--info-bg,#dbeafe);border-left:4px solid #3b82f6">
        <div style="font-size:1.5rem;margin-bottom:8px">⏳</div>
        <div style="font-size:0.8125rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">En attente</div>
        <div style="font-size:1.75rem;font-weight:800">${stats.pendingOrders}</div>
      </div>
      <div class="card" style="background:var(--success-bg);border-left:4px solid #0d6e4a">
        <div style="font-size:1.5rem;margin-bottom:8px">💰</div>
        <div style="font-size:0.8125rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Revenus</div>
        <div style="font-size:1.75rem;font-weight:800">${formatPrice(stats.revenue)}</div>
      </div>
    </div>`;

    // 4 quick stats
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px">
      <div style="padding:12px 16px;border-radius:var(--radius-sm);background:var(--bg);font-size:0.875rem">
        <span style="color:var(--text-muted)">Taux livraison</span>
        <div style="font-weight:700;font-size:1.125rem">${stats.deliveryRate}%</div>
      </div>
      <div style="padding:12px 16px;border-radius:var(--radius-sm);background:var(--bg);font-size:0.875rem">
        <span style="color:var(--text-muted)">Panier moyen</span>
        <div style="font-weight:700;font-size:1.125rem">${formatPrice(stats.avgBasket)}</div>
      </div>
      <div style="padding:12px 16px;border-radius:var(--radius-sm);background:var(--bg);font-size:0.875rem">
        <span style="color:var(--text-muted)">Confirmées</span>
        <div style="font-weight:700;font-size:1.125rem;color:#0d6e4a">${stats.confirmedOrders}</div>
      </div>
      <div style="padding:12px 16px;border-radius:var(--radius-sm);background:var(--bg);font-size:0.875rem">
        <span style="color:var(--text-muted)">Annulées</span>
        <div style="font-weight:700;font-size:1.125rem;color:var(--danger)">${stats.cancelledOrders}</div>
      </div>
    </div>`;

    // Charts row
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
      <div class="card">
        <h3 style="font-weight:700;margin-bottom:16px">📈 Revenus</h3>
        <canvas id="revenue-chart"></canvas>
      </div>
      <div class="card">
        <h3 style="font-weight:700;margin-bottom:16px">📊 Commandes</h3>
        <canvas id="orders-chart"></canvas>
      </div>
    </div>`;

    // Recent orders
    html += `<div class="card" style="margin-bottom:24px">
      <h3 style="font-weight:700;margin-bottom:16px">🕐 Commandes récentes</h3>`;
    if (recentOrders.length === 0) {
      html += '<p style="color:var(--text-muted);text-align:center;padding:24px">Aucune commande</p>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:8px">';
      recentOrders.forEach(o => {
        html += `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--radius-sm);background:var(--bg);cursor:pointer" onclick="AdminPages._showOrderDetail('${o.id}')">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem">${(o.clientName||'?')[0].toUpperCase()}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:0.875rem">${o.clientName}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${formatDate(o.createdAt)}</div>
          </div>
          <span class="badge badge-outline" style="font-size:0.6875rem">${AdminPages._statusLabel(o.status)}</span>
          <div style="font-weight:700;font-size:0.875rem">${formatPrice(o.total)}</div>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div>';

    // Status pie chart
    html += `<div class="card">
      <h3 style="font-weight:700;margin-bottom:16px">🍩 Répartition des statuts</h3>
      <div style="max-width:300px;margin:0 auto">
        <canvas id="status-chart"></canvas>
      </div>
    </div>`;

    html += '</div>';
    container.innerHTML = html;

    // Render charts after DOM is ready
    setTimeout(() => AdminPages._renderDashCharts(stats), 50);
  },

  _setDashDays(days) {
    AdminPages._dashDays = days;
    AdminPages.renderDashboard();
  },

  _renderDashCharts(stats) {
    // Revenue chart (line)
    const revCtx = document.getElementById('revenue-chart');
    if (revCtx) {
      const revData = stats.revenueByDate || [];
      AdminPages._charts.revenue = new Chart(revCtx, {
        type: 'line',
        data: {
          labels: revData.map(d => { const p = d.date.split('-'); return p[2] + '/' + p[1]; }),
          datasets: [{
            label: 'Revenus (F)',
            data: revData.map(d => d.revenue),
            borderColor: '#0d6e4a',
            backgroundColor: 'rgba(13,110,74,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0d6e4a',
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { callback: v => (v/1000)+'k' } },
            x: { ticks: { maxTicksLimit: 10 } }
          }
        }
      });
    }

    // Orders chart (bar)
    const ordCtx = document.getElementById('orders-chart');
    if (ordCtx) {
      const ordData = stats.ordersByDate || [];
      AdminPages._charts.orders = new Chart(ordCtx, {
        type: 'bar',
        data: {
          labels: ordData.map(d => { const p = d.date.split('-'); return p[2] + '/' + p[1]; }),
          datasets: [{
            label: 'Commandes',
            data: ordData.map(d => d.count),
            backgroundColor: '#c9973a',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { maxTicksLimit: 10 } }
          }
        }
      });
    }

    // Status pie (donut)
    const pieCtx = document.getElementById('status-chart');
    if (pieCtx) {
      const sd = stats.statusDistribution;
      AdminPages._charts.status = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ['En attente', 'Confirmée', 'En préparation', 'Livrée', 'Annulée'],
          datasets: [{
            data: [sd.en_attente, sd.confirmee, sd.en_preparation, sd.livree, sd.annulee],
            backgroundColor: ['#3b82f6', '#c9973a', '#f59e0b', '#0d6e4a', '#ef4444'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 12 } } } }
        }
      });
    }
  },

  _updateSidebarBadges() {
    // Show pending orders count badge in sidebar
    const pendingOrders = DB.getOrders().filter(o => o.status === 'en attente' || o.status === 'nouvelle').length;
    const sidebarItems = document.querySelectorAll('#admin-sidebar .sidebar-item[data-tab="orders"]');
    sidebarItems.forEach(item => {
      let badge = item.querySelector('.sidebar-badge');
      if (pendingOrders > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'sidebar-badge';
          badge.style.cssText = 'margin-left:auto;background:var(--danger);color:#fff;font-size:0.6875rem;font-weight:700;padding:1px 7px;border-radius:20px;min-width:18px;text-align:center';
          item.appendChild(badge);
        }
        badge.textContent = pendingOrders > 99 ? '99+' : pendingOrders;
      } else if (badge) {
        badge.remove();
      }
    });
  },

  _destroyCharts() {
    Object.values(AdminPages._charts).forEach(c => { if (c) c.destroy(); });
    AdminPages._charts = {};
  },

  _statusLabel(status) {
    const labels = {
      en_attente: 'En attente',
      confirmee: 'Confirmée',
      en_preparation: 'En préparation',
      livree: 'Livrée',
      annulee: 'Annulée'
    };
    return labels[status] || status;
  },

  _statusColor(status) {
    const colors = {
      en_attente: '#3b82f6',
      confirmee: '#c9973a',
      en_preparation: '#f59e0b',
      livree: '#0d6e4a',
      annulee: '#ef4444'
    };
    return colors[status] || '#999';
  },

  // ================================================================
  // 3. ARTICLES MANAGER
  // ================================================================
  renderArticles() {
    AdminPages._artPage = 1;
    AdminPages._artSearch = '';
    AdminPages._artCat = '';
    AdminPages._artAvail = 'tous';
    AdminPages._renderArticlesContent();
  },

  _renderArticlesContent() {
    const container = document.getElementById('admin-content');
    const allItems = DB.getItems();
    const categories = DB.getActiveCategories();

    // Counts for tabs
    const countTous = allItems.length;
    const countDispo = allItems.filter(i => i.available).length;
    const countIndispo = allItems.filter(i => !i.available).length;
    const countMenu = allItems.filter(i => i.isMenuJour).length;

    let html = '<div class="page-enter">';

    // Header
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <h1 style="font-weight:800;font-size:1.5rem">Articles</h1>
      <button class="btn btn-primary" onclick="AdminPages._openArticleDialog()">+ Nouvel Article</button>
    </div>`;

    // Filter bar
    html += `<div class="card" style="margin-bottom:20px;padding:16px">
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div class="search-bar" style="flex:1;min-width:200px">
          <span class="search-icon">🔍</span>
          <input type="text" id="art-search" placeholder="Rechercher un article..." value="${AdminPages._artSearch}" oninput="AdminPages._artSearch=this.value;AdminPages._artPage=1;AdminPages._renderArticlesList()">
        </div>
        <select class="select" id="art-cat-select" style="width:auto;min-width:160px" onchange="AdminPages._artCat=this.value;AdminPages._artPage=1;AdminPages._renderArticlesList()">
          <option value="">Toutes les catégories</option>
          ${categories.map(c => `<option value="${c.id}" ${AdminPages._artCat===c.id?'selected':''}>${c.emoji} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm ${AdminPages._artAvail==='tous'?'btn-primary':'btn-outline'}" onclick="AdminPages._artAvail='tous';AdminPages._artPage=1;AdminPages._renderArticlesList()">Tous (${countTous})</button>
        <button class="btn btn-sm ${AdminPages._artAvail==='disponibles'?'btn-primary':'btn-outline'}" onclick="AdminPages._artAvail='disponibles';AdminPages._artPage=1;AdminPages._renderArticlesList()">Disponibles (${countDispo})</button>
        <button class="btn btn-sm ${AdminPages._artAvail==='indisponibles'?'btn-primary':'btn-outline'}" onclick="AdminPages._artAvail='indisponibles';AdminPages._artPage=1;AdminPages._renderArticlesList()">Indisponibles (${countIndispo})</button>
        <button class="btn btn-sm ${AdminPages._artAvail==='menu'?'btn-primary':'btn-outline'}" onclick="AdminPages._artAvail='menu';AdminPages._artPage=1;AdminPages._renderArticlesList()">Menu du jour (${countMenu})</button>
      </div>
    </div>`;

    // Items list container
    html += '<div id="art-list"></div>';
    html += '<div id="art-pagination"></div>';

    html += '</div>';
    container.innerHTML = html;
    AdminPages._renderArticlesList();
  },

  _getFilteredArticles() {
    let items = DB.getItems();
    if (AdminPages._artSearch) {
      const s = AdminPages._artSearch.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
    }
    if (AdminPages._artCat) {
      items = items.filter(i => i.categoryId === AdminPages._artCat);
    }
    switch (AdminPages._artAvail) {
      case 'disponibles': items = items.filter(i => i.available); break;
      case 'indisponibles': items = items.filter(i => !i.available); break;
      case 'menu': items = items.filter(i => i.isMenuJour); break;
    }
    return items;
  },

  _renderArticlesList() {
    const listEl = document.getElementById('art-list');
    const pagEl = document.getElementById('art-pagination');
    if (!listEl || !pagEl) return;

    const filtered = AdminPages._getFilteredArticles();
    const PER_PAGE = 12;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (AdminPages._artPage > totalPages) AdminPages._artPage = totalPages;

    const start = (AdminPages._artPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    if (pageItems.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🍽️</div><h3>Aucun article trouvé</h3><p>Modifiez vos filtres ou ajoutez un nouvel article</p></div>';
      pagEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">' +
      pageItems.map(item => {
        const cat = DB.getCategory(item.categoryId);
        const price = item.promoPrice > 0 ? item.promoPrice : item.price;
        return `<div class="card" style="padding:16px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <span style="font-size:2rem;line-height:1">${item.emoji}</span>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:0.9375rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
                ${item.isMenuJour ? '<span class="badge badge-gold" style="font-size:0.6875rem">★ Menu du jour</span>' : ''}
                ${!item.available ? '<span class="badge" style="font-size:0.6875rem;background:var(--danger-bg,#fef2f2);color:var(--danger)">Indisponible</span>' : ''}
                ${cat ? `<span class="badge badge-outline" style="font-size:0.6875rem">${cat.emoji} ${cat.name}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="font-weight:700;color:var(--primary)">
              ${item.promoPrice > 0 ? `<span style="text-decoration:line-through;color:var(--text-muted);font-size:0.8125rem;font-weight:400">${formatPrice(item.price)}</span> ${formatPrice(item.promoPrice)}` : formatPrice(item.price)}
            </div>
          </div>
          <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid var(--border-light,#eee);padding-top:8px">
            <button class="btn btn-sm btn-outline" onclick="AdminPages._toggleMenuJour('${item.id}')" title="Menu du jour">${item.isMenuJour ? '★' : '☆'}</button>
            <button class="btn btn-sm btn-outline" onclick="AdminPages._toggleAvailability('${item.id}')" title="${item.available?'Rendre indisponible':'Rendre disponible'}">${item.available ? '👁' : '👁‍🗨'}</button>
            <button class="btn btn-sm btn-outline" onclick="AdminPages._duplicateArticle('${item.id}')" title="Dupliquer">📋</button>
            <button class="btn btn-sm btn-outline" onclick="AdminPages._openArticleDialog('${item.id}')" title="Modifier">✏️</button>
            <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="AdminPages._deleteArticle('${item.id}')" title="Supprimer">🗑️</button>
          </div>
        </div>`;
      }).join('') + '</div>';

    // Pagination
    if (totalPages > 1) {
      let pagHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:20px;padding:16px 0">';
      pagHTML += `<button class="btn btn-sm btn-outline" ${AdminPages._artPage<=1?'disabled style="opacity:0.4;pointer-events:none"':''} onclick="AdminPages._artPage--;AdminPages._renderArticlesList()">← Précédent</button>`;
      const maxVisible = 5;
      let startP = Math.max(1, AdminPages._artPage - Math.floor(maxVisible/2));
      let endP = Math.min(totalPages, startP + maxVisible - 1);
      if (endP - startP < maxVisible - 1) startP = Math.max(1, endP - maxVisible + 1);
      if (startP > 1) pagHTML += '<button class="btn btn-sm btn-outline" onclick="AdminPages._artPage=1;AdminPages._renderArticlesList()">1</button>';
      if (startP > 2) pagHTML += '<span style="color:var(--text-muted);padding:0 4px">...</span>';
      for (let p = startP; p <= endP; p++) {
        pagHTML += `<button class="btn btn-sm ${p===AdminPages._artPage?'btn-primary':'btn-outline'}" onclick="AdminPages._artPage=${p};AdminPages._renderArticlesList()">${p}</button>`;
      }
      if (endP < totalPages - 1) pagHTML += '<span style="color:var(--text-muted);padding:0 4px">...</span>';
      if (endP < totalPages) pagHTML += `<button class="btn btn-sm btn-outline" onclick="AdminPages._artPage=${totalPages};AdminPages._renderArticlesList()">${totalPages}</button>`;
      pagHTML += `<button class="btn btn-sm btn-outline" ${AdminPages._artPage>=totalPages?'disabled style="opacity:0.4;pointer-events:none"':''} onclick="AdminPages._artPage++;AdminPages._renderArticlesList()">Suivant →</button>`;
      pagHTML += '</div>';
      pagEl.innerHTML = pagHTML;
    } else {
      pagEl.innerHTML = '';
    }
  },

  _toggleMenuJour(id) {
    const item = DB.getItem(id);
    if (item) {
      DB.updateItem(id, { isMenuJour: !item.isMenuJour });
      Toast.success(item.isMenuJour ? 'Retiré du menu du jour' : 'Ajouté au menu du jour');
      AdminPages._renderArticlesList();
    }
  },

  _toggleAvailability(id) {
    const item = DB.getItem(id);
    if (item) {
      DB.updateItem(id, { available: !item.available });
      Toast.success(item.available ? 'Article marqué indisponible' : 'Article marqué disponible');
      AdminPages._renderArticlesList();
    }
  },

  _duplicateArticle(id) {
    const item = DB.getItem(id);
    if (item) {
      DB.createItem({
        name: item.name + ' (copie)',
        description: item.description,
        price: item.price,
        promoPrice: item.promoPrice,
        emoji: item.emoji,
        categoryId: item.categoryId,
        image: item.image,
        available: item.available,
        isMenuJour: false
      });
      Toast.success('Article dupliqué');
      AdminPages._renderArticlesContent();
    }
  },

  _deleteArticle(id) {
    const item = DB.getItem(id);
    if (!item) return;
    confirmAction(`Supprimer l'article "${item.name}" ?`, () => {
      DB.deleteItem(id);
      Toast.success('Article supprimé');
      AdminPages._renderArticlesContent();
    });
  },

  _openArticleDialog(itemId) {
    const isEdit = !!itemId;
    const item = isEdit ? DB.getItem(itemId) : null;
    const categories = DB.getActiveCategories();
    const emoji = item ? item.emoji : '🍛';

    const body = `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Nom</label>
          <input type="text" id="dlg-art-name" value="${item?item.name:''}" placeholder="Nom de l'article" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Emoji</label>
          <input type="hidden" id="dlg-art-emoji" value="${emoji}">
          <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-height:180px;overflow-y:auto;padding:4px;border:1px solid var(--border);border-radius:var(--radius-sm)">
            ${FOOD_EMOJIS.map(e => `<button type="button" class="btn btn-sm btn-outline emoji-pick-btn" data-emoji="${e}" onclick="AdminPages._pickEmoji('dlg-art-emoji',this,'${e}')" style="font-size:1.25rem;padding:6px;${e===emoji?'background:var(--primary);color:#fff;border-color:var(--primary)':''}">${e}</button>`).join('')}
          </div>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Description</label>
          <textarea id="dlg-art-desc" rows="3" placeholder="Description de l'article" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem;resize:vertical">${item?item.description:''}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Prix (F)</label>
            <input type="number" id="dlg-art-price" value="${item?item.price:''}" placeholder="0" min="0" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Prix promo (F)</label>
            <input type="number" id="dlg-art-promo" value="${item&&item.promoPrice?item.promoPrice:''}" placeholder="0" min="0" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
          </div>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Catégorie</label>
          <select id="dlg-art-cat" class="select" style="width:100%">
            <option value="">-- Aucune --</option>
            ${categories.map(c => `<option value="${c.id}" ${item&&item.categoryId===c.id?'selected':''}>${c.emoji} ${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">URL de l'image</label>
          <input type="text" id="dlg-art-image" value="${item?item.image:''}" placeholder="https://..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div style="display:flex;gap:24px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9375rem">
            <input type="checkbox" id="dlg-art-available" ${item?item.available?'checked':'':'checked'}> Disponible
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9375rem">
            <input type="checkbox" id="dlg-art-menujour" ${item&&item.isMenuJour?'checked':''}> Menu du jour
          </label>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-outline" onclick="Modal.close()">Annuler</button>
      <button class="btn btn-primary" onclick="AdminPages._saveArticle('${itemId||''}')">${isEdit?'Enregistrer':'Créer'}</button>`;

    Modal.open(isEdit ? 'Modifier l\'article' : 'Nouvel Article', body, footer, { width: '560px' });
  },

  _saveArticle(itemId) {
    const name = document.getElementById('dlg-art-name')?.value.trim();
    const emoji = document.getElementById('dlg-art-emoji')?.value || '🍛';
    const desc = document.getElementById('dlg-art-desc')?.value.trim();
    const price = parseInt(document.getElementById('dlg-art-price')?.value) || 0;
    const promo = parseInt(document.getElementById('dlg-art-promo')?.value) || 0;
    const catId = document.getElementById('dlg-art-cat')?.value || '';
    const image = document.getElementById('dlg-art-image')?.value.trim() || '';
    const available = document.getElementById('dlg-art-available')?.checked ?? true;
    const isMenuJour = document.getElementById('dlg-art-menujour')?.checked ?? false;

    if (!name) { Toast.error('Le nom est obligatoire'); return; }
    if (price <= 0) { Toast.error('Le prix doit être supérieur à 0'); return; }

    const data = { name, emoji, description: desc, price, promoPrice: promo, categoryId: catId, image, available, isMenuJour };

    if (itemId) {
      DB.updateItem(itemId, data);
      Toast.success('Article mis à jour');
    } else {
      DB.createItem(data);
      Toast.success('Article créé');
    }
    Modal.close();
    AdminPages._renderArticlesContent();
  },

  // ================================================================
  // 4. CATEGORIES MANAGER
  // ================================================================
  renderCategories() {
    const container = document.getElementById('admin-content');
    const categories = DB.getCategories().sort((a, b) => a.sortOrder - b.sortOrder);

    let html = '<div class="page-enter">';

    // Header
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <h1 style="font-weight:800;font-size:1.5rem">Catégories</h1>
      <button class="btn btn-primary" onclick="AdminPages._openCategoryDialog()">+ Nouvelle Catégorie</button>
    </div>`;

    // Category list
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    categories.forEach((cat, idx) => {
      const itemCount = DB.getItemsByCategory(cat.id).length;
      html += `<div class="card" style="padding:16px;display:flex;align-items:center;gap:14px">
        <span style="font-size:1.75rem">${cat.emoji}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:0.9375rem">${cat.name}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
            <span style="font-size:0.8125rem;color:var(--text-muted)">Ordre : ${cat.sortOrder}</span>
            <span style="font-size:0.8125rem;color:var(--text-muted)">•</span>
            <span style="font-size:0.8125rem;color:var(--text-muted)">${itemCount} article${itemCount!==1?'s':''}</span>
            <span class="badge ${cat.active?'badge-green':'badge-outline'}" style="font-size:0.6875rem">${cat.active?'Active':'Inactive'}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-sm btn-outline" onclick="AdminPages._reorderCategory('${cat.id}','up')" ${idx===0?'disabled style="opacity:0.3;pointer-events:none"':''} title="Monter">▲</button>
          <button class="btn btn-sm btn-outline" onclick="AdminPages._reorderCategory('${cat.id}','down')" ${idx===categories.length-1?'disabled style="opacity:0.3;pointer-events:none"':''} title="Descendre">▼</button>
          <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.8125rem;margin-left:4px" title="Activer/Désactiver">
            <input type="checkbox" ${cat.active?'checked':''} onchange="AdminPages._toggleCategoryActive('${cat.id}',this.checked)">
          </label>
          <button class="btn btn-sm btn-outline" onclick="AdminPages._openCategoryDialog('${cat.id}')" title="Modifier">✏️</button>
          <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="AdminPages._deleteCategory('${cat.id}')" title="Supprimer">🗑️</button>
        </div>
      </div>`;
    });
    if (categories.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">📁</div><h3>Aucune catégorie</h3><p>Créez votre première catégorie</p></div>';
    }
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  },

  _reorderCategory(id, direction) {
    DB.reorderCategories(id, direction);
    AdminPages.renderCategories();
  },

  _toggleCategoryActive(id, active) {
    DB.updateCategory(id, { active });
    Toast.success(active ? 'Catégorie activée' : 'Catégorie désactivée');
    AdminPages.renderCategories();
  },

  _deleteCategory(id) {
    const cat = DB.getCategory(id);
    if (!cat) return;
    const count = DB.getItemsByCategory(id).length;
    confirmAction(`Supprimer la catégorie "${cat.name}" et ses ${count} article${count!==1?'s':''} ?`, () => {
      DB.deleteCategory(id);
      Toast.success('Catégorie supprimée');
      AdminPages.renderCategories();
    });
  },

  _openCategoryDialog(catId) {
    const isEdit = !!catId;
    const cat = isEdit ? DB.getCategory(catId) : null;
    const emoji = cat ? cat.emoji : '🍽️';
    const categories = DB.getCategories();

    const body = `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Nom</label>
          <input type="text" id="dlg-cat-name" value="${cat?cat.name:''}" placeholder="Nom de la catégorie" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Emoji</label>
          <input type="hidden" id="dlg-cat-emoji" value="${emoji}">
          <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-height:160px;overflow-y:auto;padding:4px;border:1px solid var(--border);border-radius:var(--radius-sm)">
            ${FOOD_EMOJIS.map(e => `<button type="button" class="btn btn-sm btn-outline emoji-pick-btn" data-emoji="${e}" onclick="AdminPages._pickEmoji('dlg-cat-emoji',this,'${e}')" style="font-size:1.25rem;padding:6px;${e===emoji?'background:var(--primary);color:#fff;border-color:var(--primary)':''}">${e}</button>`).join('')}
          </div>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Ordre de tri</label>
          <input type="number" id="dlg-cat-sort" value="${cat?cat.sortOrder:categories.length}" min="0" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-outline" onclick="Modal.close()">Annuler</button>
      <button class="btn btn-primary" onclick="AdminPages._saveCategory('${catId||''}')">${isEdit?'Enregistrer':'Créer'}</button>`;

    Modal.open(isEdit ? 'Modifier la catégorie' : 'Nouvelle Catégorie', body, footer, { width: '460px' });
  },

  _saveCategory(catId) {
    const name = document.getElementById('dlg-cat-name')?.value.trim();
    const emoji = document.getElementById('dlg-cat-emoji')?.value || '🍽️';
    const sortOrder = parseInt(document.getElementById('dlg-cat-sort')?.value) || 0;

    if (!name) { Toast.error('Le nom est obligatoire'); return; }

    const data = { name, emoji, sortOrder };

    if (catId) {
      DB.updateCategory(catId, data);
      Toast.success('Catégorie mise à jour');
    } else {
      DB.createCategory(data);
      Toast.success('Catégorie créée');
    }
    Modal.close();
    AdminPages.renderCategories();
  },

  // ================================================================
  // 5. ORDERS MANAGER
  // ================================================================
  renderOrders() {
    AdminPages._ordPage = 1;
    AdminPages._ordStatus = 'toutes';
    AdminPages._ordSearch = '';
    AdminPages._renderOrdersContent();
  },

  _renderOrdersContent() {
    const container = document.getElementById('admin-content');
    const allOrders = DB.getOrders();
    const todayOrders = DB.getTodayOrders();

    const statusTabs = [
      { key: 'toutes', label: 'Toutes' },
      { key: 'en_attente', label: 'En attente' },
      { key: 'confirmee', label: 'Confirmée' },
      { key: 'en_preparation', label: 'En préparation' },
      { key: 'livree', label: 'Livrée' },
      { key: 'annulee', label: 'Annulée' }
    ];

    let html = '<div class="page-enter">';

    // Header
    html += `<h1 style="font-weight:800;font-size:1.5rem;margin-bottom:24px">Commandes</h1>`;

    // Filter bar
    html += `<div class="card" style="margin-bottom:20px;padding:16px">
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div class="search-bar" style="flex:1;min-width:200px">
          <span class="search-icon">🔍</span>
          <input type="text" id="ord-search" placeholder="Rechercher par nom ou téléphone..." value="${AdminPages._ordSearch}" oninput="AdminPages._ordSearch=this.value;AdminPages._ordPage=1;AdminPages._renderOrdersList()">
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${statusTabs.map(t => `<button class="btn btn-sm ${AdminPages._ordStatus===t.key?'btn-primary':'btn-outline'}" onclick="AdminPages._ordStatus='${t.key}';AdminPages._ordPage=1;AdminPages._renderOrdersList()">${t.label}</button>`).join('')}
      </div>
    </div>`;

    // Today's orders
    if (todayOrders.length > 0) {
      html += `<div class="card" style="margin-bottom:20px;padding:16px">
        <h3 style="font-weight:700;margin-bottom:12px">📅 Aujourd'hui <span class="badge badge-green" style="font-size:0.75rem">${todayOrders.length}</span></h3>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${todayOrders.slice(0, 3).map(o => AdminPages._renderOrderCard(o)).join('')}
        </div>
      </div>`;
    }

    // All orders list
    html += '<div id="ord-list"></div>';
    html += '<div id="ord-pagination"></div>';

    html += '</div>';
    container.innerHTML = html;
    AdminPages._renderOrdersList();
  },

  _renderOrderCard(o) {
    const statusColor = AdminPages._statusColor(o.status);
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius-sm);background:var(--bg);cursor:pointer" onclick="AdminPages._showOrderDetail('${o.id}')">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0">${(o.clientName||'?')[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:0.9375rem">${o.clientName}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:2px">
          <span style="font-size:0.8125rem;color:var(--text-muted)">${o.deliveryType==='livraison'?'🛵 Livraison':'🏪 Retrait'}</span>
          <span style="font-size:0.8125rem;color:var(--text-muted)">•</span>
          <span style="font-size:0.8125rem;color:var(--text-muted)">${formatDate(o.createdAt)}</span>
        </div>
      </div>
      <span class="badge" style="font-size:0.6875rem;background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40">${AdminPages._statusLabel(o.status)}</span>
      <div style="font-weight:700;font-size:0.9375rem;white-space:nowrap">${formatPrice(o.total)}</div>
    </div>`;
  },

  _getFilteredOrders() {
    let orders = DB.getOrders();
    if (AdminPages._ordSearch) {
      const s = AdminPages._ordSearch.toLowerCase();
      orders = orders.filter(o => o.clientName.toLowerCase().includes(s) || (o.phone||'').includes(s));
    }
    if (AdminPages._ordStatus !== 'toutes') {
      orders = orders.filter(o => o.status === AdminPages._ordStatus);
    }
    return orders;
  },

  _renderOrdersList() {
    const listEl = document.getElementById('ord-list');
    const pagEl = document.getElementById('ord-pagination');
    if (!listEl || !pagEl) return;

    const filtered = AdminPages._getFilteredOrders();
    const PER_PAGE = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (AdminPages._ordPage > totalPages) AdminPages._ordPage = totalPages;

    const start = (AdminPages._ordPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    if (pageItems.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>Aucune commande trouvée</h3><p>Modifiez vos filtres</p></div>';
      pagEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = '<div class="card" style="padding:16px"><div style="display:flex;flex-direction:column;gap:8px">' +
      pageItems.map(o => AdminPages._renderOrderCard(o)).join('') +
      '</div></div>';

    // Pagination
    if (totalPages > 1) {
      let pagHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:20px;padding:16px 0">';
      pagHTML += `<button class="btn btn-sm btn-outline" ${AdminPages._ordPage<=1?'disabled style="opacity:0.4;pointer-events:none"':''} onclick="AdminPages._ordPage--;AdminPages._renderOrdersList()">← Précédent</button>`;
      const maxVisible = 5;
      let startP = Math.max(1, AdminPages._ordPage - Math.floor(maxVisible/2));
      let endP = Math.min(totalPages, startP + maxVisible - 1);
      if (endP - startP < maxVisible - 1) startP = Math.max(1, endP - maxVisible + 1);
      if (startP > 1) pagHTML += '<button class="btn btn-sm btn-outline" onclick="AdminPages._ordPage=1;AdminPages._renderOrdersList()">1</button>';
      if (startP > 2) pagHTML += '<span style="color:var(--text-muted);padding:0 4px">...</span>';
      for (let p = startP; p <= endP; p++) {
        pagHTML += `<button class="btn btn-sm ${p===AdminPages._ordPage?'btn-primary':'btn-outline'}" onclick="AdminPages._ordPage=${p};AdminPages._renderOrdersList()">${p}</button>`;
      }
      if (endP < totalPages - 1) pagHTML += '<span style="color:var(--text-muted);padding:0 4px">...</span>';
      if (endP < totalPages) pagHTML += `<button class="btn btn-sm btn-outline" onclick="AdminPages._ordPage=${totalPages};AdminPages._renderOrdersList()">${totalPages}</button>`;
      pagHTML += `<button class="btn btn-sm btn-outline" ${AdminPages._ordPage>=totalPages?'disabled style="opacity:0.4;pointer-events:none"':''} onclick="AdminPages._ordPage++;AdminPages._renderOrdersList()">Suivant →</button>`;
      pagHTML += '</div>';
      pagEl.innerHTML = pagHTML;
    } else {
      pagEl.innerHTML = '';
    }
  },

  _showOrderDetail(id) {
    const order = DB.getOrder(id);
    if (!order) return;

    const statusSteps = ['en_attente', 'confirmee', 'en_preparation', 'livree'];
    const stepLabels = { en_attente: 'En attente', confirmee: 'Confirmée', en_preparation: 'En préparation', livree: 'Livrée' };
    const stepIcons = { en_attente: '📋', confirmee: '✅', en_preparation: '👨‍🍳', livree: '🚚' };
    const currentStepIdx = statusSteps.indexOf(order.status);

    // Status timeline
    let timelineHTML = '<div class="timeline" style="display:flex;align-items:center;justify-content:space-between;margin:24px 0;padding:0 8px">';
    statusSteps.forEach((step, idx) => {
      const isActive = idx <= currentStepIdx;
      const isCurrent = idx === currentStepIdx;
      timelineHTML += `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
        <div class="timeline-dot ${isActive?'active':''} ${isCurrent?'current':''}" style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.125rem;border:3px solid ${isActive?AdminPages._statusColor(step):'var(--border-light,#ddd)'};background:${isActive?AdminPages._statusColor(step)+'15':'transparent'};transition:all 0.3s">${stepIcons[step]}</div>
        <span style="font-size:0.6875rem;font-weight:${isCurrent?'700':'500'};color:${isActive?AdminPages._statusColor(step):'var(--text-muted)'};text-align:center">${stepLabels[step]}</span>
      </div>`;
      if (idx < statusSteps.length - 1) {
        timelineHTML += `<div style="flex:0.6;height:3px;background:${idx < currentStepIdx ? AdminPages._statusColor(statusSteps[idx]) : 'var(--border-light,#ddd)'};border-radius:2px;margin:0 -8px;margin-bottom:28px"></div>`;
      }
    });
    timelineHTML += '</div>';

    // Parse items
    let items = [];
    try { items = JSON.parse(order.items || '[]'); } catch { items = []; }

    const body = `
      ${timelineHTML}

      <!-- Client Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg)">
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.5px;margin-bottom:6px">Client</div>
          <div style="font-weight:700">${order.clientName}</div>
          <div style="font-size:0.875rem;color:var(--text-muted)">${order.phone||'-'}</div>
          ${order.address ? `<div style="font-size:0.8125rem;color:var(--text-muted);margin-top:2px">📍 ${order.address}</div>` : ''}
        </div>
        <div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg)">
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;letter-spacing:0.5px;margin-bottom:6px">Détails</div>
          <div style="font-weight:700">${order.deliveryType==='livraison'?'🛵 Livraison':'🏪 Retrait'}</div>
          <div style="font-size:0.8125rem;color:var(--text-muted)">${formatDate(order.createdAt)}</div>
        </div>
      </div>

      <!-- Items -->
      <div style="margin-bottom:20px">
        <h4 style="font-weight:700;margin-bottom:10px;font-size:0.9375rem">Articles commandés</h4>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${items.length > 0 ? items.map(i => {
            const unitPrice = i.promoPrice > 0 ? i.promoPrice : i.price;
            return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);background:var(--bg)">
              <span style="font-size:1.25rem">${i.emoji}</span>
              <div style="flex:1;font-size:0.875rem;font-weight:600">${i.name} <span style="color:var(--text-muted);font-weight:400">× ${i.quantity}</span></div>
              <div style="font-weight:700;font-size:0.875rem">${formatPrice(unitPrice * i.quantity)}</div>
            </div>`;
          }).join('') : '<p style="color:var(--text-muted);font-size:0.875rem">Aucun article</p>'}
        </div>
        <div style="text-align:right;padding-top:10px;border-top:1px solid var(--border-light,#eee);margin-top:8px">
          <span style="font-weight:700;font-size:1.125rem">Total : ${formatPrice(order.total)}</span>
        </div>
      </div>

      <!-- Notes -->
      ${order.notes ? `<div style="margin-bottom:20px">
        <h4 style="font-weight:700;margin-bottom:6px;font-size:0.9375rem">📝 Notes</h4>
        <p style="font-size:0.875rem;color:var(--text-secondary);background:var(--bg);padding:10px;border-radius:var(--radius-sm)">${order.notes}</p>
      </div>` : ''}

      <!-- Status Actions -->
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm" style="background:#3b82f620;color:#3b82f6;border:1px solid #3b82f640" onclick="AdminPages._updateOrderStatus('${order.id}','en_attente')">📋 En attente</button>
        <button class="btn btn-sm" style="background:#c9973a20;color:#c9973a;border:1px solid #c9973a40" onclick="AdminPages._updateOrderStatus('${order.id}','confirmee')">✅ Confirmée</button>
        <button class="btn btn-sm" style="background:#f59e0b20;color:#f59e0b;border:1px solid #f59e0b40" onclick="AdminPages._updateOrderStatus('${order.id}','en_preparation')">👨‍🍳 En préparation</button>
        <button class="btn btn-sm" style="background:#0d6e4a20;color:#0d6e4a;border:1px solid #0d6e4a40" onclick="AdminPages._updateOrderStatus('${order.id}','livree')">🚚 Livrée</button>
        <button class="btn btn-sm" style="background:#ef444420;color:#ef4444;border:1px solid #ef444440" onclick="AdminPages._updateOrderStatus('${order.id}','annulee')">❌ Annulée</button>
      </div>`;

    const footer = `<button class="btn btn-outline" onclick="Modal.close()">Fermer</button>`;

    Modal.open(`Commande #${order.id.slice(0,8)}`, body, footer, { width: '560px' });
  },

  _updateOrderStatus(id, status) {
    DB.updateOrder(id, { status });
    Toast.success(`Statut mis à jour : ${AdminPages._statusLabel(status)}`);
    Modal.close();
    AdminPages._renderOrdersContent();
  },

  // ================================================================
  // 6. TESTIMONIALS MANAGER
  // ================================================================
  renderTestimonials() {
    const container = document.getElementById('admin-content');
    const testimonials = DB.getTestimonials();

    let html = '<div class="page-enter">';

    // Header
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <h1 style="font-weight:800;font-size:1.5rem">Avis Clients</h1>
      <button class="btn btn-primary" onclick="AdminPages._openTestimonialDialog()">+ Nouvel Avis</button>
    </div>`;

    // List
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    testimonials.forEach(t => {
      const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
      html += `<div class="card" style="padding:16px;display:flex;align-items:flex-start;gap:14px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:0.9375rem;margin-bottom:4px">${t.author}</div>
          <div style="color:#f59e0b;font-size:0.875rem;margin-bottom:6px;letter-spacing:2px">${stars}</div>
          <div style="font-size:0.875rem;color:var(--text-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${t.text}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-sm btn-outline" onclick="AdminPages._openTestimonialDialog('${t.id}')" title="Modifier">✏️</button>
          <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="AdminPages._deleteTestimonial('${t.id}')" title="Supprimer">🗑️</button>
        </div>
      </div>`;
    });
    if (testimonials.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">💬</div><h3>Aucun avis client</h3><p>Ajoutez le premier avis</p></div>';
    }
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  },

  _openTestimonialDialog(id) {
    const isEdit = !!id;
    const testimonials = DB.getTestimonials();
    const t = isEdit ? testimonials.find(x => x.id === id) : null;
    const rating = t ? t.rating : 5;

    const body = `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Auteur</label>
          <input type="text" id="dlg-test-author" value="${t?t.author:''}" placeholder="Nom de l'auteur" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Note</label>
          <input type="hidden" id="dlg-test-rating" value="${rating}">
          <div style="display:flex;gap:6px" id="star-picker">
            ${[1,2,3,4,5].map(s => `<button type="button" class="btn btn-sm btn-outline" onclick="AdminPages._pickRating(${s})" style="font-size:1.5rem;padding:4px 8px;color:${s<=rating?'#f59e0b':'var(--text-muted)'}">★</button>`).join('')}
          </div>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Commentaire</label>
          <textarea id="dlg-test-text" rows="4" placeholder="Commentaire du client..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem;resize:vertical">${t?t.text:''}</textarea>
        </div>
      </div>`;

    const footer = `
      <button class="btn btn-outline" onclick="Modal.close()">Annuler</button>
      <button class="btn btn-primary" onclick="AdminPages._saveTestimonial('${id||''}')">${isEdit?'Enregistrer':'Créer'}</button>`;

    Modal.open(isEdit ? "Modifier l'avis" : 'Nouvel Avis', body, footer, { width: '480px' });
  },

  _pickRating(rating) {
    document.getElementById('dlg-test-rating').value = rating;
    const buttons = document.querySelectorAll('#star-picker button');
    buttons.forEach((btn, idx) => {
      btn.style.color = idx < rating ? '#f59e0b' : 'var(--text-muted)';
    });
  },

  _saveTestimonial(id) {
    const author = document.getElementById('dlg-test-author')?.value.trim();
    const rating = parseInt(document.getElementById('dlg-test-rating')?.value) || 5;
    const text = document.getElementById('dlg-test-text')?.value.trim();

    if (!author) { Toast.error("Le nom de l'auteur est obligatoire"); return; }
    if (!text) { Toast.error('Le commentaire est obligatoire'); return; }

    const data = { author, rating, text };

    if (id) {
      DB.updateTestimonial(id, data);
      Toast.success('Avis mis à jour');
    } else {
      DB.createTestimonial(data);
      Toast.success('Avis créé');
    }
    Modal.close();
    AdminPages.renderTestimonials();
  },

  _deleteTestimonial(id) {
    confirmAction('Supprimer cet avis client ?', () => {
      DB.deleteTestimonial(id);
      Toast.success('Avis supprimé');
      AdminPages.renderTestimonials();
    });
  },

  // ================================================================
  // 7. PROMOTIONS MANAGER
  // ================================================================
  renderPromotions() {
    const container = document.getElementById('admin-content');
    const promotions = DB.getPromotions();

    let html = '<div class="page-enter">';

    // Header
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <h1 style="font-weight:800;font-size:1.5rem">Promotions</h1>
      <button class="btn btn-primary" onclick="AdminPages._openPromotionDialog()">+ Nouvelle Promotion</button>
    </div>`;

    // List
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    promotions.forEach(p => {
      html += `<div class="card" style="padding:16px;display:flex;align-items:center;gap:14px">
        <span style="font-size:2rem">${p.emoji}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-weight:700;font-size:0.9375rem">${p.title}</span>
            ${p.discount ? `<span class="badge badge-gold" style="font-size:0.6875rem">${p.discount}</span>` : ''}
            <span class="badge ${p.active?'badge-green':'badge-outline'}" style="font-size:0.6875rem">${p.active?'Active':'Inactive'}</span>
          </div>
          ${p.description ? `<div style="font-size:0.8125rem;color:var(--text-muted);margin-top:4px">${p.description}</div>` : ''}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-sm btn-outline" onclick="AdminPages._openPromotionDialog('${p.id}')" title="Modifier">✏️</button>
          <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="AdminPages._deletePromotion('${p.id}')" title="Supprimer">🗑️</button>
        </div>
      </div>`;
    });
    if (promotions.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">🎉</div><h3>Aucune promotion</h3><p>Créez votre première promotion</p></div>';
    }
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  },

  _openPromotionDialog(id) {
    const isEdit = !!id;
    const promos = DB.getPromotions();
    const p = isEdit ? promos.find(x => x.id === id) : null;
    const emoji = p ? p.emoji : '🎉';

    const body = `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Titre</label>
          <input type="text" id="dlg-promo-title" value="${p?p.title:''}" placeholder="Titre de la promotion" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Emoji</label>
          <input type="hidden" id="dlg-promo-emoji" value="${emoji}">
          <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-height:180px;overflow-y:auto;padding:4px;border:1px solid var(--border);border-radius:var(--radius-sm)">
            ${FOOD_EMOJIS.map(e => `<button type="button" class="btn btn-sm btn-outline emoji-pick-btn" data-emoji="${e}" onclick="AdminPages._pickEmoji('dlg-promo-emoji',this,'${e}')" style="font-size:1.25rem;padding:6px;${e===emoji?'background:var(--primary);color:#fff;border-color:var(--primary)':''}">${e}</button>`).join('')}
          </div>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Description</label>
          <textarea id="dlg-promo-desc" rows="3" placeholder="Description de la promotion" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem;resize:vertical">${p?p.description:''}</textarea>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.875rem">Réduction / Discount</label>
          <input type="text" id="dlg-promo-discount" value="${p?p.discount:''}" placeholder="Ex: -20%, 2 pour 1, Gratuit..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9375rem">
          <input type="checkbox" id="dlg-promo-active" ${p?p.active?'checked':'':'checked'}> Active
        </label>
      </div>`;

    const footer = `
      <button class="btn btn-outline" onclick="Modal.close()">Annuler</button>
      <button class="btn btn-primary" onclick="AdminPages._savePromotion('${id||''}')">${isEdit?'Enregistrer':'Créer'}</button>`;

    Modal.open(isEdit ? 'Modifier la promotion' : 'Nouvelle Promotion', body, footer, { width: '500px' });
  },

  _savePromotion(id) {
    const title = document.getElementById('dlg-promo-title')?.value.trim();
    const emoji = document.getElementById('dlg-promo-emoji')?.value || '🎉';
    const description = document.getElementById('dlg-promo-desc')?.value.trim();
    const discount = document.getElementById('dlg-promo-discount')?.value.trim();
    const active = document.getElementById('dlg-promo-active')?.checked ?? true;

    if (!title) { Toast.error('Le titre est obligatoire'); return; }

    const data = { title, emoji, description, discount, active };

    if (id) {
      DB.updatePromotion(id, data);
      Toast.success('Promotion mise à jour');
    } else {
      DB.createPromotion(data);
      Toast.success('Promotion créée');
    }
    Modal.close();
    AdminPages.renderPromotions();
  },

  _deletePromotion(id) {
    confirmAction('Supprimer cette promotion ?', () => {
      DB.deletePromotion(id);
      Toast.success('Promotion supprimée');
      AdminPages.renderPromotions();
    });
  },

  // ================================================================
  // 8. CSV IMPORT/EXPORT
  // ================================================================
  renderCSV() {
    const container = document.getElementById('admin-content');

    let html = '<div class="page-enter">';

    html += `<h1 style="font-weight:800;font-size:1.5rem;margin-bottom:24px">Import / Export CSV</h1>`;

    // Export section
    html += `<div class="card" style="margin-bottom:20px;padding:24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-size:1.5rem">📤</span>
        <h3 style="font-weight:700">Exporter les articles</h3>
      </div>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px">Téléchargez tous vos articles au format CSV pour sauvegarde ou modification.</p>
      <button class="btn btn-primary" onclick="AdminPages._exportCSV()">📥 Télécharger le CSV</button>
    </div>`;

    // Import section
    html += `<div class="card" style="padding:24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-size:1.5rem">📥</span>
        <h3 style="font-weight:700">Importer des articles</h3>
      </div>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px">Importez un fichier CSV pour ajouter ou mettre à jour des articles en masse.</p>
      <div id="csv-drop-zone" style="border:2px dashed var(--border);border-radius:var(--radius);padding:40px 24px;text-align:center;cursor:pointer;transition:all 0.2s"
        onclick="document.getElementById('csv-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--primary)';this.style.background='var(--primary-bg,#e8f5e9)'"
        ondragleave="this.style.borderColor='var(--border)';this.style.background=''"
        ondrop="event.preventDefault();this.style.borderColor='var(--border)';this.style.background='';AdminPages._handleCSVFile(event.dataTransfer.files[0])">
        <div style="font-size:2rem;margin-bottom:8px">📄</div>
        <div style="font-weight:600;margin-bottom:4px">Glissez votre fichier CSV ici</div>
        <div style="color:var(--text-muted);font-size:0.8125rem">ou cliquez pour parcourir</div>
      </div>
      <input type="file" id="csv-file-input" accept=".csv" style="display:none" onchange="AdminPages._handleCSVFile(this.files[0])">
      <div id="csv-results" style="margin-top:16px"></div>
    </div>`;

    html += '</div>';
    container.innerHTML = html;
  },

  _exportCSV() {
    const csv = DB.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bodoro-articles-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    Toast.success('Fichier CSV téléchargé');
  },

  _handleCSVFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      Toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const result = DB.importCSV(text);

      const resultsEl = document.getElementById('csv-results');
      if (resultsEl) {
        resultsEl.innerHTML = `<div style="padding:16px;border-radius:var(--radius-sm);background:var(--success-bg,#e8f5e9);border:1px solid #0d6e4a30">
          <div style="font-weight:700;margin-bottom:8px;flex:1">✅ Import terminé</div>
          <div style="display:flex;gap:16px;font-size:0.875rem">
            <span>🆕 Créés : <strong>${result.created}</strong></span>
            <span>🔄 Mis à jour : <strong>${result.updated}</strong></span>
            <span>❌ Erreurs : <strong>${result.errors}</strong></span>
          </div>
        </div>`;
      }
      Toast.success(`Import terminé : ${result.created} créés, ${result.updated} mis à jour, ${result.errors} erreurs`);
    };
    reader.readAsText(file);
  },

  // ================================================================
  // 9. CONFIG MANAGER
  // ================================================================
  renderConfig() {
    const container = document.getElementById('admin-content');
    const config = DB.getConfig();
    AdminPages._configDirty = false;

    let html = '<div class="page-enter">';

    // Header with save button
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:12px">
        <h1 style="font-weight:800;font-size:1.5rem">Configuration</h1>
        <span class="badge badge-outline" id="config-dirty-badge" style="display:none;font-size:0.6875rem">Modifications non enregistrées</span>
      </div>
      <button class="btn btn-primary" id="config-save-btn" onclick="AdminPages._saveConfig()">💾 Enregistrer</button>
    </div>`;

    // Config sections grid
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px">`;

    // Restaurant
    html += `<div class="card" style="padding:20px">
      <h3 style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">🏪 Restaurant</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Nom du restaurant</label>
          <input type="text" id="cfg-name" value="${config.restaurantName||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Slogan</label>
          <input type="text" id="cfg-slogan" value="${config.slogan||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
      </div>
    </div>`;

    // Contact
    html += `<div class="card" style="padding:20px">
      <h3 style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">📞 Contact</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Adresse</label>
          <textarea id="cfg-address" rows="2" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem;resize:vertical">${config.address||''}</textarea>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Téléphone 1</label>
          <input type="text" id="cfg-phone1" value="${config.phone1||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Téléphone 2</label>
          <input type="text" id="cfg-phone2" value="${config.phone2||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">WhatsApp</label>
          <input type="text" id="cfg-whatsapp" value="${config.whatsapp||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem" placeholder="+225XXXXXXXXXX">
        </div>
      </div>
    </div>`;

    // Horaires
    html += `<div class="card" style="padding:20px">
      <h3 style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">🕐 Horaires</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Heure d'ouverture</label>
          <input type="time" id="cfg-opening" value="${config.openingTime||'10:00'}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Heure de fermeture</label>
          <input type="time" id="cfg-closing" value="${config.closingTime||'23:00'}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Jours d'ouverture</label>
          <input type="text" id="cfg-days" value="${config.openDays||''}" class="cfg-input" placeholder="Ex: Lun-Dim" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
      </div>
    </div>`;

    // Bannière
    html += `<div class="card" style="padding:20px">
      <h3 style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">📢 Bannière</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Texte de la bannière</label>
          <textarea id="cfg-banner-text" rows="2" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem;resize:vertical">${config.bannerText||''}</textarea>
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9375rem">
          <input type="checkbox" id="cfg-banner-active" class="cfg-input" ${config.bannerActive?'checked':''}> Bannière active
        </label>
      </div>
    </div>`;

    // Réseaux Sociaux
    html += `<div class="card" style="padding:20px">
      <h3 style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">📱 Réseaux Sociaux</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">📷 Instagram (URL)</label>
          <input type="url" id="cfg-instagram" value="${config.instagram||''}" class="cfg-input" placeholder="https://instagram.com/..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">📘 Facebook (URL)</label>
          <input type="url" id="cfg-facebook" value="${config.facebook||''}" class="cfg-input" placeholder="https://facebook.com/..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">🎵 TikTok (URL)</label>
          <input type="url" id="cfg-tiktok" value="${config.tiktok||''}" class="cfg-input" placeholder="https://tiktok.com/..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
        </div>
      </div>
    </div>`;

    // Sécurité
    html += `<div class="card" style="padding:20px">
      <h3 style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">🔐 Sécurité</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Mot de passe administrateur</label>
          <div style="position:relative">
            <input type="password" id="cfg-password" class="cfg-input" value="${config.adminPassword||''}" style="width:100%;padding:10px 12px;padding-right:44px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
            <button type="button" onclick="AdminPages._togglePasswordVisibility()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.125rem;padding:4px" id="pwd-toggle-btn">👁️</button>
          </div>
        </div>
      </div>
    </div>`;

    html += '</div>'; // close grid
    html += '</div>'; // close page-enter
    container.innerHTML = html;

    // Attach change listeners for dirty detection
    document.querySelectorAll('.cfg-input').forEach(input => {
      input.addEventListener('change', AdminPages._markConfigDirty);
      input.addEventListener('input', AdminPages._markConfigDirty);
    });
  },

  _markConfigDirty() {
    if (!AdminPages._configDirty) {
      AdminPages._configDirty = true;
      const badge = document.getElementById('config-dirty-badge');
      if (badge) badge.style.display = 'inline-flex';
    }
  },

  _togglePasswordVisibility() {
    const input = document.getElementById('cfg-password');
    const btn = document.getElementById('pwd-toggle-btn');
    if (input && btn) {
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }
  },

  _saveConfig() {
    const updates = {
      restaurantName: document.getElementById('cfg-name')?.value.trim() || '',
      slogan: document.getElementById('cfg-slogan')?.value.trim() || '',
      address: document.getElementById('cfg-address')?.value.trim() || '',
      phone1: document.getElementById('cfg-phone1')?.value.trim() || '',
      phone2: document.getElementById('cfg-phone2')?.value.trim() || '',
      whatsapp: document.getElementById('cfg-whatsapp')?.value.trim() || '',
      openingTime: document.getElementById('cfg-opening')?.value || '10:00',
      closingTime: document.getElementById('cfg-closing')?.value || '23:00',
      openDays: document.getElementById('cfg-days')?.value.trim() || 'Lun-Dim',
      bannerText: document.getElementById('cfg-banner-text')?.value.trim() || '',
      bannerActive: document.getElementById('cfg-banner-active')?.checked ?? false,
      adminPassword: (document.getElementById('cfg-password')?.value || '').trim() || 'bodoro2024',
      instagram: (document.getElementById('cfg-instagram')?.value || '').trim(),
      facebook: (document.getElementById('cfg-facebook')?.value || '').trim(),
      tiktok: (document.getElementById('cfg-tiktok')?.value || '').trim()
    };

    DB.updateConfig(updates);
    AdminPages._configDirty = false;
    const badge = document.getElementById('config-dirty-badge');
    if (badge) badge.style.display = 'none';
    Toast.success('Configuration enregistrée');
  },

  // ================================================================
  // SHARED HELPERS
  // ================================================================
  // ================================================================
  // RENDER DISPATCHER
  // ================================================================
  render(tab) {
    if (!DB.isAdmin() || !DB.validateAdminToken()) {
      AdminPages._destroyCharts();
      AdminPages.renderLogin();
      return;
    }
    AdminPages._destroyCharts();
    AdminPages._updateSidebarBadges();
    switch(tab) {
      case 'dashboard': AdminPages.renderDashboard(); break;
      case 'articles': AdminPages.renderArticles(); break;
      case 'categories': AdminPages.renderCategories(); break;
      case 'orders': AdminPages.renderOrders(); break;
      case 'testimonials': AdminPages.renderTestimonials(); break;
      case 'promotions': AdminPages.renderPromotions(); break;
      case 'csv': AdminPages.renderCSV(); break;
      case 'config': AdminPages.renderConfig(); break;
      default: AdminPages.renderLogin();
    }
  },

  _pickEmoji(inputId, btn, emoji) {
    document.getElementById(inputId).value = emoji;
    // Update visual selection
    const parent = btn.parentElement;
    parent.querySelectorAll('.emoji-pick-btn').forEach(b => {
      b.style.background = '';
      b.style.color = '';
      b.style.borderColor = '';
    });
    btn.style.background = 'var(--primary)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'var(--primary)';
  }
};
