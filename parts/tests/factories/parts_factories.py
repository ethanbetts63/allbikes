import factory
from factory.django import DjangoModelFactory
from django.utils.text import slugify

from parts.models import Part, PartsModel, PartSection, SectionPart


class PartsModelFactory(DjangoModelFactory):
    class Meta:
        model = PartsModel

    name = factory.Sequence(lambda n: f"Test Model {n}")
    model_code = factory.Sequence(lambda n: f"AX{n:04d}W-1")
    cc_class = '100_165'
    slug = factory.LazyAttribute(lambda o: slugify(f"{o.name}-{o.model_code}"))


class PartSectionFactory(DjangoModelFactory):
    class Meta:
        model = PartSection

    parts_model = factory.SubFactory(PartsModelFactory)
    code = factory.Sequence(lambda n: f"E{n % 99 + 1:02d}")
    group = 'engine'
    name = factory.Sequence(lambda n: f"Section {n}")
    sort_order = factory.Sequence(lambda n: n)


class PartFactory(DjangoModelFactory):
    class Meta:
        model = Part

    part_number = factory.Sequence(lambda n: f"11100-ABA-{n:03d}")
    description = factory.Sequence(lambda n: f"Test Part {n}")
    base_part_number = factory.LazyAttribute(lambda o: o.part_number)
    wholesale_price_incl_gst = factory.Faker('pydecimal', left_digits=3, right_digits=2, positive=True)
    available_qty = 5
    in_pa_feed = True


class SectionPartFactory(DjangoModelFactory):
    class Meta:
        model = SectionPart

    section = factory.SubFactory(PartSectionFactory)
    part = factory.SubFactory(PartFactory)
    ref_number = factory.Sequence(lambda n: str(n + 1))
    description = factory.LazyAttribute(lambda o: o.part.description)
    quantity = 1
    sort_order = factory.Sequence(lambda n: n)
