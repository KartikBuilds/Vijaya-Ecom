/**
 * Vijaya Premix — products.js
 * Filtering, sorting and on-page search for products.html. Operates on the
 * statically rendered #products-grid cards (progressive enhancement) rather
 * than re-rendering from JSON, so the page works and is crawlable even if
 * this script fails to load.
 */
(function () {
  "use strict";

  function init() {
    var grid = document.getElementById("products-grid");
    if (!grid) return; // not on products.html

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".product-card"));
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var searchInput = document.getElementById("products-search");
    var emptyState = document.getElementById("products-empty");
    var countLabel = document.getElementById("products-count");

    var state = { filter: "all", query: "" };

    function matches(card) {
      var category = card.getAttribute("data-category");
      var tags = (card.getAttribute("data-tags") || "").split(" ");
      var name = card.getAttribute("data-name") || "";

      var filterOk =
        state.filter === "all" ||
        category === state.filter ||
        tags.indexOf(state.filter) > -1;

      var queryOk = state.query === "" || name.indexOf(state.query) > -1 || tags.join(" ").indexOf(state.query) > -1;

      return filterOk && queryOk;
    }

    function applyFilters() {
      var visibleCount = 0;
      cards.forEach(function (card, index) {
        var show = matches(card);
        window.clearTimeout(card._vjFilterTimer);
        if (show) {
          card.classList.remove("hidden", "filter-leaving", "filter-enter");
          card.style.setProperty("--vj-delay", Math.min(index * 35, 175) + "ms");
          void card.offsetWidth;
          card.classList.add("filter-enter");
          card._vjFilterTimer = window.setTimeout(function () { card.classList.remove("filter-enter"); }, 500);
          visibleCount += 1;
        } else if (!card.classList.contains("hidden")) {
          card.classList.remove("filter-enter");
          card.classList.add("filter-leaving");
          card._vjFilterTimer = window.setTimeout(function () {
            card.classList.add("hidden");
            card.classList.remove("filter-leaving");
          }, 155);
        }
      });
      if (emptyState) emptyState.classList.toggle("hidden", visibleCount !== 0);
      if (countLabel) countLabel.textContent = String(visibleCount);
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterButtons.forEach(function (b) {
          b.classList.remove("filter-chip-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("filter-chip-active");
        btn.setAttribute("aria-pressed", "true");
        state.filter = btn.getAttribute("data-filter");
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value.trim().toLowerCase();
        applyFilters();
      });
    }

    // Pre-apply state from URL, used by navigation and category cards.
    var params = new URLSearchParams(window.location.search);
    var urlFilter = params.get("filter");
    var urlQuery = params.get("q");
    if (urlFilter) {
      var match = filterButtons.find(function (b) { return b.getAttribute("data-filter") === urlFilter; });
      if (match) match.click();
    }
    if (urlQuery) {
      if (searchInput) {
        searchInput.value = urlQuery;
        state.query = urlQuery.trim().toLowerCase();
      }
    }

    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
