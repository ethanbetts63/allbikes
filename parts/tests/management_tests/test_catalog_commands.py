import os
from io import StringIO
from unittest.mock import patch

import pytest
from django.core.management import call_command

from parts.ingestion import storage
from parts.management.utils import update_parts, update_prices


def test_scrape_parts_routes_to_parts_utility():
    with patch('parts.management.commands.scrape.scrape_parts.run') as run:
        call_command('scrape', '--parts', stdout=StringIO(), stderr=StringIO())
    run.assert_called_once()


def test_scrape_prices_routes_to_prices_utility():
    with patch('parts.management.commands.scrape.scrape_prices.run') as run:
        call_command('scrape', '--prices', stdout=StringIO(), stderr=StringIO())
    run.assert_called_once()


def test_update_archive_flag_is_forwarded():
    with patch('data_management.management.commands.update.update_parts.run') as run:
        call_command('update', '--parts', '--archive', stdout=StringIO(), stderr=StringIO())
    assert run.call_args.kwargs['archive'] is True


def _touch(path, timestamp):
    path.write_bytes(path.name.encode())
    os.utime(path, (timestamp, timestamp))


def test_parts_archive_selects_newest_version_of_each_model(tmp_path, monkeypatch):
    monkeypatch.setattr(storage, 'BASE_DIR', tmp_path)
    archive = storage.archive_dir('books')
    old_a = archive / 'model-a-old.xls'
    new_a = archive / 'model-a-new.xls'
    only_b = archive / 'model-b.xls'
    _touch(old_a, 1)
    _touch(new_a, 2)
    _touch(only_b, 1)

    monkeypatch.setattr(
        update_parts,
        'read_model_code',
        lambda path: 'MODEL-A' if 'model-a' in path else 'MODEL-B',
    )
    imported = []
    monkeypatch.setattr(
        update_parts,
        '_import_one',
        lambda path, **kwargs: imported.append(path.name),
    )

    count = update_parts.run(
        stdout=StringIO(), stderr=StringIO(), archive=True
    )

    assert count == 2
    assert imported == ['model-a-new.xls', 'model-b.xls']
    assert old_a.exists() and new_a.exists() and only_b.exists()


def test_prices_archive_applies_only_newest_csv(tmp_path, monkeypatch):
    monkeypatch.setattr(storage, 'BASE_DIR', tmp_path)
    archive = storage.archive_dir('pricing')
    old = archive / 'PA-2026-07-01.csv'
    newest = archive / 'PA-2026-07-29.csv'
    _touch(old, 1)
    _touch(newest, 2)

    monkeypatch.setattr(update_prices, '_validated_rows', lambda path: [path.name])
    imported = []
    monkeypatch.setattr(
        update_prices,
        'import_pricing',
        lambda rows: imported.extend(rows) or len(rows),
    )

    count = update_prices.run(stdout=StringIO(), archive=True)

    assert count == 1
    assert imported == ['PA-2026-07-29.csv']
    assert old.exists() and newest.exists()


def test_normal_prices_update_consumes_inbox(tmp_path, monkeypatch):
    monkeypatch.setattr(storage, 'BASE_DIR', tmp_path)
    inbox_file = storage.inbox_dir('pricing') / 'PA-current.csv'
    _touch(inbox_file, 1)
    monkeypatch.setattr(update_prices, '_validated_rows', lambda path: ['row'])
    monkeypatch.setattr(update_prices, 'import_pricing', lambda rows: 1)

    update_prices.run(stdout=StringIO(), archive=False)

    assert not inbox_file.exists()
