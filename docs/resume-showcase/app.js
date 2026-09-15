/* ---------------------------------------------------------------------------
 * Interactive Resume Showcase — presentation layer only.
 * No resume content is duplicated here. This file maps template names to
 * assets produced by the existing Resume-as-Code pipeline (CI-generated).
 *
 * Primary preview renders the ACTUAL generated PDF with PDF.js:
 *   - page 1 scaled to fit the preview container (exact aspect ratio)
 *   - sharp backing store at devicePixelRatio
 *   - annotation layer from the PDF's real link annotations
 *     positioned with the SAME viewport used for canvas rendering
 * --------------------------------------------------------------------------- */
(function () {
  "use strict";

  var TEMPLATES = [
    { id: "ats", label: "ATS", tagline: "Recruiter-friendly, dense, machine-readable layout.",
      preview: "assets/previews/general-ats.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-ats.pdf" },
    { id: "modern", label: "Modern", tagline: "Clean contemporary presentation with strong visual hierarchy.",
      preview: "assets/previews/general-modern.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-modern.pdf" },
    { id: "developer", label: "Developer", tagline: "Classic centred serif with compact developer-style sections.",
      preview: "assets/previews/general-developer.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-developer.pdf" },
    { id: "minimal", label: "Minimal", tagline: "Extremely clean, restrained, typography-first design.",
      preview: "assets/previews/general-minimal.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-minimal.pdf" },
    { id: "executive", label: "Executive", tagline: "Premium senior-engineer style with strong hierarchy.",
      preview: "assets/previews/general-executive.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-executive.pdf" },
    { id: "technical", label: "Technical", tagline: "Dense engineering layout emphasizing skills and projects.",
      preview: "assets/previews/general-technical.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-technical.pdf" },
    { id: "editorial", label: "Editorial", tagline: "Elegant magazine-inspired typography and spacing.",
      preview: "assets/previews/general-editorial.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-editorial.pdf" },
    { id: "terminal", label: "Terminal", tagline: "Subtle coding aesthetics — professional and printable.",
      preview: "assets/previews/general-terminal.png", pdf: "assets/pdfs/Chirayu-Babu-Jaysawal-general-terminal.pdf" }
  ];

  var DEFAULT_ID = "ats";

  var buttonsHost = document.getElementById("template-buttons");
  var statusEl = document.getElementById("template-status");
  var preview = document.getElementById("preview");
  var pdfStage = document.getElementById("pdf-stage");
  var pdfPage = document.getElementById("pdf-page");
  var pdfCanvas = document.getElementById("pdf-canvas");
  var pdfLinks = document.getElementById("pdf-links");
  var previewImage = document.getElementById("preview-image");
  var previewCaption = document.getElementById("preview-caption");
  var previewLoading = document.getElementById("preview-loading");

  var openPdfBtn = document.getElementById("open-pdf");
  var downloadPdfBtn = document.getElementById("download-pdf");

  var current = null;
  var currentDoc = null;
  var currentDocUrl = null;
  var currentViewport = null;
  var renderJob = 0;
  var resizeTimer = null;

  function findTemplate(id) {
    for (var i = 0; i < TEMPLATES.length; i++) { if (TEMPLATES[i].id === id) return TEMPLATES[i]; }
    return TEMPLATES[0];
  }

  function buildButtons() {
    var html = "", i;
    for (i = 0; i < TEMPLATES.length; i++) {
      var t = TEMPLATES[i];
      html +=
        '<button type="button" class="template-switch__button" data-template="' +
        t.id + '" aria-pressed="false">' + t.label + "</button>";
    }
    buttonsHost.innerHTML = html;
    var btns = buttonsHost.querySelectorAll(".template-switch__button");
    for (var j = 0; j < btns.length; j++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          select(btn.getAttribute("data-template"));
        });
      })(btns[j]);
    }
  }

  function markActive(id) {
    var btns = buttonsHost.querySelectorAll(".template-switch__button");
    for (var i = 0; i < btns.length; i++) {
      var isActive = btns[i].getAttribute("data-template") === id;
      btns[i].setAttribute("aria-pressed", isActive ? "true" : "false");
      btns[i].classList.toggle("is-active", isActive);
    }
    if (statusEl) statusEl.textContent = "Active template: " + findTemplate(id).label;
  }

  function applyMeta(template) {
    if (document.title !== undefined) {
      document.title = template.label + " Resume - Chirayu Babu Jaysawal";
    }
    if (previewCaption) previewCaption.textContent = template.tagline || "";
    if (openPdfBtn) openPdfBtn.setAttribute("href", template.pdf);
    if (downloadPdfBtn) {
      downloadPdfBtn.setAttribute("href", template.pdf);
      downloadPdfBtn.setAttribute(
        "download",
        "Chirayu-Babu-Jaysawal-general-" + template.id + ".pdf"
      );
    }
  }

  function showFallback(template) {
    if (currentDoc) {
      try { currentDoc.destroy(); } catch (e) {}
      currentDoc = null;
      currentDocUrl = null;
    }
    pdfStage.classList.remove("has-pdf");
    pdfStage.classList.add("has-fallback");
    if (pdfPage) pdfPage.style.display = "none";
    pdfCanvas.style.display = "none";
    pdfLinks.innerHTML = "";
    pdfLinks.style.display = "none";
    previewImage.classList.add("pdf-fallback");
    previewImage.src = template.preview;
    previewImage.alt = template.label + " resume preview";
    previewImage.hidden = false;
  }

  function showPdf() {
    pdfStage.classList.add("has-pdf");
    pdfStage.classList.remove("has-fallback");
    if (pdfPage) pdfPage.style.display = "inline-block";
    pdfCanvas.style.display = "block";
    pdfLinks.style.display = "block";
    previewImage.hidden = true;
    previewImage.src = "";
  }


  function computeFitScale(pageViewport) {
    var availW = pdfStage.clientWidth;
    var availH = pdfStage.clientHeight;
    var pageW = pageViewport.width;
    var pageH = pageViewport.height;
    if (pageW <= 0 || pageH <= 0) return 1;
    var scaleW = availW / pageW;
    var scaleH = availH / pageH;
    var scale = Math.min(scaleW, scaleH);
    if (scale < 0.15) scale = 0.15;
    if (scale > 3.5) scale = 3.5;
    return scale;
  }

  function renderCanvas(page, viewport) {
    var dpr = window.devicePixelRatio || 1;
    if (dpr > 2.5) dpr = 2.5;
    pdfCanvas.width = Math.floor(viewport.width * dpr);
    pdfCanvas.height = Math.floor(viewport.height * dpr);
    pdfCanvas.style.width = Math.floor(viewport.width) + "px";
    pdfCanvas.style.height = Math.floor(viewport.height) + "px";
    var ctx = pdfCanvas.getContext("2d");
    ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var rc = { canvasContext: ctx, viewport: viewport };
    var renderTask = page.render(rc);
    return renderTask.promise;
  }

  function buildLinkLayer(page, viewport) {
    pdfLinks.innerHTML = "";
    var pageW = Math.floor(viewport.width);
    var pageH = Math.floor(viewport.height);
    if (pdfPage) {
      pdfPage.style.width = pageW + "px";
      pdfPage.style.height = pageH + "px";
    }
    return page.getAnnotations().then(function (annotations) {
      for (var i = 0; i < annotations.length; i++) {
        var a = annotations[i];
        if (!a || !a.subtype || a.subtype !== "Link") continue;
        var url = null;
        try { url = (a.uri || a.actions && a.actions.URI); } catch (e) {}
        if (!url || typeof url !== "string") continue;
        if (!/^https?:\/\//i.test(url)) continue;
        var rect = viewport.convertToViewportRectangle(a.rect);
        var x1 = Math.min(rect[0], rect[2]);
        var x2 = Math.max(rect[0], rect[2]);
        var y1 = Math.min(rect[1], rect[3]);
        var y2 = Math.max(rect[1], rect[3]);
        var w = x2 - x1;
        var h = y2 - y1;
        if (w <= 0 || h <= 0) continue;
        var link = document.createElement("a");
        link.className = "pdf-link";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.title = url;
        link.style.left = Math.round(x1) + "px";
        link.style.top = Math.round(y1) + "px";
        link.style.width = Math.round(w) + "px";
        link.style.height = Math.round(h) + "px";
        pdfLinks.appendChild(link);
      }
    }).catch(function () {});
  }

  function renderCurrent(renderToken) {
    if (renderToken !== renderJob) return;
    if (!currentDoc) {
      showFallback(current);
      previewLoading.classList.remove("is-visible");
      return;
    }
    try {
      currentDoc.getPage(1).then(function (page) {
        if (renderToken !== renderJob) return;
        var baseViewport = page.getViewport({ scale: 1 });
        var scale = computeFitScale(baseViewport);
        var viewport = page.getViewport({ scale: scale });
        currentViewport = viewport;
        return renderCanvas(page, viewport).then(function () {
          if (renderToken !== renderJob) return;
          return buildLinkLayer(page, viewport);
        }).then(function () {
          if (renderToken !== renderJob) return;
          showPdf();
          previewLoading.classList.remove("is-visible");
        }).catch(function () {
          if (renderToken !== renderJob) return;
          showFallback(current);
          previewLoading.classList.remove("is-visible");
        });
      }).catch(function () {
        if (renderToken !== renderJob) return;
        showFallback(current);
        previewLoading.classList.remove("is-visible");
      });
    } catch (e) {
      if (renderToken !== renderJob) return;
      showFallback(current);
      previewLoading.classList.remove("is-visible");
    }
  }

  function loadDocument(template) {
    var token = ++renderJob;
    previewLoading.classList.add("is-visible");
    if (currentDocUrl === template.pdf && currentDoc) {
      renderCurrent(token);
      return;
    }
    pdfStage.classList.remove("has-pdf");
    pdfStage.classList.add("has-fallback");
    if (pdfPage) pdfPage.style.display = "none";
    pdfCanvas.style.display = "none";
    pdfLinks.innerHTML = "";
    pdfLinks.style.display = "none";
    try {
      var pdf = window.pdfjsLib.getDocument(template.pdf);
      pdf.promise.then(function (doc) {
        if (token !== renderJob) {
          try { doc.destroy(); } catch (e) {}
          return;
        }
        if (currentDoc) {
          try { currentDoc.destroy(); } catch (e) {}
        }
        currentDoc = doc;
        currentDocUrl = template.pdf;
        renderCurrent(token);
      }).catch(function () {
        if (token !== renderJob) return;
        showFallback(template);
        previewLoading.classList.remove("is-visible");
      });
    } catch (e) {
      if (token !== renderJob) return;
      showFallback(template);
      previewLoading.classList.remove("is-visible");
    }
  }

  function whenPdfJsReady(callback) {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      callback(true);
      return;
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var pdfjs = window.pdfjsLib;
      if (pdfjs) {
        clearInterval(timer);
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        callback(true);
      } else if (tries > 40) {
        clearInterval(timer);
        callback(false);
      }
    }, 120);
  }

  function apply(template, token) {
    applyMeta(template);
    if (window.pdfjsLib) {
      loadDocument(template);
    } else {
      var tries2 = 0;
      var timer2 = setInterval(function () {
        tries2++;
        var pdfjs2 = window.pdfjsLib;
        if (pdfjs2) {
          clearInterval(timer2);
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          loadDocument(template);
        } else if (tries2 > 40) {
          clearInterval(timer2);
          showFallback(template);
          previewLoading.classList.remove("is-visible");
        }
      }, 120);
    }
  }

  function select(id) {
    var template = findTemplate(id);
    if (!template) template = findTemplate(DEFAULT_ID);
    if (current && current.id === template.id) return;
    current = template;
    var token = ++renderJob;
    markActive(template.id);
    previewLoading.classList.add("is-visible");
    apply(template, token);
    setTimeout(function () {
      if (token === renderJob) {
        previewLoading.classList.remove("is-visible");
      }
    }, 6000);
  }

  if (window.addEventListener) {
    window.addEventListener(
      "resize",
      function () {
        if (!currentDoc) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          if (currentViewport && currentViewport.width > 0 && currentViewport.height > 0) {
            var token = ++renderJob;
            currentDoc.getPage(1).then(function (page) {
              if (token !== renderJob) return;
              var baseViewport = page.getViewport({ scale: 1 });
              var scale = computeFitScale(baseViewport);
              var viewport = page.getViewport({ scale: scale });
              currentViewport = viewport;
              renderCanvas(page, viewport).then(function () {
                buildLinkLayer(page, viewport);
              }).catch(function () {});
            }).catch(function () {});
          }
        }, 150);
      }
    );
  }

  whenPdfJsReady(function (ready) {
    if (!ready) {
      showFallback(findTemplate(DEFAULT_ID));
    } else {
      buildButtons();
      select(DEFAULT_ID);
    }
  });

})();
