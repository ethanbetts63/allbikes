from io import StringIO
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError


def _patch_all():
    return (
        patch('parts.management.commands.scrape.scrape_parts.run'),
        patch('parts.management.commands.scrape.scrape_prices.run'),
        patch('data_management.management.commands.update.update_parts.run'),
        patch('data_management.management.commands.update.update_prices.run'),
    )


def test_sync_runs_all_four_steps_in_order():
    calls = []
    patches = _patch_all()
    with patches[0] as sp, patches[1] as spr, patches[2] as up, patches[3] as upr:
        sp.side_effect = lambda **kw: calls.append('scrape_parts')
        spr.side_effect = lambda **kw: calls.append('scrape_prices')
        up.side_effect = lambda **kw: calls.append('update_parts')
        upr.side_effect = lambda **kw: calls.append('update_prices')
        call_command('sync', stdout=StringIO(), stderr=StringIO())

    assert calls == ['scrape_parts', 'scrape_prices', 'update_parts', 'update_prices']


def test_sync_forwards_force_and_url_overrides():
    patches = _patch_all()
    with patches[0] as sp, patches[1] as spr, patches[2], patches[3]:
        call_command(
            'sync',
            '--force',
            '--parts-url', 'https://example.test/books',
            '--prices-url', 'https://example.test/prices',
            stdout=StringIO(),
            stderr=StringIO(),
        )

    assert sp.call_args.kwargs['force'] is True
    assert sp.call_args.kwargs['url'] == 'https://example.test/books'
    assert spr.call_args.kwargs['force'] is True
    assert spr.call_args.kwargs['url'] == 'https://example.test/prices'


def test_failed_scrape_skips_matching_update_but_not_the_other():
    patches = _patch_all()
    with patches[0] as sp, patches[1], patches[2] as up, patches[3] as upr:
        sp.side_effect = RuntimeError('portal down')
        err = StringIO()
        with pytest.raises(CommandError):
            call_command('sync', stdout=StringIO(), stderr=err)

    up.assert_not_called()
    upr.assert_called_once()
    assert 'portal down' in err.getvalue()
