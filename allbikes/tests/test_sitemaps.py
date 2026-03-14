import pytest
from django.test import RequestFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from allbikes.sitemaps import MotorcycleSitemap, StaticViewSitemap

@pytest.mark.django_db
class TestMotorcycleSitemap:

    def test_items_returns_only_for_sale(self):
        MotorcycleFactory(status='for_sale')
        MotorcycleFactory(status='sold')
        MotorcycleFactory(status='withdrawn')
        
        sitemap = MotorcycleSitemap()
        items = sitemap.items()
        
        assert items.count() == 1
        assert all(m.status == 'for_sale' for m in items)

    def test_lastmod(self):
        moto = MotorcycleFactory(status='for_sale')
        sitemap = MotorcycleSitemap()
        assert sitemap.lastmod(moto) == moto.date_posted

class TestStaticViewSitemap:

    def test_items(self):
        sitemap = StaticViewSitemap()
        items = sitemap.items()
        expected = [
            '/',
            '/inventory/motorcycles/new',
            '/inventory/motorcycles/used',
            '/contact',
            '/service', 
            '/escooters',
            '/tyre-fitting',
        ]
        assert items == expected

    def test_location(self):
        sitemap = StaticViewSitemap()
        assert sitemap.location('/contact') == '/contact'
