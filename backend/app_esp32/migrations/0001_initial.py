

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Eletrodomestico',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100)),
                ('localizacao', models.CharField(max_length=100)),
                ('data_instalacao', models.DateField()),
                ('limite_tensao', models.FloatField(default=250)),
                ('limite_corrente', models.FloatField(default=10)),
                ('limite_potencia', models.FloatField(default=2000)),
                ('data_manutencao', models.DateField()),
            ],
        ),
        migrations.CreateModel(
            name='Evento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('PICO', 'Pico de Tensão'), ('NORMAL', 'Tensão Normalizada'), ('MANUTENCAO', 'Manutenção Próxima')], max_length=20)),
                ('descricao', models.TextField()),
                ('data_hora', models.DateTimeField(auto_now_add=True)),
                ('eletrodomestico', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app_esp32.eletrodomestico')),
            ],
        ),
        migrations.CreateModel(
            name='LeituraEnergia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tensao', models.FloatField()),
                ('corrente', models.FloatField()),
                ('potencia', models.FloatField()),
                ('frequencia', models.FloatField()),
                ('energia_kwh', models.FloatField()),
                ('data_hora', models.DateTimeField(auto_now_add=True)),
                ('eletrodomestico', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app_esp32.eletrodomestico')),
            ],
        ),
    ]
