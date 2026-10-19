import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "src"))

from suite_py_lib import initials, normalize


class NormalizeTests(unittest.TestCase):
    def test_normalize_collapses_whitespace(self):
        self.assertEqual(normalize("  Hello   World "), "hello world")

    def test_initials_takes_first_letters(self):
        self.assertEqual(initials("Deep Seek Harness"), "dsh")

    def test_initials_ignores_empty_parts(self):
        self.assertEqual(initials("  a  b "), "ab")


if __name__ == "__main__":
    unittest.main()
