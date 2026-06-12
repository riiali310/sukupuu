#!/usr/bin/env python3
import json
import re
import sys
import collections
from pathlib import Path

DATE_RE = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
UNCERTAIN_RE = re.compile(r"tark|epäsel|mahd|jatkuu|puuttuu|\?+|vai", re.I)

def natural_id_key(value: str):
    if "-" not in value:
        return (value, 0, value)
    gen, num = value.split("-", 1)
    digits = re.sub(r"[^0-9]", "", num)
    return (gen, int(digits or 0), num)

def load(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)

def analyze(path: Path):
    data = load(path)
    people = data.get("henkilot", [])
    ids = [p.get("id") for p in people]
    id_counts = collections.Counter(ids)
    id_set = set(ids)

    issues = {
        "duplicate_ids": sorted([i for i, c in id_counts.items() if i and c > 1], key=natural_id_key),
        "missing_required": [],
        "broken_parent_refs": [],
        "invalid_dates": [],
        "missing_source": [],
        "uncertain_notes": [],
        "meta_kesken": data.get("_meta", {}).get("kesken", []),
    }

    required = ["id", "sukupolvi", "nimi", "syntyma", "lahde"]
    date_fields = ["syntyma", "kuolema", "vihitty"]

    for p in people:
        pid = p.get("id", "<missing id>")
        missing = [field for field in required if not p.get(field)]
        if missing:
            issues["missing_required"].append({"id": pid, "fields": missing})
        if not p.get("lahde"):
            issues["missing_source"].append(pid)
        parent = p.get("vanhempi_id")
        if parent and parent not in id_set:
            issues["broken_parent_refs"].append({"id": pid, "vanhempi_id": parent})
        for field in date_fields:
            value = p.get(field)
            if value and not DATE_RE.match(str(value)):
                issues["invalid_dates"].append({"id": pid, "field": field, "value": value})
        note_text = " ".join(str(p.get(k, "")) for k in ["huomiot", "paikat", "puoliso"])
        if UNCERTAIN_RE.search(note_text):
            issues["uncertain_notes"].append({"id": pid, "text": note_text.strip()})

    children = collections.defaultdict(list)
    for p in people:
        if p.get("vanhempi_id"):
            children[p["vanhempi_id"]].append(p["id"])

    summary = {
        "file": str(path),
        "person_count": len(people),
        "generation_counts": dict(sorted(collections.Counter(p.get("sukupolvi") for p in people).items())),
        "parent_link_count": sum(1 for p in people if p.get("vanhempi_id")),
        "root_count": sum(1 for p in people if not p.get("vanhempi_id")),
        "source_count": len(set(p.get("lahde") for p in people if p.get("lahde"))),
    }
    return summary, issues, children

def write_markdown(summary, issues, out_path: Path):
    lines = []
    lines.append("# QA report")
    lines.append("")
    lines.append(f"Tiedosto: `{summary['file']}`")
    lines.append(f"Henkilöitä: **{summary['person_count']}**")
    lines.append(f"Vanhempi-linkkejä: **{summary['parent_link_count']}**")
    lines.append(f"Juuri-/irrallisia henkilöitä: **{summary['root_count']}**")
    lines.append(f"Lähdetiedostoja: **{summary['source_count']}**")
    lines.append("")
    lines.append("## Sukupolvet")
    lines.append("")
    for gen, count in summary["generation_counts"].items():
        lines.append(f"- {gen}: {count}")
    lines.append("")

    def section(title, rows):
        lines.append(f"## {title}")
        lines.append("")
        if not rows:
            lines.append("Ei löydöksiä.")
            lines.append("")
            return
        for row in rows:
            lines.append(f"- `{row}`" if isinstance(row, str) else f"- `{row.get('id')}`: {row}")
        lines.append("")

    section("Duplikaatti-ID:t", issues["duplicate_ids"])
    section("Puuttuvat pakolliset kentät", issues["missing_required"])
    section("Rikkinäiset vanhempi_id-viittaukset", issues["broken_parent_refs"])
    section("Virheelliset päivämäärämuodot", issues["invalid_dates"])
    section("Puuttuva lahde", issues["missing_source"])

    lines.append("## Meta: kesken")
    lines.append("")
    if issues["meta_kesken"]:
        for item in issues["meta_kesken"]:
            lines.append(f"- {item}")
    else:
        lines.append("Ei avoimia meta-kohtia.")
    lines.append("")

    lines.append("## Epävarmat käsiala- ja jatkokohdat")
    lines.append("")
    if issues["uncertain_notes"]:
        for row in issues["uncertain_notes"]:
            text = row["text"].replace("\n", " ")
            lines.append(f"- `{row['id']}`: {text}")
    else:
        lines.append("Ei löydöksiä.")
    lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/qa_henkilot.py henkilot.json [reports/qa-report.md]", file=sys.stderr)
        return 2
    src = Path(sys.argv[1])
    report = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("reports/qa-report.md")
    report.parent.mkdir(parents=True, exist_ok=True)
    summary, issues, children = analyze(src)
    write_markdown(summary, issues, report)
    print(f"OK: {summary['person_count']} persons checked")
    print(f"Report: {report}")
    hard_errors = len(issues["duplicate_ids"]) + len(issues["missing_required"]) + len(issues["broken_parent_refs"]) + len(issues["invalid_dates"]) + len(issues["missing_source"])
    if hard_errors:
        print(f"Hard errors: {hard_errors}", file=sys.stderr)
        return 1
    print("Hard errors: 0")
    print(f"Uncertain notes: {len(issues['uncertain_notes'])}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
