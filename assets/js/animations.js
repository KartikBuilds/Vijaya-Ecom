/**
 * Vijaya Premix — shared premium motion and interaction feedback.
 * Progressive enhancement only: content remains visible and usable without JS.
 */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function delay(el, index, step) {
    el.style.setProperty("--vj-delay", reducedMotion ? "0ms" : Math.min(index * step, 280) + "ms");
  }

  function setupHero() {
    var hero = document.querySelector(".hero-decor");
    if (!hero) return;
    var text = hero.querySelectorAll("h1, h1 + p, h1 + p + a");
    text.forEach(function (el, index) {
      el.classList.add("hero-enter");
      delay(el, index, 110);
    });
    var mainProductWrap = hero.querySelector(".order-2");
    var mainProduct = hero.querySelector(".order-2 > div");
    if (mainProductWrap) {
      mainProductWrap.classList.add("hero-enter");
      delay(mainProductWrap, 3, 110);
    }
    if (mainProduct) {
      mainProduct.classList.add("hero-product-float");
    }
    hero.querySelectorAll(".order-3 > div").forEach(function (el, index) {
      el.classList.add("hero-enter");
      delay(el, index + 4, 100);
    });
  }

  function revealTargets() {
    var targets = [];
    document.querySelectorAll("main section").forEach(function (section) {
      if (section.classList.contains("hero-decor")) return;
      var heading = section.querySelector("h1, h2");
      if (heading) targets.push(heading);
      var cards = section.querySelectorAll(".product-card, .recipe-card, article, .grid > a, .grid > div");
      cards.forEach(function (card, index) {
        if (card === heading || card.contains(heading)) return;
        delay(card, index, 55);
        targets.push(card);
      });
    });
    if (document.body.querySelector("main") && document.title.toLowerCase().indexOf("about") > -1) {
      document.querySelectorAll("main section").forEach(function (section, index) {
        delay(section, index, 55);
        targets.push(section);
      });
    }
    targets = targets.filter(function (el, index, all) { return all.indexOf(el) === index; });
    targets.forEach(function (el) { el.classList.add("reveal-ready"); });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    targets.forEach(function (el) { observer.observe(el); });
  }

  function interactionFeedback() {
    document.addEventListener("pointerdown", function (event) {
      var control = event.target.closest("button, a.rounded-full");
      if (control) control.classList.add("vj-pressed");
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
      document.addEventListener(name, function (event) {
        var control = event.target.closest && event.target.closest("button, a.rounded-full");
        if (control) control.classList.remove("vj-pressed");
      });
    });

    document.addEventListener("click", function (event) {
      var add = event.target.closest("[data-add-to-cart]");
      if (add) {
        var icon = add.querySelector("i");
        var original = icon ? icon.className : "";
        add.classList.add("add-confirmed");
        if (icon) icon.className = "fa-solid fa-check";
        window.setTimeout(function () {
          add.classList.remove("add-confirmed");
          if (icon) icon.className = original;
        }, 850);
        document.querySelectorAll("#cart-count").forEach(function (badge) {
          badge.classList.remove("cart-count-pulse");
          void badge.offsetWidth;
          badge.classList.add("cart-count-pulse");
        });
      }

      var wish = event.target.closest("[data-wishlist]");
      if (wish) {
        wish.classList.remove("wishlist-pop");
        void wish.offsetWidth;
        wish.classList.add("wishlist-pop");
      }

      if (event.target.closest("[data-qty-increase], [data-qty-decrease]")) {
        var line = event.target.closest("[data-cart-line]");
        window.setTimeout(function () {
          var value = line && line.querySelector("[data-qty-value]");
          if (!value) return;
          value.classList.remove("qty-feedback");
          void value.offsetWidth;
          value.classList.add("qty-feedback");
        }, 0);
      }
    });
  }

  function setupForms() {
    var form = document.querySelector("#login-form, #signup-form");
    if (form) form.classList.add("form-enter");
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.documentElement.classList.add("motion-ready");
    setupHero();
    revealTargets();
    interactionFeedback();
    setupForms();
  });
})();
