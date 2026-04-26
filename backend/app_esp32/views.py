from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, datetime, timedelta
from django.db.models import Max, Avg, Sum
from types import SimpleNamespace
import math
import json
from .models import *


def _placeholder_dispositivo(sensor):
    return SimpleNamespace(
        id=None,
        nome=f"Dispositivo {sensor}",
        localizacao=f"Sensor {sensor}",
        numero_sensor=sensor,
        rele_ligado=False,
        is_mock=False,
        limite_tensao=230.0,
        limite_subtensao=190.0,
        limite_corrente=8.0,
        limite_subcorrente=0.10,
        limite_curto_circuito=25.0,
        limite_potencia=1500.0,
    )


def _criar_dispositivo_padrao(sensor):
    return Eletrodomestico.objects.create(
        nome=f"Dispositivo {sensor}",
        localizacao=f"Sensor {sensor}",
        data_instalacao=date.today(),
        numero_sensor=sensor,
        is_mock=False,
        rele_ligado=True,
        limite_tensao=230.0,
        limite_subtensao=190.0,
        limite_corrente=8.0,
        limite_subcorrente=0.10,
        limite_curto_circuito=25.0,
        limite_potencia=1500.0,
    )


def _get_dispositivos_sensores(include_placeholders=False):
    dispositivos = []
    for sensor in (1, 2):
        eletro = Eletrodomestico.objects.filter(numero_sensor=sensor).order_by('id').first()
        if eletro:
            dispositivos.append(eletro)
        elif include_placeholders:
            dispositivos.append(_placeholder_dispositivo(sensor))

    # Dispositivos extras de simulacao (sem hardware real)
    mock_devices = Eletrodomestico.objects.filter(is_mock=True).exclude(numero_sensor__in=[1, 2]).order_by('numero_sensor', 'id')
    dispositivos.extend(list(mock_devices))

    return dispositivos

# =====================
# VIEW - DADOS COMPLETOS DO BANCO
# =====================
@login_required(login_url='login')
@user_passes_test(lambda u: u.is_staff, login_url='index')
def dados_completos_view(request):
    """
    Visualização completa de todos os dados do banco, organizados por dispositivo.
    Mostra estatísticas e histórico detalhado.
    """
    eletrodomesticos = _get_dispositivos_sensores()
    dados_dispositivos = []
    
    for eletro in eletrodomesticos:
        leituras = LeituraEnergia.objects.filter(eletrodomestico=eletro).order_by('-data_hora')
        
        # Estatísticas
        stats = leituras.aggregate(
            tensao_media=Avg('tensao'),
            tensao_max=Max('tensao'),
            corrente_media=Avg('corrente'),
            corrente_max=Max('corrente'),
            potencia_media=Avg('potencia'),
            potencia_max=Max('potencia'),
            energia_total=Sum('energia_kwh'),
            fator_potencia_media=Avg('fator_potencia')
        )
        
        # Eventos associados
        eventos = Evento.objects.filter(eletrodomestico=eletro).order_by('-data_hora')[:20]
        
        # Últimas 50 leituras
        ultimas_leituras = leituras[:50]
        
        dados_dispositivos.append({
            'eletro': eletro,
            'stats': stats,
            'eventos': eventos,
            'ultimas_leituras': ultimas_leituras,
            'total_leituras': leituras.count()
        })
    
    return render(request, "dados_completos.html", {"dados_dispositivos": dados_dispositivos})


@login_required(login_url='login')
@user_passes_test(lambda u: u.is_staff, login_url='index')
def configuracoes_view(request):
    """
    Página de configurações para editar limites de proteção dos sensores.
    """
    if request.method == "POST":
        eletro_id = request.POST.get("eletro_id")
        eletro = get_object_or_404(Eletrodomestico, id=eletro_id)
        
        eletro.nome = request.POST.get("nome")
        eletro.localizacao = request.POST.get("localizacao")
        eletro.limite_tensao = float(request.POST.get("limite_tensao", 230.0))
        eletro.limite_subtensao = float(request.POST.get("limite_subtensao", 190.0))
        eletro.limite_corrente = float(request.POST.get("limite_corrente", 8.0))
        eletro.limite_subcorrente = float(request.POST.get("limite_subcorrente", 0.1))
        eletro.limite_curto_circuito = float(request.POST.get("limite_curto_circuito", 25.0))
        eletro.limite_potencia = float(request.POST.get("limite_potencia", 1500.0))
        
        eletro.save()
        return redirect('configuracoes')

    eletrodomesticos = _get_dispositivos_sensores()
    return render(request, "configuracoes.html", {"eletrodomesticos": eletrodomesticos})


