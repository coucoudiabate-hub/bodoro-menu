// Toast notification system
const Toast = {
  show(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

// Generic Modal Manager
const Modal = {
  open(title, bodyHTML, footerHTML, options = {}) {
    const overlay = document.getElementById('generic-modal');
    const content = overlay.querySelector('.modal-content');
    const width = options.width || '500px';
    content.style.maxWidth = width;

    content.querySelector('.modal-header h2').textContent = title;
    content.querySelector('.modal-body').innerHTML = bodyHTML;

    const footer = content.querySelector('.modal-footer');
    if (footerHTML) {
      footer.innerHTML = footerHTML;
      footer.style.display = 'flex';
    } else {
      footer.innerHTML = '';
      footer.style.display = 'none';
    }

    overlay.classList.add('active');
    return { content, footer };
  },
  close() {
    document.getElementById('generic-modal').classList.remove('active');
  }
};

// Checkout Modal
const CheckoutModal = {
  open() {
    document.getElementById('checkout-modal').classList.add('active');
    this.render();
  },
  close() {
    document.getElementById('checkout-modal').classList.remove('active');
  },
  render() {
    const cart = DB.getCart();
    const total = DB.getCartTotal();
    const originalTotal = DB.getCartOriginalTotal();
    const savings = DB.getCartSavings();
    const config = DB.getConfig();

    // Render cart summary in checkout
    const itemsHTML = cart.map(item => {
      const price = item.promoPrice > 0 ? item.promoPrice : item.price;
      return `<div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light)">
        <span style="font-size:1.5rem">${item.emoji}</span>
        <span style="flex:1;font-weight:600;font-size:0.9375rem">${item.name}</span>
        <span style="font-size:0.875rem;color:var(--text-muted)">${item.quantity} x ${formatPrice(price)}</span>
        <span style="font-weight:700">${formatPrice(price * item.quantity)}</span>
      </div>`;
    }).join('');

    document.getElementById('checkout-items-summary').innerHTML = itemsHTML || '<p style="text-align:center;color:var(--text-muted);padding:16px">Panier vide</p>';
    document.getElementById('checkout-total').textContent = formatPrice(total);

    const savingsEl = document.getElementById('checkout-savings');
    if (savings > 0) {
      savingsEl.style.display = 'flex';
      savingsEl.querySelector('span').textContent = `Vous économisez ${formatPrice(savings)} !`;
    } else {
      savingsEl.style.display = 'none';
    }
  }
};

// Cart Drawer
const CartDrawer = {
  open() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-drawer-overlay').classList.add('open');
    this.render();
  },
  close() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-drawer-overlay').classList.remove('open');
  },
  render() {
    const cart = DB.getCart();
    const count = DB.getCartCount();
    const total = DB.getCartTotal();
    const originalTotal = DB.getCartOriginalTotal();
    const savings = DB.getCartSavings();

    // Update floating button badge
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    const itemsContainer = document.getElementById('cart-drawer-items');
    if (!itemsContainer) return;

    if (cart.length === 0) {
      itemsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><h3>Panier vide</h3><p>Ajoutez des articles depuis le menu</p></div>';
    } else {
      itemsContainer.innerHTML = cart.map(item => {
        const price = item.promoPrice > 0 ? item.promoPrice : item.price;
        return `<div class="cart-item">
          <span class="cart-item-emoji">${item.emoji}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${item.promoPrice > 0 ? `<span style="text-decoration:line-through;color:var(--text-muted);font-size:0.8125rem">${formatPrice(item.price)}</span> ` : ''}${formatPrice(price)} × ${item.quantity}</div>
          </div>
          <div class="cart-item-controls">
            <button onclick="CartManager.updateQty('${item.id}', ${item.quantity - 1})">−</button>
            <span style="font-weight:700;min-width:20px;text-align:center">${item.quantity}</span>
            <button onclick="CartManager.updateQty('${item.id}', ${item.quantity + 1})">+</button>
            <button onclick="CartManager.remove('${item.id}')" style="color:var(--danger)">✕</button>
          </div>
        </div>`;
      }).join('');
    }

    // Update totals
    document.getElementById('cart-total').textContent = formatPrice(total);
    const origEl = document.getElementById('cart-original-total');
    if (origEl && savings > 0) {
      origEl.textContent = formatPrice(originalTotal);
      origEl.parentElement.style.display = 'flex';
    }
    const savingsEl = document.getElementById('cart-savings');
    if (savingsEl && savings > 0) {
      savingsEl.textContent = `Économie : ${formatPrice(savings)}`;
      savingsEl.style.display = 'block';
    }
  }
};

