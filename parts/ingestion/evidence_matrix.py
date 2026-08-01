"""Build a source-preserving, review-oriented SYM model/year evidence matrix."""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from datetime import datetime
from html import escape


def code_stem(code):
    return (code or "").strip().upper().split("-", 1)[0]


MODEL_YEAR_DECADE = {"J": 1990, "K": 2000, "L": 2010, "M": 2020, "N": 2030}


def decode_generation_years(value):
    """Decode one SYM/Suzuki-style K8-L0 model-year qualifier."""
    matches = re.findall(r"(?<![A-Z0-9])([JKLMN]\d)(?:-([JKLMN]\d))?(?![A-Z0-9])", value or "", re.I)
    if len(matches) != 1:
        return None
    start_token, end_token = (token.upper() for token in matches[0])
    end_token = end_token or start_token
    start = MODEL_YEAR_DECADE[start_token[0]] + int(start_token[1])
    end = MODEL_YEAR_DECADE[end_token[0]] + int(end_token[1])
    if start > end:
        return None
    return start, end


def annotate_generation_years(claim):
    """Attach decoded years and preserve disagreements with explicit source years."""
    annotated = dict(claim)
    decoded = decode_generation_years(annotated.get("generation", ""))
    annotated["generation_year_from"] = decoded[0] if decoded else None
    annotated["generation_year_to"] = decoded[1] if decoded else None
    annotated["generation_year_check"] = ""
    annotated["year_evidence"] = "explicit source years" if annotated.get("year_from") is not None else ""
    if not decoded:
        return annotated

    explicit_from = annotated.get("year_from")
    explicit_to = annotated.get("year_to")
    if explicit_from is None and explicit_to is None:
        annotated["year_from"], annotated["year_to"] = decoded
        annotated["year_evidence"] = "decoded generation qualifier"
        annotated["generation_year_check"] = "generation qualifier supplies year range"
        return annotated

    explicit_to = explicit_to if explicit_to is not None else explicit_from
    if explicit_from == decoded[0] and explicit_to == decoded[1]:
        annotated["generation_year_check"] = "explicit years match encoded range"
    elif decoded[0] <= explicit_from <= explicit_to <= decoded[1]:
        annotated["generation_year_check"] = "explicit years fall within encoded range"
    else:
        annotated["generation_year_check"] = (
            f"review: explicit {explicit_from}-{explicit_to} differs from encoded {decoded[0]}-{decoded[1]}"
        )
    annotated["year_evidence"] = "explicit source years plus generation qualifier"
    return annotated


def _year_labels(claim, current_year):
    year_from = claim.get("year_from")
    year_to = claim.get("year_to")
    if year_from is not None and year_to is not None:
        if 1950 <= year_from <= year_to <= current_year + 2 and year_to - year_from <= 40:
            return [str(year) for year in range(year_from, year_to + 1)]
        return [f"{year_from}–{year_to}"]
    if year_from is not None:
        if 1950 <= year_from <= current_year + 2:
            return [str(year) for year in range(year_from, current_year + 1)]
        return [f"{year_from}+ "]
    if year_to is not None:
        return [f"≤{year_to}"]
    return ["Unspecified"]


def _name_key(title):
    value = re.sub(r"\[[^\]]+\]", " ", title or "")
    value = re.sub(r"\b(?:19|20)?\d{2}\s*[-–]\s*(?:19|20)?\d{2}\b", " ", value)
    value = re.sub(r"\([^)]*(?:EU|FR|NL|IT|PT|BNL)[^)]*\)", " ", value, flags=re.I)
    value = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
    return value or "unnamed"


