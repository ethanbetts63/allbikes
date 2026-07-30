import json
import re
import time

from django.db import OperationalError, close_old_connections
from parts.ingestion import storage
from parts.ingestion.importer import import_book, unique_model_slug
from parts.ingestion.xls_parser import parse_book, read_model_code
from parts.models import PartsModel

DEADLOCK_CODES = {1205, 1213}
MAX_IMPORT_ATTEMPTS = 3


def _metadata(path):
    sidecar = path.with_name(f'{path.name}.json')
    if not sidecar.exists():
        return {}
    return json.loads(sidecar.read_text(encoding='utf-8'))


def _repair_existing_metadata(model, meta, path):
    """Apply authoritative listing metadata to a hash-matched old import."""
    if not meta:
        return False
    metadata_was_missing = not model.source_xls_url
    model.name = meta.get('name') or model.name
    model.cc_class = meta.get('cc_class') or model.cc_class
    model.source_xls_url = meta.get('url') or model.source_xls_url
    model.source_filename = model.source_filename or path.name
    if metadata_was_missing and meta.get('name'):
        model.slug = unique_model_slug(model.name, model.model_code)
    model.save(update_fields=[
        'name', 'cc_class', 'source_xls_url', 'source_filename', 'slug', 'updated_at',
    ])
    return True


def _fallback_cc_class(*values):
    text = ' '.join(str(value or '') for value in values)
    if re.search(r'\b(?:ATV|QUAD)', text, re.I):
        return 'atv'
    if re.search(r'(?<!\d)(?:200|250|300|350|400)(?!\d)', text):
        return '200_400'
    if re.search(r'(?<!\d)50(?!\d)', text):
        return '50'
    return '100_165'


def _latest_archived_books(*, stderr):
    latest = {}
    for path in storage.archive_dir('books').glob('*.xls'):
        try:
            model_code = read_model_code(str(path))
        except Exception as exc:
            stderr.write(f'Could not identify archived book {path.name}: {exc}')
            continue
        if not model_code:
            stderr.write(f'Could not identify archived book {path.name}: no model code.')
            continue
        candidate_key = (path.stat().st_mtime_ns, path.name)
        current = latest.get(model_code)
        if current is None or candidate_key > current[0]:
            latest[model_code] = (candidate_key, path)
    return [latest[code][1] for code in sorted(latest)]


def _import_one(path, *, stdout, remove_after=False):
    meta = _metadata(path)
    book_hash = storage.sha256_file(path)
    existing_model = PartsModel.objects.filter(book_hash=book_hash).first()
    if existing_model:
        if _repair_existing_metadata(existing_model, meta, path):
            stdout.write(
                f'Updated metadata for {existing_model.model_code} from {path.name}.'
            )
        else:
            stdout.write(f'Skipped {path.name}: already imported (hash match).')
    else:
        parsed = parse_book(str(path))
        display_name = meta.get('name') or parsed.get('model_name_hint') or parsed['model_code']
        import_kwargs = {
            'name': display_name,
            'cc_class': meta.get('cc_class') or _fallback_cc_class(
                display_name, parsed['model_code'], path.name
            ),
            'source_url': meta.get('url', ''),
            'source_filename': path.name,
            'book_hash': book_hash,
        }
        for attempt in range(1, MAX_IMPORT_ATTEMPTS + 1):
            try:
                model = import_book(parsed, **import_kwargs)
                break
            except OperationalError as exc:
                code = exc.args[0] if exc.args else None
                if code not in DEADLOCK_CODES or attempt == MAX_IMPORT_ATTEMPTS:
                    raise
                close_old_connections()
                stdout.write(
                    f'Database lock while importing {path.name}; retrying '
                    f'({attempt}/{MAX_IMPORT_ATTEMPTS - 1}).'
                )
                time.sleep(0.25 * attempt)
        stdout.write(f'Imported {model} — {model.sections.count()} sections.')

    if remove_after:
        path.unlink()
        sidecar = path.with_name(f'{path.name}.json')
        if sidecar.exists():
            sidecar.unlink()


def run(*, stdout, stderr, archive=False):
    if archive:
        files = _latest_archived_books(stderr=stderr)
        source_label = 'parts archive'
    else:
        files = sorted(storage.inbox_dir('books').glob('*.xls'))
        source_label = 'parts inbox'

    if not files:
        stdout.write(f'No model books found in the {source_label}.')
        return 0

    for path in files:
        _import_one(path, stdout=stdout, remove_after=not archive)
    stdout.write(f'Updated parts from {len(files)} model books in the {source_label}.')
    return len(files)
