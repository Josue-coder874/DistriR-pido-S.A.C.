"""Fail when the Cobertura XML line coverage is below the required threshold."""

import argparse
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def read_line_coverage(report_path: Path) -> float:
    try:
        root = ET.parse(report_path).getroot()
    except (OSError, ET.ParseError) as error:
        raise ValueError(f"No se pudo leer el reporte de cobertura {report_path}: {error}") from error

    line_rate = root.get("line-rate")
    if line_rate is None:
        raise ValueError(f"El reporte {report_path} no contiene el atributo line-rate.")

    try:
        return float(line_rate) * 100
    except ValueError as error:
        raise ValueError(f"El reporte {report_path} tiene un line-rate no válido: {line_rate}") from error


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, default=Path("coverage.xml"))
    parser.add_argument("--threshold", type=float, default=80)
    args = parser.parse_args()

    if not 0 <= args.threshold <= 100:
        parser.error("--threshold debe estar entre 0 y 100.")

    try:
        coverage = read_line_coverage(args.report)
    except ValueError as error:
        parser.error(str(error))

    print(f"Cobertura de líneas: {coverage:.2f}% (mínimo requerido: {args.threshold:.2f}%).")
    if coverage < args.threshold:
        print("La cobertura de líneas no alcanza el mínimo requerido.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
