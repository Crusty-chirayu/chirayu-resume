# Chirayu Babu Jaysawal Resume-as-Code

This repository generates role-specific resumes from one verified source of truth.

```text
master-data.yaml -> profile YAML -> template -> generated LaTeX -> PDF
```

## Build

Install Python dependencies and a TeX distribution with XeLaTeX:

```bash
python -m pip install -r requirements.txt
python build.py --profile fullstack --template modern
```

The PDF is written to `dist/Chirayu-Babu-Jaysawal-fullstack-modern.pdf`.
Use `--validate-only` to generate and inspect LaTeX without a local compiler.

## Profiles

- `general`: broad computer engineering profile
- `fullstack`: frontend, APIs, databases, and full-stack projects
- `java`: Java, SQL, backend, and the Hotel Management System project
- `ai-ml`: AI products, Gemini API, OpenCV, and agentic workflows
- `software-engineer`: balanced programming, APIs, databases, and tooling

## Templates

- `ats`: conservative typography and spacing for machine readability
- `modern`: larger hierarchy and restrained blue accent
- `developer`: compact layout with a green monospace technical accent

Templates are real LaTeX inputs, so changing the template changes the generated
document rather than only its filename.

## Updating The Resume

Edit `master-data.yaml` for personal information, education, skills, projects,
experience, and certifications. The generator validates required fields and
escapes LaTeX-sensitive characters.

To add a project, add an entry with a unique `id`, `title`, and factual
`description`, then include its id in the profiles where it belongs. Add skills
to the appropriate master-data category and reference that category in a
profile's `skills` list.

To create a profile, add `profiles/<name>.yaml` with `name`, `summary`,
`skills`, and `projects`. To create a template, add `templates/<name>.tex` with
the style commands used by `build.py`, then pass that template name to the
build command.

## Tests And CI

Run the local source-generation matrix with:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

GitHub Actions runs the full 5 profiles x 3 templates matrix on pushes and pull
requests. Each of the 15 jobs installs dependencies, generates LaTeX, compiles
with XeLaTeX, parses the PDF, checks identity and links, checks page count, and
uploads the resulting PDF as an artifact.

The local environment used to prepare this repository does not contain a TeX
compiler, so local PDF compilation is reported as unavailable by `build.py`.