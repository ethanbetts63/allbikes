from parts.ingestion import source_page, storage


def run(*, stdout, url=None, force=False):
    page_url = url or source_page.SOURCE_URL
    pa_url, pa_date = source_page.parse_pa_link(source_page.fetch_page(page_url))
    if not pa_url:
        raise RuntimeError('Could not find the Price & Availability link on the page.')

    data = source_page.download_bytes(pa_url, timeout=60)
    digest = storage.sha256_bytes(data)
    if not force and digest in storage.archived_hashes('pricing'):
        stdout.write('No change — current pricing file is already archived.')
        return 0

    stamp = pa_date.isoformat() if pa_date else 'undated'
    filename = f"PA-{stamp}-{digest[:12]}.csv"
    storage.queue_file('pricing', filename, data)
    stdout.write(f"Queued pricing file {filename} ({len(data)} bytes).")
    return 1
