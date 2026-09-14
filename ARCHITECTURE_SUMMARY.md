# Architecture Summary – Resume‑as‑Code System

## 1. Overview
A maintainable, testable, and extensible résumé generation framework that separates **content**, **role‑specific selection**, and **visual styling**.

## 2. Core Concepts

| Layer | Responsibility | Files / Directories |
|------|----------------|---------------------|
| **Master Content** | Single source of truth for all data (personal info, education, experience, projects, skills, certifications). | `master-data.yaml`, `content/*.tex` |
| **Profiles** | Choose a subset/order of master content, optionally add role‑specific wording. | `profiles/<profile>/resume.tex` |
| **Templates** | Apply visual styling (layout, spacing, fonts) without altering content. | `templates/*.tex` |
| **Build Pipeline** | Compile LaTeX for every profile‑template combination, produce versioned PDFs, publish as artifacts. | `.github/workflows/build-resume.yml` |

## 3. Directory Layout (post‑implementation)

```
/content/
   summary.tex
   education.tex
   experience.tex
   certifications.tex
   projects/
       Aiely.tex
       BrainScan.tex
       ...
   skills/
       ai-ml-skills.tex
       back-end-skills.tex
       ...

/profiles/
   general/resume.tex
   fullstack/resume.tex
   ai-ml/resume.tex
   software-engineer/resume.tex

/templates/
   ats.tex
   modern.tex
   developer.tex

/.github/workflows/
   build-resume.yml

README.md
ARCHITECTURE_SUMMARY.md
master-data.yaml
```

## 3.1 Master Content (`master-data.yaml`)
* Holds all immutable data (name, headline, contact info, skills, projects, etc.).
* Stored as structured YAML for easy parsing and versioning.

## 3.2 Profiles (`profiles/*.tex`)
* Each profile imports a specific visual `templates/*.tex` file.
* Determines which sections (projects, skills) to feature and in what order.
* Example: `fullstack/resume.tex` emphasizes backend & frontend skills.

## 3.3 Templates (`templates/*.tex`)
* Pure LaTeX modifications that affect spacing, heading style, or bullet formatting.
* Keep the document ATS‑compatible (black‑and‑white, minimal underlines).

## 3.4 Build Pipeline (GitHub Actions)
* Matrix strategy (`profile` × `template`) → 12 builds per push.
* Uses `xelatex` to generate a PDF.
* PDF is renamed to `Chirayu-Babu-Jaysawal-<profile>-<template>.pdf`.
* PDF is uploaded as an artifact; future steps could publish to GitHub Releases.

## 4. Generation Workflow (local)
1. `cp profiles/<profile>/resume.tex resume.tex`
2. `xelatex -interaction=nonstopmode resume.tex`
3. `mv resume.pdf Chirayu-Babu-Jaysawal-<profile>-<template>.pdf`

## 5. Extensibility
* Add new **profiles** by creating a new folder under `profiles/` with its own `resume.tex`.
* Add new **templates** under `templates/` and reference them from any profile.
* Update `master-data.yaml` to modify core data; rerun the CI pipeline to propagate changes.

## 6. Verification Checklist
- [ ] All 12 PDFs compile without errors.
- [ ] PDF filenames follow the convention `Chirayu-Babu-Jaysawal-<profile>-<template>.pdf`.
- [ ] No duplicate or missing sections across PDFs.
- [ ] Visual styling matches the intended template (ATS, modern, developer).
- [ ] Updated README accurately reflects the workflow.

---

*Document generated on 2025‑09‑25.*