def favicon(request):
    return HttpResponse(status=204) # Silencioso, evita erros 404 de ícone no log

def login_view(request):
    if request.method == "POST":
        u = request.POST.get("username")
        p = request.POST.get("password")
        user = authenticate(request, username=u, password=p)
        if user is not None:
            login(request, user)
            return redirect("index")
        else:
            return render(request, "login.html", {"error": "Credenciais inválidas"})
    return render(request, "login.html")

def logout_view(request):
    logout(request)
    return redirect("login")

def registro_view(request):
    if request.method == "POST":
        u = request.POST.get("username")
        p = request.POST.get("password") or ""
        n = request.POST.get("nome")
        tipo = request.POST.get("tipo")  # 'ADM' ou 'USER'

        if len(p) < 6:
            return render(request, "registro.html", {"error": "A senha precisa ter no mínimo 6 caracteres."})
        
        if User.objects.filter(username=u).exists():
            return render(request, "registro.html", {"error": "Este usuário já existe"})
            
        user = User.objects.create_user(username=u, password=p, first_name=n)
        if tipo == 'ADM':
            user.is_superuser = True
            user.is_staff = True
        user.save()
        
        login(request, user)
        return redirect("index")
        
    return render(request, "registro.html")

@login_required(login_url='login')
def index(request):
    eletrodomesticos = _get_dispositivos_sensores(include_placeholders=True)
    eventos = Evento.objects.order_by('-data_hora')[:5]
    return render(request, "index.html", {"eletrodomesticos": eletrodomesticos, "eventos": eventos})

@login_required(login_url='login')
@user_passes_test(lambda u: u.is_staff, login_url='index')
def adicionar_dispositivo(request):
    if request.method == "POST":
        nome = request.POST.get("nome", "").strip()
        if not nome:
            return render(request, "adicionar_dispositivo.html", {"error": "Informe um nome para o equipamento."})

        ultimo_numero = Eletrodomestico.objects.aggregate(max_numero=Max('numero_sensor')).get('max_numero') or 2
        novo_numero = ultimo_numero + 1

        Eletrodomestico.objects.create(
            nome=nome,
            localizacao="Virtual",
            data_instalacao=date.today(),
            numero_sensor=novo_numero,
            is_mock=True,
            rele_ligado=True,
        )
        return redirect('index')

    return render(request, "adicionar_dispositivo.html")

@login_required(login_url='login')
def relatorio(request):
    leituras_lista = LeituraEnergia.objects.all().order_by('-data_hora')
    paginator = Paginator(leituras_lista, 10)  # Paginação: 10 itens por página
    page_number = request.GET.get('page')
    leituras = paginator.get_page(page_number)
    return render(request, "relatorio.html", {"leituras": leituras})

@csrf_exempt
def deletar_leitura(request, id):
    try:
        leitura = LeituraEnergia.objects.get(id=id)
        leitura.delete()
        return JsonResponse({"status": "sucesso"})
    except LeituraEnergia.DoesNotExist:
        return JsonResponse({"status": "erro", "mensagem": "Registro não encontrado"}, status=404)


@csrf_exempt
def deletar_evento(request, id):
    try:
        evento = Evento.objects.get(id=id)
        evento.delete()
        return JsonResponse({"status": "sucesso"})
    except Evento.DoesNotExist:
        return JsonResponse({"status": "erro", "mensagem": "Alerta não encontrado"}, status=404)

@csrf_exempt
def limpar_alertas(request):
    Evento.objects.all().delete()
    return JsonResponse({"status": "sucesso"})

@csrf_exempt
def limpar_relatorio(request):
    # Permite GET ou POST para evitar erros de preflight CORS
    LeituraEnergia.objects.all().delete()
    return JsonResponse({"status": "sucesso"})

@login_required(login_url='login')
@user_passes_test(lambda u: u.is_staff, login_url='index')
def limpar_subconsumo(request):
    LeituraEnergia.objects.exclude(energia_kwh=0).delete()
    return redirect('subconsumo')