def _model_signature(title):
    value = re.sub(r"\[[^\]]+\]", " ", title or "")
    value = re.sub(r"\([^)]*(?:EU|FR|NL|IT|PT|BNL)[^)]*\)", " ", value, flags=re.I)
    emission_match = re.search(r"\bE([1-6])\+?\b", value, flags=re.I)
    capacity_match = re.search(r"\b(50|100|110|115|125|150|160|180|200|250|300|400|500|600)I?\b", value, flags=re.I)
    if capacity_match is None:
        return ""
    family = value[: capacity_match.start()]
    family = re.sub(r"\bSYM\b", " ", family, flags=re.I)
    family = re.sub(r"[^a-z0-9]+", "", family.casefold())
    if not family:
        return ""
    emission = f"e{emission_match.group(1)}" if emission_match else ""
    return f"{family}|{capacity_match.group(1)}|{emission}"


def _claim_summary(claim):
    details = []
    if claim.get("model_code"):
        details.append(f"code {claim['model_code']}")
    if claim.get("engine"):
        details.append(claim["engine"])
    if claim.get("generation"):
        details.append(f"generation {claim['generation']}")
    if claim.get("generation_year_from") is not None:
        encoded_from = claim["generation_year_from"]
        encoded_to = claim["generation_year_to"]
        encoded_label = str(encoded_from) if encoded_from == encoded_to else f"{encoded_from}-{encoded_to}"
        details.append(f"encoded model years {encoded_label}")
    if (claim.get("generation_year_check") or "").startswith("review:"):
        details.append(claim["generation_year_check"])
    if claim.get("frame_number"):
        details.append(f"frame {claim['frame_number']}")
    if claim.get("document_type"):
        details.append(claim["document_type"])
    if claim.get("evidence_authority"):
        details.append(claim["evidence_authority"])
    if claim.get("evidence_notes"):
        details.append(claim["evidence_notes"])
    suffix = f" — {'; '.join(details)}" if details else ""
    source_url = f" — {claim['source_url']}" if claim.get("source_url") else ""
    return f"{claim['source_title']}{suffix}{source_url}"


def _year_confidence_score(*, year_label, exact_local, stem_candidates, source_count, claims):
    numeric_year = year_label.isdigit()
    if numeric_year and exact_local:
        score = 82
    elif numeric_year and stem_candidates:
        score = 72
    elif numeric_year:
        score = 45
    elif exact_local:
        score = 35
    elif stem_candidates:
        score = 25
    else:
        score = 10

    if numeric_year:
        score += min(max(source_count - 1, 0), 3) * 5
        year = int(year_label)
        if any(
            claim.get("generation_year_from") is not None
            and claim["generation_year_from"] <= year <= claim["generation_year_to"]
            and not (claim.get("generation_year_check") or "").startswith("review:")
            for claim in claims
        ):
            score += 5
        if any(claim.get("range_is_open") for claim in claims):
            score -= 5
    if any((claim.get("generation_year_check") or "").startswith("review:") for claim in claims):
        score -= 15
    if any(claim.get("_linked_by_name") for claim in claims):
        score -= 10
    return max(0, min(100, score))


def confidence_band(score):
    if score >= 90:
        return "Very high"
    if score >= 80:
        return "High"
    if score >= 70:
        return "Accepted"
    if score >= 50:
        return "Moderate"
    return "Unconfirmed"


