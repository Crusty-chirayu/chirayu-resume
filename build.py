#!/usr/bin/env python3
"""Build one role-specific resume from master data, a profile, and a template."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).parent.resolve()
PROFILES = ROOT / "profiles"
TEMPLATES = ROOT / "templates"
GENERATED = ROOT / "generated"
DIST = ROOT / "dist"
REQUIRED_PERSONAL = {"name", "headline", "email", "github", "linkedin", "location"}
REQUIRED_SKILLS = {"languages", "frontend", "backend", "databases", "ai_ml", "tools"}
SKILL_TITLES = {"ai_ml": "AI / ML"}


def skill_title(category: str) -> str:
    """Human-readable skill category label (keeps acronyms intact)."""
    if category in SKILL_TITLES:
        return SKILL_TITLES[category]
    return category.replace("_", " ").title()


def load_yaml(path: Path) -> dict[str, Any]:
    try:
        with path.open(encoding="utf-8") as source:
            value = yaml.safe_load(source)
    except yaml.YAMLError as error:
        raise ValueError(f"Invalid YAML in {path}: {error}") from error
    if not isinstance(value, dict):
        raise ValueError(f"Expected a mapping in {path}")
    return value


def validate_master(data: dict[str, Any]) -> None:
    personal = data.get("personal_info")
    skills = data.get("skills")
    projects = data.get("projects")
    if not isinstance(personal, dict) or not REQUIRED_PERSONAL <= personal.keys():
        missing = sorted(REQUIRED_PERSONAL - set(personal or {}))
        raise ValueError(f"master-data.yaml is missing personal_info fields: {', '.join(missing)}")
    if not isinstance(skills, dict) or not REQUIRED_SKILLS <= skills.keys():
        missing = sorted(REQUIRED_SKILLS - set(skills or {}))
        raise ValueError(f"master-data.yaml is missing skill categories: {', '.join(missing)}")
    if not isinstance(projects, list) or any(not isinstance(item, dict) for item in projects):
        raise ValueError("master-data.yaml projects must be a list of mappings")
    for project in projects:
        if not project.get("id") or not project.get("title") or not project.get("description"):
            raise ValueError("Every project needs id, title, and description")


def latex_escape(value: Any) -> str:
    text = str(value)
    replacements = {"\\": r"\textbackslash{}", "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#", "_": r"\_", "{": r"\{", "}": r"\}"}
    return "".join(replacements.get(character, character) for character in text)


def profile_data(profile: str) -> dict[str, Any]:
    path = PROFILES / f"{profile}.yaml"
    if not path.is_file():
        raise ValueError(f"Unknown profile '{profile}'. Expected one of: general, fullstack, java, ai-ml, software-engineer")
    return load_yaml(path)


def render(data: dict[str, Any], profile: dict[str, Any], template: str) -> str:
    personal = data["personal_info"]
    projects = {item["id"]: item for item in data["projects"]}
    selected = []
    for project_id in profile["projects"]:
        if project_id not in projects:
            raise ValueError(f"Profile '{profile['name']}' selects unknown project '{project_id}'")
        selected.append(projects[project_id])

    email_link = rf"\href{{mailto:{personal['email']}}}{{{latex_escape(personal['email'])}}}"
    github_link = rf"\href{{{personal['github']}}}{{GitHub}}"
    linkedin_link = rf"\href{{{personal['linkedin']}}}{{LinkedIn}}"
    portfolio_url = str(personal.get("portfolio", "") or "").strip()
    portfolio_link = rf"\href{{{portfolio_url}}}{{Portfolio}}" if portfolio_url else ""
    location = latex_escape(personal["location"])
    affiliation = latex_escape(personal.get("university", ""))
    contact = email_link + r" \ResumeSep " + location
    links = github_link + r" \ResumeSep " + linkedin_link
    if portfolio_link:
        links += r" \ResumeSep " + portfolio_link

    lines = [
        r"\documentclass[10pt]{article}",
        r"\usepackage[T1]{fontenc}",
        r"\usepackage[utf8]{inputenc}",
        r"\usepackage{hyperref}",
        r"\usepackage{enumitem}",
        r"\usepackage{geometry}",
        r"\input{templates/" + template + r".tex}",
        r"\pagestyle{empty}",
        r"\begin{document}",
        rf"\ResumeTop{{{latex_escape(personal['name'])}}}{{{latex_escape(personal['headline'])}}}"
        rf"{{{contact}}}{{{affiliation}}}{{{links}}}",
        r"\section*{Profile}",
        rf"\ResumeParagraph{{{latex_escape(profile['summary'])}}}",
        r"\section*{Education}",
    ]
    for education in data.get("education", []):
        degree = latex_escape(education["degree"])
        year = latex_escape(education.get("year", ""))
        institution = latex_escape(education.get("institution", ""))
        place = latex_escape(education.get("location", ""))
        score = latex_escape(education.get("score", ""))
        if institution:
            detail = institution + (", " + place if place else "")
            lines.append(rf"\ResumeEntryHead{{{degree}}}{{{year}}}")
            lines.append(rf"\ResumeEntrySub{{{detail}}}{{{score}}}")
        else:
            right = r" \ResumeSep ".join(part for part in (score, year) if part)
            lines.append(rf"\ResumeEntryHead{{{degree}}}{{{right}}}")
    lines.append(r"\section*{Technical Skills}")
    lines.append(r"\begin{resumeskills}")
    for category in profile["skills"]:
        values = data["skills"].get(category, [])
        if not values:
            continue
        label = skill_title(category)
        lines.append(rf"\ResumeSkillLine{{{label}}}{{{latex_escape(', '.join(values))}}}")
    lines.append(r"\end{resumeskills}")
    lines.append(r"\section*{Projects}")
    for project in selected:
        tech = ", ".join(project.get("tech") or [])
        title = latex_escape(project["title"])
        subtitle = latex_escape(project.get("subtitle", "") or "")
        if subtitle:
            title = title + f" -- {subtitle}"
        lines.append(rf"\ResumeProjectHead{{{title}}}{{{latex_escape(tech)}}}")
        lines.append(rf"\ResumeProjectDesc{{{latex_escape(project.get('description', ''))}}}")
        bullets = project.get("bullets") or []
        if bullets:
            lines.append(r"\begin{resumebullets}")
            lines.extend(r"\item " + latex_escape(bullet) for bullet in bullets)
            lines.append(r"\end{resumebullets}")
    if data.get("achievements"):
        lines.append(r"\section*{Achievements \& Certifications}")
        lines.append(r"\begin{resumebullets}")
        lines.extend(r"\item " + latex_escape(item) for item in data["achievements"])
        lines.append(r"\end{resumebullets}")
    if data.get("certifications"):
        lines.append(r"\section*{Certifications}")
        lines.append(r"\begin{resumebullets}")
        for item in data["certifications"]:
            name = item.get("name") if isinstance(item, dict) else item
            lines.append(r"\item " + latex_escape(name))
        lines.append(r"\end{resumebullets}")
    if data.get("experience"):
        lines.append(r"\section*{Experience}")
        for item in data["experience"]:
            lines.append(rf"\ResumeEntryHead{{{latex_escape(item['position'])}}}{{{latex_escape(item.get('period', ''))}}}")
            lines.append(rf"\ResumeEntrySub{{{latex_escape(item['organization'])}}}{{{latex_escape(item.get('location', ''))}}}")
            lines.append(rf"\ResumeProjectDesc{{{latex_escape(item['description'])}}}")
    if data.get("soft_skills"):
        lines.append(r"\section*{Soft Skills}")
        lines.append(rf"\ResumeSoftSkills{{{latex_escape(', '.join(data['soft_skills']))}}}")
    lines.extend([r"\end{document}", ""])
    return "\n".join(lines)


COMPILERS = ("xelatex", "lualatex", "pdflatex", "tectonic")


def find_compiler() -> str | None:
    for compiler in COMPILERS:
        if shutil.which(compiler):
            return compiler
    return None


def compile_command(compiler: str, job_dir: Path, output: Path) -> list[str]:
    if compiler == "tectonic":
        # Tectonic runs non-interactive by default and stops on the first error.
        # It resolves \input paths relative to the input file, so point it at the repo root.
        return [compiler, "-Z", f"search-path={ROOT}", "--outdir", str(job_dir), str(output)]
    return [compiler, "-interaction=nonstopmode", "-halt-on-error", "-output-directory", str(job_dir), str(output)]


def build(profile_name: str, template: str, compile_pdf: bool) -> Path:
    if template not in {"ats", "modern", "developer"} or not (TEMPLATES / f"{template}.tex").is_file():
        raise ValueError("Unknown template. Expected one of: ats, modern, developer")
    data = load_yaml(ROOT / "master-data.yaml")
    validate_master(data)
    profile = profile_data(profile_name)
    if not profile.get("projects") or not profile.get("skills") or not profile.get("summary"):
        raise ValueError(f"Profile '{profile_name}' must define summary, skills, and projects")
    output = GENERATED / f"{profile_name}-{template}.tex"
    GENERATED.mkdir(exist_ok=True)
    output.write_text(render(data, profile, template), encoding="utf-8", newline="\n")
    if not compile_pdf:
        return output
    compiler = find_compiler()
    if compiler is None:
        raise RuntimeError("No LaTeX compiler found. Install XeLaTeX, LuaLaTeX, pdfLaTeX, or Tectonic, or use --validate-only.")
    DIST.mkdir(exist_ok=True)
    job_dir = DIST / f".build-{profile_name}-{template}"
    job_dir.mkdir(exist_ok=True)
    result = subprocess.run(compile_command(compiler, job_dir, output), cwd=ROOT, text=True)
    pdf = job_dir / output.with_suffix(".pdf").name
    if result.returncode != 0 or not pdf.is_file() or pdf.stat().st_size == 0:
        raise RuntimeError(f"LaTeX compilation failed for {profile_name} x {template}")
    destination = DIST / f"Chirayu-Babu-Jaysawal-{profile_name}-{template}.pdf"
    shutil.copy2(pdf, destination)
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", required=True)
    parser.add_argument("--template", required=True)
    parser.add_argument("--validate-only", action="store_true", help="Generate LaTeX without requiring a local compiler")
    args = parser.parse_args()
    try:
        result = build(args.profile, args.template, not args.validate_only)
    except (OSError, RuntimeError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(f"Built: {result.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())