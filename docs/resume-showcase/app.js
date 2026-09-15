/* ---------------------------------------------------------------------------
 * Interactive Resume Showcase — presentation layer only.
 * No resume content is duplicated here. This file maps template names to
 * assets produced by the existing Resume-as-Code pipeline (CI-generated):
 *   assets/previews/general-<template>.png  (first-page render, fallback)
 *   assets/pdfs/Chirayu-Babu-Jaysawal-general-<template>.pdf
 *
 * The primary preview renders the ACTUAL generated PDF with PDF.js:
 *   - page 1 scaled to fit the preview container (exact aspect ratio)
 *   - sharp backing store at devicePixelRatio
 *   - an annotation layer built from the PDF's real link annotations,
 *     positioned with the same viewport used to draw the canvas
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

  var DEFAULT_ID = "ats";

  var buttonsHost = document.getElementById("template-buttons");
  var statusEl = document.getElementById("template-status");
  var preview = document.getElementById("preview");
  var pdfStage = document.getElementById("pdf-stage");
  var pdfCanvas = document.getElementById("pdf-canvas");
  var pdfLinks = document.getElementById("pdf-links");
  var previewImage = document.getElementById("preview-image");
  var previewCaption = document.getElementById("preview-caption");
  var previewLoading = document.getElementById("preview-loading");
  var openLink = document.getElementById("open-pdf");
  var downloadLink = document.getElementById("download-pdf");
  var actionsHint = document.getElementById("actions-hint");

  // PDF.js is loaded as a pinned classic script; the worker must match.
  var PDFJS_READY = typeof window.pdfjsLib !== "undefined";
  if (PDFJS_READY) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }


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

  function markActive(id) {
    var buttons = buttonsHost.querySelectorAll("button");
    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.templateId === id ? "true" : "false"
      );
    });
  }

  /* Clean static fallback (no fake clickable regions) when PDF.js is
   * unavailable or a document fails to load. Open PDF stays available. */
  function showFallback(template) {
    pdfCanvas.hidden = true;
    pdfLinks.hidden = true;
    previewImage.hidden = false;
    previewImage.src = template.preview;
    previewImage.alt =
      "First-page preview of the " + template.label +
      " resume for Chirayu Babu Jaysawal";
  }

  function showPdf() {
    previewImage.hidden = true;
    pdfCanvas.hidden = false;
    pdfLinks.hidden = false;

  function applyMeta(template) {
    var label = template.label;
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

  /* ------------------------------------------------------------------ *
   * PDF.js rendering
   *
   * Scale strategy: take a scale-1 viewport, then pick the largest
   * scale that fits BOTH the container width and a viewport-height
   * budget, preserving the PDF's exact aspect ratio. The canvas backing
   * store is multiplied by devicePixelRatio for sharpness while its CSS
   * size stays at the 1x fit size, so annotation rectangles (computed
   * with the SAME viewport) map 1:1 onto CSS pixels.
   * ------------------------------------------------------------------ */
  function fitScale(unitViewport) {
    var available = pdfStage.clientWidth || preview.clientWidth || 640;
    var heightBudget = Math.max(window.innerHeight * 0.78, 420);
    return Math.min(
      available / unitViewport.width,
      heightBudget / unitViewport.height
    );
  }

  /* Annotation layer built ONLY from the PDF's own link annotations,
   * transformed with the exact viewport used for the canvas render. */
  function buildLinkLayer(page, viewport) {
    pdfLinks.innerHTML = "";
    pdfLinks.style.width = viewport.width + "px";
    pdfLinks.style.height = viewport.height + "px";
    return page.getAnnotations().then(function (annotations) {
      var fragment = document.createDocumentFragment();
      annotations.forEach(function (annotation) {
        if (annotation.subtype !== "Link") return;
        var url = annotation.url || annotation.unsafeUrl;
        if (!url || !/^https?:/i.test(url)) return; // skip internal dests
        var rect = viewport.convertToViewportRectangle(annotation.rect);
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.className = "pdf-link";
        anchor.setAttribute("aria-label", url);
        anchor.style.left = Math.min(rect[0], rect[2]) + "px";
        anchor.style.top = Math.min(rect[1], rect[3]) + "px";
        anchor.style.width = Math.abs(rect[2] - rect[0]) + "px";
        anchor.style.height = Math.abs(rect[3] - rect[1]) + "px";
        fragment.appendChild(anchor);
      });
      pdfLinks.appendChild(fragment);
    });
  }

  }

  function renderCurrent(token) {
    if (!currentDoc) return;
    currentDoc.getPage(1).then(function (page) {
      if (token !== renderJob) return;
      var unit = page.getViewport({ scale: 1 });
      var viewport = page.getViewport({ scale: fitScale(unit) });
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      pdfCanvas.width = Math.floor(viewport.width * dpr);
      pdfCanvas.height = Math.floor(viewport.height * dpr);
      pdfCanvas.style.width = viewport.width + "px";
      pdfCanvas.style.height = viewport.height + "px";

      var context = pdfCanvas.getContext("2d");
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      return page.render({
        canvasContext: context,
        viewport: viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
      }).promise.then(function () {
        if (token !== renderJob) return;
        return buildLinkLayer(page, viewport);
      }).then(function () {
        if (token !== renderJob) return;
        showPdf();
        previewLoading.classList.remove("is-visible");
        preview.classList.remove("is-switching");
      });
    }).catch(function () {
      if (token !== renderJob) return;
      showFallback(current);
      previewLoading.classList.remove("is-visible");
      preview.classList.remove("is-switching");
    });
  }

  function loadDocument(template) {
    var token = ++renderJob;
    if (currentDocUrl === template.pdf && currentDoc) {
      renderCurrent(token);
      return;
    }
    window.pdfjsLib.getDocument(template.pdf).promise.then(function (doc) {
      if (token !== renderJob) {
        doc.destroy();
        return;
      }
      if (currentDoc) currentDoc.destroy();
      currentDoc = doc;
      currentDocUrl = template.pdf;
      renderCurrent(token);
    }).catch(function () {
      if (token !== renderJob) return;
      showFallback(template);
      previewLoading.classList.remove("is-visible");
      preview.classList.remove("is-switching");
    });
  }

  function apply(template) {
    applyMeta(template);
    if (PDFJS_READY) {
      loadDocument(template);
    } else {
      showFallback(template);
      previewLoading.classList.remove("is-visible");
      preview.classList.remove("is-switching");
    }
  }

  function select(id) {
    if (current && current.id === id) return;
    var template = findTemplate(id);
    current = template;
    markActive(template.id);

    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      apply(template);
      return;
    }

    preview.classList.add("is-switching");
    previewLoading.classList.add("is-visible");
    apply(template);
    // Failsafe: never leave the preview hidden if an async step stalls.
    setTimeout(function () {
      previewLoading.classList.remove("is-visible");
      preview.classList.remove("is-switching");
    }, 2500);
  }

  // Re-fit the active page when the viewport changes (debounced).
  window.addEventListener("resize", function () {
    if (!currentDoc) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      renderCurrent(++renderJob);
    }, 150);
  });

  buildButtons();
  select(DEFAULT_ID);
})();


  var current = null;
  var currentDoc = null;      // PDF.js document handle for the active template
  var currentDocUrl = null;
  var renderJob = 0;          // token guarding against stale async renders
  var resizeTimer = null;
