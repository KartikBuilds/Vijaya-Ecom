/**
 * Vijaya Premix — auth.js
 * PROTOTYPE-ONLY authentication. Nothing here is secure: passwords are
 * never stored, there is no server, and "sessions" are plain localStorage /
 * sessionStorage flags used purely to demo a logged-in nav state.
 */
(function () {
  "use strict";

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function isValidMobile(v) {
    return /^[6-9]\d{9}$/.test(v.replace(/\s+/g, ""));
  }

  function setFieldError(input, message) {
    var errorEl = document.getElementById(input.id + "-error");
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.classList.add("field-invalid");
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
      }
    } else {
      input.removeAttribute("aria-invalid");
      input.classList.remove("field-invalid");
      if (errorEl) errorEl.classList.add("hidden");
    }
  }

  function storeSession(user, remember) {
    var payload = JSON.stringify(user);
    if (remember) {
      localStorage.setItem("vijaya_user", payload);
    } else {
      sessionStorage.setItem("vijaya_user", payload);
    }
  }

  function getStoredAccounts() {
    try {
      return JSON.parse(localStorage.getItem("vijaya_accounts") || "[]");
    } catch (e) {
      return [];
    }
  }

  /* ---------------------------------------------------------------------
   * Signup
   * ------------------------------------------------------------------- */
  function initSignup() {
    var form = document.getElementById("signup-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("signup-name");
      var email = document.getElementById("signup-email");
      var mobile = document.getElementById("signup-mobile");
      var password = document.getElementById("signup-password");
      var confirm = document.getElementById("signup-confirm");
      var terms = document.getElementById("signup-terms");
      var valid = true;

      if (name.value.trim().length < 2) { setFieldError(name, "Enter your full name."); valid = false; } else setFieldError(name, "");
      if (!isValidEmail(email.value.trim())) { setFieldError(email, "Enter a valid email address."); valid = false; } else setFieldError(email, "");
      if (!isValidMobile(mobile.value.trim())) { setFieldError(mobile, "Enter a valid 10-digit mobile number."); valid = false; } else setFieldError(mobile, "");
      if (password.value.length < 8) { setFieldError(password, "Password must be at least 8 characters."); valid = false; } else setFieldError(password, "");
      if (confirm.value !== password.value || confirm.value === "") { setFieldError(confirm, "Passwords do not match."); valid = false; } else setFieldError(confirm, "");
      if (terms && !terms.checked) { setFieldError(terms, "Please accept the Terms to continue."); valid = false; } else if (terms) setFieldError(terms, "");

      if (!valid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var accounts = getStoredAccounts();
      accounts.push({ name: name.value.trim(), email: email.value.trim().toLowerCase() });
      localStorage.setItem("vijaya_accounts", JSON.stringify(accounts));
      storeSession({ name: name.value.trim(), email: email.value.trim().toLowerCase() }, true);

      if (window.VijayaToast) window.VijayaToast("Account created. Welcome to Vijaya!", { icon: "fa-circle-check text-emerald-400" });
      window.setTimeout(function () { window.location.href = "index.html"; }, 700);
    });
  }

  /* ---------------------------------------------------------------------
   * Login
   * ------------------------------------------------------------------- */
  function initLogin() {
    var form = document.getElementById("login-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("login-email");
      var password = document.getElementById("login-password");
      var remember = document.getElementById("login-remember");
      var valid = true;

      if (!isValidEmail(email.value.trim())) { setFieldError(email, "Enter a valid email address."); valid = false; } else setFieldError(email, "");
      if (password.value.length < 1) { setFieldError(password, "Enter your password."); valid = false; } else setFieldError(password, "");

      if (!valid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var accounts = getStoredAccounts();
      var matched = accounts.find(function (a) { return a.email === email.value.trim().toLowerCase(); });
      var name = matched ? matched.name : email.value.split("@")[0];
      storeSession({ name: name, email: email.value.trim().toLowerCase() }, !!(remember && remember.checked));

      if (window.VijayaToast) window.VijayaToast("Welcome back, " + name.split(" ")[0] + "!", { icon: "fa-circle-check text-emerald-400" });
      window.setTimeout(function () { window.location.href = "index.html"; }, 700);
    });

    var forgot = document.getElementById("forgot-password-link");
    if (forgot) {
      forgot.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.VijayaToast) window.VijayaToast("Password reset isn't available in this prototype.", { icon: "fa-circle-info text-vijaya-gold" });
      });
    }

    var google = document.getElementById("google-signin-btn");
    if (google) {
      google.addEventListener("click", function () {
        if (window.VijayaToast) window.VijayaToast("Google sign-in is a visual placeholder in this prototype.", { icon: "fa-circle-info text-vijaya-gold" });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSignup();
    initLogin();
  });
})();
