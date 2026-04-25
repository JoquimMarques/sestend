#include <PZEM004Tv30.h>
#include <HardwareSerial.h>
#include <U8g2lib.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ============================================================
// CONFIGURAR AQUI antes de gravar no ESP32
// ============================================================
const char* WIFI_SSID   = "SEU_WIFI_AQUI";
const char* WIFI_PASS   = "SUA_PASSWORD_AQUI";
const char* DJANGO_HOST = "sistend-api.onrender.com";
const char* API_KEY     = "12345";
// ============================================================

// =====================
// SENSOR 1
// =====================
HardwareSerial pzemSerial1(2);
PZEM004Tv30 pzem1(pzemSerial1, 16, 17);

// =====================
// SENSOR 2
// =====================
HardwareSerial pzemSerial2(1);
PZEM004Tv30 pzem2(pzemSerial2, 26, 27);

// =====================
// DISPLAY
// =====================
U8G2_ST7920_128X64_F_SW_SPI u8g2(
  U8G2_R0,
  12,
  13,
  2,
  14
);

// =====================
// RELÉ
// =====================
const int rele1 = 19;
const int rele2 = 18;

// =====================
// BUZZERS
// =====================
const int buzzer1 = 23;
const int buzzer2 = 25;

// =====================
// BOTÃO
// =====================
// =====================
// BOTÃO (Volatile para funcionar com interrupção)
// =====================
const int botao = 4;
volatile bool mute = false;
volatile bool mutePotencia = false;

void IRAM_ATTR trataBotao() {
  static unsigned long ultimaInterrupcao = 0;
  unsigned long tempoInterrupcao = millis();
  if (tempoInterrupcao - ultimaInterrupcao > 300) { // Debounce
    mute = !mute;
    mutePotencia = !mutePotencia;
  }
  ultimaInterrupcao = tempoInterrupcao;
}

// =====================
// LED RGB
// =====================
const int ledVermelho = 22;
const int ledVerde = 21;

// =====================
// LIMITES
// =====================
const float TENSAO_MAX_1 = 230.0;
const float TENSAO_MAX_2 = 230.0;

const float CORRENTE_MAX_1 = 8.0;
const float CORRENTE_MAX_2 = 8.0;

const float POTENCIA_MAX_1 = 1500.0;
const float POTENCIA_MAX_2 = 1500.0;

// =====================
// CALIBRAÇÃO DOS SENSORES
// =====================
const float CAL_V1 = 0.988;
const float CAL_I1 = 1.00;
const float CAL_P1 = 0.98;

const float CAL_V2 = 0.988;
const float CAL_I2 = 1.00;
const float CAL_P2 = 0.98;

// =====================
// TEMPOS
// =====================
const unsigned long TEMPO_CONFIRMACAO = 2000;
const unsigned long TEMPO_BLOQUEIO = 12000;

// Proteção de arranque
const unsigned long TEMPO_BOOT = 5000;
unsigned long tempoInicio = 0;

unsigned long tempoFalha1 = 0;
unsigned long tempoFalha2 = 0;

unsigned long tempoCorrente1 = 0;
unsigned long tempoCorrente2 = 0;
unsigned long tempoPotencia1 = 0;
unsigned long tempoPotencia2 = 0;

// =====================
// ESTADO DE PROTEÇÃO (Globais para o buzzer funcionar fora do bloco de 1s)
// =====================
bool g_falha1 = false;
bool g_falha2 = false;
bool g_falhaPot1 = false;
bool g_falhaPot2 = false;
bool g_qualquerFalha = false;

// =====================
// BUZZER CONTROLO (Tarefa Independente)
// =====================
void tarefaBuzzer(void * parameter) {
  for(;;) {
    bool boot = (millis() - tempoInicio < TEMPO_BOOT);
    if (!boot && !mute && g_qualquerFalha) {
       // BIP LIGADO
       bool s1 = g_falha1;
       bool s2 = g_falha2;
       // Respeita mute de potência se configurado
       if (g_falhaPot1 && mutePotencia && !(g_falha1 && !g_falhaPot1)) s1 = false;
       if (g_falhaPot2 && mutePotencia && !(g_falha2 && !g_falhaPot2)) s2 = false;

       digitalWrite(buzzer1, s1 ? HIGH : LOW);
       digitalWrite(buzzer2, s2 ? HIGH : LOW);
       vTaskDelay(pdMS_TO_TICKS(400));
       
       // BIP DESLIGADO
       digitalWrite(buzzer1, LOW);
       digitalWrite(buzzer2, LOW);
       vTaskDelay(pdMS_TO_TICKS(400));
    } else {
       digitalWrite(buzzer1, LOW);
       digitalWrite(buzzer2, LOW);
       vTaskDelay(pdMS_TO_TICKS(100)); // Espera curta quando em silêncio
    }
  }
}

// =====================
// LOOP TIME
// =====================
unsigned long ultimoTempo = 0;
const long intervalo = 1000;

// =====================
// DISPLAY BUFFERS
// =====================
char v1s[8], i1s[8], p1s[8], f1s[8], fp1s[8];
char v2s[8], i2s[8], p2s[8], f2s[8], fp2s[8];