@login_required(login_url='login')
def alertas_view(request):
    eventos_qs = Evento.objects.select_related('eletrodomestico').filter(
        tipo__in=['PICO', 'SOBRECORRENTE', 'SOBRECONSUMO']
    ).order_by('-data_hora')

    filtro_tipo = (request.GET.get('tipo') or '').strip()
    filtro_sensor = (request.GET.get('sensor') or '').strip()
    filtro_texto = (request.GET.get('q') or '').strip()
    filtro_data_inicio = (request.GET.get('inicio') or '').strip()
    filtro_data_fim = (request.GET.get('fim') or '').strip()

    if filtro_tipo:
        eventos_qs = eventos_qs.filter(tipo=filtro_tipo)

    if filtro_sensor:
        try:
            eventos_qs = eventos_qs.filter(eletrodomestico__numero_sensor=int(filtro_sensor))
        except ValueError:
            pass

    if filtro_texto:
        eventos_qs = eventos_qs.filter(descricao__icontains=filtro_texto)

    if filtro_data_inicio:
        eventos_qs = eventos_qs.filter(data_hora__date__gte=filtro_data_inicio)

    if filtro_data_fim:
        eventos_qs = eventos_qs.filter(data_hora__date__lte=filtro_data_fim)

    total_filtrado = eventos_qs.count()
    paginator = Paginator(eventos_qs, 50)
    page_number = request.GET.get('page')
    eventos = paginator.get_page(page_number)

    query_params = request.GET.copy()
    query_params.pop('page', None)
    query_string = query_params.urlencode()

    return render(
        request,
        "alertas.html",
        {
            "eventos": eventos,
            "tipos_evento": Evento.TIPOS,
            "dispositivos": _get_dispositivos_sensores(),
            "filtro_tipo": filtro_tipo,
            "filtro_sensor": filtro_sensor,
            "filtro_texto": filtro_texto,
            "filtro_data_inicio": filtro_data_inicio,
            "filtro_data_fim": filtro_data_fim,
            "total_filtrado": total_filtrado,
            "query_string": query_string,
        }
    )

@login_required(login_url='login')
def subconsumo_view(request):
    # Mostra registros focados em consumo (Energia kWh)
    leituras = LeituraEnergia.objects.exclude(energia_kwh=0).order_by('-data_hora')[:100]
    return render(request, "subconsumo.html", {"leituras": leituras})

@login_required(login_url='login')
@user_passes_test(lambda u: u.is_staff, login_url='index')
def deletar_dispositivo(request, id):
    """
    Deleta um dispositivo. Apenas Admins podem deletar (simulado aqui).
    Dispositivos reais (ID 1 e 2) são protegidos.
    """
    if not request.user.is_staff:
        return JsonResponse({"status": "erro", "mensagem": "Apenas administradores podem deletar dispositivos."}, status=403)
    
    eletro = get_object_or_404(Eletrodomestico, id=id)

    if eletro.numero_sensor in [1, 2] or not eletro.is_mock:
        return JsonResponse({"status": "erro", "mensagem": "Somente dispositivos adicionados podem ser eliminados."}, status=403)

    eletro.delete()
    return redirect('index')

@login_required(login_url='login')
@user_passes_test(lambda u: u.is_staff, login_url='index')
def configurar_consumo(request, id):
    eletro = get_object_or_404(Eletrodomestico, id=id)
    config, created = ConfiguracaoConsumo.objects.get_or_create(eletrodomestico=eletro)
    
    if request.method == "POST":
        config.limite_kwh = float(request.POST.get("limite_kwh", 100))
        config.periodo_alarme = request.POST.get("periodo_alarme", "MENSAL")
        config.alarme_ativo = request.POST.get("alarme_ativo") == "on"
        config.save()
        return redirect('index')
        
    return render(request, "configurar_consumo.html", {"config": config, "eletro": eletro})






from django.conf import settings

