import csv
import os
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from service.models import Booking

# MechanicDesk job status -> our diary status.
STATUS_MAP = {
    'finished': Booking.Status.FINISHED,
    'new': Booking.Status.ACCEPTED,
    'preparing': Booking.Status.STARTED,
}
DEFAULT_STATUS = Booking.Status.ACCEPTED

DEFAULT_DATA_DIR = os.path.join(
    settings.BASE_DIR, 'data_management', 'data', 'mechanics_desk_data'
)


def _read_csv(path):
    with open(path, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def _normalize_year(raw):
    """'02/2012' -> '2012', '03/14' -> '2014', '2016' -> '2016'."""
    raw = (raw or '').strip()
    if not raw:
        return ''
    part = raw.split('/')[-1].strip()
    if part.isdigit():
        if len(part) == 2:
            return '20' + part
        return part[:4]
    return raw[:10]


def _normalize_odometer(raw):
    """'5046.0' -> '5046'."""
    raw = (raw or '').strip()
    if raw.endswith('.0'):
        raw = raw[:-2]
    return raw[:20]


def _parse_time(raw):
    """'2021-08-31 15:35:00 +0800' -> (date, time). The offset is AWST (the
    shop's timezone), so the naive local components are used directly."""
    raw = (raw or '').strip()
    if not raw:
        return None, None
    for fmt in ('%Y-%m-%d %H:%M:%S %z', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M %z', '%Y-%m-%d %H:%M'):
        try:
            dt = datetime.strptime(raw, fmt)
            return dt.date(), dt.time()
        except ValueError:
            continue
    return None, None


def _build_description(job_type, description):
    jt = (job_type or '').strip()
    desc = (description or '').strip()
    if jt and desc:
        return f"{jt} — {desc}"
    return jt or desc


def _first(*values):
    for v in values:
        v = (v or '').strip()
        if v:
            return v
    return ''


class Command(BaseCommand):
    help = (
        "Import MechanicDesk Jobs.csv into the diary as Booking records, joining "
        "Vehicles.csv (make/model/year) and Customers.csv (address). Idempotent: "
        "keyed on MechanicDesk Job Number, so re-running updates rather than "
        "duplicates. Creates nothing through the notification path, so no emails "
        "or SMS are sent."
    )

    def add_arguments(self, parser):
        parser.add_argument('--data-dir', default=DEFAULT_DATA_DIR,
                            help='Directory containing Jobs.csv, Vehicles.csv, Customers.csv.')
        parser.add_argument('--limit', type=int, default=None,
                            help='Only process the first N job rows (for testing).')
        parser.add_argument('--dry-run', action='store_true',
                            help='Report what would happen without writing to the database.')

    def handle(self, *args, **options):
        data_dir = options['data_dir']
        limit = options['limit']
        dry_run = options['dry_run']

        jobs_path = os.path.join(data_dir, 'Jobs.csv')
        vehicles_path = os.path.join(data_dir, 'Vehicles.csv')
        customers_path = os.path.join(data_dir, 'Customers.csv')

        for path in (jobs_path, vehicles_path, customers_path):
            if not os.path.exists(path):
                self.stderr.write(self.style.ERROR(f"Missing file: {path}"))
                return

        jobs = _read_csv(jobs_path)
        vehicles = {v['Vehicle Number']: v for v in _read_csv(vehicles_path) if v.get('Vehicle Number')}
        customers = {c['Customer ID']: c for c in _read_csv(customers_path) if c.get('Customer ID')}

        if limit:
            jobs = jobs[:limit]

        self.stdout.write(
            f"Jobs: {len(jobs)} | Vehicles: {len(vehicles)} | Customers: {len(customers)}"
            + (" | DRY RUN" if dry_run else "")
        )

        created = updated = skipped = 0
        errors = 0

        existing_numbers = set(
            Booking.objects.exclude(md_job_number='').values_list('md_job_number', flat=True)
        )

        def process():
            nonlocal created, updated, skipped, errors
            for row in jobs:
                job_number = (row.get('Job Number') or '').strip()
                if not job_number:
                    skipped += 1
                    continue

                drop_off_date, drop_off_time = _parse_time(row.get('Time'))
                if drop_off_date is None:
                    skipped += 1
                    continue

                vehicle = vehicles.get((row.get('Vehicle Number') or '').strip(), {})
                customer = customers.get((row.get('Customer ID') or '').strip(), {})

                fields = {
                    'drop_off_date': drop_off_date,
                    'drop_off_time': drop_off_time,
                    'customer_name': _first(row.get('Customer Name'))[:255],
                    'customer_phone': _first(row.get('Customer Phone'))[:30],
                    'customer_email': _first(row.get('Customer Email'))[:254],
                    'street_address': _first(customer.get('Address'), customer.get('Street Address'))[:255],
                    'suburb': _first(customer.get('Suburb'), customer.get('Street Address Suburb'))[:100],
                    'postcode': _first(customer.get('Postcode'), customer.get('Street Address Postcode'))[:10],
                    'registration': _first(row.get('Registration Number'), vehicle.get('Registration Number'))[:20],
                    'make': _first(vehicle.get('Make'))[:100],
                    'model': _first(vehicle.get('Model'))[:100],
                    'year': _normalize_year(vehicle.get('Year')),
                    'odometer': _normalize_odometer(_first(row.get('Odometer'), vehicle.get('Odometer'))),
                    'job_description': _build_description(row.get('Job Type'), row.get('Description')),
                    'status': STATUS_MAP.get((row.get('Status') or '').strip().lower(), DEFAULT_STATUS),
                    'source': Booking.Source.IMPORTED,
                }

                if not fields['customer_email']:
                    # avoid EmailField validation on blank+full_clean paths; blank is fine
                    fields['customer_email'] = ''

                try:
                    if dry_run:
                        if job_number in existing_numbers:
                            updated += 1
                        else:
                            created += 1
                        continue
                    _, was_created = Booking.objects.update_or_create(
                        md_job_number=job_number, defaults=fields,
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                except Exception as e:  # noqa: BLE001 - report and continue
                    errors += 1
                    self.stderr.write(self.style.WARNING(f"Job {job_number}: {e}"))

        if dry_run:
            process()
        else:
            with transaction.atomic():
                process()

        self.stdout.write(self.style.SUCCESS(
            f"Done. created={created} updated={updated} skipped={skipped} errors={errors}"
        ))
