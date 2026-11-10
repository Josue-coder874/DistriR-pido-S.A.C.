import pytest

from scripts.check_line_coverage import read_line_coverage


def test_read_line_coverage_uses_xml_line_rate(tmp_path):
    report = tmp_path / "coverage.xml"
    report.write_text('<coverage line-rate="0.8375" />', encoding="utf-8")

    assert read_line_coverage(report) == pytest.approx(83.75)


def test_read_line_coverage_rejects_report_without_line_rate(tmp_path):
    report = tmp_path / "coverage.xml"
    report.write_text("<coverage />", encoding="utf-8")

    with pytest.raises(ValueError, match="no contiene el atributo line-rate"):
        read_line_coverage(report)