def _processar_leitura_individual(data, eletro=None):
    """
    Helper para processar uma única leitura de sensor vinda do JSON.
    """
    def _to_float(campo, padrao=0.0):
        valor = data.get(campo, padrao)
        try:
            numero = float(valor)
        except (TypeError, ValueError):
            return padrao
        return numero if math.isfinite(numero) else padrao

    # 1. Identificar o sensor
    sensor_id = data.get("device_id")
    try:
        sensor_id = int(sensor_id)
    except (TypeError, ValueError):
        return None, "device_id inválido"

    if eletro is None:
        eletro = Eletrodomestico.objects.filter(numero_sensor=sensor_id).order_by('id').first()
        if eletro is None and sensor_id in (1, 2):
            eletro = _criar_dispositivo_padrao(sensor_id)

    if eletro is None:
        return None, f"Dispositivo {sensor_id} não cadastrado"

    # 2. Salvar leitura
    leitura = LeituraEnergia.objects.create(
        eletrodomestico=eletro,
        tensao=_to_float("voltage"),
        corrente=_to_float("current"),
        potencia=_to_float("power"),
        frequencia=_to_float("frequency"),
        energia_kwh=_to_float("energy"),
        fator_potencia=_to_float("pf"),
        pico_de_tensao=_to_float("peak_voltage"),
    )

    # 3. Verificar alertas
    limite_tensao_ativo = _to_float("max_voltage", eletro.limite_tensao)
    limite_corrente_ativo = _to_float("max_current", eletro.limite_corrente)
    limite_potencia_ativo = _to_float("max_power", eletro.limite_potencia)

    leitura_valida = (leitura.tensao >= 20 or leitura.corrente >= 0.02 or leitura.potencia >= 1)
    alarmes_habilitados = leitura_valida and eletro.rele_ligado

    pico_fixo_padrao = float(getattr(settings, "PICO_MAXIMO_FIXO", 250.0))
    limite_pico_configurado = limite_tensao_ativo if limite_tensao_ativo > 0 else pico_fixo_padrao

    def criar_evento_limpo(tipo, descricao, cooldown_segundos=60):
        ultimo = Evento.objects.filter(
            eletrodomestico=eletro, tipo=tipo,
            data_hora__gte=timezone.now() - timedelta(seconds=cooldown_segundos)
        ).order_by('-data_hora').first()
        if not ultimo:
            Evento.objects.create(eletrodomestico=eletro, tipo=tipo, descricao=descricao)
        elif ultimo.descricao != descricao:
            ultimo.descricao = descricao
            ultimo.save(update_fields=['descricao'])

    if alarmes_habilitados and leitura.tensao > limite_pico_configurado:
        criar_evento_limpo('PICO', f"PICO DE TENSÃO: {leitura.tensao:.1f}V")
    
    if alarmes_habilitados and leitura.corrente > limite_corrente_ativo:
        criar_evento_limpo('SOBRECORRENTE', f"SOBRECORRENTE: {leitura.corrente}A")

    config = getattr(eletro, 'configuracaoconsumo', None)
    if alarmes_habilitados and (config.alarme_ativo if config else True) and leitura.potencia > limite_potencia_ativo:
        criar_evento_limpo('SOBRECONSUMO', f"SOBRECONSUMO: {leitura.potencia}W")

    return eletro, None

@csrf_exempt
def receber_dados(request):
    if request.method == "POST":
        api_key = request.headers.get("X-ESP32-KEY")
        if api_key != getattr(settings, "ESP32_API_KEY", None):
            return JsonResponse({"status": "erro", "mensagem": "Chave de API inválida"}, status=403)

        try:
            payload = json.loads(request.body)
            reles_status = {}

            if isinstance(payload, list):
                for item in payload:
                    eletro, erro = _processar_leitura_individual(item)
                    if eletro:
                        reles_status[str(eletro.numero_sensor)] = eletro.rele_ligado
            elif isinstance(payload, dict):
                eletro, erro = _processar_leitura_individual(payload)
                if erro:
                    return JsonResponse({"status": "erro", "mensagem": erro}, status=400)
                reles_status[str(eletro.numero_sensor)] = eletro.rele_ligado
            else:
                return JsonResponse({"status": "erro", "mensagem": "Formato inválido"}, status=400)

            return JsonResponse({
                "status": "sucesso", 
                "reles": reles_status,
                # Legado para manter compatibilidade com código antigo se necessário
                "rele": list(reles_status.values())[0] if reles_status else True
            })

        except Exception as e:
            return JsonResponse({"status": "erro", "mensagem": str(e)}, status=400)
    
    return JsonResponse({"status": "metodo_nao_permitido"}, status=405)