def build_matrix(*, claims, local_models, current_year=None):
    current_year = current_year or datetime.now().year
    local_by_code = {model.model_code.upper(): model for model in local_models}
    local_by_stem = defaultdict(list)
    for model in local_models:
        local_by_stem[code_stem(model.model_code)].append(model)

    signature_stems = defaultdict(set)
    for claim in claims:
        stem = code_stem(claim.get("model_code"))
        signature = _model_signature(claim.get("source_title", ""))
        if stem and signature:
            signature_stems[signature].add(stem)

    groups = defaultdict(list)
    for claim in claims:
        stem = code_stem(claim.get("model_code"))
        linked_by_name = False
        # An RVCS certification/marketing name is authoritative Australian
        # identity evidence, but it is not necessarily a SYM parts-book code.
        # Keep code-less RVCS claims visible without letting a name-only match
        # extend a local book's supported years.
        if not stem and claim.get("source") != "mvsa.infrastructure.gov.au":
            signature = _model_signature(claim.get("source_title", ""))
            candidates = signature_stems.get(signature, set())
            if len(candidates) == 1:
                stem = next(iter(candidates))
                linked_by_name = True
        evidence_key = stem or f"NAME:{_name_key(claim.get('source_title', ''))}"
        matrix_claim = {**claim, "_linked_by_name": linked_by_name}
        for year_label in _year_labels(claim, current_year):
            groups[(evidence_key, year_label)].append(matrix_claim)

    rows = []
    for (evidence_key, year_label), group_claims in groups.items():
        stem = evidence_key if not evidence_key.startswith("NAME:") else ""
        by_source = defaultdict(list)
        codes_by_source = defaultdict(set)
        for claim in group_claims:
            source = claim["source"]
            by_source[source].append(claim)
            if claim.get("model_code"):
                codes_by_source[source].add(claim["model_code"].upper())

        source_names = sorted(by_source)
        code_source_count = Counter(
            code
            for source_codes in codes_by_source.values()
            for code in source_codes
        )
        exact_corroboration = max(code_source_count.values(), default=0)
        exact_local_codes = sorted(
            {
                code
                for source_codes in codes_by_source.values()
                for code in source_codes
                if code in local_by_code
            }
        )
        exact_local = [
            f"{local_by_code[code].name} [{local_by_code[code].model_code}]"
            for code in exact_local_codes
        ]
        stem_candidate_models = sorted(
            (model for model in local_by_stem.get(stem, []) if model.model_code not in exact_local_codes),
            key=lambda model: (model.name.casefold(), model.model_code),
        )
        stem_candidates = [f"{model.name} [{model.model_code}]" for model in stem_candidate_models]

        if exact_corroboration >= 3:
            confidence = "Very high — exact code corroborated by 3 sources"
        elif exact_corroboration >= 2:
            confidence = "High — exact code corroborated"
        elif len(source_names) >= 2 and stem:
            confidence = "Medium — code stem corroborated"
        elif exact_local_codes:
            confidence = "Exact local code — single source"
        else:
            confidence = "Single-source evidence"

        distinct_codes = sorted({code for codes in codes_by_source.values() for code in codes})
        notes = []
        if len(distinct_codes) > 1:
            notes.append("Different regional/revision codes share this stem; review before guaranteeing fitment.")
        if any(claim.get("_linked_by_name") for claim in group_claims):
            notes.append("Code-less evidence linked by a unique model/capacity/emissions signature.")
        if stem_candidates and not exact_local_codes:
            if year_label.isdigit():
                notes.append("Regional suffix differs; core-code year evidence is accepted as confirmation.")
            else:
                notes.append("Local book has the same code stem but no confirmed year on this row.")
        if not exact_local and not stem_candidates:
            notes.append("No local parts book currently linked.")

        year_confidence_score = _year_confidence_score(
            year_label=year_label,
            exact_local=exact_local,
            stem_candidates=stem_candidates,
            source_count=len(source_names),
            claims=group_claims,
        )

        row = {
            "evidence_key": evidence_key,
            "model_code_stem": stem,
            "source_model_codes": " | ".join(distinct_codes),
            "year": year_label,
            "local_exact_books": " | ".join(exact_local),
            "local_same_stem_candidates": " | ".join(stem_candidates),
            "local_year_status": (
                "Confirmed"
                if year_label.isdigit() and (exact_local or stem_candidates)
                else "Unconfirmed year"
                if exact_local or stem_candidates
                else "No local book"
            ),
            "year_confidence_score": year_confidence_score,
            "year_confidence_band": confidence_band(year_confidence_score),
            "open_range_evidence": any(claim.get("range_is_open") for claim in group_claims),
            "bike_parts_sym_evidence": " | ".join(
                sorted({_claim_summary(claim) for claim in by_source.get("bike-parts-sym.nl", [])})
            ),
            "easyparts_evidence": " | ".join(
                sorted({_claim_summary(claim) for claim in by_source.get("easyparts.com", [])})
            ),
            "racing_planet_evidence": " | ".join(
                sorted({_claim_summary(claim) for claim in by_source.get("racing-planet.com", [])})
            ),
            "official_sym_document_evidence": " | ".join(
                sorted({_claim_summary(claim) for claim in by_source.get("sym-global.com", [])})
            ),
            "australian_rvcs_evidence": " | ".join(
                sorted(
                    {
                        _claim_summary(claim)
                        for claim in by_source.get("mvsa.infrastructure.gov.au", [])
                    }
                )
            ),
            "taiwan_register_evidence": " | ".join(
                sorted(
                    {
                        _claim_summary(claim)
                        for source in ("data.moenv.gov.tw", "moeaea.gov.tw")
                        for claim in by_source.get(source, [])
                    }
                )
            ),
            "third_party_document_evidence": " | ".join(
                sorted(
                    {
                        _claim_summary(claim)
                        for source in by_source
                        if source
                        not in {
                            "bike-parts-sym.nl",
                            "easyparts.com",
                            "racing-planet.com",
                            "sym-global.com",
                            "mvsa.infrastructure.gov.au",
                            "data.moenv.gov.tw",
                            "moeaea.gov.tw",
                        }
                        for claim in by_source.get(source, [])
                    }
                )
            ),
            "source_count": len(source_names),
            "confidence": confidence,
            "review_notes": " ".join(notes),
        }
        rows.append(row)

    def sort_key(row):
        year = row["year"]
        numeric_year = int(year) if year.isdigit() else 9999
        return (row["evidence_key"], numeric_year, year)

    return sorted(rows, key=sort_key)