// =====================
// PICO DE TENSÃO
// =====================
float picoV1 = 0;
float picoV2 = 0;

// =====================
// ESTADO DO RELE NO SERVIDOR
// =====================
bool releServidor1 = true;
bool releServidor2 = true;

// ============================================================
// enviarDados: envia leitura ao Django de forma independente
// ============================================================
void enviarDados(int sensor, float v, float c, float p, float f,
                 float e, float pf, float peak,
                 float limiteTensao, float limiteCorrente, float limitePotencia,
                 bool &releServidor) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = "https://" + String(DJANGO_HOST) + "/api/receber-dados/";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-ESP32-KEY", API_KEY);
  http.setTimeout(800); // Timeout reduzido para não atrasar o próximo dispositivo

  char body[256];
  snprintf(body, sizeof(body),
           "{\"device_id\":%d,\"voltage\":%.1f,\"current\":%.3f,\"power\":%.1f,\"frequency\":%.1f,\"energy\":%.3f,\"pf\":%.2f,\"peak_voltage\":%.1f,\"max_voltage\":%.1f,\"max_current\":%.2f,\"max_power\":%.1f}",
           sensor, v, c, p, f, e, pf, peak, limiteTensao, limiteCorrente, limitePotencia);

  int httpCode = http.POST(body);

  if (httpCode == 200) {
    String resposta = http.getString();
    int idx = resposta.indexOf("\"rele\":");
    if (idx != -1) {
      String resto = resposta.substring(idx + 7);
      resto.trim();
      releServidor = resto.startsWith("true");
    }
  }

  http.end();
}

// =====================
// SETUP
// =====================
void setup() {
  Serial.begin(115200);

  pinMode(rele1, OUTPUT);
  pinMode(rele2, OUTPUT);

  pinMode(buzzer1, OUTPUT);
  pinMode(buzzer2, OUTPUT);

  pinMode(botao, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(botao), trataBotao, FALLING);

  pinMode(ledVermelho, OUTPUT);
  pinMode(ledVerde, OUTPUT);

  digitalWrite(rele1, HIGH);
  digitalWrite(rele2, HIGH);

  digitalWrite(buzzer1, LOW);
  digitalWrite(buzzer2, LOW);

  digitalWrite(ledVermelho, LOW);
  digitalWrite(ledVerde, HIGH);

  u8g2.begin();

  tempoInicio = millis();

  // Conectar WiFi
  Serial.print("Conectando WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 8000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK");
  } else {
    Serial.println(" FALHOU");
  }

  // Criar tarefa para o buzzer (corre de forma independente do loop)
  xTaskCreate(tarefaBuzzer, "BuzzerTask", 2048, NULL, 1, NULL);
}

