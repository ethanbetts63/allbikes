from django.contrib.sitemaps import Sitemap
from inventory.models import Motorcycle

class MotorcycleSitemap(Sitemap):
    """
    Sitemap for motorcycles that are for sale.
    """
    changefreq = "weekly"
    priority = 0.9
    protocol = 'https'

    def items(self):
        return Motorcycle.objects.filter(status="for_sale")

    def lastmod(self, obj):
        return obj.date_posted

class StaticViewSitemap(Sitemap):
    """
    Sitemap for static pages.
    """
    priority = 0.7
    changefreq = 'daily'
    protocol = 'https'

    def items(self):
        return [
            '/',
            '/inventory/motorcycles/new',
            '/inventory/motorcycles/used',
            '/contact',
            '/service', 
            '/tyre-fitting',
        ]

    def location(self, item):
        return item
