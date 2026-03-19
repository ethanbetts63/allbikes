from django.contrib.sitemaps import Sitemap
from inventory.models import Motorcycle
from product.models.product import Product

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

class ProductSitemap(Sitemap):
    """Sitemap for e-scooter products that are active."""
    changefreq = "weekly"
    priority = 0.8
    protocol = 'https'

    def items(self):
        return Product.objects.filter(is_active=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/escooters/{obj.slug}'


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
            '/inventory/motorcycles/parts',
            '/contact',
            '/service', 
            '/escooters',
            '/electric-scooters',
            '/tyre-fitting',
        ]

    def location(self, item):
        return item
