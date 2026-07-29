import django.db.models.deletion
import parts.models.parts_order
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Part",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "part_number",
                    models.CharField(
                        help_text="Full part number incl. any colour suffix, e.g. '53205-ALA-000-RD'.",
                        max_length=60,
                        unique=True,
                    ),
                ),
                ("description", models.CharField(blank=True, max_length=255)),
                (
                    "base_part_number",
                    models.CharField(
                        blank=True,
                        db_index=True,
                        help_text="Part number without the colour suffix; equals part_number when not colour-keyed.",
                        max_length=60,
                    ),
                ),
                (
                    "colour_suffix",
                    models.CharField(
                        blank=True, help_text="Colour suffix, e.g. 'RD'.", max_length=10
                    ),
                ),
                (
                    "paint_code",
                    models.CharField(
                        blank=True,
                        help_text="Paint code parsed from description, e.g. 'R-010CA'.",
                        max_length=30,
                    ),
                ),
                (
                    "colour_name",
                    models.CharField(
                        blank=True,
                        help_text="Human colour name, e.g. 'Red'.",
                        max_length=50,
                    ),
                ),
                (
                    "wholesale_price_incl_gst",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="From the PA 'RRP+GST' column; null = unknown.",
                        max_digits=10,
                        null=True,
                    ),
                ),
                (
                    "available_qty",
                    models.IntegerField(
                        blank=True,
                        help_text="From PA 'AVAILABLE'; null = not in the PA feed.",
                        null=True,
                    ),
                ),
                (
                    "in_pa_feed",
                    models.BooleanField(
                        default=False, help_text="True if present in the latest PA CSV."
                    ),
                ),
                ("price_updated_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["part_number"],
            },
        ),
        migrations.CreateModel(
            name="PartsModel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        help_text="Display name from the source page, e.g. 'Classic 150'.",
                        max_length=200,
                    ),
                ),
                (
                    "model_code",
                    models.CharField(
                        help_text="SYM model code, e.g. 'AX15W2-6'. The stable key.",
                        max_length=50,
                        unique=True,
                    ),
                ),
                (
                    "cc_class",
                    models.CharField(
                        choices=[
                            ("50", "50cc"),
                            ("100_165", "100cc – 165cc"),
                            ("200_400", "200cc – 400cc"),
                            ("atv", "ATV's"),
                        ],
                        max_length=10,
                    ),
                ),
                ("slug", models.SlugField(max_length=120, unique=True)),
                ("source_xls_url", models.URLField(blank=True, max_length=500)),
                ("source_filename", models.CharField(blank=True, max_length=255)),
                (
                    "book_hash",
                    models.CharField(
                        blank=True,
                        help_text="sha256 of the last-imported .xls, for change detection.",
                        max_length=64,
                    ),
                ),
                ("last_ingested_at", models.DateTimeField(blank=True, null=True)),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="False if the book disappears from the source page.",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["cc_class", "name"],
            },
        ),
        migrations.CreateModel(
            name="PartsOrder",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "order_reference",
                    models.CharField(blank=True, max_length=20, unique=True),
                ),
                (
                    "access_token",
                    models.CharField(
                        default=parts.models.parts_order._generate_access_token,
                        editable=False,
                        max_length=64,
                        unique=True,
                    ),
                ),
                ("customer_name", models.CharField(max_length=200)),
                ("customer_email", models.EmailField(max_length=254)),
                ("customer_phone", models.CharField(blank=True, max_length=50)),
                ("address_line1", models.CharField(max_length=200)),
                ("address_line2", models.CharField(blank=True, max_length=200)),
                ("suburb", models.CharField(max_length=100)),
                ("state", models.CharField(blank=True, max_length=50)),
                ("postcode", models.CharField(max_length=20)),
                ("country", models.CharField(default="Australia", max_length=100)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending_payment", "Pending Payment"),
                            ("paid", "Paid"),
                            ("dispatched", "Dispatched"),
                            ("completed", "Completed"),
                            ("cancelled", "Cancelled"),
                            ("refunded", "Refunded"),
                            ("partially_refunded", "Partially Refunded"),
                        ],
                        default="pending_payment",
                        max_length=20,
                    ),
                ),
                (
                    "has_backorder",
                    models.BooleanField(
                        default=False,
                        help_text="True if any line was understocked at order time.",
                    ),
                ),
                (
                    "backorder_hold_days",
                    models.PositiveIntegerField(
                        help_text="Backorder policy snapshotted from Parts Settings when the order is created.",
                    ),
                ),
                (
                    "subtotal",
                    models.DecimalField(decimal_places=2, default=0, max_digits=10),
                ),
                (
                    "shipping",
                    models.DecimalField(decimal_places=2, default=0, max_digits=10),
                ),
                (
                    "total",
                    models.DecimalField(decimal_places=2, default=0, max_digits=10),
                ),
                (
                    "amount_paid",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                ("terms_accepted", models.BooleanField(default=False)),
                (
                    "admin_notes",
                    models.TextField(
                        blank=True,
                        help_text="Internal notes (wholesaler chase-ups, etc.). Not shown to the customer.",
                    ),
                ),
                ("dispatched_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PartsSettings",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "markup_percentage",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("20.00"),
                        help_text="Percent added to the wholesale price to get the customer price, e.g. 20.00 = +20%.",
                        max_digits=6,
                    ),
                ),
                (
                    "shipping_fee",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("15.00"),
                        help_text="Flat shipping fee (AUD) for Australian delivery addresses.",
                        max_digits=10,
                    ),
                ),
                (
                    "enable_new_part_sales",
                    models.BooleanField(
                        default=True,
                        help_text="Allow customers to add genuine new SYM parts to their cart and checkout.",
                    ),
                ),
                (
                    "backorder_hold_days",
                    models.PositiveIntegerField(
                        default=7,
                        help_text="Days an order can wait for a backordered part before the operator refunds it.",
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Parts Settings",
                "verbose_name_plural": "Parts Settings",
            },
        ),
        migrations.CreateModel(
            name="PartSection",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "code",
                    models.CharField(
                        help_text="Section code, e.g. 'E01', 'F14'.", max_length=10
                    ),
                ),
                (
                    "group",
                    models.CharField(
                        choices=[("engine", "Engine"), ("frame", "Frame")],
                        max_length=10,
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        help_text="Section name, e.g. 'Shroud Assy'.", max_length=200
                    ),
                ),
                (
                    "diagram_image",
                    models.ImageField(
                        blank=True, null=True, upload_to="parts/diagrams/"
                    ),
                ),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "parts_model",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sections",
                        to="parts.partsmodel",
                    ),
                ),
            ],
            options={
                "ordering": ["parts_model", "sort_order", "code"],
                "unique_together": {("parts_model", "code")},
            },
        ),
        migrations.CreateModel(
            name="PartsOrderItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "part_number",
                    models.CharField(
                        help_text="Snapshot, incl. any colour suffix.", max_length=60
                    ),
                ),
                ("description", models.CharField(blank=True, max_length=255)),
                ("colour_name", models.CharField(blank=True, max_length=50)),
                ("model_name", models.CharField(blank=True, max_length=200)),
                ("model_code", models.CharField(blank=True, max_length=50)),
                ("section_code", models.CharField(blank=True, max_length=10)),
                ("ref_number", models.CharField(blank=True, max_length=20)),
                ("quantity", models.PositiveIntegerField(default=1)),
                (
                    "unit_price",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Customer price incl. GST (marked up).",
                        max_digits=10,
                    ),
                ),
                ("line_total", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "status",
                    models.CharField(
                        choices=[("to_order", "To Order"), ("refunded", "Refunded")],
                        default="to_order",
                        max_length=20,
                    ),
                ),
                (
                    "backordered",
                    models.BooleanField(
                        default=False,
                        help_text="Understocked at order time / placed on backorder by admin.",
                    ),
                ),
                (
                    "parts_order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="parts.partsorder",
                    ),
                ),
            ],
            options={
                "ordering": ["id"],
            },
        ),
        migrations.CreateModel(
            name="SectionPart",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "fitment_key",
                    models.CharField(
                        help_text="Stable model/section/callout/part identity used by carts across book re-imports.",
                        max_length=200,
                        unique=True,
                    ),
                ),
                (
                    "ref_number",
                    models.CharField(
                        help_text="Callout number as printed on the diagram, e.g. '2', '2-1'.",
                        max_length=20,
                    ),
                ),
                (
                    "description",
                    models.CharField(
                        blank=True,
                        help_text="Description as printed in this book.",
                        max_length=255,
                    ),
                ),
                ("quantity", models.PositiveIntegerField(default=1)),
                (
                    "effective_date",
                    models.DateField(
                        blank=True,
                        help_text="Running-change date, parsed from the book's Excel serial.",
                        null=True,
                    ),
                ),
                (
                    "superseded_flag",
                    models.CharField(
                        blank=True,
                        help_text="The book's supersession flag/note (usually Y/N).",
                        max_length=50,
                    ),
                ),
                ("sort_order", models.PositiveIntegerField(default=0)),
                (
                    "part",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="section_parts",
                        to="parts.part",
                    ),
                ),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="parts",
                        to="parts.partsection",
                    ),
                ),
            ],
            options={
                "ordering": ["section", "sort_order"],
            },
        ),
    ]
