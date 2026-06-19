// ============================================================
// BODORO - Data Store (Firestore + localStorage)
// Firestore  → config, catégories, articles, commandes, promos, témoignages
// localStorage → panier, favoris, dark mode, auth admin
// ============================================================

const DB = {

  // ===================== CACHE LOCAL =====================
  _cache: {
    config: null, categories: null, items: null,
    orders: null, promotions: null, testimonials: null
  },

  // ===================== HELPERS localStorage =====================
  _lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  },
  _lsSet(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
  _genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); },
  _now()   { return new Date().toISOString(); },

  // ===================== INIT =====================
  async loadAll() {
    try {
      await Promise.all([
        DB._loadConfig(), DB._loadCategories(), DB._loadItems(),
        DB._loadOrders(), DB._loadPromotions(), DB._loadTestimonials()
      ]);
      return true;
    } catch(e) { console.warn('Firestore indisponible:', e.message); return false; }
  },

  async _loadConfig() {
    const doc = await FS.config().get();
    DB._cache.config = doc.exists ? doc.data() : null;
  },
  async _loadCategories() {
    const snap = await FS.categories().orderBy('sortOrder').get();
    DB._cache.categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async _loadItems() {
    const snap = await FS.items().get();
    DB._cache.items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async _loadOrders() {
    const snap = await FS.orders().orderBy('createdAt', 'desc').limit(200).get();
    DB._cache.orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async _loadPromotions() {
    const snap = await FS.promotions().get();
    DB._cache.promotions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async _loadTestimonials() {
    const snap = await FS.testimonials().orderBy('createdAt', 'desc').limit(20).get();
    DB._cache.testimonials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Écoute les commandes en temps réel
  listenOrders(callback) {
    return FS.orders().orderBy('createdAt', 'desc').limit(200)
      .onSnapshot(snap => {
        DB._cache.orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (callback) callback(DB._cache.orders);
      });
  },

  // ===================== CONFIG =====================
  getConfig() {
    const defaults = {
      restaurantName: "Bodoro - La Côte d'Émeraude",
      address: "Yamoussoukro, Côte d'Ivoire",
      phone1: '+225 07 00 00 00 00', phone2: '+225 05 00 00 00 00',
      whatsapp: '2250700000000', openingTime: '08:00', closingTime: '22:00',
      openDays: 'Lundi - Samedi', bannerText: '', bannerActive: false,
      adminPassword: 'bodoro2024', deliveryFee: 0, currency: 'FCFA',
      instagram: '', facebook: '', tiktok: '',
      aboutText: "Restaurant ivoirien authentique proposant les meilleures saveurs d'Afrique de l'Ouest.",
      // Localisation GPS - La Côte d'Émeraude Chez Bodoro
      placeName: "LA CÔTE D'EMERAUDE CHEZ BODORO",
      latitude: 6.73714,
      longitude: -5.2853533,
      mapZoom: 15,
      // URL publique du site (pour générer les QR codes)
      // Si vide, on utilise automatiquement window.location.origin
      siteUrl: ""
    };
    return DB._cache.config ? Object.assign({}, defaults, DB._cache.config) : defaults;
  },
  // Renvoie l'URL publique du site (configurée ou détectée automatiquement)
  getSiteUrl() {
    const cfg = DB.getConfig();
    const url = (cfg.siteUrl || '').trim();
    if (url) return url.replace(/\/+$/, '');
    // Fallback : URL courante (sans paramètres ni hash)
    try { return window.location.origin + window.location.pathname.replace(/[^/]*$/, ''); }
    catch { return 'https://bodoro.example.com/'; }
  },
  async updateConfig(updates) {
    const config = Object.assign({}, DB.getConfig(), updates, { updatedAt: DB._now() });
    await FS.config().set(config, { merge: true });
    DB._cache.config = config;
    return config;
  },

  // ===================== CATÉGORIES =====================
  getCategories()       { return DB._cache.categories || []; },
  getActiveCategories() { return DB.getCategories().filter(c => c.active).sort((a,b) => a.sortOrder - b.sortOrder); },
  getCategory(id)       { return DB.getCategories().find(c => c.id === id); },
  async createCategory(data) {
    const cat = {
      name: data.name||'', emoji: data.emoji||'📂', active: data.active!==false,
      sortOrder: data.sortOrder ?? (DB.getCategories().length+1),
      createdAt: DB._now(), updatedAt: DB._now()
    };
    const ref = await FS.categories().add(cat);
    cat.id = ref.id;
    DB._cache.categories = [...DB.getCategories(), cat];
    return cat;
  },
  async updateCategory(id, data) {
    const updated = { ...data, updatedAt: DB._now() };
    await FS.categories().doc(id).update(updated);
    DB._cache.categories = DB.getCategories().map(c => c.id===id ? {...c,...updated} : c);
    return DB.getCategory(id);
  },
  async deleteCategory(id) {
    await FS.categories().doc(id).delete();
    DB._cache.categories = DB.getCategories().filter(c => c.id!==id);
    const batch = firestore.batch();
    DB.getItems().filter(i => i.categoryId===id).forEach(i => batch.delete(FS.items().doc(i.id)));
    await batch.commit();
    DB._cache.items = DB.getItems().filter(i => i.categoryId!==id);
  },
  async reorderCategories() {
    const cats = DB.getCategories().sort((a,b) => a.sortOrder - b.sortOrder);
    const batch = firestore.batch();
    cats.forEach((c,idx) => { batch.update(FS.categories().doc(c.id),{sortOrder:idx+1}); c.sortOrder=idx+1; });
    await batch.commit();
    DB._cache.categories = cats;
  },

  // ===================== ARTICLES =====================
  getItems()            { return DB._cache.items || []; },
  getAvailableItems()   { return DB.getItems().filter(i => i.available); },
  getItem(id)           { return DB.getItems().find(i => i.id===id); },
  getSearchIndex()      { return { items: DB.getItems() }; },
  getMenuDuJour()       { return DB.getItems().filter(i => i.available && i.isMenuJour); },
  getPromoItems()       { return DB.getItems().filter(i => i.available && i.promoPrice>0 && !i.isMenuJour); },
  getItemsByCategory(catId) { return DB.getItems().filter(i => i.categoryId===catId); },
  async createItem(data) {
    const item = {
      name: data.name||'', description: data.description||'', price: data.price||0,
      promoPrice: data.promoPrice||0, emoji: data.emoji||'🍛', image: data.image||'',
      categoryId: data.categoryId||'', available: data.available!==false,
      isMenuJour: data.isMenuJour||false, options: data.options||'[]',
      createdAt: DB._now(), updatedAt: DB._now()
    };
    const ref = await FS.items().add(item);
    item.id = ref.id;
    DB._cache.items = [...DB.getItems(), item];
    return item;
  },
  async updateItem(id, data) {
    const updated = { ...data, updatedAt: DB._now() };
    await FS.items().doc(id).update(updated);
    DB._cache.items = DB.getItems().map(i => i.id===id ? {...i,...updated} : i);
    return DB.getItem(id);
  },
  async deleteItem(id) {
    await FS.items().doc(id).delete();
    DB._cache.items = DB.getItems().filter(i => i.id!==id);
  },

  // ===================== COMMANDES =====================
  getOrders()     { return DB._cache.orders || []; },
  getOrder(id)    { return DB.getOrders().find(o => o.id===id); },
  getTodayOrders(){ const t = DB._now().split('T')[0]; return DB.getOrders().filter(o => (o.createdAt||'').startsWith(t)); },
  async createOrder(data) {
    const order = {
      customerName: data.customerName||'', phone: data.phone||'', address: data.address||'',
      deliveryType: data.deliveryType||'livraison', items: data.items||[],
      total: data.total||0, status: 'en_attente', notes: data.notes||'',
      createdAt: DB._now(), updatedAt: DB._now()
    };
    const ref = await FS.orders().add(order);
    order.id = ref.id;
    DB._cache.orders = [order, ...DB.getOrders()];
    return order;
  },
  async updateOrder(id, data) {
    const updated = { ...data, updatedAt: DB._now() };
    await FS.orders().doc(id).update(updated);
    DB._cache.orders = DB.getOrders().map(o => o.id===id ? {...o,...updated} : o);
    return DB.getOrder(id);
  },

  // ===================== PROMOTIONS =====================
  getPromotions()       { return DB._cache.promotions || []; },
  getActivePromotions() { return DB.getPromotions().filter(p => p.active); },
  async createPromotion(data) {
    const promo = {
      title: data.title||'', description: data.description||'', discount: data.discount||'',
      emoji: data.emoji||'🎉', active: data.active!==false, createdAt: DB._now(), updatedAt: DB._now()
    };
    const ref = await FS.promotions().add(promo);
    promo.id = ref.id;
    DB._cache.promotions = [...DB.getPromotions(), promo];
    return promo;
  },
  async updatePromotion(id, data) {
    const updated = { ...data, updatedAt: DB._now() };
    await FS.promotions().doc(id).update(updated);
    DB._cache.promotions = DB.getPromotions().map(p => p.id===id ? {...p,...updated} : p);
  },
  async deletePromotion(id) {
    await FS.promotions().doc(id).delete();
    DB._cache.promotions = DB.getPromotions().filter(p => p.id!==id);
  },

  // ===================== TÉMOIGNAGES =====================
  getTestimonials() { return (DB._cache.testimonials || []).slice(0,20); },
  async createTestimonial(data) {
    const t = {
      author: data.author||'', text: data.text||'', rating: data.rating||5,
      approved: data.approved!==false, createdAt: DB._now(), updatedAt: DB._now()
    };
    const ref = await FS.testimonials().add(t);
    t.id = ref.id;
    DB._cache.testimonials = [t, ...(DB._cache.testimonials||[])];
    return t;
  },
  async updateTestimonial(id, data) {
    const updated = { ...data, updatedAt: DB._now() };
    await FS.testimonials().doc(id).update(updated);
    DB._cache.testimonials = (DB._cache.testimonials||[]).map(t => t.id===id ? {...t,...updated} : t);
  },
  async deleteTestimonial(id) {
    await FS.testimonials().doc(id).delete();
    DB._cache.testimonials = (DB._cache.testimonials||[]).filter(t => t.id!==id);
  },

  // ===================== PANIER (localStorage) =====================
  getCart()  { return DB._lsGet('bodoro_cart') || []; },
  addToCart(item, quantity=1) {
    const cart = DB.getCart();
    const ex   = cart.find(c => c.id===item.id);
    if (ex) { ex.quantity += quantity; }
    else cart.push({ id:item.id, name:item.name, emoji:item.emoji, price:item.price, promoPrice:item.promoPrice||0, quantity });
    DB._lsSet('bodoro_cart', cart); return cart;
  },
  removeFromCart(itemId)         { const c=DB.getCart().filter(c=>c.id!==itemId); DB._lsSet('bodoro_cart',c); return c; },
  updateCartQuantity(itemId, qty){ const c=DB.getCart(); const it=c.find(i=>i.id===itemId); if(it) it.quantity=Math.max(0,qty); const f=c.filter(i=>i.quantity>0); DB._lsSet('bodoro_cart',f); return f; },
  clearCart()          { DB._lsSet('bodoro_cart',[]); },
  getCartTotal()       { return DB.getCart().reduce((s,i)=>s+(i.promoPrice>0?i.promoPrice:i.price)*i.quantity,0); },
  getCartOriginalTotal(){ return DB.getCart().reduce((s,i)=>s+i.price*i.quantity,0); },
  getCartCount()       { return DB.getCart().reduce((s,i)=>s+i.quantity,0); },
  getCartSavings()     { return DB.getCartOriginalTotal()-DB.getCartTotal(); },

  // ===================== FAVORIS (localStorage) =====================
  getFavorites()    { return DB._lsGet('bodoro_fav')||[]; },
  toggleFavorite(id){ const f=DB.getFavorites(); const i=f.indexOf(id); if(i>=0)f.splice(i,1); else f.push(id); DB._lsSet('bodoro_fav',f); return f; },
  isFavorite(id)    { return DB.getFavorites().includes(id); },

  // ===================== DARK MODE (localStorage) =====================
  isDarkMode()   { const s=DB._lsGet('bodoro_dark'); return s!==null?s:window.matchMedia('(prefers-color-scheme: dark)').matches; },
  toggleDarkMode(){ const n=!DB.isDarkMode(); DB._lsSet('bodoro_dark',n); document.documentElement.classList.toggle('dark',n); return n; },
  initDarkMode() { document.documentElement.classList.toggle('dark',DB.isDarkMode()); },

  // ===================== ADMIN AUTH (localStorage) =====================
  adminLogin(password) {
    const cfg    = DB.getConfig();
    const stored = (cfg.adminPassword||'bodoro2024').trim();
    const input  = (password||'').trim();
    if (input && input===stored) {
      const token  = btoa(input+':'+Date.now());
      const tokens = (DB._lsGet('bodoro_tokens')||[]).filter(t=>t.expires>Date.now());
      tokens.push({ token, expires: Date.now()+86400000 });
      DB._lsSet('bodoro_tokens',tokens);
      DB._lsSet('bodoro_token',token);
      DB._lsSet('bodoro_admin',true);
      return { success:true, token };
    }
    return { success:false, error:'Mot de passe incorrect' };
  },
  adminLogout() {
    const token  = DB._lsGet('bodoro_token');
    const tokens = (DB._lsGet('bodoro_tokens')||[]).filter(t=>t.token!==token);
    DB._lsSet('bodoro_tokens',tokens); DB._lsSet('bodoro_token',null); DB._lsSet('bodoro_admin',false);
  },
  isAdmin()          { return DB._lsGet('bodoro_admin')===true; },
  validateAdminToken(){ const t=DB._lsGet('bodoro_token'); if(!t) return false; const f=(DB._lsGet('bodoro_tokens')||[]).find(x=>x.token===t); if(f&&f.expires>Date.now()) return true; DB._lsSet('bodoro_admin',false); DB._lsSet('bodoro_token',null); return false; },

  // ===================== MODE =====================
  getMode()     { return DB._lsGet('bodoro_mode')||'client'; },
  setMode(mode) { DB._lsSet('bodoro_mode',mode); },

  // ===================== STATS =====================
  getStats(days=30) {
    const orders   = DB.getOrders();
    const since    = new Date(Date.now()-days*86400000);
    const filtered = orders.filter(o=>new Date(o.createdAt)>=since);
    const revenue  = filtered.filter(o=>o.status!=='annulee').reduce((s,o)=>s+(o.total||0),0);
    const confirmed= filtered.filter(o=>o.status==='livree').length;
    const cancelled= filtered.filter(o=>o.status==='annulee').length;
    const pending  = filtered.filter(o=>o.status==='en_attente').length;
    const avgBasket= confirmed>0?Math.round(filtered.filter(o=>o.status==='livree').reduce((s,o)=>s+(o.total||0),0)/confirmed):0;
    return {
      totalArticles: DB.getItems().length, totalOrders: filtered.length, pendingOrders: pending,
      revenue, avgBasket, confirmedOrders: confirmed, cancelledOrders: cancelled,
      deliveryRate: filtered.length>0?Math.round(filtered.filter(o=>o.deliveryType==='livraison').length/filtered.length*100):0,
      ordersByDate: DB._groupByDate(filtered), revenueByDate: DB._revenueByDate(filtered),
      statusDistribution: {
        en_attente: pending, confirmee: filtered.filter(o=>o.status==='confirmee').length,
        en_preparation: filtered.filter(o=>o.status==='en_preparation').length,
        livree: confirmed, annulee: cancelled
      }
    };
  },
  _groupByDate(orders){ const m={}; orders.forEach(o=>{const d=(o.createdAt||'').split('T')[0]; m[d]=(m[d]||0)+1;}); return Object.entries(m).map(([date,count])=>({date,count})); },
  _revenueByDate(orders){ const m={}; orders.filter(o=>o.status!=='annulee').forEach(o=>{const d=(o.createdAt||'').split('T')[0]; m[d]=(m[d]||0)+(o.total||0);}); return Object.entries(m).map(([date,revenue])=>({date,revenue})); },

  // ===================== CSV =====================
  exportCSV() {
    const cats=DB.getCategories();
    const headers=['name','description','price','emoji','category','available','isMenuJour','promoPrice'];
    const rows=DB.getItems().map(i=>{
      const cat=cats.find(c=>c.id===i.categoryId);
      return [i.name,i.description,i.price,i.emoji,cat?cat.name:'',i.available?'oui':'non',i.isMenuJour?'oui':'non',i.promoPrice||'']
        .map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',');
    });
    return [headers.join(','),...rows].join('\n');
  },
  async importCSV(csvText) {
    function parseCSVLine(line){ const r=[]; let cur='',inQ=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ if(inQ&&line[i+1]==='"'){cur+='"';i++;} else inQ=!inQ; } else if(c===','&&!inQ){ r.push(cur.trim());cur=''; } else cur+=c; } r.push(cur.trim()); return r; }
    const lines=csvText.trim().split(/\r?\n/); if(lines.length<2) return {created:0,updated:0,errors:0};
    const hm={}; parseCSVLine(lines[0]).map(h=>h.replace(/"/g,'').trim().toLowerCase()).forEach((h,i)=>{ hm[h]=i; });
    let created=0,updated=0,errors=0; const cats=DB.getCategories();
    for(let i=1;i<lines.length;i++){ if(!lines[i].trim()) continue; try{
      const c=parseCSVLine(lines[i]); const name=(c[hm.name??0]||'').trim(); if(!name){errors++;continue;}
      const cat=cats.find(x=>x.name.toLowerCase()===(c[hm.category??4]||'').trim().toLowerCase());
      const data={ name, description:(c[hm.description??1]||'').trim(), price:parseInt(c[hm.price??2])||0,
        emoji:((c[hm.emoji??3]||'').trim())||'🍛', categoryId:cat?cat.id:(cats[0]?.id||''),
        available:((c[hm.available??5]||'oui').toLowerCase()!=='non'),
        isMenuJour:((c[hm.ismenujour??6]||'non').toLowerCase()==='oui'),
        promoPrice:parseInt(c[hm.promoprice??7])||0 };
      const ex=DB.getItems().find(it=>it.name.toLowerCase()===name.toLowerCase());
      if(ex){ await DB.updateItem(ex.id,data); updated++; } else { await DB.createItem(data); created++; }
    } catch { errors++; }}
    return {created,updated,errors};
  },

  // ===================== RESET =====================
  isSeeded() { return DB.getCategories().length>0; },
  resetAll() { ['bodoro_cart','bodoro_fav','bodoro_dark','bodoro_mode','bodoro_admin','bodoro_token','bodoro_tokens'].forEach(k=>localStorage.removeItem(k)); }
};

function formatPrice(price){ return Number(price).toLocaleString('fr-FR')+' F'; }
function formatDate(iso){ if(!iso) return ''; const d=new Date(iso); return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