@csrf_exempt
def dados_recentes(request):
    leituras_recentes = []
    eletrodomesticos = _get_dispositivos_sensores(include_placeholders=True)
    agora = timezone.now()
    pico_fixo_padrao = float(getattr(settings, "PICO_MAXIMO_FIXO", 250.0))
    
    for eletro in eletrodomesticos:
        if not getattr(eletro, 'id', None):
            leituras_recentes.append({
                "device_id": eletro.numero_sensor,
                "device_name": eletro.nome,
                "voltage": None,
                "current": None,
                "frequency": None,
                "energy": None,
                "pf": None,
                "peak_voltage": pico_fixo_padrao,
                "power": None,
                "rele": False,
                "has_data": False
            })
            continue

        # Busca a última leitura
        ultima_leitura = LeituraEnergia.objects.filter(eletrodomestico=eletro).order_by('-data_hora').first()
        
        # Pico maximo fixo configurado; evita exibir pico dinamico antigo no dashboard.
        pico_atual = pico_fixo_padrao
        if ultima_leitura:
            if (ultima_leitura.pico_de_tensao or 0) > 0:
                pico_atual = ultima_leitura.pico_de_tensao
        
        # RIGOROSO: Só considera conectado se a leitura for de no máximo 15 segundos atrás (evita desconexões falsas)
        is_connected = False
        if ultima_leitura:
            delta = (agora - ultima_leitura.data_hora).total_seconds()
            if delta <= 15:
                is_connected = True

        if is_connected:
            # Se o relé estiver desligado, forçamos os dados a 0 para refletir o corte de energia
            mostrar_zero = not eletro.rele_ligado
            
            leituras_recentes.append({
                "device_id": eletro.numero_sensor,
                "device_name": eletro.nome,
                "voltage": 0 if mostrar_zero else ultima_leitura.tensao,
                "current": 0 if mostrar_zero else ultima_leitura.corrente,
                "frequency": 0 if mostrar_zero else ultima_leitura.frequencia,
                "energy": 0 if mostrar_zero else ultima_leitura.energia_kwh, 
                "pf": 0 if mostrar_zero else ultima_leitura.fator_potencia,
                "peak_voltage": 0 if mostrar_zero else pico_atual,
                "power": 0 if mostrar_zero else ultima_leitura.potencia,
                "rele": eletro.rele_ligado,
                "has_data": True
            })
        else:
            # Para dispositivos sem leitura recente (ou virtuais), evita mostrar dados antigos/simulados
            leituras_recentes.append({
                "device_id": eletro.numero_sensor,
                "device_name": eletro.nome,
                "voltage": None,
                "current": None,
                "frequency": None,
                "energy": None,
                "pf": None,
                "peak_voltage": pico_fixo_padrao,
                "power": None,
                "rele": eletro.rele_ligado,
                "has_data": False
            })

    # Verifica alertas ativos nos últimos 10 segundos para cada dispositivo
    alertas = {}
    for eletro in eletrodomesticos:
        if not getattr(eletro, 'id', None):
            alertas[eletro.numero_sensor] = None
            continue

        ultima_leitura = LeituraEnergia.objects.filter(eletrodomestico=eletro).order_by('-data_hora').first()
        ultimo_evento = Evento.objects.filter(
            eletrodomestico=eletro,
            tipo__in={'PICO', 'SOBRECORRENTE', 'SOBRECONSUMO'},
            data_hora__gte=timezone.now() - timedelta(seconds=15)
        ).order_by('-data_hora').first()
        if (not eletro.rele_ligado):
            alertas[eletro.numero_sensor] = None
        elif (
            ultimo_evento
            and ultima_leitura
            and ultimo_evento.data_hora >= (ultima_leitura.data_hora - timedelta(seconds=2))
        ):
            tipos_criticos = {'PICO', 'SOBRECORRENTE'}
            simbolos = {
                'PICO': '⚡',
                'SOBRECORRENTE': '🔥',
                'SOBRECONSUMO': '📈',
            }

            if ultimo_evento.tipo in tipos_criticos:
                cor_alerta = 'red'
            else:
                cor_alerta = 'orange'

            alertas[eletro.numero_sensor] = {
                "cor": cor_alerta,
                "tipo": ultimo_evento.get_tipo_display(),
                "mensagem": ultimo_evento.descricao,
                "simbolo": simbolos.get(ultimo_evento.tipo, '⚠'),
            }
        else:
            alertas[eletro.numero_sensor] = None

    return JsonResponse({
        "status": "sucesso",
        "dados": leituras_recentes,
        "alertas": alertas
    })

