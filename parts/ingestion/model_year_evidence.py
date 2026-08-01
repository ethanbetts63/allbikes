"""Combine exact-code model/year evidence from independent selector sources."""

from collections import defaultdict


def _new_claim():
    return {
        "customer_names": set(),
        "engines": set(),
        "generations": set(),
        "frame_numbers": set(),
        "source_names": set(),
        "source_urls": set(),
        "has_inactive_record": False,
    }


def _add(claims, *, code, year, customer_name, engine, generation, frame_number, source_name, source_url):
    claim = claims[(code.upper(), int(year))]
    for key, value in (
        ("customer_names", customer_name),
        ("engines", engine),
        ("generations", generation),
        ("frame_numbers", frame_number),
        ("source_names", source_name),
        ("source_urls", source_url),
    ):
        if value:
            claim[key].add(value)
    if "NOT ACTIVE" in (generation or "").upper():
        claim["has_inactive_record"] = True


def combine_exact_code_evidence(*, dutch_rows, easyparts_rows, local_models):
    """Return consolidated per-year rows and local models with no evidence."""
    local_by_code = {model.model_code.upper(): model for model in local_models}
    claims = defaultdict(_new_claim)

    for row in dutch_rows:
        code = row["local_model_code"].upper()
        if code not in local_by_code:
            continue
        _add(
            claims,
            code=code,
            year=row["year"],
            customer_name=row.get("customer_name", ""),
            engine="",
            generation=row.get("code_qualifiers", ""),
            frame_number="",
            source_name="bike-parts-sym.nl",
            source_url=row.get("source_url", ""),
        )

    for row in easyparts_rows:
        code = row["local_model_code"].upper()
        if code not in local_by_code:
            continue
        for year in range(int(row["year_from"]), int(row["year_to"]) + 1):
            _add(
                claims,
                code=code,
                year=year,
                customer_name=row.get("customer_name", ""),
                engine=row.get("engine", ""),
                generation=row.get("generation", ""),
                frame_number=row.get("frame_number", ""),
                source_name="easyparts.com",
                source_url=row.get("source_url", ""),
            )

    rows = []
    matched_codes = set()
    for (code, year), claim in sorted(claims.items(), key=lambda item: (item[0][0], item[0][1])):
        local = local_by_code[code]
        matched_codes.add(code)
        source_count = len(claim["source_names"])
        confidence = "corroborated_exact_code" if source_count > 1 else "single_source_exact_code"
        if claim["has_inactive_record"]:
            confidence = "review_inactive_source_record"
        rows.append(
            {
                "local_model_name": local.name,
                "local_model_code": local.model_code,
                "local_cc_class": local.cc_class,
                "customer_names": " | ".join(sorted(claim["customer_names"])),
                "year": year,
                "engines": " | ".join(sorted(claim["engines"])),
                "generations": " | ".join(sorted(claim["generations"])),
                "frame_numbers": " | ".join(sorted(claim["frame_numbers"])),
                "evidence_status": confidence,
                "source_count": source_count,
                "source_names": " | ".join(sorted(claim["source_names"])),
                "source_urls": " | ".join(sorted(claim["source_urls"])),
            }
        )

    unmatched = [model for model in local_models if model.model_code.upper() not in matched_codes]
    return rows, unmatched
