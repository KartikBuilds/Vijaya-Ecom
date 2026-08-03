/**
 * Vijaya Premix — recipes.js
 * Filtering + search for the statically rendered #recipes-grid cards, and
 * the "View Recipe" detail modal populated from VIJAYA_RECIPES.
 */
(function () {
  "use strict";

  function initFilters() {
    var grid = document.getElementById("recipes-grid");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".recipe-card"));
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-recipe-filter]"));
    var searchInput = document.getElementById("recipes-search");
    var emptyState = document.getElementById("recipes-empty");

    var state = { filter: "all", query: "" };

    function matches(card) {
      var category = card.getAttribute("data-category");
      var mealType = card.getAttribute("data-mealtype");
      var total = Number(card.getAttribute("data-total"));
      var name = card.getAttribute("data-name") || "";

      var filterOk = true;
      if (state.filter === "veg" || state.filter === "non-veg") filterOk = category === state.filter;
      else if (state.filter === "under-15") filterOk = total <= 15;
      else if (state.filter === "under-30") filterOk = total <= 30;
      else if (["breakfast", "lunch", "dinner", "snacks"].indexOf(state.filter) > -1) filterOk = mealType === state.filter;

      var queryOk = state.query === "" || name.indexOf(state.query) > -1;
      return filterOk && queryOk;
    }

    function applyFilters() {
      var visible = 0;
      cards.forEach(function (card, index) {
        var show = matches(card);
        window.clearTimeout(card._vjFilterTimer);
        if (show) {
          card.classList.remove("hidden", "filter-leaving", "filter-enter");
          card.style.setProperty("--vj-delay", Math.min(index * 35, 175) + "ms");
          void card.offsetWidth;
          card.classList.add("filter-enter");
          card._vjFilterTimer = window.setTimeout(function () { card.classList.remove("filter-enter"); }, 500);
          visible += 1;
        } else if (!card.classList.contains("hidden")) {
          card.classList.remove("filter-enter");
          card.classList.add("filter-leaving");
          card._vjFilterTimer = window.setTimeout(function () {
            card.classList.add("hidden");
            card.classList.remove("filter-leaving");
          }, 155);
        }
      });
      if (emptyState) emptyState.classList.toggle("hidden", visible !== 0);
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterButtons.forEach(function (b) {
          b.classList.remove("filter-chip-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("filter-chip-active");
        btn.setAttribute("aria-pressed", "true");
        state.filter = btn.getAttribute("data-recipe-filter");
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value.trim().toLowerCase();
        applyFilters();
      });
    }

    var params = new URLSearchParams(window.location.search);
    var urlFilter = params.get("filter");
    var urlQuery = params.get("q");
    if (urlFilter) {
      var match = filterButtons.find(function (b) { return b.getAttribute("data-recipe-filter") === urlFilter; });
      if (match) match.click();
    }
    if (urlQuery && searchInput) {
      searchInput.value = urlQuery;
      state.query = urlQuery.trim().toLowerCase();
    }

    applyFilters();
  }

  /* ---------------------------------------------------------------------
   * Recipe detail modal
   * ------------------------------------------------------------------- */
  function findRecipe(id) {
    return (window.VIJAYA_RECIPES || []).find(function (r) { return r.id === id; });
  }
  function findProduct(id) {
    return (window.VIJAYA_PRODUCTS || []).find(function (p) { return p.id === id; });
  }

  function buildModal() {
    var overlay = document.createElement("div");
    overlay.id = "recipe-modal-overlay";
    overlay.className =
      "fixed inset-0 z-[90] bg-vijaya-dark/60 flex items-start sm:items-center justify-center p-0 sm:p-4 opacity-0 transition-opacity duration-200 overflow-y-auto";
    overlay.innerHTML =
      '<div id="recipe-modal-panel" class="bg-white rounded-t-4xl sm:rounded-4xl max-w-3xl w-full my-auto shadow-2xl scale-95 transition-transform duration-200"></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeModal(overlay, trigger) {
    overlay.classList.add("opacity-0");
    overlay.querySelector("#recipe-modal-panel").classList.add("scale-95");
    window.setTimeout(function () {
      overlay.remove();
      document.body.classList.remove("overflow-hidden");
      if (trigger && trigger.focus) trigger.focus();
    }, 200);
  }

  function openRecipeModal(id, trigger) {
    var recipe = findRecipe(id);
    if (!recipe) return;
    var related = findProduct(recipe.related);
    var overlay = buildModal();
    var panel = overlay.querySelector("#recipe-modal-panel");

    var relatedHtml = related
      ? '<div class="flex items-center gap-3 bg-vijaya-pink/60 rounded-3xl p-3 mt-5">' +
        '<img src="' + related.img + '" alt="" class="w-14 h-14 rounded-full object-contain bg-white" loading="lazy">' +
        '<div class="flex-1 min-w-0"><p class="text-xs text-vijaya-muted font-body">Made with</p><p class="font-display font-bold text-vijaya-dark truncate">' + related.name + "</p></div>" +
        '<button type="button" data-add-to-cart data-id="' + related.id + '" class="shrink-0 rounded-full bg-vijaya-red text-white text-xs font-bold px-4 py-2.5 hover:bg-vijaya-red2 transition">Add Premix to Cart</button>' +
        "</div>"
      : "";

    panel.innerHTML =
      '<div class="relative">' +
      '<img src="' + recipe.img + '" alt="Vijaya ' + recipe.title + ' premix pack" class="w-full h-64 object-contain bg-vijaya-pink p-4 rounded-t-4xl">' +
      '<button type="button" data-modal-close class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white grid place-items-center shadow-soft" aria-label="Close recipe"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      "</div>" +
      '<div class="p-6 sm:p-8">' +
      '<h2 class="font-display font-bold text-2xl text-vijaya-dark mb-2">' + recipe.title + "</h2>" +
      '<p class="text-sm text-vijaya-muted font-body mb-4">' + recipe.desc + "</p>" +
      '<div class="rounded-3xl bg-vijaya-cream p-5 text-sm font-body text-vijaya-dark"><h3 class="font-display font-bold text-vijaya-red mb-2">Cooking directions</h3><p>Follow the directions printed on the official Vijaya Premix pack. No additional cooking instructions have been supplied for publication.</p></div>' +
      relatedHtml +
      "</div>";

    document.body.appendChild(overlay);
    document.body.classList.add("overflow-hidden");
    requestAnimationFrame(function () {
      overlay.classList.remove("opacity-0");
      panel.classList.remove("scale-95");
    });
    panel.querySelector("[data-modal-close]").focus();

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

  function statBlock(label, value) {
    return (
      '<div class="bg-vijaya-cream rounded-2xl py-2.5">' +
      '<p class="font-display font-extrabold text-vijaya-dark">' + value + "</p>" +
      '<p class="text-[10px] uppercase tracking-wide text-vijaya-muted font-bold">' + label + "</p></div>"
    );
  }

  function initModalTriggers() {
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest("[data-view-recipe]");
      if (!trigger) return;
      e.preventDefault();
      openRecipeModal(trigger.getAttribute("data-view-recipe"), trigger);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFilters();
    initModalTriggers();
  });
})();
