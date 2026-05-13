const ClientPages = {

  // ---- ACCUEIL (Home) ----
  renderAccueil() {
    const config = DB.getConfig();
    const container = document.getElementById('page-accueil');

    // Banner
    const bannerEl = document.getElementById('announcement-banner');
    if (config.bannerActive && config.bannerText) {
      const bannerTextEl = document.getElementById('banner-text-content');
      if (bannerTextEl) bannerTextEl.textContent = config.bannerText;
      bannerEl.style.display = 'flex';
      document.body.classList.add('banner-open');
    } else {
      bannerEl.style.display = 'none';
      document.body.classList.remove('banner-open');
    }

    // Get data
    const menuDuJour = DB.getMenuDuJour();
    const promoItems = DB.getPromoItems();
    const promotions = DB.getActivePromotions();
    const testimonials = DB.getTestimonials();

    let html = '<div class="page-enter">';

    // Info Cards (3 cards: Horaires, Cuisine, Spécialité)
    html += `<div class="info-cards">
      <div class="info-card card-enter">
        <div class="info-icon">🕐</div>
        <h3>Nos Horaires</h3>
        <p>${config.openingTime} - ${config.closingTime}<br>${config.openDays}</p>
      </div>
      <div class="info-card card-enter" style="animation-delay:0.1s">
        <div class="info-icon">🌍</div>
        <h3>Cuisine Africaine</h3>
        <p>Saveurs authentiques de Côte d'Ivoire et d'Afrique de l'Ouest</p>
      </div>
      <div class="info-card card-enter" style="animation-delay:0.2s">
        <div class="info-icon">⭐</div>
        <h3>Notre Spécialité</h3>
        <p>Attiéké poisson grillé et poulet braisé aux épices maison</p>
      </div>
    </div>`;

    // Promotions section
    if (promotions.length > 0) {
      html += '<h2 style="font-weight:800;margin-bottom:16px;font-size:1.375rem">🎉 Offres Spéciales</h2>';
      html += '<div class="promo-cards">';
      promotions.forEach(p => {
        html += `<div class="promo-card card-enter">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:2rem">${p.emoji}</span>
            <div>
              <div style="font-weight:700">${p.title}</div>
              <span class="badge badge-gold">${p.discount}</span>
            </div>
          </div>
          <p style="color:var(--text-secondary);font-size:0.875rem">${p.description}</p>
        </div>`;
      });
      html += '</div>';
    }

    // Menu du Jour
    if (menuDuJour.length > 0) {
      html += '<h2 style="font-weight:800;margin:32px 0 16px;font-size:1.375rem">🍽️ Menu du Jour</h2>';
      html += '<div class="menu-grid">';
      menuDuJour.forEach(item => {
        const isFav = DB.isFavorite(item.id);
        const price = item.promoPrice > 0 ? item.promoPrice : item.price;
        html += `<div class="menu-card card-enter">
          <div class="card-image">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : item.emoji}
            <span class="badge badge-gold" style="position:absolute;top:8px;left:8px">★ Menu du jour</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="ClientPages.toggleFavorite('${item.id}')">${isFav ? '❤️' : '🤍'}</button>
          </div>
          <div class="card-body">
            <div class="card-name">${item.name}</div>
            <div class="card-desc line-clamp-2">${item.description}</div>
            <div class="card-footer" style="margin-top:12px">
              <div class="card-price">${item.promoPrice > 0 ? `<span class="original">${formatPrice(item.price)}</span>${formatPrice(price)}` : formatPrice(item.price)}</div>
              <button class="btn btn-primary btn-sm" onclick="ClientPages.addToCart('${item.id}')">Ajouter</button>
            </div>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    // Promo Items (with discount badges)
    if (promoItems.length > 0) {
      html += '<h2 style="font-weight:800;margin:32px 0 16px;font-size:1.375rem">🏷️ Promotions</h2>';
      html += '<div class="menu-grid">';
      promoItems.forEach(item => {
        const isFav = DB.isFavorite(item.id);
        const discount = Math.round((1 - item.promoPrice / item.price) * 100);
        html += `<div class="menu-card card-enter">
          <div class="card-image">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : item.emoji}
            <span class="discount-badge">-${discount}%</span>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="ClientPages.toggleFavorite('${item.id}')">${isFav ? '❤️' : '🤍'}</button>
          </div>
          <div class="card-body">
            <div class="card-name">${item.name}</div>
            <div class="card-desc line-clamp-2">${item.description}</div>
            <div class="card-footer" style="margin-top:12px">
              <div class="card-price"><span class="original">${formatPrice(item.price)}</span>${formatPrice(item.promoPrice)}</div>
              <button class="btn btn-primary btn-sm" onclick="ClientPages.addToCart('${item.id}')">Ajouter</button>
            </div>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    // Testimonials
    if (testimonials.length > 0) {
      html += '<h2 style="font-weight:800;margin:32px 0 16px;font-size:1.375rem">💬 Avis Clients</h2>';
      html += '<div class="testimonials-grid">';
      testimonials.forEach(t => {
        const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
        html += `<div class="testimonial-card card-enter">
          <div class="star-rating" style="margin-bottom:10px">${stars.split('').map(s => `<span class="star ${s === '★' ? 'active' : ''}">${s}</span>`).join('')}</div>
          <div class="quote">"${t.text}"</div>
          <div class="author">— ${t.author}</div>
        </div>`;
      });
      html += '</div>';
    }

    // CTA Section
    html += `<div class="cta-section" style="margin-top:32px">
      <h2>Prêt à commander ?</h2>
      <p>Découvrez notre menu et passez votre commande en quelques clics</p>
      <button class="btn btn-gold btn-lg" onclick="App.setClientTab('menu')">Voir le Menu</button>
    </div>`;

    html += '</div>';
    container.innerHTML = html;
  },

  // ---- MENU ----
  renderMenu() {
    const container = document.getElementById('page-menu');
    const allItems = DB.getAvailableItems();
    const categories = DB.getActiveCategories();
    const favorites = DB.getFavorites();

    let html = '<div class="page-enter">';

    // Search + Sort bar
    html += `<div class="filter-bar">
      <div class="search-bar" style="flex:1;min-width:200px">
        <span class="search-icon">🔍</span>
        <input type="text" id="menu-search" placeholder="Rechercher un plat..." oninput="ClientPages.filterMenu()">
      </div>
      <select class="select" id="menu-sort" style="width:auto;min-width:160px" onchange="ClientPages.filterMenu()">
        <option value="default">Par défaut</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
        <option value="name_asc">Nom A-Z</option>
        <option value="name_desc">Nom Z-A</option>
      </select>
      <button class="btn btn-outline btn-sm" id="fav-filter-btn" onclick="ClientPages.toggleFavFilter()" title="Favoris uniquement">
        ❤️ Favoris <span id="fav-count" style="opacity:0.7">(${favorites.length})</span>
      </button>
    </div>`;

    // Category pills
    html += '<div class="category-pills" id="category-pills">';
    html += `<button class="category-pill active" data-cat="all" onclick="ClientPages.filterByCategory('all')">🍽️ Tous <span class="count">${allItems.length}</span></button>`;
    categories.forEach(cat => {
      const count = allItems.filter(i => i.categoryId === cat.id).length;
      html += `<button class="category-pill" data-cat="${cat.id}" onclick="ClientPages.filterByCategory('${cat.id}')">${cat.emoji} ${cat.name} <span class="count">${count}</span></button>`;
    });
    html += '</div>';

    // Items count
    html += `<div id="menu-items-info" style="font-size:0.875rem;color:var(--text-muted);margin-bottom:12px">
      ${allItems.length} articles trouvés
    </div>`;

    // Items grid
    html += '<div class="menu-grid" id="menu-items-grid"></div>';

    // Empty state (hidden by default)
    html += '<div class="empty-state hidden" id="menu-empty-state"><div class="empty-icon">👨‍🍳</div><h3>Aucun article trouvé</h3><p>Essayez un autre terme de recherche ou filtre</p></div>';

    html += '</div>';
    container.innerHTML = html;

    // Store filter state
    ClientPages._menuFilter = { category: 'all', search: '', sort: 'default', favsOnly: false };
    ClientPages.filterMenu();
  },

  filterMenu() {
    const searchEl = document.getElementById('menu-search');
    const sortEl = document.getElementById('menu-sort');
    if (!searchEl || !sortEl) return;

    const search = searchEl.value.toLowerCase().trim();
    const sort = sortEl.value;
    const favsOnly = ClientPages._menuFilter?.favsOnly || false;
    const cat = ClientPages._menuFilter?.category || 'all';

    let items = DB.getAvailableItems();

    // Category filter
    if (cat !== 'all') items = items.filter(i => i.categoryId === cat);

    // Search filter
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search) || i.description.toLowerCase().includes(search));

    // Favorites filter
    if (favsOnly) items = items.filter(i => DB.isFavorite(i.id));

    // Sort
    switch (sort) {
      case 'price_asc': items.sort((a, b) => a.price - b.price); break;
      case 'price_desc': items.sort((a, b) => b.price - a.price); break;
      case 'name_asc': items.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_desc': items.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    // Render items
    const grid = document.getElementById('menu-items-grid');
    const emptyState = document.getElementById('menu-empty-state');
    const info = document.getElementById('menu-items-info');

    if (grid) {
      if (items.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
      } else {
        if (emptyState) emptyState.classList.add('hidden');
        grid.innerHTML = items.map(item => {
          const isFav = DB.isFavorite(item.id);
          const price = item.promoPrice > 0 ? item.promoPrice : item.price;
          const cat = DB.getCategory(item.categoryId);
          const discount = item.promoPrice > 0 ? Math.round((1 - item.promoPrice / item.price) * 100) : 0;
          const cartItem = DB.getCart().find(c => c.id === item.id);

          return `<div class="menu-card card-enter">
            <div class="card-image">
              ${item.image ? `<img src="${item.image}" alt="${item.name}">` : item.emoji}
              ${item.isMenuJour ? '<span class="badge badge-gold" style="position:absolute;top:8px;left:8px">★ Menu du jour</span>' : ''}
              ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
              <button class="fav-btn ${isFav ? 'active' : ''}" onclick="ClientPages.toggleFavorite('${item.id}')">${isFav ? '❤️' : '🤍'}</button>
            </div>
            <div class="card-body">
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px">
                ${cat ? `<span class="badge badge-outline" style="font-size:0.6875rem;padding:1px 6px">${cat.emoji} ${cat.name}</span>` : ''}
              </div>
              <div class="card-name">${item.name}</div>
              <div class="card-desc line-clamp-2">${item.description}</div>
              <div class="card-footer" style="margin-top:12px">
                <div class="card-price">${item.promoPrice > 0 ? `<span class="original">${formatPrice(item.price)}</span>${formatPrice(price)}` : formatPrice(item.price)}</div>
                ${cartItem ? `<div class="cart-item-controls">
                  <button onclick="ClientPages.updateCartQty('${item.id}', ${cartItem.quantity - 1})">−</button>
                  <span style="font-weight:700;min-width:20px;text-align:center">${cartItem.quantity}</span>
                  <button onclick="ClientPages.updateCartQty('${item.id}', ${cartItem.quantity + 1})">+</button>
                </div>` : `<button class="btn btn-primary btn-sm" onclick="ClientPages.addToCart('${item.id}')">Ajouter</button>`}
              </div>
            </div>
          </div>`;
        }).join('');
      }
    }

    if (info) {
      let text = `${items.length} article${items.length !== 1 ? 's' : ''} trouvé${items.length !== 1 ? 's' : ''}`;
      if (favsOnly) text += ' <span class="badge badge-red" style="font-size:0.6875rem;vertical-align:middle">Favoris uniquement</span>';
      info.innerHTML = text;
    }
  },

  filterByCategory(catId) {
    ClientPages._menuFilter = ClientPages._menuFilter || {};
    ClientPages._menuFilter.category = catId;

    // Update pills
    document.querySelectorAll('.category-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.cat === catId);
    });

    ClientPages.filterMenu();
  },

  toggleFavFilter() {
    ClientPages._menuFilter = ClientPages._menuFilter || {};
    ClientPages._menuFilter.favsOnly = !ClientPages._menuFilter.favsOnly;
    const btn = document.getElementById('fav-filter-btn');
    if (btn) btn.style.background = ClientPages._menuFilter.favsOnly ? 'var(--success-bg)' : '';
    ClientPages.filterMenu();
  },

  toggleFavorite(itemId) {
    DB.toggleFavorite(itemId);
    // Re-render current page
    const activeTab = document.querySelector('.client-tab.active');
    if (activeTab) {
      const tab = activeTab.dataset.tab;
      if (tab === 'accueil') ClientPages.renderAccueil();
      else if (tab === 'menu') ClientPages.renderMenu();
    }
  },

  addToCart(itemId) {
    const item = DB.getItem(itemId);
    if (item) CartManager.addItem(item);
    // Re-render menu to show quantity controls
    ClientPages.filterMenu();
  },

  updateCartQty(itemId, qty) {
    if (qty <= 0) {
      CartManager.remove(itemId);
    } else {
      DB.updateCartQuantity(itemId, qty);
      CartDrawer.render();
    }
    ClientPages.filterMenu();
  },

  // ---- CONTACT ----
  renderContact() {
    const config = DB.getConfig();
    const container = document.getElementById('page-contact');

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    let html = '<div class="page-enter">';

    // Info Cards
    html += `<div class="contact-grid">
      <div class="info-card card-enter">
        <div class="info-icon">📍</div>
        <h3>Adresse</h3>
        <p>${config.address}</p>
      </div>
      <div class="info-card card-enter" style="animation-delay:0.1s">
        <div class="info-icon">🕐</div>
        <h3>Horaires</h3>
        <p>${config.openingTime} - ${config.closingTime}<br>${config.openDays}</p>
      </div>
      <div class="info-card card-enter" style="animation-delay:0.2s">
        <div class="info-icon">📞</div>
        <h3>Téléphone</h3>
        <p>${config.phone1}<br>${config.phone2}</p>
      </div>
      <div class="info-card card-enter" style="animation-delay:0.3s">
        <div class="info-icon">💬</div>
        <h3>WhatsApp</h3>
        <p><a href="https://wa.me/${config.whatsapp}" target="_blank" style="color:var(--bodoro)">${config.whatsapp}</a></p>
      </div>
    </div>`;

    // Opening hours table
    html += `<div class="card" style="margin-bottom:32px">
      <h3 style="font-weight:700;margin-bottom:16px">📅 Horaires d'ouverture</h3>
      <table class="hours-table">
        ${days.map(d => `<tr><td>${d}</td><td>${config.openingTime} - ${config.closingTime}</td></tr>`).join('')}
      </table>
    </div>`;

    // Social media
    const socials = [
      { icon: '📷', label: 'Instagram', url: config.instagram },
      { icon: '📘', label: 'Facebook', url: config.facebook },
      { icon: '🎵', label: 'TikTok', url: config.tiktok },
      { icon: '💬', label: 'WhatsApp', url: `https://wa.me/${config.whatsapp}` }
    ].filter(s => s.url && s.url.trim() !== '' && s.url !== '#');
    if (socials.length > 0) {
      html += `<div class="card" style="margin-bottom:32px">
        <h3 style="font-weight:700;margin-bottom:16px">📱 Suivez-nous</h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${socials.map(s => `<a href="${s.url}" target="_blank" rel="noopener" class="btn btn-outline" style="border-radius:var(--radius)">${s.icon} ${s.label}</a>`).join('')}
        </div>
      </div>`;
    }

    // Map
    html += `<div class="card" style="margin-bottom:32px">
      <h3 style="font-weight:700;margin-bottom:16px">📍 Notre emplacement</h3>
      <div style="border-radius:var(--radius-sm);overflow:hidden;margin-bottom:12px">
        <iframe
          src="https://maps.google.com/maps?q=${encodeURIComponent(config.address)}&output=embed&z=15"
          width="100%" height="240" style="border:0;display:block" allowfullscreen="" loading="lazy"
          referrerpolicy="no-referrer-when-downgrade" title="Localisation du restaurant">
        </iframe>
      </div>
      <a href="https://maps.google.com/?q=${encodeURIComponent(config.address)}" target="_blank" class="btn btn-outline btn-sm">📍 Ouvrir dans Google Maps</a>
    </div>`;

    // WhatsApp CTA
    html += `<div class="cta-section" style="background:linear-gradient(135deg,#075e54,#128C7E,#25D366)">
      <h2>💬 Commandez via WhatsApp</h2>
      <p>Envoyez-nous votre commande directement par WhatsApp pour un service rapide</p>
      <a href="https://wa.me/${config.whatsapp}" target="_blank" class="btn btn-gold btn-lg">Commander via WhatsApp</a>
    </div>`;

    html += '</div>';
    container.innerHTML = html;
  }
};