// Cart Manager (actions)
const CartManager = {
  addItem(item) {
    DB.addToCart(item);
    CartDrawer.render();
    Toast.success(`${item.emoji} ${item.name} ajouté au panier`);
  },
  updateQty(itemId, qty) {
    DB.updateCartQuantity(itemId, qty);
    CartDrawer.render();
  },
  remove(itemId) {
    DB.removeFromCart(itemId);
    CartDrawer.render();
    Toast.success('Article retiré du panier');
  },
  clear() {
    DB.clearCart();
    CartDrawer.render();
  },
  checkout() {
    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const deliveryType = document.querySelector('.delivery-option.active')?.dataset.type || 'livraison';
    const address = document.getElementById('checkout-address')?.value.trim() || '';
    const notes = document.getElementById('checkout-notes')?.value.trim() || '';

    if (!name) { Toast.error('Veuillez entrer votre nom'); return; }
    if (!phone) { Toast.error('Veuillez entrer votre téléphone'); return; }
    if (deliveryType === 'livraison' && !address) { Toast.error('Veuillez entrer votre adresse'); return; }

    const cart = DB.getCart();
    if (cart.length === 0) { Toast.error('Votre panier est vide'); return; }

    const total = DB.getCartTotal();
    // Numéro de table (si scan QR)
    let tableNumber = null;
    try { tableNumber = sessionStorage.getItem('bodoro_table'); } catch {}
    const order = DB.createOrder({
      clientName: name,
      phone,
      address,
      items: JSON.stringify(cart),
      total,
      deliveryType,
      notes: tableNumber ? `${notes ? notes + ' | ' : ''}[Table ${tableNumber}]` : notes,
      table: tableNumber || ''
    });

    // Build WhatsApp message
    const config = DB.getConfig();
    // tableNumber déjà récupéré ci-dessus (scan QR)
    const itemsText = cart.map(i => `• ${i.emoji} ${i.name} × ${i.quantity} = ${formatPrice((i.promoPrice > 0 ? i.promoPrice : i.price) * i.quantity)}`).join('\n');
    const msg = `🍽️ *Nouvelle Commande - ${config.restaurantName}*\n\n${tableNumber ? `🪑 *Table: ${tableNumber}*\n` : ''}👤 ${name}\n📱 ${phone}\n${deliveryType === 'livraison' ? '📍 ' + address : '🏪 Retrait sur place'}\n\n*Commande:*\n${itemsText}\n\n💰 *Total: ${formatPrice(total)}*\n${notes ? '\n📝 ' + notes : ''}`;

    DB.clearCart();
    CartDrawer.render();
    CheckoutModal.close();

    // Open WhatsApp
    const waURL = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(waURL, '_blank');

    Toast.success('Commande envoyée via WhatsApp !');
  }
};

// Confirm Dialog
function confirmAction(message, callback) {
  const { content } = Modal.open('Confirmation',
    `<p style="margin-bottom:0;font-size:0.9375rem">${message}</p>`,
    `<button class="btn btn-outline" onclick="Modal.close()">Annuler</button>
     <button class="btn btn-danger" id="confirm-action-btn">Confirmer</button>`,
    { width: '400px' }
  );
  document.getElementById('confirm-action-btn').onclick = () => { Modal.close(); callback(); };
}

// Format helpers are already in store.js
