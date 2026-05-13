// ============================================================
// BODORO - Seed Data (Default categories, items, testimonials)
// ============================================================

async function seedDatabase() {
  if (DB.isSeeded()) return;

  // --- Categories ---
  const categories = [
    { id: 'cat_africains', name: 'Africains', emoji: '🍛', sortOrder: 0, active: true },
    { id: 'cat_grillades', name: 'Grillades', emoji: '🔥', sortOrder: 1, active: true },
    { id: 'cat_snacks', name: 'Snacks & Rapides', emoji: '🌯', sortOrder: 2, active: true },
    { id: 'cat_boissons', name: 'Boissons', emoji: '🥤', sortOrder: 3, active: true },
    { id: 'cat_bieres', name: 'Bières', emoji: '🍺', sortOrder: 4, active: true },
    { id: 'cat_cocktails', name: 'Cocktails & Alcools', emoji: '🍸', sortOrder: 5, active: true },
    { id: 'cat_garnitures', name: 'Garnitures & Accompagnements', emoji: '🌿', sortOrder: 6, active: true },
    { id: 'cat_desserts', name: 'Desserts', emoji: '🍮', sortOrder: 7, active: true }
  ];

  // --- Menu Items ---
  const items = [
    // Africains
    { id: 'item_attiéké', name: 'Attiéké Poisson Grillé', description: 'Attiéké de manioc frais accompagné de poisson tilapia grillé, piment et légumes', price: 2500, emoji: '🐟', categoryId: 'cat_africains', available: true, isMenuJour: true, promoPrice: 2000 },
    { id: 'item_aloko', name: 'Alocco Poulet Braisé', description: 'Planches d\'alloco croustillant avec poulet braisé mariné aux épices', price: 3000, emoji: '🍗', categoryId: 'cat_africains', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_garba', name: 'Garba', description: 'Attiéké au thon frit, piment, oignon cru et tomate', price: 1500, emoji: '🥘', categoryId: 'cat_africains', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_foutou', name: 'Foutou Sauce Graine', description: 'Foutou banane avec sauce graine de palme riche et poisson fumé', price: 2500, emoji: '🍲', categoryId: 'cat_africains', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_kedjénou', name: 'Kedjénou de Poulet', description: 'Poulet mijoté lentement avec tomates, oignons et aubergines', price: 3500, emoji: '🍗', categoryId: 'cat_africains', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_placali', name: 'Placali Sauce Arachide', description: 'Placali de maïs avec sauce arachide onctueuse et viande', price: 2000, emoji: '🍛', categoryId: 'cat_africains', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_riz_gras', name: 'Riz Gras Complet', description: 'Riz cuit dans un bouillon riche avec légumes et viande', price: 2000, emoji: '🍚', categoryId: 'cat_africains', available: true, isMenuJour: true, promoPrice: 0 },
    { id: 'item_tchep', name: 'Tchep Djembienne', description: 'Riz cuit avec poisson, légumes et parfumé au thym', price: 2500, emoji: '🥘', categoryId: 'cat_africains', available: true, isMenuJour: false, promoPrice: 0 },

    // Grillades
    { id: 'item_poulet_braise', name: 'Poulet Braisé', description: 'Poulet entier braisé au charbon de bois, mariné 24h', price: 4000, emoji: '🍗', categoryId: 'cat_grillades', available: true, isMenuJour: false, promoPrice: 3500 },
    { id: 'item_côte_boeuf', name: 'Côte de Bœuf Grillée', description: 'Côte de bœuf grillée au feu de bois, assaisonnements maison', price: 5000, emoji: '🥩', categoryId: 'cat_grillades', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_brochette', name: 'Brochettes Mixtes', description: 'Brochettes de bœuf et poulet servies avec sauce piquante', price: 3000, emoji: '🍢', categoryId: 'cat_grillades', available: true, isMenuJour: true, promoPrice: 0 },
    { id: 'item_tilapia', name: 'Tilapia Braisé', description: 'Tilapia entier braisé au charbon avec alloco', price: 3500, emoji: '🐟', categoryId: 'cat_grillades', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_crevettes', name: 'Crevettes Grillées', description: 'Crevettes géantes grillées aux épices et beurre d\'arachide', price: 4500, emoji: '🦐', categoryId: 'cat_grillades', available: true, isMenuJour: false, promoPrice: 0 },

    // Snacks & Rapides
    { id: 'item_burger', name: 'Burger Bodoro', description: 'Burger gourmet avec steak haché, fromage, salade et sauce maison', price: 2000, emoji: '🍔', categoryId: 'cat_snacks', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_chawarma', name: 'Chawarma Poulet', description: 'Pain pita garni de poulet rôti, crudités et sauce tahini', price: 1500, emoji: '🌯', categoryId: 'cat_snacks', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_pizza', name: 'Pizza Maison', description: 'Pizza cuite au four, sauce tomate, mozzarella et garniture au choix', price: 2500, emoji: '🍕', categoryId: 'cat_snacks', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_omelette', name: 'Omelette Complète', description: 'Omelette avec fromage, jambon, légumes et frites', price: 1500, emoji: '🍳', categoryId: 'cat_snacks', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_sandwich', name: 'Sandwich Club', description: 'Sandwich triple étage avec poulet, œuf, fromage et salade', price: 1800, emoji: '🥪', categoryId: 'cat_snacks', available: true, isMenuJour: false, promoPrice: 0 },

    // Boissons
    { id: 'item_bissap', name: 'Bissap Frais', description: 'Jus d\'hibiscus glacé fait maison, sucré à la vanille', price: 500, emoji: '🧃', categoryId: 'cat_boissons', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_gingembre', name: 'Jus de Gingembre', description: 'Jus de gingembre frais avec citron et menthe', price: 500, emoji: '🥤', categoryId: 'cat_boissons', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_ananas', name: 'Jus d\'Ananas', description: 'Jus d\'ananas pressé, 100% naturel', price: 700, emoji: '🍍', categoryId: 'cat_boissons', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_coco', name: 'Eau de Coco', description: 'Eau de coco naturelle fraîche', price: 500, emoji: '🥥', categoryId: 'cat_boissons', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_citronnade', name: 'Citronnade Maison', description: 'Citronnade fraîche avec menthe et sucre de canne', price: 500, emoji: '🍋', categoryId: 'cat_boissons', available: true, isMenuJour: false, promoPrice: 0 },

    // Bières
    { id: 'item_flag', name: 'Flag', description: 'Bière locale 65cl', price: 1000, emoji: '🍺', categoryId: 'cat_bieres', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_castel', name: 'Castel', description: 'Bière Castel froid 65cl', price: 1000, emoji: '🍺', categoryId: 'cat_bieres', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_tuborg', name: 'Tuborg', description: 'Bière Tuborg premium 33cl', price: 800, emoji: '🍺', categoryId: 'cat_bieres', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_guinness', name: 'Guinness', description: 'Guinness Extra Foreign stout 33cl', price: 1200, emoji: '🍺', categoryId: 'cat_bieres', available: true, isMenuJour: false, promoPrice: 0 },

    // Cocktails & Alcools
    { id: 'item_cocktail_ananas', name: 'Cocktail Ananas-Vanille', description: 'Cocktail à base de rhum, jus d\'ananas et vanille', price: 1500, emoji: '🍹', categoryId: 'cat_cocktails', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_mojito', name: 'Mojito Maison', description: 'Rhum blanc, menthe fraîche, citron vert et sucre de canne', price: 1500, emoji: '🍸', categoryId: 'cat_cocktails', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_ti_punch', name: 'Ti Punch', description: 'Rhum agricole, citron vert et sirop de canne', price: 1200, emoji: '🍹', categoryId: 'cat_cocktails', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_planteur', name: 'Planteur', description: 'Mélange de jus de fruits tropicaux et rhum', price: 1500, emoji: '🍹', categoryId: 'cat_cocktails', available: true, isMenuJour: false, promoPrice: 0 },

    // Garnitures
    { id: 'item_alloco_seul', name: 'Alloco', description: 'Planches d\'alloco croustillant', price: 500, emoji: '🍌', categoryId: 'cat_garnitures', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_riz_seul', name: 'Riz Blanc', description: 'Portion de riz blanc cuit à la vapeur', price: 500, emoji: '🍚', categoryId: 'cat_garnitures', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_frites', name: 'Frites Maison', description: 'Frites de pommes de terre croustillantes', price: 800, emoji: '🍟', categoryId: 'cat_garnitures', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_salade', name: 'Salade Verte', description: 'Salade fraîche avec tomates et vinaigrette', price: 500, emoji: '🥗', categoryId: 'cat_garnitures', available: true, isMenuJour: false, promoPrice: 0 },

    // Desserts
    { id: 'item_fruits', name: 'Salade de Fruits', description: 'Mélange de fruits frais de saison', price: 1000, emoji: '🍎', categoryId: 'cat_desserts', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_glace', name: 'Glace Artisanale', description: '2 boules de glace au choix', price: 1000, emoji: '🍨', categoryId: 'cat_desserts', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_gateau', name: 'Gâteau au Chocolat', description: 'Moelleux au chocolat fait maison', price: 1500, emoji: '🍫', categoryId: 'cat_desserts', available: true, isMenuJour: false, promoPrice: 0 },
    { id: 'item_banane', name: 'Banane Plantain', description: 'Banane plantain grillée au beurre et cannelle', price: 800, emoji: '🍌', categoryId: 'cat_desserts', available: true, isMenuJour: false, promoPrice: 0 }
  ];

  // --- Promotions ---
  const promotions = [
    { id: 'promo_1', title: 'Happy Hour', description: 'Tous les cocktails à -20% de 18h à 20h', discount: '-20%', emoji: '🍹', active: true },
    { id: 'promo_2', title: 'Menu Midi', description: 'Plat + Boisson à 3000F au lieu de 3500F', discount: '-15%', emoji: '🍽️', active: true },
    { id: 'promo_3', title: 'Fidelité', description: 'Le 10ème plat offert pour les clients fidèles', discount: 'Offert', emoji: '🎁', active: true }
  ];

  // --- Testimonials ---
  const testimonials = [
    { id: 'test_1', author: 'Aminata K.', text: 'Le meilleur attiéké poisson d\'Abidjan ! Le poisson est toujours frais et bien assaisonné. Je recommande vivement Bodoro à tous les amis.', rating: 5 },
    { id: 'test_2', author: 'Kouamé B.', text: 'Service rapide et cuisine délicieuse. Le poulet braisé est tombant ! L\'ambiance est chaleureuse et le personnel très accueillant.', rating: 5 },
    { id: 'test_3', author: 'Fatou D.', text: 'J\'adore les brochettes mixtes et le bissap frais. Un vrai coin de paradis pour les gourmands. Prix très raisonnable pour la qualité.', rating: 4 },
    { id: 'test_4', author: 'Yao S.', text: 'Le kedjénou est exceptionnel, tout comme les cocktails. Ambiance familiale parfaite pour un bon moment entre amis. On y retourne chaque week-end !', rating: 5 },
    { id: 'test_5', author: 'Marie-Claire T.', text: 'Tchep djembienne exquis et service impeccable. Le personnel est attentionné. C\'est devenu notre restaurant préféré.', rating: 4 },
    { id: 'test_6', author: 'Ibrahim C.', text: 'Bodoro est notre rendez-vous du vendredi soir. Les grillades sont parfumées et les prix abordables. Le mojito maison est un must !', rating: 5 }
  ];

  // --- Add timestamps and save ---
  // Créer les catégories dans Firestore et récupérer leurs vrais IDs
  const catIdMap = {};
  for (const cat of categories) {
    const oldId = cat.id;
    const created = await DB.createCategory({
      name: cat.name, emoji: cat.emoji, sortOrder: cat.sortOrder, active: cat.active
    });
    catIdMap[oldId] = created.id;
  }

  // Créer les articles avec les bons categoryId Firestore
  for (const item of items) {
    await DB.createItem({
      name: item.name, description: item.description || '',
      price: item.price, promoPrice: item.promoPrice || 0,
      emoji: item.emoji, image: '',
      categoryId: catIdMap[item.categoryId] || '',
      available: item.available !== false,
      isMenuJour: item.isMenuJour || false,
      options: '[]'
    });
  }

  // Créer les promotions
  for (const p of promotions) {
    await DB.createPromotion({ title: p.title, description: p.description, discount: p.discount, emoji: p.emoji, active: p.active !== false });
  }

  // Créer les témoignages
  for (const t of testimonials) {
    await DB.createTestimonial({ author: t.author, text: t.text, rating: t.rating, approved: true });
  }
}
