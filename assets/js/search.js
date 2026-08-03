/**
 * Vijaya Premix — search.js
 * Client-side search across VIJAYA_PRODUCTS and VIJAYA_RECIPES, powering the
 * navbar search box (desktop + mobile). Also exposes searchSite() globally
 * so products.html / recipes.html can reuse the same matching logic.
 */
(function () {
  "use strict";

  function buildIndex() {
    var products = (window.VIJAYA_PRODUCTS || []).map(function (p) {
      return {
        type: "product",
        id: p.id,
        title: p.name,
        meta: "Price on request \u00B7 " + p.category.toUpperCase(),
        img: p.img,
        href: "products.html#" + p.id,
        haystack: [p.name, p.category, (p.tags || []).join(" "), p.desc].join(" ").toLowerCase(),
      };
    });
    var recipes = (window.VIJAYA_RECIPES || []).map(function (r) {
      return {
        type: "recipe",
        id: r.id,
        title: r.title,
        meta: "Serving idea \u00B7 " + r.category.toUpperCase(),
        img: r.img,
        href: "recipes.html#recipe-" + r.id,
        haystack: [r.title, r.category, r.mealType, r.desc].join(" ").toLowerCase(),
      };
    });
    return products.concat(recipes);
  }

  function searchSite(query, limit) {
    var q = (query || "").trim().toLowerCase();
    if (q.length < 2) return [];
    var index = buildIndex();
    var results = index.filter(function (item) {
      if (q === "veg") return item.haystack.split(" ").indexOf("non-veg") === -1 && item.haystack.indexOf("veg") > -1;
      return item.haystack.indexOf(q) > -1;
    });
    return typeof limit === "number" ? results.slice(0, limit) : results;
  }
  window.searchSite = searchSite;

  function renderResults(container, query, results) {
    if (!container) return;
    if (!query || query.trim().length < 2) {
      container.classList.add("hidden");
      container.innerHTML = "";
      return;
    }
    if (results.length === 0) {
      container.innerHTML =
        '<p class="p-5 text-sm text-vijaya-muted text-center font-body">No dishes found. Try another craving.</p>';
      container.classList.remove("hidden");
      return;
    }
    var products = results.filter(function (r) { return r.type === "product"; });
    var recipes = results.filter(function (r) { return r.type === "recipe"; });

    function section(label, items) {
      if (!items.length) return "";
      var rows = items
        .map(function (item) {
          return (
            '<a href="' + item.href + '" class="flex items-center gap-3 px-4 py-2.5 hover:bg-vijaya-pink/50 transition" role="option">' +
            '<img src="' + item.img + '" alt="" class="w-10 h-10 rounded-full object-contain bg-vijaya-pink shrink-0" loading="lazy">' +
            '<span class="min-w-0"><span class="block text-sm font-bold text-vijaya-dark truncate font-body">' + item.title + "</span>" +
            '<span class="block text-xs text-vijaya-muted font-body">' + item.meta + "</span></span>" +
            "</a>"
          );
        })
        .join("");
      return (
        '<p class="px-4 pt-3 pb-1 text-[10px] font-extrabold tracking-wide text-vijaya-red uppercase">' + label + "</p>" + rows
      );
    }

    container.innerHTML = section("Products", products) + section("Recipes", recipes);
    container.classList.remove("hidden");
  }

  function wireInput(inputId, resultsId) {
    var input = document.getElementById(inputId);
    var results = document.getElementById(resultsId);
    if (!input || !results) return;

    var timer;
    input.addEventListener("input", function () {
      window.clearTimeout(timer);
      var value = input.value;
      timer = window.setTimeout(function () {
        renderResults(results, value, searchSite(value, 8));
      }, 150);
    });
    input.addEventListener("focus", function () {
      if (input.value.trim().length >= 2) renderResults(results, input.value, searchSite(input.value, 8));
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        results.classList.add("hidden");
        input.blur();
      }
      if (e.key === "Enter" && !input.closest("form")) {
        e.preventDefault();
        window.location.href = "products.html?q=" + encodeURIComponent(input.value.trim());
      }
    });
    document.addEventListener("click", function (e) {
      if (!results.contains(e.target) && e.target !== input) {
        results.classList.add("hidden");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireInput("site-search", "search-results");
    wireInput("site-search-mobile", "search-results-mobile");
  });
})();
