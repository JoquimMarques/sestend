from django.db import models

class Eletrodomestico(models.Model):
    nome = models.CharField(max_length=100)
    localizacao = models.CharField(max_length=100)
    data_instalacao = models.DateField()
    numero_sensor = models.IntegerField(default=1)  # 1 ou 2 (para ESP32 com 2 PZEM)
    
    limite_tensao = models.FloatField(default=230.0)  # Mesmo do código C++
    limite_subtensao = models.FloatField(default=190)
    limite_corrente = models.FloatField(default=8.0)  # Mesmo do código C++
    limite_subcorrente = models.FloatField(default=0.10)
    limite_curto_circuito = models.FloatField(default=25)
    limite_potencia = models.FloatField(default=1500.0)  # Mesmo do código C++
    
    rele_ligado = models.BooleanField(default=True)
    is_mock = models.BooleanField(default=False)
    
    # Novos campos compatíveis com display ESP32
    frequencia_rede = models.FloatField(default=60.0)
    fator_potencia_nominal = models.FloatField(default=1.0)

    def __str__(self):
        return self.nome


class LeituraEnergia(models.Model):
    eletrodomestico = models.ForeignKey(Eletrodomestico, on_delete=models.CASCADE)
    tensao = models.FloatField()
    corrente = models.FloatField()
    potencia = models.FloatField()
    frequencia = models.FloatField()
    energia_kwh = models.FloatField()
    fator_potencia = models.FloatField(default=0)
    pico_de_tensao = models.FloatField(default=0)
    data_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.eletrodomestico.nome} - {self.data_hora}"


class Evento(models.Model):
    TIPOS = (
        ('PICO', 'Pico de Tensão'),
        ('SOBRECORRENTE', 'Sobrecorrente'),
        ('SOBRECONSUMO', 'Sobreconsumo de Energia'),
    )

    eletrodomestico = models.ForeignKey(Eletrodomestico, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    descricao = models.TextField()
    data_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} - {self.data_hora}"

class ConfiguracaoConsumo(models.Model):
    PERIODOS = (
        ('DIARIO', 'Diário'),
        ('MENSAL', 'Mensal'),
    )
    eletrodomestico = models.OneToOneField(Eletrodomestico, on_delete=models.CASCADE)
    limite_kwh = models.FloatField(default=100)
    periodo_alarme = models.CharField(max_length=10, choices=PERIODOS, default='MENSAL')
    alarme_ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"Config para {self.eletrodomestico.nome}"


