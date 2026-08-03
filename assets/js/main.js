/**
 * Vijaya Premix — main.js
 * Site-wide UI behaviour: mobile nav, back-to-top, toasts, auth nav label,
 * newsletter validation, wishlist state and the product quick-view modal.
 * Loaded on every page.
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
   * Toasts
   * ------------------------------------------------------------------- */
  function showToast(message, opts) {
    opts = opts || {};
    var container = document.getElementById("toast-container");
    if (!container) return;
    var toast = document.createElement("div");
    toast.className =
      "toast pointer-events-auto w-full bg-vijaya-dark text-white text-sm font-bold font-body " +
      "rounded-full px-5 py-3 shadow-card flex items-center gap-2 justify-center";
    toast.setAttribute("role", "status");
    toast.innerHTML =
      '<i class="fa-solid ' + (opts.icon || "fa-circle-check text-emerald-400") + '" aria-hidden="true"></i><span>' +
      message +
      "</span>";
    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("toast-visible");
    });
    window.setTimeout(function () {
      toast.classList.remove("toast-visible");
      window.setTimeout(function () {
        toast.remove();
      }, 250);
    }, 2600);
  }
  window.VijayaToast = showToast;

  /* ---------------------------------------------------------------------
   * Mobile menu + mobile search toggle
   * ------------------------------------------------------------------- */
  function initMobileMenu() {
    var menuBtn = document.getElementById("mobile-menu-toggle");
    var menu = document.getElementById("mobile-menu");
    if (menuBtn && menu) {
      menuBtn.addEventListener("click", function () {
        var isOpen = !menu.classList.contains("hidden");
        window.clearTimeout(menu._vjCloseTimer);
        menu.classList.add("mobile-menu-animating");
        if (isOpen) {
          menu.classList.remove("mobile-menu-opening");
          menu.classList.add("mobile-menu-closing");
          menuBtn.setAttribute("aria-expanded", "false");
          menuBtn.querySelector("i").className = "fa-solid fa-bars";
          menu._vjCloseTimer = window.setTimeout(function () {
            menu.classList.add("hidden");
            menu.classList.remove("mobile-menu-animating", "mobile-menu-closing");
          }, 190);
        } else {
          menu.classList.remove("hidden", "mobile-menu-closing");
          void menu.offsetWidth;
          menu.classList.add("mobile-menu-opening");
          menuBtn.setAttribute("aria-expanded", "true");
          menuBtn.querySelector("i").className = "fa-solid fa-xmark";
        }
      });
    }
    var searchBtn = document.getElementById("mobile-search-toggle");
    var searchBar = document.getElementById("mobile-search-bar");
    if (searchBtn && searchBar) {
      searchBtn.addEventListener("click", function () {
        var isOpen = !searchBar.classList.contains("hidden");
        searchBar.classList.toggle("hidden");
        searchBtn.setAttribute("aria-expanded", String(!isOpen));
        if (!isOpen) {
          var input = document.getElementById("site-search-mobile");
          if (input) input.focus();
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
   * Back to top
   * ------------------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    window.addEventListener(
      "scroll",
      function () {
        btn.classList.toggle("back-to-top-visible", window.scrollY >= 480);
      },
      { passive: true }
    );
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------------
   * Auth nav label (mock localStorage / sessionStorage auth)
   * ------------------------------------------------------------------- */
  function getSession() {
    try {
      var raw = localStorage.getItem("vijaya_user") || sessionStorage.getItem("vijaya_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  window.VijayaAuth = {
    getSession: getSession,
    logout: function () {
      localStorage.removeItem("vijaya_user");
      sessionStorage.removeItem("vijaya_user");
    },
  };

  function initAuthNav() {
    var link = document.getElementById("auth-nav-link");
    var label = document.getElementById("auth-nav-label");
    if (!link || !label) return;
    var user = getSession();
    if (user && user.name) {
      label.textContent = "Hi, " + user.name.split(" ")[0];
      link.setAttribute("href", "#");
      link.addEventListener("click", function (e) {
        e.preventDefault();
        window.VijayaAuth.logout();
        showToast("Signed out. See you again soon!", { icon: "fa-circle-check text-emerald-400" });
        window.setTimeout(function () {
          window.location.reload();
        }, 700);
      });
    }
  }

  /* ---------------------------------------------------------------------
   * Newsletter validation (works for any form matching this selector)
   * ------------------------------------------------------------------- */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function initNewsletterForms() {
    var forms = document.querySelectorAll("[data-newsletter-form], #footer-newsletter-form, #newsletter-form");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        if (!input) return;
        var errorEl = form.parentElement ? form.parentElement.querySelector("[data-newsletter-error]") : null;
        if (!isValidEmail(input.value.trim())) {
          input.setAttribute("aria-invalid", "true");
          input.classList.add("ring-2", "ring-red-400");
          if (errorEl) {
            errorEl.textContent = "Enter a valid email address to subscribe.";
            errorEl.classList.remove("hidden");
          }
          input.focus();
          return;
        }
        input.removeAttribute("aria-invalid");
        input.classList.remove("ring-2", "ring-red-400");
        if (errorEl) errorEl.classList.add("hidden");
        showToast("Subscribed! Recipes & offers are on their way.", { icon: "fa-circle-check text-emerald-400" });
        form.reset();
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Wishlist (localStorage-backed heart toggle)
   * ------------------------------------------------------------------- */
  function getWishlist() {
    try {
      var validIds = (window.VIJAYA_PRODUCTS || []).map(function (p) { return p.id; });
      var stored = JSON.parse(localStorage.getItem("vijaya_wishlist") || "[]");
      var clean = Array.isArray(stored) ? stored.filter(function (id) { return validIds.indexOf(id) > -1; }) : [];
      if (!Array.isArray(stored) || clean.length !== stored.length) localStorage.setItem("vijaya_wishlist", JSON.stringify(clean));
      return clean;
    } catch (e) {
      return [];
    }
  }
  function saveWishlist(list) {
    localStorage.setItem("vijaya_wishlist", JSON.stringify(list));
  }
  function paintWishlistButton(btn, active) {
    btn.setAttribute("aria-pressed", String(active));
    var icon = btn.querySelector("i");
    if (icon) icon.className = active ? "fa-solid fa-heart text-vijaya-red" : "fa-regular fa-heart";
  }
  function initWishlist() {
    var wishlist = getWishlist();
    document.querySelectorAll("[data-wishlist]").forEach(function (btn) {
      paintWishlistButton(btn, wishlist.indexOf(btn.getAttribute("data-wishlist")) > -1);
    });
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-wishlist]");
      if (!btn) return;
      var id = btn.getAttribute("data-wishlist");
      var list = getWishlist();
      var idx = list.indexOf(id);
      var nowActive;
      if (idx > -1) {
        list.splice(idx, 1);
        nowActive = false;
      } else {
        list.push(id);
        nowActive = true;
      }
      saveWishlist(list);
      paintWishlistButton(btn, nowActive);
      showToast(nowActive ? "Saved to your wishlist." : "Removed from wishlist.", {
        icon: nowActive ? "fa-heart text-vijaya-red" : "fa-circle-check text-emerald-400",
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Quick View modal (built on demand, works on any page with VIJAYA_PRODUCTS)
   * ------------------------------------------------------------------- */
  function buildModalShell() {
    var overlay = document.createElement("div");
    overlay.id = "vj-modal-overlay";
    overlay.className =
      "fixed inset-0 z-[90] bg-vijaya-dark/60 flex items-center justify-center p-4 opacity-0 transition-opacity duration-200";
    overlay.innerHTML = '<div id="vj-modal-panel" class="bg-white rounded-4xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl scale-95 transition-transform duration-200"></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeModal(overlay, trigger) {
    overlay.classList.add("opacity-0");
    overlay.querySelector("#vj-modal-panel").classList.add("scale-95");
    window.setTimeout(function () {
      overlay.remove();
      document.body.classList.remove("overflow-hidden");
      if (trigger && trigger.focus) trigger.focus();
    }, 200);
  }

  function openQuickView(id, trigger) {
    var product = (window.VIJAYA_PRODUCTS || []).find(function (p) {
      return p.id === id;
    });
    if (!product) return;
    var overlay = buildModalShell();
    var panel = overlay.querySelector("#vj-modal-panel");
    panel.innerHTML =
      '<div class="relative p-6 sm:p-8">' +
      '<button type="button" data-modal-close class="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-vijaya-pink grid place-items-center" aria-label="Close quick view"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '<div class="grid sm:grid-cols-2 gap-6 items-start">' +
      '<div class="w-full aspect-square rounded-4xl overflow-hidden bg-vijaya-pink p-4"><img src="' + product.img + '" alt="Vijaya ' + product.name + ' pack" class="w-full h-full object-contain"></div>' +
      '<div>' +
      '<p class="text-[10px] font-extrabold tracking-wide ' + (product.category === "veg" ? "text-emerald-700" : "text-vijaya-red") + ' mb-2">' + product.category.toUpperCase() + "</p>" +
      '<h2 class="font-display font-bold text-2xl text-vijaya-dark mb-2">' + product.name + "</h2>" +
      '<p class="text-sm text-vijaya-muted font-body mb-4">' + product.desc + "</p>" +
      '<div class="mb-5"><span class="font-display font-bold text-lg text-vijaya-red">Price on request</span></div>' +
      '<button type="button" data-add-to-cart data-id="' + product.id + '" class="w-full rounded-full bg-vijaya-red hover:bg-vijaya-red2 text-white font-bold py-3.5 transition">Add to Cart</button>' +
      "</div></div></div>";
    document.body.appendChild(overlay);
    document.body.classList.add("overflow-hidden");
    requestAnimationFrame(function () {
      overlay.classList.remove("opacity-0");
      panel.classList.remove("scale-95");
    });
    var closeBtn = panel.querySelector("[data-modal-close]");
    closeBtn.focus();
    function onKey(e) {
      if (e.key === "Escape") {
        closeModal(overlay, trigger);
        document.removeEventListener("keydown", onKey);
      }
    }
    document.addEventListener("keydown", onKey);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest("[data-modal-close]")) {
        closeModal(overlay, trigger);
        document.removeEventListener("keydown", onKey);
      }
    });
  }

  function initQuickView() {
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-quick-view]");
      if (!trigger) return;
      e.preventDefault();
      openQuickView(trigger.getAttribute("data-quick-view"), trigger);
    });
  }

  /* ---------------------------------------------------------------------
   * Scroll-margin fix for in-page anchors landing under the sticky header
   * ------------------------------------------------------------------- */
  function initAnchorOffset() {
    document.querySelectorAll("main [id]").forEach(function (el) {
      el.classList.add("scroll-mt-28");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initBackToTop();
    initAuthNav();
    initNewsletterForms();
    initWishlist();
    initQuickView();
    initAnchorOffset();
  });
})();
