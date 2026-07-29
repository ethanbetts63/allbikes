from parts.ingestion import storage
from parts.ingestion.importer import import_pricing
from parts.ingestion.pa_csv import iter_pa_rows

MIN_PRICING_ROWS = 100


def _validated_rows(path):
    rows = list(iter_pa_rows(str(path)))
    if len(rows) < MIN_PRICING_ROWS:
        raise ValueError(
            f'Pricing file {path} has only {len(rows)} rows; refusing to replace live availability.'
        )
    return rows


def _newest_archived_price():
    files = list(storage.archive_dir('pricing').glob('*.csv'))
    return max(files, key=lambda path: (path.stat().st_mtime_ns, path.name), default=None)


def run(*, stdout, archive=False):
    if archive:
        newest = _newest_archived_price()
        files = [newest] if newest else []
        source_label = 'pricing archive'
    else:
        files = sorted(storage.inbox_dir('pricing').glob('*.csv'))
        source_label = 'pricing inbox'

    if not files:
        stdout.write(f'No pricing files found in the {source_label}.')
        return 0

    for path in files:
        applied = import_pricing(_validated_rows(path))
        stdout.write(f'Imported {applied} pricing rows from {path.name}.')
        if not archive:
            path.unlink()
    return len(files)
