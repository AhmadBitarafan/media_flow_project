# Generated migration for adding max_revisions to ProjectRequest

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0002_project_budget_max_project_budget_min_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='projectrequest',
            name='max_revisions',
            field=models.PositiveIntegerField(default=3, help_text='Maximum revisions allowed when converted to project'),
        ),
    ]
