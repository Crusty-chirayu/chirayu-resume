/* ---------------------------------------------------------------------------
 * Interactive Resume Showcase — presentation layer only.
 * No resume content is duplicated here. This file maps template names to
 * assets produced by the existing Resume-as-Code pipeline (CI-generated):
 *   assets/previews/general-<template>.png  (first-page render of the PDF)
 *   assets/pdfs/Chirayu-Babu-Jaysawal-general-<template>.pdf
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";

  var TEMPLATES = [
    {
      id: "ats",
      label: "ATS",
      tagline: "Recruiter-friendly, dense, machine-readable layout.",
      preview: "assets/previews/general-ats.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-ats.pdf"
    },
    {
      id: "modern",
      label: "Modern",
      tagline: "Clean contemporary presentation with strong visual hierarchy.",
      preview: "assets/previews/general-modern.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-modern.pdf"
    },
    {
      id: "developer",
      label: "Developer",
      tagline: "Classic centred serif with compact developer-style sections.",
      preview: "assets/previews/general-developer.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-developer.pdf"
    },
    {
      id: "minimal",
      label: "Minimal",
      tagline: "Extremely clean, restrained, typography-first design.",
      preview: "assets/previews/general-minimal.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-minimal.pdf"
    },
    {
      id: "executive",
      label: "Executive",
      tagline: "Premium senior-engineer style with strong hierarchy.",
      preview: "assets/previews/general-executive.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-executive.pdf"
    },
    {
      id: "technical",
      label: "Technical",
      tagline: "Dense engineering layout emphasizing skills and projects.",
      preview: "assets/previews/general-technical.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-technical.pdf"
    },
    {
      id: "editorial",
      label: "Editorial",
      tagline: "Elegant magazine-inspired typography and spacing.",
      preview: "assets/previews/general-editorial.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-editorial.pdf"
    },
    {
      id: "terminal",
      label: "Terminal",
      tagline: "Subtle coding aesthetics — professional and printable.",
      preview: "assets/previews/general-terminal.png",
      pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-terminal.pdf"
    }
  ];

  var PORTFOLIO_URL = "https://portfolio-lac-kappa-49.vercel.app";

  var DEFAULT_ID = "ats";

  var buttonsHost = document.getElementById("template-buttons");
  var statusEl = document.getElementById("template-status");
  var preview = document.getElementById("preview");
  var previewImage = document.getElementById("preview-image");
  var previewCaption = document.getElementById("preview-caption");
  var previewLoading = document.getElementById("preview-loading");
  var openLink = document.getElementById("open-pdf");
  var downloadLink = document.getElementById("download-pdf");
  var actionsHint = document.getElementById("actions-hint");

  var current = null;

  function findTemplate(id) {
    for (var i = 0; i < TEMPLATES.length; i++) {
      if (TEMPLATES[i].id === id) return TEMPLATES[i];
    }
    return TEMPLATES[0];
  }

  function buildButtons() {
    TEMPLATES.forEach(function (template) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = template.label;
      button.dataset.templateId = template.id;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        select(template.id);
      });
      buttonsHost.appendChild(button);
    });
  }

  function apply(template) {
    var label = template.label;
    previewImage.src = template.preview;
    previewImage.alt =
      "First-page preview of the " + label + " resume for Chirayu Babu Jaysawal";
    previewCaption.textContent = label + " — " + template.tagline;
    openLink.href = template.pdf;
    openLink.setAttribute(
      "aria-label",
      "Open the " + label + " resume PDF in a new tab"
    );
    downloadLink.href = template.pdf;
    downloadLink.setAttribute(
      "aria-label",
      "Download the " + label + " resume PDF"
    );
    downloadLink.setAttribute(
      "download",
      template.pdf.substring(template.pdf.lastIndexOf("/") + 1)
    );
    actionsHint.textContent =
      "The " + label + " PDF is the exact output of the repository's verified build pipeline.";
    statusEl.innerHTML =
      "Active template: <strong>" + label + "</strong>";
  }

  function markActive(id) {
    var buttons = buttonsHost.querySelectorAll("button");
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.templateId === id ? "true" : "false"
      );
    });
  }

  function select(id) {
    if (current && current.id === id) return;
    var template = findTemplate(id);
    current = template;
    markActive(template.id);

    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || preview.classList.contains("is-switching")) {
      apply(template);
      return;
    }

    preview.classList.add("is-switching");
    previewLoading.classList.add("is-visible");

    var swapped = false;
    function reveal() {
      if (swapped) return;
      swapped = true;
      apply(template);
      previewLoading.classList.remove("is-visible");
      requestAnimationFrame(function () {
        preview.classList.remove("is-switching");
      });
    }

    previewImage.onload = reveal;
    previewImage.onerror = reveal;
    setTimeout(reveal, 900); // never stay hidden if the image stalls
  }

  buildButtons();
  select(DEFAULT_ID);
})();
