import os
import subprocess
import sys


LOAD_ORDER = [
    # Site/content pages and singleton settings first.
    'sites.site.json',
    'data_management.termsandconditions.json',
    'service.servicesettings.json',
    'service.jobtype.json',
    'hire.hiresettings.json',
    'hire.hireblockeddate.json',
    'hire.hireextra.json',
    'payments.depositsettings.json',

    # Catalogue/inventory before transactional rows that reference them.
    'inventory.motorcycle.json',
    'inventory.motorcycleimage.json',
    'product.product.json',
    'product.productimage.json',

    # Bookings/orders before payments and selected booking extras.
    'hire.hirebooking.json',
    'hire.hirebookingextra.json',
    'payments.order.json',
    'payments.payment.json',

    # Logs/messages last because they may reference transactional objects.
    'service.bookingrequestlog.json',
    'notifications.message.json',
]


def load_db_from_latest_archive(command):
    base_archive_dir = os.path.join('data_management', 'data', 'archive', 'db_backups')

    if not os.path.exists(base_archive_dir):
        command.stderr.write(command.style.ERROR(f"Archive directory not found: {base_archive_dir}"))
        return
    
    all_dirs = [d for d in os.listdir(base_archive_dir) if os.path.isdir(os.path.join(base_archive_dir, d))]
    if not all_dirs:
        command.stderr.write(command.style.ERROR("No archive directories found."))
        return
    
    latest_dir_name = sorted(all_dirs, reverse=True)[0]
    archive_dir = os.path.join(base_archive_dir, latest_dir_name)

    command.stdout.write(f"Loading data from latest archive: {archive_dir}")

    python_executable = sys.executable
    env = os.environ.copy()
    env['PYTHONUTF8'] = '1'

    command.stdout.write(command.style.WARNING("This will completely wipe the database before loading data."))
    flush_command = [python_executable, 'manage.py', 'flush', '--no-input']
    try:
        command.stdout.write("Flushing database...")
        subprocess.run(flush_command, check=True, capture_output=True, text=True, env=env, encoding='utf-8', errors='replace')
    except subprocess.CalledProcessError as e:
        command.stderr.write(command.style.ERROR(f"Failed to flush database.\n    Error: {e.stderr}"))
        return

    archived_files = [
        filename
        for filename in os.listdir(archive_dir)
        if filename.endswith('.json') and os.path.isfile(os.path.join(archive_dir, filename))
    ]
    archived_file_set = set(archived_files)
    ordered_files = [filename for filename in LOAD_ORDER if filename in archived_file_set]
    ordered_files.extend(sorted(archived_file_set - set(ordered_files)))

    missing_files = [filename for filename in LOAD_ORDER if filename not in archived_file_set]
    for filename in missing_files:
        command.stderr.write(command.style.WARNING(f"    - Could not find {filename} in archive, skipping."))

    for filename in ordered_files:
        filepath = os.path.join(archive_dir, filename)
        command.stdout.write(f"  - Loading {filename}...")
        loaddata_command = [
            python_executable, 'manage.py', 'loaddata', filepath
        ]
        try:
            subprocess.run(loaddata_command, check=True, capture_output=True, text=True, env=env, encoding='utf-8', errors='replace')
        except subprocess.CalledProcessError as e:
            command.stderr.write(command.style.ERROR(f"    Failed to load {filename}.\n    Error: {e.stderr}"))
            command.stderr.write(command.style.ERROR("Aborting data load."))
            return
    
    command.stdout.write(command.style.SUCCESS("\nData loading from archive complete."))