@csrf_exempt
def editar_dispositivo(request):
    """
    Endpoint para renomear os painéis (dispositivos) diretamente do Front-end.
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            sensor_id = data.get("device_id")
            novo_nome = data.get("nome")

            eletro = Eletrodomestico.objects.filter(numero_sensor=sensor_id).order_by('id').first()
            if eletro is None:
                return JsonResponse({"status": "erro", "mensagem": "Sensor não encontrado"}, status=404)
            eletro.nome = novo_nome
            eletro.save()
            return JsonResponse({"status": "sucesso"})
        except Exception as e:
            return JsonResponse({"status": "erro", "mensagem": str(e)}, status=400)
    return JsonResponse({"status": "metodo_nao_permitido"}, status=405)
@csrf_exempt
def toggle_rele(request, id):
    """
    Alterna o estado do relé (ligado/desligado) de um dispositivo.
    """
    if request.method == "POST":
        eletro = Eletrodomestico.objects.filter(numero_sensor=id).order_by('id').first()
        if not eletro:
            return JsonResponse({"status": "erro", "mensagem": "Sensor não encontrado"}, status=404)
        eletro.rele_ligado = not eletro.rele_ligado
        eletro.save(update_fields=['rele_ligado'])
        
        return JsonResponse({"status": "sucesso", "rele": eletro.rele_ligado})
    return JsonResponse({"status": "metodo_nao_permitido"}, status=405)
@csrf_exempt
def api_alertas(request):
    """API para retornar os eventos de alertas (PICO, SOBRECORRENTE, etc)"""
    eventos_qs = Evento.objects.select_related('eletrodomestico').filter(
        tipo__in=['PICO', 'SOBRECORRENTE', 'SOBRECONSUMO']
    ).order_by('-data_hora')
    
    # Filtros simples
    tipo = request.GET.get('tipo')
    if tipo: eventos_qs = eventos_qs.filter(tipo=tipo)
    
    sensor = request.GET.get('sensor')
    if sensor: eventos_qs = eventos_qs.filter(eletrodomestico__numero_sensor=sensor)

    data = []
    for ev in eventos_qs[:100]: # Limitado a 100 para performance
        data.append({
            "id": ev.id,
            "data_hora": ev.data_hora.isoformat(),
            "equipamento": ev.eletrodomestico.nome,
            "tipo": ev.get_tipo_display(),
            "tipo_slug": ev.tipo,
            "descricao": ev.descricao
        })
    return JsonResponse({"status": "sucesso", "dados": data})

@csrf_exempt
def api_relatorio(request):
    """API para retornar o histórico de leituras de energia"""
    leituras = LeituraEnergia.objects.select_related('eletrodomestico').order_by('-data_hora')[:100]
    data = []
    for l in leituras:
        data.append({
            "id": l.id,
            "data_hora": l.data_hora.isoformat(),
            "equipamento": l.eletrodomestico.nome,
            "tensao": l.tensao,
            "corrente": l.corrente,
            "potencia": l.potencia,
            "frequencia": l.frequencia or 0,
            "fator_potencia": l.fator_potencia or 0,
            "energia": l.energia_kwh
        })
    return JsonResponse({"status": "sucesso", "dados": data})

@csrf_exempt
def api_configuracoes(request):
    """API para retornar e salvar configurações dos dispositivos"""
    if request.method == "GET":
        eletros = _get_dispositivos_sensores()
        data = []
        for e in eletros:
            data.append({
                "id": e.id,
                "nome": e.nome,
                "localizacao": e.localizacao,
                "limite_tensao": e.limite_tensao,
                "limite_corrente": e.limite_corrente,
                "limite_potencia": e.limite_potencia,
                "numero_sensor": e.numero_sensor
            })
        return JsonResponse({"status": "sucesso", "dados": data})
    return JsonResponse({"status": "metodo_nao_permitido"}, status=405)

@csrf_exempt
def api_limpar_alertas(request):
    if request.method == "POST":
        Evento.objects.all().delete()
        return JsonResponse({"status": "sucesso"})
    return JsonResponse({"status": "metodo_nao_permitido"}, status=405)
