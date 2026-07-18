import csv
import pytest
from django.core.management import call_command

from service.models import Booking


def _write_csv(path, rows, fieldnames):
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)


@pytest.fixture
def data_dir(tmp_path):
    _write_csv(
        tmp_path / 'Jobs.csv',
        [
            {
                'Job Number': '101', 'Status': 'finished', 'Vehicle Number': 'V1',
                'Registration Number': '1ABC234', 'Customer ID': 'C1',
                'Customer Name': 'Jane Doe', 'Customer Email': 'jane@example.com',
                'Customer Phone': '0400111222', 'Job Type': 'Tyre Fitting',
                'Description': 'Front + rear tyres', 'Odometer': '5046.0',
                'Time': '2021-08-31 15:35:00 +0800',
            },
            {
                'Job Number': '102', 'Status': 'new', 'Vehicle Number': 'V2',
                'Registration Number': '', 'Customer ID': 'C2',
                'Customer Name': 'Bob Smith', 'Customer Email': '',
                'Customer Phone': '0400333444', 'Job Type': '', 'Description': 'Service',
                'Odometer': '', 'Time': '2021-09-03 14:30:00 +0800',
            },
        ],
        ['Job Number', 'Status', 'Vehicle Number', 'Registration Number', 'Customer ID',
         'Customer Name', 'Customer Email', 'Customer Phone', 'Job Type', 'Description',
         'Odometer', 'Time'],
    )
    _write_csv(
        tmp_path / 'Vehicles.csv',
        [
            {'Vehicle Number': 'V1', 'Registration Number': '1ABC234', 'Make': 'Vespa',
             'Model': 'GTS 300', 'Year': '03/14', 'Odometer': '5000.0'},
            {'Vehicle Number': 'V2', 'Registration Number': '9ZZZ999', 'Make': 'Honda',
             'Model': 'CB125', 'Year': '2019', 'Odometer': '2000.0'},
        ],
        ['Vehicle Number', 'Registration Number', 'Make', 'Model', 'Year', 'Odometer'],
    )
    _write_csv(
        tmp_path / 'Customers.csv',
        [
            {'Customer ID': 'C1', 'Address': '10 Test St', 'Street Address': '',
             'Suburb': 'Dianella', 'Street Address Suburb': '', 'Postcode': '6059',
             'Street Address Postcode': ''},
            {'Customer ID': 'C2', 'Address': '', 'Street Address': '', 'Suburb': '',
             'Street Address Suburb': '', 'Postcode': '', 'Street Address Postcode': ''},
        ],
        ['Customer ID', 'Address', 'Street Address', 'Suburb', 'Street Address Suburb',
         'Postcode', 'Street Address Postcode'],
    )
    return str(tmp_path)


@pytest.mark.django_db
class TestImportMechanicdeskJobs:
    def test_imports_and_maps_fields(self, data_dir):
        call_command('import_mechanicdesk_jobs', '--data-dir', data_dir)

        assert Booking.objects.filter(source=Booking.Source.IMPORTED).count() == 2

        b1 = Booking.objects.get(md_job_number='101')
        assert b1.status == Booking.Status.FINISHED_PAID
        assert b1.customer_name == 'Jane Doe'
        assert b1.make == 'Vespa'
        assert b1.model == 'GTS 300'
        assert b1.year == '2014'                 # '03/14' normalized
        assert b1.odometer == '5046'             # '.0' stripped, job value preferred
        assert b1.registration == '1ABC234'
        assert b1.suburb == 'Dianella'
        assert b1.postcode == '6059'
        assert b1.street_address == '10 Test St'
        assert 'Tyre Fitting' in b1.job_description and 'Front + rear tyres' in b1.job_description
        assert str(b1.drop_off_date) == '2021-08-31'

        b2 = Booking.objects.get(md_job_number='102')
        assert b2.status == Booking.Status.NOT_STARTED   # 'new'
        assert b2.customer_email == ''
        assert b2.job_description == 'Service'

    def test_is_idempotent(self, data_dir):
        call_command('import_mechanicdesk_jobs', '--data-dir', data_dir)
        call_command('import_mechanicdesk_jobs', '--data-dir', data_dir)
        assert Booking.objects.filter(source=Booking.Source.IMPORTED).count() == 2

    def test_dry_run_writes_nothing(self, data_dir):
        call_command('import_mechanicdesk_jobs', '--data-dir', data_dir, '--dry-run')
        assert Booking.objects.count() == 0
