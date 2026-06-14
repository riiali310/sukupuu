#!/usr/bin/env python3
"""Export Riiali henkilot.json to a conservative GEDCOM 5.5.1 file.

The source JSON has one record per original chart box. Spouses are mostly
stored as free text, so this exporter keeps spouse details as NOTE text rather
than inventing separate spouse person records. Parent-child links are exported
from vanhempi_id as GEDCOM FAM/CHIL/FAMC links.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

MONTHS = {
    "01": "JAN", "02": "FEB", "03": "MAR", "04": "APR",
    "05": "MAY", "06": "JUN", "07": "JUL", "08": "AUG",
    "09": "SEP", "10": "OCT", "11": "NOV", "12": "DEC",
}

DATE_RE = re.compile(r"^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$")
VALID_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")

SKIP_NOTE_FIELDS = {"id", "nimi", "sukunimi", "syntyma", "kuolema", "vanhempi_id"}


def load_people(path: Path) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "henkilot" not in data:
        raise SystemExit("Input must be a JSON object containing a 'henkilot' list")
    people = data["henkilot"]
    if not isinstance(people, list):
        raise SystemExit("'henkilot' must be a list")
    return data.get("_meta", {}), people


def ged_id(person_id: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_]", "_", person_id)
    return f"@I{cleaned}@"


def fam_id(parent_id: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_]", "_", parent_id)
    return f"@F{cleaned}@"


def escape_text(value: Any) -> str:
    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    return text.strip()


def fold_line(level: int, tag: str, value: str | None = None, xref: str | None = None) -> List[str]:
    """Return GEDCOM lines. Keeps long values readable using CONC/CONT.

    This is intentionally simple and ASCII-safe enough for most importers while
    preserving UTF-8 names and Finnish characters.
    """
    if xref:
        base = f"{level} {xref} {tag}"
    else:
        base = f"{level} {tag}"
    if value is None or value == "":
        return [base]
    value = escape_text(value)
    lines: List[str] = []
    parts = value.split("\n")
    first = True
    for part in parts:
        prefix = base if first else f"{level + 1} CONT"
        first = False
        if len(prefix) + 1 + len(part) <= 240:
            lines.append(f"{prefix} {part}")
        else:
            # First chunk fits after the tag, continuations use CONC.
            max_first = 240 - len(prefix) - 1
            chunks = [part[:max_first]]
            rest = part[max_first:]
            while rest:
                max_next = 240 - len(f"{level + 1} CONC") - 1
                chunks.append(rest[:max_next])
                rest = rest[max_next:]
            lines.append(f"{prefix} {chunks[0]}")
            for chunk in chunks[1:]:
                lines.append(f"{level + 1} CONC {chunk}")
    return lines


def ged_date(value: Any) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    m = DATE_RE.match(text)
    if not m:
        return None
    year, month, day = m.groups()
    if year and month and day:
        return f"{int(day)} {MONTHS.get(month, month)} {year}"
    if year and month:
        return f"{MONTHS.get(month, month)} {year}"
    return year


def name_value(person: Dict[str, Any]) -> str:
    name = str(person.get("nimi", "")).strip() or person.get("id", "Tuntematon")
    surname = person.get("sukunimi")
    if surname:
        # Avoid duplicating surname if the full name already contains it.
        s = str(surname).strip()
        if s and f"/{s}/" not in name:
            return f"{name} /{s}/"
    return name


def note_for_person(person: Dict[str, Any]) -> str:
    rows = []
    rows.append(f"Alkuperainen id: {person.get('id')}")
    for key, value in person.items():
        if key in SKIP_NOTE_FIELDS:
            continue
        if value is None or value == "" or value == []:
            continue
        if isinstance(value, list):
            value = ", ".join(map(str, value))
        rows.append(f"{key}: {value}")
    return "\n".join(rows)


def build_gedcom(meta: Dict[str, Any], people: List[Dict[str, Any]]) -> Tuple[str, Dict[str, Any]]:
    by_id = {str(p.get("id")): p for p in people if p.get("id")}
    duplicates = len(people) - len(by_id)
    children_by_parent: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    broken_parent_refs = []

    for person in people:
        parent = person.get("vanhempi_id")
        if parent:
            parent = str(parent)
            if parent in by_id:
                children_by_parent[parent].append(person)
            else:
                broken_parent_refs.append((person.get("id"), parent))

    lines: List[str] = []
    lines += [
        "0 HEAD",
        "1 SOUR RiialiJSON",
        "2 NAME Riiali JSON to GEDCOM exporter",
        "2 VERS 0.1.0",
        "1 GEDC",
        "2 VERS 5.5.1",
        "2 FORM LINEAGE-LINKED",
        "1 CHAR UTF-8",
        f"1 DATE {date.today().strftime('%-d %b %Y').upper()}",
        "1 SUBM @SUBM1@",
        "0 @SUBM1@ SUBM",
        "1 NAME Riiali sukupuu JSON export",
    ]

    source_title = meta.get("lahde") or "Sukututkimus Riialin suvusta"
    lines += [
        "0 @S1@ SOUR",
        f"1 TITL {source_title}",
    ]
    if meta:
        meta_note = json.dumps(meta, ensure_ascii=False, indent=2)
        lines += fold_line(1, "NOTE", meta_note)

    # Individuals
    for person in people:
        pid = str(person.get("id"))
        if not pid:
            continue
        lines.append(f"0 {ged_id(pid)} INDI")
        lines += fold_line(1, "NAME", name_value(person))
        if person.get("syntyma"):
            lines.append("1 BIRT")
            d = ged_date(person.get("syntyma"))
            if d:
                lines.append(f"2 DATE {d}")
            else:
                lines += fold_line(2, "DATE", str(person.get("syntyma")))
            if person.get("syntymapaikka"):
                lines += fold_line(2, "PLAC", str(person.get("syntymapaikka")))
        if person.get("kuolema"):
            lines.append("1 DEAT")
            d = ged_date(person.get("kuolema"))
            if d:
                lines.append(f"2 DATE {d}")
            else:
                lines += fold_line(2, "DATE", str(person.get("kuolema")))
        parent = person.get("vanhempi_id")
        if parent and str(parent) in by_id:
            lines.append(f"1 FAMC {fam_id(str(parent))}")
        if pid in children_by_parent:
            lines.append(f"1 FAMS {fam_id(pid)}")
        lines.append("1 SOUR @S1@")
        lines += fold_line(1, "NOTE", note_for_person(person))

    # Families generated from parent-child links
    for parent_id, children in sorted(children_by_parent.items()):
        lines.append(f"0 {fam_id(parent_id)} FAM")
        # Parent sex is unknown, so use a NOTE plus CHIL links. Many GEDCOM
        # readers still import this; Gramps keeps the family relationship.
        lines += fold_line(1, "NOTE", f"Perhe generoitu vanhempi_id-kentasta. Vanhempi: {parent_id}. Puoliso voi olla vanhemman puoliso-kentassa tekstina.")
        lines.append(f"1 _PARENT {ged_id(parent_id)}")
        for child in children:
            cid = str(child.get("id"))
            lines.append(f"1 CHIL {ged_id(cid)}")

    lines.append("0 TRLR")

    report = {
        "people": len(people),
        "unique_ids": len(by_id),
        "duplicate_id_count": duplicates,
        "families_generated": len(children_by_parent),
        "child_links_exported": sum(len(v) for v in children_by_parent.values()),
        "broken_parent_refs": broken_parent_refs,
    }
    return "\n".join(lines) + "\n", report


def write_report(path: Path, input_path: Path, output_path: Path, report: Dict[str, Any]) -> None:
    broken = report["broken_parent_refs"]
    rows = [
        "# GEDCOM export report",
        "",
        f"Input: `{input_path}`",
        f"Output: `{output_path}`",
        "",
        f"Henkilöitä: {report['people']}",
        f"Uniikkeja ID-arvoja: {report['unique_ids']}",
        f"Duplikaatti-ID:t: {report['duplicate_id_count']}",
        f"Generoituja perheitä: {report['families_generated']}",
        f"Vietyjä lapsilinkkejä: {report['child_links_exported']}",
        f"Rikkinäisiä vanhempi_id-viitteitä: {len(broken)}",
        "",
        "## Huomioita",
        "",
        "Tämä GEDCOM on konservatiivinen vienti. JSONin `puoliso`-kentät säilytetään henkilön NOTE-tekstissä, koska alkuperäisessä aineistossa puolisot ovat usein vapaatekstiä eikä heille ole aina omaa laatikko-ID:tä.",
        "",
        "Perheet on muodostettu `vanhempi_id`-kentästä. GEDCOMissa toinen vanhempi voi siksi puuttua rakenteellisena henkilönä, vaikka puolison tiedot näkyvät muistiinpanossa.",
        "",
    ]
    if broken:
        rows += ["## Rikkinäiset vanhempi_id-viitteet", ""]
        for child_id, parent_id in broken:
            rows.append(f"- `{child_id}` viittaa puuttuvaan vanhempaan `{parent_id}`")
        rows.append("")
    path.write_text("\n".join(rows), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Export henkilot.json to GEDCOM")
    parser.add_argument("input", nargs="?", default="henkilot.json", help="Input henkilot.json")
    parser.add_argument("output", nargs="?", default="data/riiali.ged", help="Output GEDCOM file")
    parser.add_argument("--report", default="reports/gedcom-export-report.md", help="Markdown report path")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    report_path = Path(args.report)

    meta, people = load_people(input_path)
    ged, report = build_gedcom(meta, people)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(ged, encoding="utf-8")
    write_report(report_path, input_path, output_path, report)

    print(f"Wrote {output_path}")
    print(f"Wrote {report_path}")
    print(f"People: {report['people']}")
    print(f"Families: {report['families_generated']}")
    print(f"Broken parent refs: {len(report['broken_parent_refs'])}")


if __name__ == "__main__":
    main()
