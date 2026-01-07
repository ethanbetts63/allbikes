from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from django.contrib.sites.models import Site

class FixSiteDomainsCommandTest(TestCase):

    def setUp(self):
        """
        Ensure the site is in the expected state before each test.
        """
        self.new_domain = 'www.allbikesvespawarehouse.com.au'
        # Get or create the default 'example.com' site
        self.site, _ = Site.objects.get_or_create(
            pk=1, 
            defaults={'domain': 'example.com', 'name': 'example.com'}
        )
        self.site.domain = 'example.com'
        self.site.name = 'example.com'
        self.site.save()

    def test_updates_existing_example_com_site(self):
        """
        Test that the command successfully updates the 'example.com' site.
        """
        out = StringIO()
        call_command('fix_site_domains', stdout=out)
        
        self.site.refresh_from_db()
        
        self.assertIn(f"Successfully updated site domain to '{self.new_domain}'", out.getvalue())
        self.assertEqual(self.site.domain, self.new_domain)
        self.assertEqual(self.site.name, self.new_domain)

    def test_handles_no_example_com_site(self):
        """
        Test that the command handles the case where 'example.com' does not exist.
        """
        # Change the domain so the command can't find it
        self.site.domain = 'already-changed.com'
        self.site.name = 'already-changed.com'
        self.site.save()

        err = StringIO()
        call_command('fix_site_domains', stderr=err)

        self.assertIn("Could not find a site with domain 'example.com'", err.getvalue())
        
        # Ensure the domain was not changed back
        self.site.refresh_from_db()
        self.assertEqual(self.site.domain, 'already-changed.com')
