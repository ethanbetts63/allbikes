from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from django.conf import settings

class Command(BaseCommand):
    help = 'Updates the domain for the default site.'

    def handle(self, *args, **options):
        old_domains = ['example.com', 'www.allbikesvespawarehouse.com.au']
        new_domain = 'www.scootershop.com.au'

        updated = False
        for old_domain in old_domains:
            try:
                site_to_update = Site.objects.get(domain=old_domain)
                self.stdout.write(f"Found site: {site_to_update.name} with domain {site_to_update.domain}")
                site_to_update.domain = new_domain
                site_to_update.name = new_domain
                site_to_update.save()
                self.stdout.write(self.style.SUCCESS(f"Successfully updated '{old_domain}' to '{new_domain}'"))
                updated = True
            except Site.DoesNotExist:
                self.stdout.write(f"No site found with domain '{old_domain}', skipping.")
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"An error occurred updating '{old_domain}': {e}"))

        if not updated:
            self.stderr.write(self.style.ERROR("No matching sites were found to update."))