MATRIX_FIELDS = [
    "evidence_key",
    "model_code_stem",
    "source_model_codes",
    "year",
    "local_exact_books",
    "local_same_stem_candidates",
    "local_year_status",
    "year_confidence_score",
    "year_confidence_band",
    "open_range_evidence",
    "bike_parts_sym_evidence",
    "easyparts_evidence",
    "racing_planet_evidence",
    "official_sym_document_evidence",
    "australian_rvcs_evidence",
    "taiwan_register_evidence",
    "third_party_document_evidence",
    "source_count",
    "confidence",
    "review_notes",
]


def render_matrix_html(rows, *, generated_at):
    corroborated = sum(int(row["source_count"]) >= 2 for row in rows)
    local_linked = sum(bool(row["local_exact_books"] or row["local_same_stem_candidates"]) for row in rows)
    display_fields = [field for field in MATRIX_FIELDS if field != "model_code_stem"]
    headers = {
        "evidence_key": "Evidence key",
        "model_code_stem": "Code stem",
        "source_model_codes": "Source model codes",
        "year": "Year",
        "local_exact_books": "Exact local book",
        "local_same_stem_candidates": "Same-stem local candidate",
        "local_year_status": "Local year status",
        "year_confidence_score": "Year confidence / 100",
        "year_confidence_band": "Confidence band",
        "open_range_evidence": "Open-ended evidence",
        "bike_parts_sym_evidence": "Bike-Parts-SYM evidence",
        "easyparts_evidence": "EasyParts evidence",
        "racing_planet_evidence": "Racing Planet evidence",
        "official_sym_document_evidence": "Official SYM document evidence",
        "australian_rvcs_evidence": "Australian RVCS evidence",
        "taiwan_register_evidence": "Taiwan emissions register evidence",
        "third_party_document_evidence": "Other third-party evidence",
        "source_count": "Sources",
        "confidence": "Evidence level",
        "review_notes": "Review notes",
    }
    header_html = "".join(f"<th>{escape(headers[field])}</th>" for field in display_fields)

    def cell_html(field, value):
        content = escape(str(value))
        if field.endswith("_evidence"):
            content = re.sub(
                r"(https?://[^\s|]+)",
                r'<a href="\1" target="_blank" rel="noopener noreferrer">source</a>',
                content,
            )
        return f"<td>{content}</td>"

    body = []
    for row in rows:
        local = bool(row["local_exact_books"] or row["local_same_stem_candidates"])
        cells = "".join(cell_html(field, row[field]) for field in display_fields)
        hue = round(int(row["year_confidence_score"]) * 1.2)
        body.append(
            f'<tr style="--confidence-hue:{hue}" data-sources="{row["source_count"]}" '
            f'data-local="{str(local).lower()}" data-confidence="{row["year_confidence_score"]}">{cells}</tr>'
        )
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SYM model/year evidence matrix</title>
<style>
:root{{--ink:#17202a;--muted:#617080;--line:#d9e0e6;--blue:#1261a0;--paper:#fff;--bg:#f3f6f8}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 Arial,sans-serif}}
header{{background:#132f43;color:white;padding:24px 28px}} h1{{margin:0 0 6px;font-size:26px}} header p{{margin:0;color:#dce8ef}}
.summary,.controls{{display:flex;gap:12px;flex-wrap:wrap;padding:16px 24px;background:var(--paper);border-bottom:1px solid var(--line)}}
.card{{padding:8px 14px;border:1px solid var(--line);border-radius:6px;background:#f9fbfc}} .card b{{font-size:18px;color:var(--blue)}}
.controls input,.controls select{{padding:9px 11px;border:1px solid #aebbc5;border-radius:5px;min-width:220px}}
.wrap{{overflow:auto;height:calc(100vh - 230px)}} table{{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;background:white}}
th{{position:sticky;top:0;z-index:2;background:#e7eef3;text-align:left;max-width:330px;padding:9px;border:1px solid var(--line)}}
td{{vertical-align:top;max-width:390px;min-width:90px;padding:8px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);white-space:normal}}
tbody tr td{{background:hsl(var(--confidence-hue) 58% 94%)}} tbody tr:nth-child(even) td{{background:hsl(var(--confidence-hue) 48% 91%)}}
tbody tr td:first-child{{border-left:5px solid hsl(var(--confidence-hue) 70% 40%)}} tr:hover td{{filter:brightness(.96)}} .hidden{{display:none}}
</style></head><body>
<header><h1>SYM model/year evidence matrix</h1><p>Generated {escape(generated_at)}. Evidence is preserved by source; corroboration does not itself prove Australian-market fitment.</p></header>
<section class="summary"><div class="card"><b>{len(rows):,}</b><br>evidence rows</div><div class="card"><b>{corroborated:,}</b><br>rows with 2+ sources</div><div class="card"><b>{local_linked:,}</b><br>rows linked to a local book/stem</div><div class="card"><b id="visibleCount">{len(rows):,}</b><br>currently visible</div></section>
<section class="controls"><input id="search" type="search" placeholder="Search any model, code, year or VIN"><select id="sourceFilter"><option value="0">Any source count</option><option value="2">2+ sources</option><option value="3">3 sources</option></select><select id="localFilter"><option value="all">All models</option><option value="true">Has local book/candidate</option><option value="false">No local book</option></select></section>
<div class="wrap"><table><thead><tr>{header_html}</tr></thead><tbody>{''.join(body)}</tbody></table></div>
<script>
const rows=[...document.querySelectorAll('tbody tr')],search=document.querySelector('#search'),sf=document.querySelector('#sourceFilter'),lf=document.querySelector('#localFilter'),count=document.querySelector('#visibleCount');
function filter(){{const q=search.value.trim().toLowerCase(),min=Number(sf.value),local=lf.value;let visible=0;for(const row of rows){{const show=(!q||row.textContent.toLowerCase().includes(q))&&Number(row.dataset.sources)>=min&&(local==='all'||row.dataset.local===local);row.classList.toggle('hidden',!show);if(show)visible++;}}count.textContent=visible.toLocaleString();}}
search.addEventListener('input',filter);sf.addEventListener('change',filter);lf.addEventListener('change',filter);
</script></body></html>"""
