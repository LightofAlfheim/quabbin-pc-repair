/* Quabbin PC Repair — site behaviour. No dependencies. */
(function () {
  "use strict";

  var config = window.QPR_CONFIG || {};
  var EMAIL = (config.contactEmail || "").trim();
  var PHONE = (config.phone || "").trim();
  var ENDPOINT = (config.formEndpoint || "").trim();
  var SUBJECT = config.emailSubject || "Repair request";
  var MODE = ENDPOINT ? "endpoint" : EMAIL ? "email" : "demo";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  /* ---------- Contact details from config ---------- */
  function initContact() {
    $$("[data-email-link]").forEach(function (a) {
      if (EMAIL) {
        a.href = "mailto:" + EMAIL;
        if (!a.hasAttribute("data-footer-email")) a.textContent = EMAIL;
        a.hidden = false;
      } else if (!a.hasAttribute("data-footer-email")) {
        a.removeAttribute("href");
        a.classList.add("is-unset");
        a.textContent = "Email address not set yet";
      }
    });
    var phoneItem = $('[data-contact="phone"]');
    var phoneLink = $("[data-phone-link]");
    if (PHONE && phoneItem && phoneLink) {
      phoneLink.href = "tel:" + PHONE.replace(/[^\d+]/g, "");
      phoneLink.textContent = PHONE;
      phoneItem.hidden = false;
    }
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Header: scrolled state ---------- */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("[data-nav]");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) setOpen(false); });
  }

  /* ---------- Active section in nav ---------- */
  function initActiveNav() {
    if (!("IntersectionObserver" in window)) return;
    var links = $$('.site-nav ul a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        var link = map[entry.target.id];
        if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Repair request form ---------- */
  function initForm() {
    var form = $("[data-repair-form]");
    if (!form) return;
    var select = $("[data-service-select]", form);
    var modeBox = $("[data-form-mode]");
    var hint = $("[data-form-hint]");
    var submitBtn = $("[data-submit]", form);
    var submitLabel = $("[data-submit-label]", form);
    var result = $("[data-form-result]");
    var lastSummary = "";

    // Fill the service dropdown from the service cards, so prices/services live in one place.
    var notSure = select.querySelector('option[value="Not sure"]');
    $$("[data-service]").forEach(function (card) {
      var name = card.getAttribute("data-service");
      var price = $(".price", card);
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name + (price && /\$/.test(price.textContent) ? " (" + price.textContent.trim() + ")" : " (quote)");
      select.insertBefore(opt, notSure);
    });

    // "Request" links on service cards preselect that service.
    $$("[data-pick]").forEach(function (link) {
      link.addEventListener("click", function () {
        select.value = link.getAttribute("data-pick");
        clearError(select);
      });
    });

    // Tell the visitor up front what pressing the button will do.
    var modeIcon = '<svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>';
    if (MODE === "demo") {
      modeBox.innerHTML = modeIcon + "<div><strong>Demo mode.</strong><p>This form isn’t connected to an inbox yet, so nothing will be sent. You’ll see a preview of the request instead.</p></div>";
      modeBox.hidden = false;
      submitLabel.textContent = "Preview request";
    } else if (MODE === "email") {
      hint.textContent = "This opens your email app with your request filled in. It’s sent when you press Send there.";
      submitLabel.textContent = "Continue in email";
    } else {
      hint.textContent = "Nothing is booked or charged by sending this.";
    }

    // Live error clearing
    form.addEventListener("input", function (e) { clearError(e.target); });
    form.addEventListener("change", function (e) { clearError(e.target); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var data = collect();
      lastSummary = summarize(data);

      if (MODE === "endpoint") return sendToEndpoint(data);
      if (MODE === "email") return openEmail(data);
      return showDemo(data);
    });

    $("[data-result-reset]").addEventListener("click", function () {
      form.reset();
      result.hidden = true;
      form.hidden = false;
      if (MODE === "demo") modeBox.hidden = false;
      $("#f-name").focus();
    });

    $("[data-result-copy]").addEventListener("click", function (e) {
      var btn = e.currentTarget;
      var label = $("span", btn);
      copyText(lastSummary).then(function () {
        label.textContent = "Copied";
      }, function () {
        label.textContent = "Select the text above to copy";
      });
      setTimeout(function () { label.textContent = "Copy request text"; }, 2500);
    });

    /* --- validation --- */
    var messages = {
      name: "Please enter your name.",
      email: "Please enter a valid email address so I can reply.",
      device_type: "Please choose desktop or laptop.",
      device_model: "Please add the make and model, or “custom build” / “not sure”.",
      os: "Please choose an operating system, or “Not sure”.",
      service: "Please choose a service, or “Not sure”.",
      problem: "Please describe the problem in a few words.",
      preserve_files: "Please let me know about your files."
    };

    function fieldWrap(el) { return el.closest(".field"); }
    function setError(name, msg) {
      var out = $('[data-error-for="' + name + '"]', form);
      var input = form.elements[name];
      var first = input && (input.length && !input.tagName ? input[0] : input);
      if (out) out.textContent = msg;
      if (first) {
        var wrap = fieldWrap(first);
        if (wrap) wrap.classList.add("has-error");
        if (first.setAttribute && first.type !== "radio") {
          first.setAttribute("aria-invalid", "true");
          if (out) { out.id = "err-" + name; first.setAttribute("aria-describedby", out.id); }
        }
      }
    }
    function clearError(el) {
      if (!el || !el.name) return;
      var wrap = fieldWrap(el);
      if (wrap) wrap.classList.remove("has-error");
      el.removeAttribute && el.removeAttribute("aria-invalid");
      var out = $('[data-error-for="' + el.name + '"]', form);
      if (out) out.textContent = "";
    }
    function validate() {
      var firstBad = null;
      Object.keys(messages).forEach(function (name) {
        var el = form.elements[name];
        var value = (el.value || "").trim();
        var ok = value.length > 0;
        if (ok && name === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        if (!ok) {
          setError(name, messages[name]);
          if (!firstBad) firstBad = el.length && !el.tagName ? el[0] : el;
        }
      });
      if (firstBad) {
        firstBad.focus({ preventScroll: true });
        firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        return false;
      }
      return true;
    }

    /* --- data --- */
    function collect() {
      var get = function (n) { return (form.elements[n].value || "").trim(); };
      return {
        name: get("name"), email: get("email"), phone: get("phone"),
        device_type: get("device_type"), device_model: get("device_model"), os: get("os"),
        service: get("service"), problem: get("problem"), preserve_files: get("preserve_files"),
        _gotcha: get("_gotcha")
      };
    }
    function summarize(d) {
      return [
        "REPAIR REQUEST",
        "",
        "Name: " + d.name,
        "Email: " + d.email,
        "Phone: " + (d.phone || "not given"),
        "",
        "Device type: " + d.device_type,
        "Make / model: " + d.device_model,
        "Operating system: " + d.os,
        "Requested service: " + d.service,
        "Important files to preserve: " + d.preserve_files,
        "",
        "Problem:",
        d.problem
      ].join("\n");
    }

    /* --- outcomes --- */
    function showResult(opts) {
      form.hidden = true;
      modeBox.hidden = true;
      var icon = $("[data-result-icon]");
      icon.classList.toggle("is-info", opts.tone !== "success");
      $("use", icon).setAttribute("href", opts.tone === "success" ? "#i-circle-check-big" : opts.tone === "warn" ? "#i-triangle-alert" : "#i-info");
      $("[data-result-title]").textContent = opts.title;
      var body = $("[data-result-body]");
      body.textContent = "";
      opts.body.forEach(function (part) {
        if (typeof part === "string") body.appendChild(document.createTextNode(part));
        else { var s = document.createElement("strong"); s.textContent = part.strong; body.appendChild(s); }
      });
      var pre = $("[data-result-summary]");
      pre.hidden = !opts.showSummary;
      pre.textContent = opts.showSummary ? lastSummary : "";
      var mail = $("[data-result-mailto]");
      mail.hidden = !opts.mailto;
      if (opts.mailto) mail.href = opts.mailto;
      $("[data-mailto-label]", mail).textContent = opts.mailtoLabel || "Open email again";
      $("[data-result-copy]").hidden = !opts.showCopy;
      result.hidden = false;
      result.focus({ preventScroll: true });
      $(".form-shell").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    function buildMailto(d) {
      var subject = SUBJECT + ": " + d.device_type + " – " + d.service;
      return "mailto:" + encodeURIComponent(EMAIL).replace(/%40/g, "@") +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lastSummary);
    }

    function openEmail(d) {
      var href = buildMailto(d);
      window.location.href = href;
      showResult({
        tone: "info",
        title: "Almost done: check your email app",
        body: ["Your email app should have opened with the request filled in, addressed to ", { strong: EMAIL }, ". The request is only sent once you press Send there. Using webmail, or nothing opened? Copy the text below and email it instead."],
        showSummary: true, showCopy: true, mailto: href
      });
    }

    function showDemo() {
      showResult({
        tone: "info",
        title: "Demo preview: nothing was sent",
        body: ["This form isn’t connected to an inbox yet, so your request has ", { strong: "not" }, " been sent. Here’s what would be sent once it is:"],
        showSummary: true, showCopy: true
      });
    }

    function sendToEndpoint(d) {
      submitBtn.disabled = true;
      var oldLabel = submitLabel.textContent;
      submitLabel.textContent = "Sending…";
      var fd = new FormData(form);
      fd.append("_subject", SUBJECT + ": " + d.device_type + " – " + d.service);
      if (d.email) fd.append("_replyto", d.email);

      fetch(ENDPOINT, { method: "POST", body: fd, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("Status " + res.status);
          showResult({
            tone: "success",
            title: "Request sent",
            body: ["Thanks, " + d.name + ". I’ve got your request and will reply to ", { strong: d.email }, " to set up a drop-off time."]
          });
        })
        .catch(function () {
          var fallback = EMAIL ? buildMailto(d) : null;
          showResult({
            tone: "warn",
            title: "Your request didn’t go through",
            body: EMAIL
              ? ["Something went wrong sending the form, so nothing was received. You can send the same request by email instead, to ", { strong: EMAIL }, "."]
              : ["Something went wrong sending the form, so nothing was received. Please try again in a little while. Your request is below so you don’t lose it."],
            showSummary: true, showCopy: true, mailto: fallback, mailtoLabel: "Send by email"
          });
        })
        .then(function () {
          submitBtn.disabled = false;
          submitLabel.textContent = oldLabel;
        });
    }

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      return new Promise(function (resolve, reject) {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy") ? resolve() : reject(); } catch (err) { reject(err); }
        document.body.removeChild(ta);
      });
    }
  }

  function init() {
    initContact();
    initHeader();
    initNav();
    initActiveNav();
    initForm();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
