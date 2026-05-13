// ============================================================
// BODORO - Data Store (localStorage) - Replaces Prisma/SQLite
// ============================================================

const DB = {
  // --- Keys ---
  KEYS: {
    CATEGORIES: 'bodoro_categories',
    ITEMS: 'bodoro_items',
    ORDERS: 'bodoro_orders',
    PROMOTIONS: 'bodoro_promotions',
    TESTIMONIALS: 'bodoro_testimonials',
    CONFIG: 'bodoro_config',
    CART: 'bodoro_cart',
    FAVORITES: 'bodoro_favorites',
    DARK_MODE: 'bodoro_dark_mode',
    ADMIN_TOKEN: 'bodoro_admin_token',
    IS_ADMIN: 'bodoro_admin',
    VALID_TOKENS: 'bodoro_valid_tokens',
    MODE: 'bodoro_mode'
  },

  // --- Helpers ---
  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  },
  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  _genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },
  _now() {
    return new Date().toISOString();
  },

  // ===================== CONFIG =====================
  getConfig() {
    const defaults = {
      restaurantName: "Bodoro - La Côte d'Émeraude",
      address: "Yamoussoukro, Côte d'Ivoire",
      phone1: '+225 07 00 00 00 00',
      phone2: '+225 05 00 00 00 00',
      whatsapp: '2250700000000',
      openingTime: '08:00',
      closingTime: '22:00',
      openDays: 'Lundi - Samedi',
      bannerText: '',
      bannerActive: false,
      adminPassword: 'bodoro2024',
      deliveryFee: 0,
      currency: 'FCFA',
      instagram: '',
      facebook: '',
      tiktok: '',
      aboutText: "Restaurant ivoirien authentique proposant les meilleures saveurs d'Afrique de l'Ouest."
    };
    const saved = this._get(this.KEYS.CONFIG);
    return saved ? Object.assign({}, defaults, saved) : defaults;
  },
  updateConfig(updates) {
    const config = { ...this.getConfig(), ...updates };
    this._set(this.KEYS.CONFIG, config);
    return config;
  },

  // ===================== CATEGORIES =====================
  getCategories() {
    return this._get(this.KEYS.CATEGORIES) || [];
  },
  getActiveCategories() {
    return this.getCategories().filter(c => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  getCategory(id) {
    return this.getCategories().find(c => c.id === id);
  },
  createCategory(data) {
    const cats = this.getCategories();
    const cat = {
      id: this._genId(),
      name: data.name || '',
      emoji: data.emoji || '🍽️',
      sortOrder: data.sortOrder ?? cats.length,
      active: data.active ?? true,
      createdAt: this._now(),
      updatedAt: this._now()
    };
    cats.push(cat);
    this._set(this.KEYS.CATEGORIES, cats);
    return cat;
  },
  updateCategory(id, data) {
    const cats = this.getCategories().map(c =>
      c.id === id ? { ...c, ...data, updatedAt: this._now() } : c
    );
    this._set(this.KEYS.CATEGORIES, cats);
    return cats.find(c => c.id === id);
  },
  deleteCategory(id) {
    // Also delete items in this category
    this.deleteItemsByCategory(id);
    const cats = this.getCategories().filter(c => c.id !== id);
    this._set(this.KEYS.CATEGORIES, cats);
  },
  reorderCategories(id, direction) {
    const cats = this.getCategories().sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = cats.findIndex(c => c.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= cats.length) return;
    [cats[idx].sortOrder, cats[swapIdx].sortOrder] = [cats[swapIdx].sortOrder, cats[idx].sortOrder];
    this._set(this.KEYS.CATEGORIES, cats);
  },

  // ===================== MENU ITEMS =====================
  getItems() {
    return this._get(this.KEYS.ITEMS) || [];
  },
  getAvailableItems() {
    return this.getItems().filter(i => i.available);
  },
  getPublicMenu() {
    const activeCats = this.getActiveCategories();
    return activeCats.map(cat => ({
      ...cat,
      items: this.getItems()
        .filter(i => i.categoryId === cat.id && i.available)
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  },
  getItem(id) {
    return this.getItems().find(i => i.id === id);
  },
  getItemsByCategory(catId) {
    return this.getItems().filter(i => i.categoryId === catId);
  },
  getMenuDuJour() {
    return this.getItems().filter(i => i.available && i.isMenuJour);
  },
  getPromoItems() {
    // Exclure les items déjà dans le menu du jour pour éviter les doublons sur la page d'accueil
    return this.getItems().filter(i => i.available && i.promoPrice > 0 && !i.isMenuJour);
  },
  createItem(data) {
    const items = this.getItems();
    const item = {
      id: this._genId(),
      name: data.name || '',
      description: data.description || '',
      price: data.price || 0,
      emoji: data.emoji || '🍛',
      categoryId: data.categoryId || '',
      image: data.image || '',
      available: data.available ?? true,
      options: data.options || '[]',
      isMenuJour: data.isMenuJour ?? false,
      promoPrice: data.promoPrice || 0,
      createdAt: this._now(),
      updatedAt: this._now()
    };
    items.push(item);
    this._set(this.KEYS.ITEMS, items);
    return item;
  },
  updateItem(id, data) {
    const items = this.getItems().map(i =>
      i.id === id ? { ...i, ...data, updatedAt: this._now() } : i
    );
    this._set(this.KEYS.ITEMS, items);
    return items.find(i => i.id === id);
  },
  deleteItem(id) {
    const items = this.getItems().filter(i => i.id !== id);
    this._set(this.KEYS.ITEMS, items);
  },
  deleteItemsByCategory(catId) {
    const items = this.getItems().filter(i => i.categoryId !== catId);
    this._set(this.KEYS.ITEMS, items);
  },

  // ===================== ORDERS =====================
  getOrders() {
    return this._get(this.KEYS.ORDERS) || [];
  },
  getOrder(id) {
    return this.getOrders().find(o => o.id === id);
  },
  getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    return this.getOrders().filter(o => o.createdAt.startsWith(today));
  },
  createOrder(data) {
    const orders = this.getOrders();
    const order = {
      id: this._genId(),
      clientName: data.clientName || '',
      phone: data.phone || '',
      address: data.address || '',
      items: data.items || '[]',
      total: data.total || 0,
      deliveryType: data.deliveryType || 'livraison',
      status: 'en_attente',
      notes: data.notes || '',
      createdAt: this._now(),
      updatedAt: this._now()
    };
    orders.unshift(order);
    this._set(this.KEYS.ORDERS, orders);
    return order;
  },
  updateOrder(id, data) {
    const orders = this.getOrders().map(o =>
      o.id === id ? { ...o, ...data, updatedAt: this._now() } : o
    );
    this._set(this.KEYS.ORDERS, orders);
    return orders.find(o => o.id === id);
  },

  // ===================== PROMOTIONS =====================
  getPromotions() {
    return this._get(this.KEYS.PROMOTIONS) || [];
  },
  getActivePromotions() {
    return this.getPromotions().filter(p => p.active);
  },
  createPromotion(data) {
    const promos = this.getPromotions();
    const promo = {
      id: this._genId(),
      title: data.title || '',
      description: data.description || '',
      discount: data.discount || '',
      emoji: data.emoji || '🎉',
      active: data.active ?? true,
      createdAt: this._now(),
      updatedAt: this._now()
    };
    promos.push(promo);
    this._set(this.KEYS.PROMOTIONS, promos);
    return promo;
  },
  updatePromotion(id, data) {
    const promos = this.getPromotions().map(p =>
      p.id === id ? { ...p, ...data, updatedAt: this._now() } : p
    );
    this._set(this.KEYS.PROMOTIONS, promos);
    return promos.find(p => p.id === id);
  },
  deletePromotion(id) {
    const promos = this.getPromotions().filter(p => p.id !== id);
    this._set(this.KEYS.PROMOTIONS, promos);
  },

  // ===================== TESTIMONIALS =====================
  getTestimonials() {
    return (this._get(this.KEYS.TESTIMONIALS) || []).slice(0, 20);
  },
  createTestimonial(data) {
    const testimonials = this.getTestimonials();
    const t = {
      id: this._genId(),
      author: data.author || '',
      text: data.text || '',
      rating: data.rating || 5,
      createdAt: this._now(),
      updatedAt: this._now()
    };
    testimonials.unshift(t);
    if (testimonials.length > 20) testimonials.length = 20;
    this._set(this.KEYS.TESTIMONIALS, testimonials);
    return t;
  },
  updateTestimonial(id, data) {
    const all = this._get(this.KEYS.TESTIMONIALS) || [];
    const updated = all.map(t =>
      t.id === id ? { ...t, ...data, updatedAt: this._now() } : t
    );
    this._set(this.KEYS.TESTIMONIALS, updated);
    return updated.find(t => t.id === id);
  },
  deleteTestimonial(id) {
    const all = (this._get(this.KEYS.TESTIMONIALS) || []).filter(t => t.id !== id);
    this._set(this.KEYS.TESTIMONIALS, all);
  },

  // ===================== CART =====================
  getCart() {
    return this._get(this.KEYS.CART) || [];
  },
  addToCart(item, quantity = 1) {
    const cart = this.getCart();
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        emoji: item.emoji,
        price: item.price,
        promoPrice: item.promoPrice || 0,
        quantity
      });
    }
    this._set(this.KEYS.CART, cart);
    return cart;
  },
  removeFromCart(itemId) {
    const cart = this.getCart().filter(c => c.id !== itemId);
    this._set(this.KEYS.CART, cart);
    return cart;
  },
  updateCartQuantity(itemId, quantity) {
    const cart = this.getCart();
    const item = cart.find(c => c.id === itemId);
    if (item) item.quantity = Math.max(0, quantity);
    const filtered = cart.filter(c => c.quantity > 0);
    this._set(this.KEYS.CART, filtered);
    return filtered;
  },
  clearCart() {
    this._set(this.KEYS.CART, []);
  },
  getCartTotal() {
    return this.getCart().reduce((sum, i) => {
      const price = i.promoPrice > 0 ? i.promoPrice : i.price;
      return sum + price * i.quantity;
    }, 0);
  },
  getCartOriginalTotal() {
    return this.getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },
  getCartCount() {
    return this.getCart().reduce((sum, i) => sum + i.quantity, 0);
  },
  getCartSavings() {
    return this.getCartOriginalTotal() - this.getCartTotal();
  },

  // ===================== FAVORITES =====================
  getFavorites() {
    return this._get(this.KEYS.FAVORITES) || [];
  },
  toggleFavorite(itemId) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(itemId);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(itemId);
    this._set(this.KEYS.FAVORITES, favs);
    return favs;
  },
  isFavorite(itemId) {
    return this.getFavorites().includes(itemId);
  },

  // ===================== DARK MODE =====================
  isDarkMode() {
    const stored = this._get(this.KEYS.DARK_MODE);
    if (stored !== null) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  toggleDarkMode() {
    const next = !this.isDarkMode();
    this._set(this.KEYS.DARK_MODE, next);
    document.documentElement.classList.toggle('dark', next);
    return next;
  },
  initDarkMode() {
    document.documentElement.classList.toggle('dark', this.isDarkMode());
  },

  // ===================== ADMIN AUTH =====================
  adminLogin(password) {
    const config = this.getConfig();
    // Sécurité: utiliser le mot de passe par défaut si le champ est vide dans la config sauvegardée
    const storedPassword = (config.adminPassword && config.adminPassword.trim())
      ? config.adminPassword.trim()
      : 'bodoro2024';
    const inputPassword = (password || '').trim();
    if (inputPassword && inputPassword === storedPassword) {
      const token = btoa(inputPassword + ':' + Date.now());
      const validTokens = this._get(this.KEYS.VALID_TOKENS) || [];
      validTokens.push({ token, expires: Date.now() + 86400000 }); // 24h
      // Nettoyer les tokens expirés
      const cleaned = validTokens.filter(t => t.expires > Date.now());
      this._set(this.KEYS.VALID_TOKENS, cleaned);
      this._set(this.KEYS.ADMIN_TOKEN, token);
      this._set(this.KEYS.IS_ADMIN, true);
      return { success: true, token };
    }
    return { success: false, error: 'Mot de passe incorrect' };
  },
  adminLogout() {
    const token = this._get(this.KEYS.ADMIN_TOKEN);
    if (token) {
      const validTokens = (this._get(this.KEYS.VALID_TOKENS) || []).filter(t => t.token !== token);
      this._set(this.KEYS.VALID_TOKENS, validTokens);
    }
    this._set(this.KEYS.ADMIN_TOKEN, null);
    this._set(this.KEYS.IS_ADMIN, false);
  },
  isAdmin() {
    return this._get(this.KEYS.IS_ADMIN) === true;
  },
  validateAdminToken() {
    const token = this._get(this.KEYS.ADMIN_TOKEN);
    if (!token) return false;
    const validTokens = this._get(this.KEYS.VALID_TOKENS) || [];
    const found = validTokens.find(t => t.token === token);
    if (found && found.expires > Date.now()) return true;
    this._set(this.KEYS.IS_ADMIN, false);
    this._set(this.KEYS.ADMIN_TOKEN, null);
    return false;
  },

  // ===================== STATS =====================
  getStats(days = 30) {
    const orders = this.getOrders();
    const since = new Date(Date.now() - days * 86400000);
    const filtered = orders.filter(o => new Date(o.createdAt) >= since);
    const allItems = this.getItems();

    const revenue = filtered
      .filter(o => o.status !== 'annulee')
      .reduce((s, o) => s + (o.total || 0), 0);

    const confirmed = filtered.filter(o => o.status === 'livree').length;
    const cancelled = filtered.filter(o => o.status === 'annulee').length;
    const pending = filtered.filter(o => o.status === 'en_attente').length;
    const delivering = filtered.filter(o => ['confirmee', 'en_preparation'].includes(o.status)).length;
    const avgBasket = confirmed > 0
      ? Math.round(filtered.filter(o => o.status === 'livree').reduce((s, o) => s + (o.total || 0), 0) / confirmed)
      : 0;

    return {
      totalArticles: allItems.length,
      totalOrders: filtered.length,
      pendingOrders: pending,
      revenue,
      deliveryRate: filtered.length > 0
        ? Math.round((filtered.filter(o => o.deliveryType === 'livraison').length / filtered.length) * 100)
        : 0,
      avgBasket,
      confirmedOrders: confirmed,
      cancelledOrders: cancelled,
      ordersByDate: this._groupByDate(filtered),
      revenueByDate: this._revenueByDate(filtered),
      statusDistribution: {
        en_attente: filtered.filter(o => o.status === 'en_attente').length,
        confirmee: filtered.filter(o => o.status === 'confirmee').length,
        en_preparation: filtered.filter(o => o.status === 'en_preparation').length,
        livree: filtered.filter(o => o.status === 'livree').length,
        annulee: filtered.filter(o => o.status === 'annulee').length
      }
    };
  },

  _groupByDate(orders) {
    const map = {};
    orders.forEach(o => {
      const d = o.createdAt.split('T')[0];
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  },

  _revenueByDate(orders) {
    const map = {};
    orders.filter(o => o.status !== 'annulee').forEach(o => {
      const d = o.createdAt.split('T')[0];
      map[d] = (map[d] || 0) + (o.total || 0);
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  },

  // ===================== CSV IMPORT/EXPORT =====================
  exportCSV() {
    const items = this.getItems();
    const cats = this.getCategories();
    const headers = ['name', 'description', 'price', 'emoji', 'category', 'available', 'isMenuJour', 'promoPrice'];
    const rows = items.map(i => {
      const cat = cats.find(c => c.id === i.categoryId);
      return [
        i.name, i.description, i.price, i.emoji,
        cat ? cat.name : '', i.available ? 'oui' : 'non',
        i.isMenuJour ? 'oui' : 'non', i.promoPrice || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  },

  importCSV(csvText) {
    // Parseur CSV robuste: gere les champs vides, les virgules dans les guillemets
    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        if (ch === '"') {
          if (inQuotes && line[ci + 1] === '"') { current += '"'; ci++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          result.push(current.trim()); current = '';
        } else { current += ch; }
      }
      result.push(current.trim());
      return result;
    }

    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return { created: 0, updated: 0, errors: 0 };

    const headerMap = {};
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim().toLowerCase());
    ['name', 'description', 'price', 'emoji', 'category', 'available', 'ismenujour', 'promoprice'].forEach(key => {
      const idx = headers.indexOf(key);
      if (idx >= 0) headerMap[key] = idx;
    });

    let created = 0, updated = 0, errors = 0;
    const items = this.getItems();
    const cats = this.getCategories();

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      try {
        const clean = parseCSVLine(lines[i]);
        const name = (clean[headerMap.name ?? 0] || '').trim();
        if (!name) { errors++; continue; }

        const catName = (clean[headerMap.category ?? 4] || '').trim();
        const cat = cats.find(c => c.name.toLowerCase() === catName.toLowerCase());
        const existing = items.find(it => it.name.toLowerCase() === name.toLowerCase());
        const data = {
          name,
          description: (clean[headerMap.description ?? 1] || '').trim(),
          price: parseInt(clean[headerMap.price ?? 2]) || 0,
          emoji: ((clean[headerMap.emoji ?? 3] || '').trim()) || '🍛',
          categoryId: cat ? cat.id : (cats[0]?.id || ''),
          available: ((clean[headerMap.available ?? 5] || 'oui').toLowerCase() !== 'non'),
          isMenuJour: ((clean[headerMap.ismenujour ?? 6] || 'non').toLowerCase() === 'oui'),
          promoPrice: parseInt(clean[headerMap.promoprice ?? 7]) || 0
        };

        if (existing) {
          Object.assign(existing, data, { updatedAt: this._now() });
          updated++;
        } else {
          items.push({ ...data, id: this._genId(), options: '[]', image: '', createdAt: this._now(), updatedAt: this._now() });
          created++;
        }
      } catch { errors++; }
    }

    this._set(this.KEYS.ITEMS, items);
    return { created, updated, errors };
  },
  // ===================== MODE =====================
  getMode() {
    return this._get(this.KEYS.MODE) || 'client';
  },
  setMode(mode) {
    this._set(this.KEYS.MODE, mode);
  },

  // ===================== RESET / SEED =====================
  resetAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },
  isSeeded() {
    return this.getCategories().length > 0;
  }
};

// Format price in FCFA
function formatPrice(price) {
  return Number(price).toLocaleString('fr-FR') + ' F';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
