#include <Arduino.h>
#include <SPI.h>
#include <GxEPD2_BW.h>
#include <other/GxEPD2_420_GYE042A87.h>
#include <driver/gpio.h>

#include "board.h"
#include "provisioning.h"
#ifdef PROVISIONING_PERSISTENCE_TEST
#include <esp_sleep.h>
RTC_DATA_ATTR bool persistenceSlept = false;
uint32_t persistenceStarted = 0;
#endif
#include "../assets/setup_frame.h"

namespace {
GxEPD2_BW<GxEPD2_420_GYE042A87, board::height> display(
    GxEPD2_420_GYE042A87(board::epdCs, board::epdDc, board::epdRst,
                       board::epdBusy));
static_assert(sizeof(setup_frame) == board::frameBytes,
              "Setup framebuffer must contain exactly 15000 bytes");
static_assert(GxEPD2_420_GYE042A87::WIDTH == board::width &&
                  GxEPD2_420_GYE042A87::HEIGHT == board::height,
              "Driver dimensions must match the approved frame");


void outputLevel(int pin, uint8_t level) {
  gpio_hold_dis(static_cast<gpio_num_t>(pin));
  pinMode(pin, OUTPUT);
  digitalWrite(pin, level);
}

void disableUnusedPeripherals() {
  // Release retained outputs if replacing vendor firmware that used pin holds.
  gpio_deep_sleep_hold_dis();
  outputLevel(board::temperatureEnable, LOW);
  outputLevel(board::amplifierEnable, LOW);
  outputLevel(board::codecEnable, LOW);
  outputLevel(board::loraEnable, LOW);  // No LoRa activity, even without antenna.
  outputLevel(board::adcEnable, LOW);
  outputLevel(board::sdCs, HIGH);
  outputLevel(board::loraCs, HIGH);
  gpio_hold_dis(static_cast<gpio_num_t>(board::epdRst));
}

void drawSetup() {
  SPI.begin(board::epdSck, board::epdMiso, board::epdMosi, board::epdCs);
  outputLevel(board::epdCs, HIGH);
  outputLevel(board::epdDc, HIGH);
  outputLevel(board::epdRst, HIGH);
  display.init(115200, true, 2, false);
  display.epd2.selectFastFullUpdate(true);
  display.setRotation(0);
  display.epd2.writeImage(setup_frame, 0, 0, board::width, board::height,
                        false, false, true);
  display.refresh(false);
  display.hibernate();
  Serial.println("[T15] Setup frame displayed; panel hibernated");
}
void immediateRefresh() {
  Serial.println("[T15] Immediate refresh requested (T16 fetch hook)");
}
}  // namespace

void setup() {
  disableUnusedPeripherals();
  pinMode(board::userButton, INPUT);  // Both buttons have external pull-ups.
  pinMode(board::bootButton, INPUT);
  pinMode(board::batteryAdc, INPUT);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.begin(115200);
  const uint32_t serialStartedMs = millis();
  while (!Serial && millis() - serialStartedMs < 3000) {
    delay(10);  // Bounded: the frame boots without an attached serial monitor.
  }
  Serial.println("[T15] Wi-Fi provisioning; USER unused; BOOT hold 5s resets");
  provisioning::initialize(drawSetup, immediateRefresh);
  const bool savedReconnect = provisioning::hasCredentials() &&
                              provisioning::reconnectSaved();
  if (!savedReconnect) provisioning::runPortalBlocking();
#ifdef PROVISIONING_PERSISTENCE_TEST
  persistenceStarted = millis();
  if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER && persistenceSlept) {
    if (savedReconnect)
      Serial.println("[T15 TEST] Timer wake reconnected; persistence observed");
    else
      Serial.println("[T15 TEST] FAIL timer wake required portal; persistence unproven");
  } else
    Serial.println("[T15 TEST] Connected; one 10s sleep in 30s, release BOOT");
#endif
}
void loop() {
  provisioning::pollButton();
#ifdef PROVISIONING_PERSISTENCE_TEST
  if (!persistenceSlept && millis() - persistenceStarted >= 30000 &&
      digitalRead(board::bootButton) == HIGH) {
    persistenceSlept = true;
    Serial.println("[T15 TEST] Entering one 10s timer sleep; USB CDC may disappear");
    Serial.flush();
    esp_sleep_enable_timer_wakeup(10000000ULL);
    esp_deep_sleep_start();
  }
#endif
  delay(5);
}
