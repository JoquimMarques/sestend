from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('relatorio/', views.relatorio, name='relatorio'),
    path('alertas/', views.alertas_view, name='alertas'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('registro/', views.registro_view, name='registro'),
    path('subconsumo/', views.subconsumo_view, name='subconsumo'),
    path('dados-completos/', views.dados_completos_view, name='dados_completos'),
    path('configuracoes/', views.configuracoes_view, name='configuracoes'),
    
    # Endpoints de API para consumo do hardware/frontend
    path('api/receber-dados/', views.receber_dados, name='receber_dados'),
    path('api/dados-recentes/', views.dados_recentes, name='dados_recentes'),
    path('api/editar-dispositivo/', views.editar_dispositivo, name='editar_dispositivo'),
    path('api/deletar-dispositivo/', views.api_deletar_dispositivo, name='api_deletar_dispositivo'),
    
    # Gerenciamento de dispositivos
    path('dispositivo/adicionar/', views.adicionar_dispositivo, name='adicionar_dispositivo'),
    path('dispositivo/deletar/<int:id>/', views.deletar_dispositivo, name='deletar_dispositivo'),
    path('dispositivo/configurar-consumo/<int:id>/', views.configurar_consumo, name='configurar_consumo'),
    path('api/toggle-rele/<int:id>/', views.toggle_rele, name='toggle_rele'),
    path('api/alertas/', views.api_alertas, name='api_alertas'),
    path('api/relatorio/', views.api_relatorio, name='api_relatorio'),
    path('api/configuracoes/', views.api_configuracoes, name='api_configuracoes'),
    path('api/limpar-alertas/', views.api_limpar_alertas, name='api_limpar_alertas'),

    # Exclusão de dados
    path('relatorio/deletar/<int:id>/', views.deletar_leitura, name='deletar_leitura'),
    path('relatorio/limpar/', views.limpar_relatorio, name='limpar_relatorio'),
    path('alertas/deletar/<int:id>/', views.deletar_evento, name='deletar_evento'),
    path('alertas/limpar/', views.limpar_alertas, name='limpar_alertas'),
    path('subconsumo/limpar/', views.limpar_subconsumo, name='limpar_subconsumo'),
    path('favicon.ico', views.favicon),
]

# Os endpoints seram do aparelho que analisa ou que testa