// =====================
// LOOP
void loop() {

  // A lógica do botão agora é tratada por interrupção (trataBotao)

  if (millis() - ultimoTempo >= intervalo) {
    ultimoTempo = millis();

    // ===== LEITURA =====
    float v1  = pzem1.voltage();
    float c1  = pzem1.current();
    float p1  = pzem1.power();
    float f1  = pzem1.frequency();
    float pf1 = pzem1.pf();
    float e1  = pzem1.energy();

    float v2  = pzem2.voltage();
    float c2  = pzem2.current();
    float p2  = pzem2.power();
    float f2  = pzem2.frequency();
    float pf2 = pzem2.pf();
    float e2  = pzem2.energy();

    // ===== CALIBRAÇÃO =====
    if (!isnan(v1)) v1 *= CAL_V1;
    if (!isnan(c1)) c1 *= CAL_I1;
    if (!isnan(p1)) p1 *= CAL_P1;

    if (!isnan(v2)) v2 *= CAL_V2;
    if (!isnan(c2)) c2 *= CAL_I2;
    if (!isnan(p2)) p2 *= CAL_P2;

    // Sanitize
    if (isnan(v1)) v1 = 0; if (isnan(c1)) c1 = 0; if (isnan(p1)) p1 = 0;
    if (isnan(v2)) v2 = 0; if (isnan(c2)) c2 = 0; if (isnan(p2)) p2 = 0;
    if (isnan(f1)) f1 = 0; if (isnan(pf1)) pf1= 0; if (isnan(e1)) e1 = 0;
    if (isnan(f2)) f2 = 0; if (isnan(pf2)) pf2= 0; if (isnan(e2)) e2 = 0;

    // ===== FORMATAR =====
    dtostrf(v1, 4, 1, v1s);
    dtostrf(c1, 4, 1, i1s);
    dtostrf(p1, 4, 0, p1s);
    dtostrf(f1, 4, 1, f1s);
    dtostrf(pf1, 4, 2, fp1s);

    dtostrf(v2, 4, 1, v2s);
    dtostrf(c2, 4, 1, i2s);
    dtostrf(p2, 4, 0, p2s);
    dtostrf(f2, 4, 1, f2s);
    dtostrf(pf2, 4, 2, fp2s);

    // =====================
    // PROTEÇÃO (Actualiza estados g_falha)
    // =====================
    bool boot = (millis() - tempoInicio < TEMPO_BOOT);
    
    if (!boot) {
      bool fT1 = false;
      if (v1 > TENSAO_MAX_1) {
        if (tempoFalha1 == 0) tempoFalha1 = millis();
        if (millis() - tempoFalha1 >= TEMPO_CONFIRMACAO) fT1 = true;
      } else tempoFalha1 = 0;

      bool fT2 = false;
      if (v2 > TENSAO_MAX_2) {
        if (tempoFalha2 == 0) tempoFalha2 = millis();
        if (millis() - tempoFalha2 >= TEMPO_CONFIRMACAO) fT2 = true;
      } else tempoFalha2 = 0;

      bool fC1 = false;
      if (c1 > CORRENTE_MAX_1) tempoCorrente1 = millis();
      if (millis() - tempoCorrente1 < TEMPO_BLOQUEIO) fC1 = true;

      bool fC2 = false;
      if (c2 > CORRENTE_MAX_2) tempoCorrente2 = millis();
      if (millis() - tempoCorrente2 < TEMPO_BLOQUEIO) fC2 = true;

      g_falhaPot1 = false;
      if (p1 > POTENCIA_MAX_1) tempoPotencia1 = millis();
      if (millis() - tempoPotencia1 < TEMPO_BLOQUEIO) g_falhaPot1 = true;

      g_falhaPot2 = false;
      if (p2 > POTENCIA_MAX_2) tempoPotencia2 = millis();
      if (millis() - tempoPotencia2 < TEMPO_BLOQUEIO) g_falhaPot2 = true;

      g_falha1 = (fT1 || fC1 || g_falhaPot1);
      g_falha2 = (fT2 || fC2 || g_falhaPot2);
      g_qualquerFalha = (g_falha1 || g_falha2);
    }

    // =====================
    // RELÉS
    // =====================
    digitalWrite(rele1, (g_falha1 || !releServidor1) ? LOW : HIGH);
    digitalWrite(rele2, (g_falha2 || !releServidor2) ? LOW : HIGH);

    // =====================
    // LED
    // =====================
    if (!boot && g_qualquerFalha) {
      digitalWrite(ledVermelho, HIGH);
      digitalWrite(ledVerde, LOW);
    } else {
      digitalWrite(ledVermelho, LOW);
      digitalWrite(ledVerde, HIGH);
    }

    // ===== PICO DE TENSÃO =====
    if (v1 > picoV1) picoV1 = v1;
    if (v2 > picoV2) picoV2 = v2;

    // =====================
    // DISPLAY
    // =====================
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_5x7_tr);

    u8g2.drawStr(0, 8,  "S1");
    u8g2.drawStr(64, 8, "S2");

    u8g2.drawStr(0, 18, "V:");
    u8g2.drawStr(12,18, (v1 > TENSAO_MAX_1) ? "OFF" : v1s);
    u8g2.drawStr(38,18,"V");

    u8g2.drawStr(0, 28, "I:");
    u8g2.drawStr(12,28, (c1 > CORRENTE_MAX_1) ? "OFF" : i1s);
    u8g2.drawStr(38,28,"A");

    u8g2.drawStr(0, 38, "P:");
    u8g2.drawStr(12,38, (p1 > POTENCIA_MAX_1) ? "OFF" : p1s);
    u8g2.drawStr(38,38,"W");

    u8g2.drawStr(0, 48, "F:");
    u8g2.drawStr(12,48,f1s);
    u8g2.drawStr(38,48,"Hz");

    u8g2.drawStr(0, 58, "FP:");
    u8g2.drawStr(18,58,fp1s);

    u8g2.drawStr(64, 18, "V:");
    u8g2.drawStr(76,18, (v2 > TENSAO_MAX_2) ? "OFF" : v2s);
    u8g2.drawStr(102,18,"V");

    u8g2.drawStr(64, 28, "I:");
    u8g2.drawStr(76,28, (c2 > CORRENTE_MAX_2) ? "OFF" : i2s);
    u8g2.drawStr(102,28,"A");

    u8g2.drawStr(64, 38, "P:");
    u8g2.drawStr(76,38, (p2 > POTENCIA_MAX_2) ? "OFF" : p2s);
    u8g2.drawStr(102,38,"W");

    u8g2.drawStr(64, 48, "F:");
    u8g2.drawStr(76,48,f2s);
    u8g2.drawStr(102,48,"Hz");

    u8g2.drawStr(64, 58, "FP:");
    u8g2.drawStr(82,58,fp2s);

    u8g2.sendBuffer();

    // =====================
    // ENVIAR AO DJANGO (Independente para cada sensor)
    // =====================
    enviarDados(1, v1, c1, p1, f1, e1, pf1, picoV1, TENSAO_MAX_1, CORRENTE_MAX_1, POTENCIA_MAX_1, releServidor1);
    enviarDados(2, v2, c2, p2, f2, e2, pf2, picoV2, TENSAO_MAX_2, CORRENTE_MAX_2, POTENCIA_MAX_2, releServidor2);
  }
}