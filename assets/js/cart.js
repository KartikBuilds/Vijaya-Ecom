/**
 * Vijaya Premix — cart.js
 * localStorage-persisted cart shared by the slide-out drawer (every page)
 * and the dedicated cart.html page. Regular products use type "product";
 * items added from preorder.html use type "preorder" and are shown with a
 * visual PREORDER tag and expected availability instead of instant delivery.
 */
(function () {
  "use strict";

  var CART_KEY = "vijaya_cart";
  var DELIVERY_FLAT = 49;
  var FREE_DELIVERY_THRESHOLD = 499;

  function getCart() {
    try {
      var validIds = (window.VIJAYA_PRODUCTS || []).map(function (p) { return p.id; });
      var stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      var clean = Array.isArray(stored) ? stored.filter(function (item) {
        return item && item.type !== "preorder" && validIds.indexOf(item.id) > -1;
      }) : [];
      if (!Array.isArray(stored) || clean.length !== stored.length) localStorage.setItem(CART_KEY, JSON.stringify(clean));
      return clean;
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function lookupItem(id, type) {
    if (type === "preorder") {
      return (window.VIJAYA_PREORDERS || []).find(function (p) { return p.id === id; });
    }
    return (window.VIJAYA_PRODUCTS || []).find(function (p) { return p.id === id; });
  }

  function addToCart(id, opts) {
    opts = opts || {};
    var type = opts.preorder ? "preorder" : "product";
    var qty = opts.qty || 1;
    var item = lookupItem(id, type);
    if (!item) return;
    var cart = getCart();
    var existing = cart.find(function (c) { return c.id === id && c.type === type; });
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: id, type: type, qty: qty });
    }
    saveCart(cart);
    refreshCartUI();
    if (window.VijayaToast) {
      window.VijayaToast(type === "preorder" ? "Preorder added to your kitchen!" : "Added to your kitchen!", {
        icon: "fa-cart-shopping text-vijaya-gold",
      });
    }
  }
  window.addToCart = addToCart;

  function removeFromCart(id, type) {
    var cart = getCart().filter(function (c) { return !(c.id === id && c.type === type); });
    saveCart(cart);
    refreshCartUI();
  }

  function updateQuantity(id, type, qty) {
    var cart = getCart();
    var entry = cart.find(function (c) { return c.id === id && c.type === type; });
    if (!entry) return;
    entry.qty = qty;
    if (entry.qty < 1) {
      cart = cart.filter(function (c) { return c !== entry; });
    }
    saveCart(cart);
    refreshCartUI();
  }

  function calculateCart() {
    var cart = getCart();
    var items = cart
      .map(function (c) {
        var product = lookupItem(c.id, c.type);
        if (!product) return null;
        var price = 0;
        return {
          id: c.id,
          type: c.type,
          qty: c.qty,
          name: product.name,
          img: product.img,
          category: product.category,
          price: price,
          lineTotal: price * c.qty,
          availability: product.availability || null,
        };
      })
      .filter(Boolean);
    var subtotal = items.reduce(function (sum, i) { return sum + i.lineTotal; }, 0);
    var itemCount = items.reduce(function (sum, i) { return sum + i.qty; }, 0);
    var delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FLAT;
    var total = subtotal + delivery;
    return { items: items, subtotal: subtotal, delivery: delivery, total: total, itemCount: itemCount };
  }
  window.calculateCart = calculateCart;

  function rupee(n) {
    return "\u20B9" + n.toLocaleString("en-IN");
  }

  /* ---------------------------------------------------------------------
   * Drawer + header badge (present on every page)
   * ------------------------------------------------------------------- */
  function cartLineHtml(item, compact) {
    var tag = item.type === "preorder"
      ? '<span class="inline-block text-[9px] font-extrabold bg-vijaya-gold text-vijaya-dark px-2 py-0.5 rounded-full mb-1">PREORDER</span>'
      : "";
    var availability = item.type === "preorder" && item.availability
      ? '<p class="text-[11px] text-vijaya-red font-bold mt-0.5">' + item.availability + "</p>"
      : "";
    return (
      '<div class="flex gap-3 items-start" data-cart-line data-id="' + item.id + '" data-type="' + item.type + '">' +
      '<img src="' + item.img + '" alt="" class="w-16 h-16 rounded-2xl object-contain shrink-0 bg-vijaya-pink" loading="lazy">' +
      '<div class="flex-1 min-w-0">' +
      tag +
      '<p class="text-sm font-bold text-vijaya-dark font-body leading-snug truncate">' + item.name + "</p>" +
      availability +
      '<div class="flex items-center justify-between mt-2">' +
      '<div class="flex items-center gap-2 border border-vijaya-red/20 rounded-full px-1">' +
      '<button type="button" class="qty-btn w-6 h-6 grid place-items-center text-vijaya-red" data-qty-decrease aria-label="Decrease quantity of ' + item.name + '">&minus;</button>' +
      '<span class="text-xs font-bold w-4 text-center" data-qty-value>' + item.qty + "</span>" +
      '<button type="button" class="qty-btn w-6 h-6 grid place-items-center text-vijaya-red" data-qty-increase aria-label="Increase quantity of ' + item.name + '">+</button>' +
      "</div>" +
      '<span class="text-xs font-bold text-vijaya-red font-display">Price on request</span>' +
      "</div></div>" +
      '<button type="button" class="text-vijaya-muted hover:text-vijaya-red shrink-0" data-remove-line aria-label="Remove ' + item.name + ' from cart"><i class="fa-solid fa-trash-can text-sm" aria-hidden="true"></i></button>' +
      "</div>"
    );
  }

  function refreshCartUI() {
    var data = calculateCart();

    var countEls = document.querySelectorAll("#cart-count");
    countEls.forEach(function (el) {
      el.textContent = String(data.itemCount);
    });
    var toggleBtn = document.getElementById("cart-toggle");
    if (toggleBtn) toggleBtn.setAttribute("aria-label", "Open cart, " + data.itemCount + " items");

    var drawerItems = document.getElementById("cart-items");
    if (drawerItems) {
      if (data.items.length === 0) {
        drawerItems.innerHTML =
          '<div class="h-full flex flex-col items-center justify-center text-center py-10">' +
          '<i class="fa-solid fa-kitchen-set text-3xl text-vijaya-red/30 mb-3" aria-hidden="true"></i>' +
          '<p class="text-sm text-vijaya-muted font-body">Your kitchen is empty.<br>Add a premix to get cooking.</p>' +
          "</div>";
      } else {
        drawerItems.innerHTML = data.items.map(function (i) { return cartLineHtml(i, true); }).join("");
      }
    }
    setText("cart-subtotal", "Price on request");
    setText("cart-delivery", "To be confirmed");
    setText("cart-total", "Price on request");

    renderCartPage(data);
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ---------------------------------------------------------------------
   * Dedicated cart.html page
   * ------------------------------------------------------------------- */
  function renderCartPage(data) {
    var pageList = document.getElementById("cart-page-items");
    if (!pageList) return; // not on cart.html

    var emptyState = document.getElementById("cart-page-empty");
    var summary = document.getElementById("cart-page-summary");

    if (data.items.length === 0) {
      pageList.classList.add("hidden");
      if (summary) summary.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }
    if (emptyState) emptyState.classList.add("hidden");
    pageList.classList.remove("hidden");
    if (summary) summary.classList.remove("hidden");

    pageList.innerHTML = data.items
      .map(function (item) {
        var tag = item.type === "preorder"
          ? '<span class="inline-block text-[10px] font-extrabold bg-vijaya-gold text-vijaya-dark px-2.5 py-1 rounded-full mb-2">PREORDER</span>'
          : "";
        var availability = item.type === "preorder" && item.availability
          ? '<p class="text-xs text-vijaya-red font-bold mt-0.5">' + item.availability + "</p>"
          : "";
        return (
          '<div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white rounded-4xl shadow-soft p-4 sm:p-5" data-cart-line data-id="' + item.id + '" data-type="' + item.type + '">' +
          '<img src="' + item.img + '" alt="" class="w-20 h-20 rounded-3xl object-contain bg-vijaya-pink shrink-0" loading="lazy">' +
          '<div class="flex-1 min-w-0 w-full">' + tag +
          '<p class="font-display font-bold text-vijaya-dark">' + item.name + "</p>" + availability +
          '<p class="text-sm text-vijaya-muted font-body mt-0.5">Price on request</p>' +
          "</div>" +
          '<div class="flex items-center gap-2 border border-vijaya-red/20 rounded-full px-2 py-1">' +
          '<button type="button" class="qty-btn w-7 h-7 grid place-items-center text-vijaya-red text-lg" data-qty-decrease aria-label="Decrease quantity of ' + item.name + '">&minus;</button>' +
          '<span class="text-sm font-bold w-5 text-center" data-qty-value>' + item.qty + "</span>" +
          '<button type="button" class="qty-btn w-7 h-7 grid place-items-center text-vijaya-red text-lg" data-qty-increase aria-label="Increase quantity of ' + item.name + '">+</button>' +
          "</div>" +
          '<span class="font-display font-bold text-vijaya-red text-sm w-28 text-right shrink-0">Price on request</span>' +
          '<button type="button" class="text-vijaya-muted hover:text-vijaya-red shrink-0" data-remove-line aria-label="Remove ' + item.name + ' from cart"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>' +
          "</div>"
        );
      })
      .join("");

    setText("cart-page-subtotal", "Price on request");
    setText("cart-page-delivery", "To be confirmed");
    setText("cart-page-total", "Price on request");
  }

  /* ---------------------------------------------------------------------
   * Drawer open/close
   * ------------------------------------------------------------------- */
  function openDrawer() {
    var overlay = document.getElementById("cart-overlay");
    var drawer = document.getElementById("cart-drawer");
    if (!overlay || !drawer) return;
    overlay.classList.remove("hidden");
    requestAnimationFrame(function () {
      overlay.classList.remove("opacity-0");
      drawer.classList.remove("translate-x-full");
    });
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
    var closeBtn = document.getElementById("cart-close");
    if (closeBtn) closeBtn.focus();
  }
  function closeDrawer() {
    var overlay = document.getElementById("cart-overlay");
    var drawer = document.getElementById("cart-drawer");
    if (!overlay || !drawer) return;
    drawer.classList.add("translate-x-full");
    overlay.classList.add("opacity-0");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    window.setTimeout(function () {
      overlay.classList.add("hidden");
    }, 300);
    var toggle = document.getElementById("cart-toggle");
    if (toggle) toggle.focus();
  }

  /* ---------------------------------------------------------------------
   * Mock checkout (cart.html only)
   * ------------------------------------------------------------------- */
  function initCheckout() {
    var checkoutBtn = document.getElementById("proceed-checkout");
    var panel = document.getElementById("checkout-panel");
    var form = document.getElementById("checkout-form");
    if (!checkoutBtn || !panel) return;
    checkoutBtn.addEventListener("click", function () {
      panel.classList.remove("hidden");
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        saveCart([]);
        refreshCartUI();
        panel.classList.add("hidden");
        var confirmation = document.getElementById("checkout-confirmation");
        if (confirmation) confirmation.classList.remove("hidden");
        if (window.VijayaToast) {
          window.VijayaToast("Order placed! This prototype does not submit a real order.", {
            icon: "fa-circle-check text-emerald-400",
          });
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
   * Event wiring
   * ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    refreshCartUI();
    initCheckout();

    var toggle = document.getElementById("cart-toggle");
    var close = document.getElementById("cart-close");
    var overlay = document.getElementById("cart-overlay");
    if (toggle) toggle.addEventListener("click", openDrawer);
    if (close) close.addEventListener("click", closeDrawer);
    if (overlay) overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    document.addEventListener("click", function (e) {
      var addBtn = e.target.closest("[data-add-to-cart]");
      if (addBtn) {
        addToCart(addBtn.getAttribute("data-id"), { preorder: false });
        return;
      }
      var preorderBtn = e.target.closest("[data-preorder]");
      if (preorderBtn) {
        var id = preorderBtn.getAttribute("data-id");
        var qtySelect = document.getElementById("qty-" + id);
        var qty = qtySelect ? parseInt(qtySelect.value, 10) : 1;
        addToCart(id, { preorder: true, qty: qty });
        return;
      }
      var incBtn = e.target.closest("[data-qty-increase]");
      var decBtn = e.target.closest("[data-qty-decrease]");
      var removeBtn = e.target.closest("[data-remove-line]");
      if (incBtn || decBtn || removeBtn) {
        var line = e.target.closest("[data-cart-line]");
        if (!line) return;
        var lineId = line.getAttribute("data-id");
        var lineType = line.getAttribute("data-type");
        var cart = getCart();
        var entry = cart.find(function (c) { return c.id === lineId && c.type === lineType; });
        if (!entry) return;
        if (incBtn) updateQuantity(lineId, lineType, entry.qty + 1);
        if (decBtn) updateQuantity(lineId, lineType, entry.qty - 1);
        if (removeBtn) removeFromCart(lineId, lineType);
      }
    });
  });
})();
