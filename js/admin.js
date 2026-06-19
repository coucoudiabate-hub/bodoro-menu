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
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">🌐 URL publique du site (pour QR codes)</label>
          <input type="url" id="cfg-site-url" value="${config.siteUrl||''}" class="cfg-input" placeholder="https://bodoro.netlify.app" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem">
          <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;line-height:1.4">L'URL publique de votre site déployé. Sert à générer les QR codes (onglet « QR Codes »). Si vide, l'URL courante est utilisée.</p>
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

    // Localisation GPS - Plan de localisation
    html += `<div class="card" style="padding:20px;grid-column:1 / -1">
      <h3 style="font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">🗺️ Localisation GPS & Plan</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;align-items:start">
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>
            <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Nom du lieu (Google Maps)</label>
            <input type="text" id="cfg-place-name" value="${config.placeName||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem" placeholder="Ex: LA CÔTE D'EMERAUDE CHEZ BODORO">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Latitude</label>
              <input type="number" step="any" id="cfg-latitude" value="${config.latitude||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem" placeholder="Ex: 6.73714">
            </div>
            <div>
              <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Longitude</label>
              <input type="number" step="any" id="cfg-longitude" value="${config.longitude||''}" class="cfg-input" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem" placeholder="Ex: -5.2853533">
            </div>
          </div>
          <div>
            <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Niveau de zoom (1-20)</label>
            <div style="display:flex;align-items:center;gap:12px">
              <input type="range" min="1" max="20" step="1" id="cfg-map-zoom" value="${config.mapZoom||15}" class="cfg-input" style="flex:1;accent-color:var(--bodoro)" oninput="AdminPages._updateMapPreview()">
              <span id="cfg-map-zoom-val" style="font-weight:700;font-size:0.9375rem;min-width:32px;text-align:center;color:var(--bodoro)">${config.mapZoom||15}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn btn-outline btn-sm" onclick="AdminPages._useMyPosition()" title="Détecter ma position actuelle">📍 Ma position</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="AdminPages._openMapsPicker()" title="Ouvrir Google Maps pour récupérer des coordonnées">🔍 Ouvrir Maps</button>
          </div>
          <p style="font-size:0.75rem;color:var(--text-muted);line-height:1.5;margin-top:4px">💡 Astuce : cliquez sur « Ouvrir Maps », recherchez votre restaurant, faites un clic droit sur le lieu → les coordonnées s'affichent. Cliquez dessus pour les copier, puis collez-les ici.</p>
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Aperçu du plan</label>
          <div id="cfg-map-preview" style="border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border-light);aspect-ratio:4/3;background:var(--bg-card-hover)"></div>
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

    // Live preview map + attach input listeners on GPS fields
    ['cfg-place-name', 'cfg-latitude', 'cfg-longitude'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', AdminPages._updateMapPreview);
    });
    AdminPages._updateMapPreview();
  },

  // Met à jour l'aperçu de la carte en temps réel dans la config admin
  _updateMapPreview() {
    const preview = document.getElementById('cfg-map-preview');
    if (!preview) return;
    const latEl = document.getElementById('cfg-latitude');
    const lngEl = document.getElementById('cfg-longitude');
    const zoomEl = document.getElementById('cfg-map-zoom');
    const zoomVal = document.getElementById('cfg-map-zoom-val');
    const lat = parseFloat(latEl?.value);
    const lng = parseFloat(lngEl?.value);
    const zoom = parseInt(zoomEl?.value) || 15;
    if (zoomVal) zoomVal.textContent = zoom;

    if (isNaN(lat) || isNaN(lng)) {
      preview.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.875rem;text-align:center;padding:16px">Entrez une latitude et une longitude valides pour voir l\'aperçu</div>';
      return;
    }
    preview.innerHTML = `<iframe
      src="https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&hl=fr"
      style="border:0;display:block;width:100%;height:100%" allowfullscreen="" loading="lazy"
      referrerpolicy="no-referrer-when-downgrade" title="Aperçu plan"></iframe>`;
  },

  // Détecte la position GPS actuelle de l'admin (géolocalisation navigateur)
  _useMyPosition() {
    if (!navigator.geolocation) {
      Toast.error('La géolocalisation n\'est pas supportée par ce navigateur');
      return;
    }
    Toast.info('Détection de votre position...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const latEl = document.getElementById('cfg-latitude');
        const lngEl = document.getElementById('cfg-longitude');
        if (latEl) { latEl.value = pos.coords.latitude.toFixed(6); latEl.dispatchEvent(new Event('input')); }
        if (lngEl) { lngEl.value = pos.coords.longitude.toFixed(6); lngEl.dispatchEvent(new Event('input')); }
        AdminPages._markConfigDirty();
        Toast.success('Position détectée : ' + pos.coords.latitude.toFixed(5) + ', ' + pos.coords.longitude.toFixed(5));
      },
      err => {
        console.warn(err);
        Toast.error('Impossible d\'obtenir votre position : ' + (err.message || 'permission refusée'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  // Ouvre Google Maps dans un nouvel onglet pour récupérer des coordonnées
  _openMapsPicker() {
    const latEl = document.getElementById('cfg-latitude');
    const lngEl = document.getElementById('cfg-longitude');
    const lat = parseFloat(latEl?.value);
    const lng = parseFloat(lngEl?.value);
    const url = (!isNaN(lat) && !isNaN(lng))
      ? `https://www.google.com/maps/@${lat},${lng},15z`
      : 'https://www.google.com/maps';
    window.open(url, '_blank', 'noopener');
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
      siteUrl: document.getElementById('cfg-site-url')?.value.trim() || '',
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
      tiktok: (document.getElementById('cfg-tiktok')?.value || '').trim(),
      // Champs de localisation GPS
      placeName: document.getElementById('cfg-place-name')?.value.trim() || '',
      latitude: parseFloat(document.getElementById('cfg-latitude')?.value) || 0,
      longitude: parseFloat(document.getElementById('cfg-longitude')?.value) || 0,
      mapZoom: parseInt(document.getElementById('cfg-map-zoom')?.value) || 15
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
  // 10. QR CODES - Générateur de QR codes imprimables
  // ================================================================

  // Types de QR codes prédéfinis
  _qrTypes: [
    { id: 'site',       label: 'Site principal',        icon: '🌐', desc: 'Page d\'accueil du restaurant' },
    { id: 'menu',       label: 'Menu direct',           icon: '🍽️', desc: 'Accès direct au menu de commande' },
    { id: 'whatsapp',   label: 'WhatsApp commande',     icon: '💬', desc: 'Ouvre WhatsApp pour commander' },
    { id: 'maps',       label: 'Localisation Maps',     icon: '📍', desc: 'Itinéraire vers le restaurant' },
    { id: 'tel',        label: 'Appeler',               icon: '📞', desc: 'Lance un appel téléphonique' },
    { id: 'tables',     label: 'QR Codes par table',    icon: '🪑', desc: 'Génère un QR code par table (1 à N)' }
  ],

  renderQRCodes() {
    const container = document.getElementById('admin-content');
    const config = DB.getConfig();
    const siteUrl = DB.getSiteUrl();
    const restaurantName = config.restaurantName || 'Bodoro';

    let html = '<div class="page-enter">';

    // Header
    html += `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:8px">
      <h1 style="font-weight:800;font-size:1.5rem;display:flex;align-items:center;gap:10px">📱 Générateur de QR Codes</h1>
      <button class="btn btn-outline btn-sm" onclick="AdminPages._printAllQRCodes()">🖨️ Imprimer tout</button>
    </div>
    <p style="color:var(--text-secondary);font-size:0.9375rem;margin-bottom:20px">
      Génère des QR codes imprimables que vos clients peuvent scanner avec leur téléphone pour accéder directement à votre site de commande.
      Imprimez-les, plastifiez-les et placez-les sur les tables, à l'entrée ou sur vos emballages.
    </p>`;

    // Alert si URL du site non configurée
    if (!config.siteUrl) {
      html += `<div style="background:var(--warning-bg);border:1px solid var(--gold);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px">
        <span style="font-size:1.25rem">💡</span>
        <div style="flex:1;font-size:0.875rem;color:var(--text-secondary);line-height:1.5">
          <strong>URL du site non configurée.</strong> L'URL détectée automatiquement est : <code style="background:var(--bg-card-hover);padding:2px 6px;border-radius:4px;font-size:0.8125rem">${siteUrl}</code><br>
          Pour des QR codes valides en production, allez dans <strong>Configuration → Restaurant</strong> et renseignez l'URL publique de votre site (ex: https://bodoro.netlify.app).
        </div>
      </div>`;
    }

    // Section 1: QR codes prédéfinis (cartes)
    html += `<h2 style="font-weight:700;margin-bottom:12px;font-size:1.125rem">🎯 QR Codes prêts à l'emploi</h2>`;
    html += `<div id="qr-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:32px">`;

    this._qrTypes.filter(t => t.id !== 'tables').forEach(type => {
      const url = AdminPages._getQrUrl(type.id, null);
      html += `<div class="card" style="padding:20px;display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center">
        <div style="display:flex;align-items:center;gap:8px;align-self:stretch;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.5rem">${type.icon}</span>
            <strong style="font-size:1rem">${type.label}</strong>
          </div>
        </div>
        <p style="font-size:0.8125rem;color:var(--text-muted);margin:0;align-self:stretch">${type.desc}</p>
        <div id="qr-preview-${type.id}" class="qr-print-container" style="background:#fff;padding:12px;border-radius:var(--radius-sm);box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center;width:200px;height:200px"></div>
        <div style="font-family:'Courier New',monospace;font-size:0.6875rem;color:var(--text-muted);word-break:break-all;max-width:100%;line-height:1.4">${url}</div>
        <div style="display:flex;gap:8px;width:100%">
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="AdminPages._downloadQR('${type.id}', null)">⬇️ PNG</button>
          <button class="btn btn-primary btn-sm" style="flex:1" onclick="AdminPages._printSingleQR('${type.id}', null)">🖨️ Imprimer</button>
        </div>
      </div>`;
    });
    html += '</div>';

    // Section 2: QR codes par table
    html += `<div class="card" style="padding:24px;margin-bottom:32px">
      <h2 style="font-weight:700;margin-bottom:8px;font-size:1.125rem;display:flex;align-items:center;gap:8px">🪑 QR Codes par table</h2>
      <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:16px">
        Générez un QR code unique pour chaque table. Quand un client scanne le QR de sa table, il arrive directement sur le site avec le numéro de table pré-rempli.
      </p>

      <div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Nombre de tables</label>
          <input type="number" id="qr-table-count" min="1" max="50" value="10" style="width:100px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem" oninput="AdminPages._renderTableQRCodes()">
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.8125rem">Préfixe (optionnel)</label>
          <input type="text" id="qr-table-prefix" value="Table" placeholder="Table" style="width:120px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem" oninput="AdminPages._renderTableQRCodes()">
        </div>
        <button class="btn btn-primary" onclick="AdminPages._printAllTableQRCodes()">🖨️ Imprimer toutes les tables</button>
        <button class="btn btn-outline" onclick="AdminPages._downloadAllTableQRCodes()">⬇️ Télécharger tout (ZIP)</button>
      </div>

      <div id="qr-tables-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px"></div>
    </div>`;

    // Section 3: Aide à l'impression
    html += `<div class="card" style="padding:20px;background:var(--success-bg);border-color:var(--bodoro)">
      <h3 style="font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px">💡 Conseils d'impression & d'utilisation</h3>
      <ul style="margin:0;padding-left:20px;font-size:0.875rem;color:var(--text-secondary);line-height:1.8">
        <li><strong>Format recommandé :</strong> imprimez sur papier photo ou papier couché 200g/m² pour une meilleure durabilité.</li>
        <li><strong>Plastification :</strong> faites plastifier les QR codes pour résister aux taches et à l'humidité sur les tables.</li>
        <li><strong>Taille minimale :</strong> 5×5 cm pour garantir un scan rapide par tous les smartphones.</li>
        <li><strong>Placement :</strong> posez les QR codes sur chaque table, à l'entrée, et sur les emballages de livraison.</li>
        <li><strong>Test :</strong> avant impression en masse, testez le scan avec plusieurs téléphones (iPhone, Android).</li>
        <li><strong>Mise à jour :</strong> si votre URL change, regénérez les QR codes — les anciens ne fonctionneront plus.</li>
      </ul>
    </div>`;

    html += '</div>';
    container.innerHTML = html;

    // Générer les QR codes après injection dans le DOM
    requestAnimationFrame(() => {
      // QR codes prédéfinis
      AdminPages._qrTypes.filter(t => t.id !== 'tables').forEach(type => {
        AdminPages._renderQRCode(`qr-preview-${type.id}`, AdminPages._getQrUrl(type.id, null), 180);
      });
      // QR codes par table
      AdminPages._renderTableQRCodes();
    });
  },

  // Calcule l'URL à encoder dans le QR code selon le type
  _getQrUrl(type, tableNumber) {
    const config = DB.getConfig();
    const baseUrl = DB.getSiteUrl();
    const sep = baseUrl.indexOf('?') >= 0 ? '&' : '?';

    switch (type) {
      case 'site':
        return baseUrl;
      case 'menu':
        return baseUrl + (baseUrl.indexOf('#') >= 0 ? '' : '#menu');
      case 'whatsapp':
        return `https://wa.me/${(config.whatsapp || '').replace(/[^0-9]/g, '')}`;
      case 'maps':
        const lat = parseFloat(config.latitude);
        const lng = parseFloat(config.longitude);
        if (!isNaN(lat) && !isNaN(lng)) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&hl=fr`;
        return `https://www.google.com/maps?q=${encodeURIComponent(config.address || '')}`;
      case 'tel':
        const phone = (config.phone1 || '').replace(/[^0-9+]/g, '');
        return `tel:${phone}`;
      case 'table':
        return `${baseUrl}${sep}table=${encodeURIComponent(tableNumber)}#menu`;
      default:
        return baseUrl;
    }
  },

  // Génère un QR code dans un élément conteneur
  _renderQRCode(containerId, url, size) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = ''; // reset
    try {
      new QRCode(el, {
        text: url,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) {
      console.error('QR generation failed:', e);
      el.innerHTML = '<div style="color:var(--danger);font-size:0.75rem;text-align:center;padding:20px">Erreur génération QR</div>';
    }
  },

  // Récupère l'image (canvas) d'un QR code pour téléchargement
  _getQRDataURL(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return null;
    const canvas = el.querySelector('canvas');
    const img = el.querySelector('img');
    if (canvas) return canvas.toDataURL('image/png');
    if (img && img.src) return img.src;
    return null;
  },

  // Télécharge un QR code en PNG
  _downloadQR(type, tableNumber) {
    const containerId = tableNumber !== null
      ? `qr-table-${tableNumber}`
      : `qr-preview-${type}`;
    const dataUrl = AdminPages._getQRDataURL(containerId);
    if (!dataUrl) { Toast.error('Impossible de générer l\'image'); return; }

    const config = DB.getConfig();
    const prefix = (config.restaurantName || 'Bodoro').replace(/[^a-zA-Z0-9]/g, '_');
    let filename;
    if (tableNumber !== null) {
      const tblPrefix = (document.getElementById('qr-table-prefix')?.value || 'Table').replace(/\s+/g, '_');
      filename = `${prefix}_QR_${tblPrefix}_${tableNumber}.png`;
    } else {
      filename = `${prefix}_QR_${type}.png`;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    Toast.success(`Téléchargé : ${filename}`);
  },

  // Télécharge tous les QR codes des tables un par un (pas de ZIP sans lib supplémentaire)
  _downloadAllTableQRCodes() {
    const count = parseInt(document.getElementById('qr-table-count')?.value) || 0;
    if (count <= 0) { Toast.error('Aucune table à télécharger'); return; }
    let i = 1;
    const next = () => {
      if (i > count) { Toast.success(`${count} QR codes téléchargés`); return; }
      AdminPages._downloadQR('table', i);
      i++;
      setTimeout(next, 300); // petit délai pour laisser le navigateur télécharger
    };
    next();
  },

  // Rendu de la grille des QR codes par table
  _renderTableQRCodes() {
    const count = parseInt(document.getElementById('qr-table-count')?.value) || 0;
    const prefix = document.getElementById('qr-table-prefix')?.value || 'Table';
    const grid = document.getElementById('qr-tables-grid');
    if (!grid) return;

    if (count <= 0 || count > 50) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:20px">Entrez un nombre entre 1 et 50</div>';
      return;
    }

    let html = '';
    for (let i = 1; i <= count; i++) {
      const url = AdminPages._getQrUrl('table', i);
      html += `<div class="card qr-print-container" style="padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center">
        <div style="font-weight:700;font-size:0.9375rem;color:var(--bodoro)">${prefix} ${i}</div>
        <div id="qr-table-${i}" style="background:#fff;padding:8px;border-radius:var(--radius-sm);box-shadow:var(--shadow-sm);width:160px;height:160px;display:flex;align-items:center;justify-content:center"></div>
        <div style="display:flex;gap:6px;width:100%">
          <button class="btn btn-outline btn-sm" style="flex:1;font-size:0.75rem" onclick="AdminPages._downloadQR('table', ${i})">⬇️ PNG</button>
          <button class="btn btn-primary btn-sm" style="flex:1;font-size:0.75rem" onclick="AdminPages._printSingleQR('table', ${i})">🖨️</button>
        </div>
      </div>`;
    }
    grid.innerHTML = html;

    // Génère chaque QR code
    for (let i = 1; i <= count; i++) {
      AdminPages._renderQRCode(`qr-table-${i}`, AdminPages._getQrUrl('table', i), 144);
    }
  },

  // Imprime un seul QR code (ouvre une fenêtre d'impression dédiée)
  _printSingleQR(type, tableNumber) {
    const containerId = tableNumber !== null
      ? `qr-table-${tableNumber}`
      : `qr-preview-${type}`;
    const dataUrl = AdminPages._getQRDataURL(containerId);
    if (!dataUrl) { Toast.error('QR code non disponible'); return; }

    const config = DB.getConfig();
    const restaurantName = config.restaurantName || 'Bodoro';
    const url = AdminPages._getQrUrl(type, tableNumber);
    let title;
    if (type === 'table') {
      const prefix = document.getElementById('qr-table-prefix')?.value || 'Table';
      title = `${prefix} ${tableNumber}`;
    } else {
      const typeObj = AdminPages._qrTypes.find(t => t.id === type);
      title = typeObj ? typeObj.label : 'QR Code';
    }

    AdminPages._openPrintWindow(dataUrl, title, restaurantName, url);
  },

  // Imprime tous les QR codes prédéfinis dans une seule fenêtre
  _printAllQRCodes() {
    const config = DB.getConfig();
    const restaurantName = config.restaurantName || 'Bodoro';
    const items = AdminPages._qrTypes
      .filter(t => t.id !== 'tables')
      .map(type => {
        const dataUrl = AdminPages._getQRDataURL(`qr-preview-${type.id}`);
        if (!dataUrl) return null;
        return {
          dataUrl,
          title: type.label,
          url: AdminPages._getQrUrl(type.id, null)
        };
      })
      .filter(Boolean);

    if (items.length === 0) { Toast.error('Aucun QR code à imprimer'); return; }
    AdminPages._openPrintWindowMultiple(items, restaurantName);
  },

  // Imprime tous les QR codes des tables
  _printAllTableQRCodes() {
    const count = parseInt(document.getElementById('qr-table-count')?.value) || 0;
    const prefix = document.getElementById('qr-table-prefix')?.value || 'Table';
    if (count <= 0) { Toast.error('Aucune table à imprimer'); return; }

    const config = DB.getConfig();
    const restaurantName = config.restaurantName || 'Bodoro';
    const items = [];
    for (let i = 1; i <= count; i++) {
      const dataUrl = AdminPages._getQRDataURL(`qr-table-${i}`);
      if (dataUrl) {
        items.push({
          dataUrl,
          title: `${prefix} ${i}`,
          url: AdminPages._getQrUrl('table', i)
        });
      }
    }
    if (items.length === 0) { Toast.error('QR codes non générés'); return; }
    AdminPages._openPrintWindowMultiple(items, restaurantName, true);
  },

  // Ouvre une fenêtre d'impression avec UN QR code (grand format)
  _openPrintWindow(dataUrl, title, restaurantName, url) {
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) { Toast.error('Veuillez autoriser les pop-ups pour imprimer'); return; }
    w.document.write(`<!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8">
      <title>${title} - ${restaurantName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Nunito', Arial, sans-serif; padding: 30px; text-align: center; color: #1a2e23; }
        .header { margin-bottom: 20px; }
        .restaurant { font-size: 1.5rem; font-weight: 800; color: #0d6e4a; margin-bottom: 4px; }
        .subtitle { font-size: 0.9rem; color: #7a9488; }
        .qr-wrapper { display: inline-block; padding: 20px; background: #fff; border: 3px solid #0d6e4a; border-radius: 16px; margin: 20px 0; }
        .qr-wrapper img { width: 350px; height: 350px; display: block; }
        .qr-title { font-size: 1.5rem; font-weight: 700; margin: 16px 0 8px; color: #084d34; }
        .instructions { background: #f5f8f6; border-radius: 12px; padding: 16px; margin-top: 20px; font-size: 0.9375rem; line-height: 1.6; color: #4a6558; }
        .instructions strong { color: #0d6e4a; }
        .url { font-family: 'Courier New', monospace; font-size: 0.75rem; color: #7a9488; word-break: break-all; margin-top: 12px; }
        .footer { margin-top: 30px; font-size: 0.75rem; color: #7a9488; border-top: 1px solid #e5ede8; padding-top: 12px; }
        @media print { body { padding: 15px; } .no-print { display: none; } }
        .print-btn { margin-top: 20px; padding: 10px 24px; background: #0d6e4a; color: #fff; border: none; border-radius: 8px; font-size: 0.9375rem; cursor: pointer; font-weight: 600; }
        .print-btn:hover { background: #084d34; }
      </style>
    </head><body>
      <div class="header">
        <div class="restaurant">${restaurantName}</div>
        <div class="subtitle">Scannez pour commander</div>
      </div>
      <div class="qr-wrapper"><img src="${dataUrl}" alt="QR Code ${title}"></div>
      <div class="qr-title">${title}</div>
      <div class="instructions">
        📱 <strong>Comment commander :</strong><br>
        1. Ouvrez l'appareil photo de votre téléphone<br>
        2. Pointez vers le QR code<br>
        3. Touchez la notification pour ouvrir le site<br>
        4. Choisissez vos plats et commandez !
      </div>
      <div class="url">${url}</div>
      <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer</button>
      <div class="footer">${restaurantName} • QR Code généré le ${new Date().toLocaleDateString('fr-FR')}</div>
    </body></html>`);
    w.document.close();
    // Impression auto après chargement de l'image
    w.onload = () => { setTimeout(() => w.print(), 300); };
  },

  // Ouvre une fenêtre d'impression avec PLUSIEURS QR codes (format grille)
  _openPrintWindowMultiple(items, restaurantName, isTables = false) {
    const w = window.open('', '_blank', 'width=900,height=900');
    if (!w) { Toast.error('Veuillez autoriser les pop-ups pour imprimer'); return; }

    const cardsHtml = items.map(item => `
      <div class="qr-card">
        <div class="qr-card-img"><img src="${item.dataUrl}" alt="QR ${item.title}"></div>
        <div class="qr-card-title">${item.title}</div>
        <div class="qr-card-hint">📱 Scannez pour commander</div>
      </div>
    `).join('');

    w.document.write(`<!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8">
      <title>QR Codes - ${restaurantName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Nunito', Arial, sans-serif; padding: 20px; color: #1a2e23; }
        h1 { text-align: center; font-size: 1.5rem; color: #0d6e4a; margin-bottom: 4px; }
        .subtitle { text-align: center; font-size: 0.875rem; color: #7a9488; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
        .qr-card { border: 2px solid #0d6e4a; border-radius: 12px; padding: 16px; text-align: center; page-break-inside: avoid; background: #fff; }
        .qr-card-img { display: flex; justify-content: center; margin-bottom: 10px; }
        .qr-card-img img { width: 180px; height: 180px; display: block; }
        .qr-card-title { font-size: 1rem; font-weight: 700; color: #084d34; margin-bottom: 4px; }
        .qr-card-hint { font-size: 0.75rem; color: #7a9488; }
        .header-img { text-align: center; margin-bottom: 12px; }
        .print-btn { display: block; margin: 20px auto 0; padding: 10px 24px; background: #0d6e4a; color: #fff; border: none; border-radius: 8px; font-size: 0.9375rem; cursor: pointer; font-weight: 600; }
        .print-btn:hover { background: #084d34; }
        @media print { .no-print { display: none; } body { padding: 10px; } }
      </style>
    </head><body>
      <h1>${restaurantName}</h1>
      <div class="subtitle">${isTables ? 'QR Codes par table' : 'QR Codes de commande'} • ${items.length} code${items.length > 1 ? 's' : ''}</div>
      <div class="grid">${cardsHtml}</div>
      <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer la page</button>
    </body></html>`);
    w.document.close();
    w.onload = () => { setTimeout(() => w.print(), 500); };
  },

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
      case 'qrcodes': AdminPages.renderQRCodes(); break;
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
