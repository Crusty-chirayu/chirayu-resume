import itertools
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
PROFILES = ["general", "fullstack", "java", "ai-ml", "software-engineer"]
TEMPLATES = ["ats", "modern", "developer"]


class BuildMatrixTests(unittest.TestCase):
    def test_all_profile_template_sources_generate(self):
        for profile, template in itertools.product(PROFILES, TEMPLATES):
            with self.subTest(profile=profile, template=template):
                result = subprocess.run(
                    [sys.executable, "build.py", "--profile", profile, "--template", template, "--validate-only"],
                    cwd=ROOT,
                    capture_output=True,
                    text=True,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                output = ROOT / "generated" / f"{profile}-{template}.tex"
                self.assertGreater(output.stat().st_size, 0)

    def test_templates_change_generated_latex(self):
        outputs = []
        for template in TEMPLATES:
            subprocess.run([sys.executable, "build.py", "--profile", "general", "--template", template, "--validate-only"], cwd=ROOT, check=True)
            outputs.append((ROOT / "generated" / f"general-{template}.tex").read_text(encoding="utf-8"))
        self.assertEqual(len(set(outputs)), 3)

    def test_profiles_change_project_selection(self):
        outputs = []
        for profile in PROFILES:
            subprocess.run([sys.executable, "build.py", "--profile", profile, "--template", "ats", "--validate-only"], cwd=ROOT, check=True)
            outputs.append((ROOT / "generated" / f"{profile}-ats.tex").read_text(encoding="utf-8"))
        self.assertEqual(len(set(outputs)), 5)


if __name__ == "__main__":
    unittest.main()