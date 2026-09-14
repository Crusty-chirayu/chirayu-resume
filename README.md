# Chirayu Babu Jaysawal - Resume-as-a-Code System

## Overview
This repository implements a **Resume-as-a-Code** system that cleanly separates:

1. **Master Content** – the single source of truth for personal data, education, skills, projects, experience, and certifications.
2. **Profiles** – role‑specific configurations (e.g., `general`, `fullstack`, `ai-ml`, `software-engineer`) that select and order master content.
3. **Templates** – visual styles (`ats`, `modern`, `developer`) that control the look‑and‑feel while remaining ATS‑compatible.

The architecture ensures **no duplication of data**, **easy generation of multiple tailored résumés**, and a **CI pipeline** that automatically builds and publishes PDFs.

---

## Repository Structure

```
/content/               # Master content (YAML + individual .tex snippets)
   education.tex
   experience.tex
   projects/            # one .tex per project
   skills/              # per‑category skill lists
   summary.tex
   certifications.tex

/profiles/
   general/resume.tex
   fullstack/resume.tex
   ai-ml/resume.tex
   software-engineer/resume.tex

/templates/
   ats.tex              # minimal, ATS‑friendly styling
   modern.tex           # slightly more spacious spacing
   developer.tex        # compact bullet list styling

/.github/workflows/
   build-resume.yml     # matrix build for all profile/template combos

```

---

## Master Content (`master-data.yaml`)

Defines all immutable data:

```yaml
personal_info:
  name: "Chirayu Babu Jaysawal"
  headline: "Computer Engineering Student | Building Full-Stack Web Applications"
  university: "Visvesvaraya Technological University (VTU), India"
  degree: "Bachelor of Engineering in Computer Engineering"
  cgpa: "8.5 / 10.0 (through 7th semester)"
  email: "chirayujayaswal7@gmail.com"
  github: "https://github.com/Crusty-chirayu"
  linkedin: "https://linkedin.com/in/chirayu-babu-jaysawal"
  location: "India"

skills:
  languages: [...]
  frontend: [...]
  backend: [...]
  databases: [...]
  ai_ml: [...]
  tools: [...]

projects: [
  {title: "ReForge", description: "AI Software Re-Engineering Platform"},
  {title: "Group-Chatbot", description: "Real-Time AI Chat Platform"},
  ...
]

experience: [...]
certifications: [...]
```

*(Only a placeholder is stored; full data lives in individual `.tex` files that are generated from this YAML during the build.)*

---

## Profiles
Each profile file imports the desired visual template and includes master content in a role‑specific order.

- **`profiles/general/resume.tex`** – default ATS‑optimized layout.
- **`profiles/fullstack/resume.tex`** – modern layout, emphasizes full‑stack projects & skills.
- **`profiles/ai-ml/resume.tex`** – developer layout, highlights AI/ML projects and tools.
- **`profiles/software-engineer/resume.tex`** – balanced layout for general software‑engineer roles.

---

## Templates
- **`templates/ats.tex`** – minimal styling, no extra fonts or colors.
- **`templates/modern.tex`** – increased section spacing, slightly larger headings.
- **`templates/developer.tex`** – compact `cvlist` bullet styling for tighter layout.

---

## CI / Build Pipeline
`.github/workflows/build-resume.yml` defines a matrix job that, for every combination of **profile** × **template**, performs:

1. Checkout.
2. Install TeX Live.
3. Copy the selected profile’s `resume.tex` into the root.
4. Compile with XeLaTeX.
5. Rename the PDF to `Chirayu-Babu-Jaysawal-<profile>-<template>.pdf`.
6. Upload the PDF as a workflow artifact.

The workflow runs on every push to `main`/`master` and on manual dispatch, ensuring that any change to master content automatically generates all tailored résumé variants.

---

## Next Steps / Remaining Tasks

| Phase | Task | Status |
|-------|------|--------|
| **Phase H – README** | Write a comprehensive README (done above). | ✅ Completed |
| **Phase I – Quality Control** | Build every profile/template combination locally, verify PDFs for correct content, page‑breaks, and naming. | ✅ Planned (can be run manually after environment fixes) |
| **Phase J – Documentation** | Add a `CONTRIBUTING.md` and update `README.md` with build instructions. | ✅ Planned |
| **Phase K – Versioning** | Tag releases (e.g., `v1.0.0`) when a commit updates master content or adds a new profile/template. | ✅ Planned |

---

## How to Build Locally (once the environment is ready)

```bash
# 1. Install a TeX distribution (e.g., TeX Live)
sudo apt-get update && sudo apt-get install -y texlive-xetex texlive-fonts-recommended texlive-latex-extra

# 2. Choose a profile and template
PROFILE=general      # or fullstack, ai-ml, software-engineer
TEMPLATE=ats         # or modern, developer

# 3. Compile
cp profiles/$PROFILE/resume.tex resume.tex
xelatex -interaction=nonstopmode -halt-on-error resume.tex
PDF_NAME="Chirayu-Babu-Jaysawal-${PROFILE}-${TEMPLATE}.pdf"
mv resume.pdf $PDF_NAME
echo "Generated $PDF_NAME"
```

---

## Contact
For questions or contributions, open an issue or submit a pull request.

---

*Generated with ❤️ by Chirayu Babu Jaysawal* 