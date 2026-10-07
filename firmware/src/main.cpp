#include <Arduino.h>
#include <SPI.h>
#include <GxEPD2_BW.h>
#include <other/GxEPD2_420_GYE042A87.h>
#include <driver/gpio.h>

#include "board.h"
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
uint32_t lastDiagnosticMs = 0;

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

void printDiagnostics() {
  digitalWrite(board::adcEnable, HIGH);
  delay(board::adcSettleMs);
  uint32_t rawSum = 0;
  uint32_t millivoltSum = 0;
  for (uint32_t i = 0; i < board::adcSamples; ++i) {
    // These are adjacent conversions, not a fabricated raw-to-voltage formula.
    rawSum += analogRead(board::batteryAdc);
    millivoltSum += analogReadMilliVolts(board::batteryAdc);
    delay(2);
  }
  digitalWrite(board::adcEnable, LOW);
  const uint32_t raw = (rawSum + board::adcSamples / 2) / board::adcSamples;
  const uint32_t adcMv = (millivoltSum + board::adcSamples / 2) / board::adcSamples;
  Serial.printf("[T14] ms=%lu BATT_ADC_raw=%lu ADC_mV=%lu sense_mV=%lu "
                "USER=%d BOOT=%d (LOW=pressed; pack presence unknown)\n",
                static_cast<unsigned long>(millis()),
                static_cast<unsigned long>(raw),
                static_cast<unsigned long>(adcMv),
                static_cast<unsigned long>(adcMv * board::batteryDivider),
                digitalRead(board::userButton), digitalRead(board::bootButton));
}
}  // namespace

void setup() {
  disableUnusedPeripherals();
  pinMode(board::userButton, INPUT);  // Both buttons have external pull-ups.
  pinMode(board::bootButton, INPUT);
  pinMode(board::batteryAdc, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(board::batteryAdc, ADC_11db);

  Serial.begin(115200);
  const uint32_t serialStartedMs = millis();
  while (!Serial && millis() - serialStartedMs < 3000) {
    delay(10);  // Bounded: the frame boots without an attached serial monitor.
  }
  Serial.println("[T14] NM-EPD-420-BW USB bring-up; no Wi-Fi or ESP deep sleep");
  Serial.printf("[T14] Flash=%lu PSRAM=%lu bytes; frame=%lu bytes, "
                "400x300 row-major MSB-first 1=white\n",
                static_cast<unsigned long>(ESP.getFlashChipSize()),
                static_cast<unsigned long>(ESP.getPsramSize()),
                static_cast<unsigned long>(setup_frame_len));
  Serial.println("[T14] USB-only ADC readings do not identify a battery or state of charge");

  // Vendor initialization: src/ui/display_helper.h. GPIO21 is I2S, not EPD power.
  SPI.begin(board::epdSck, board::epdMiso, board::epdMosi, board::epdCs);
  display.init(115200, true, 2, false);
  display.epd2.selectFastFullUpdate(true);
  display.setRotation(0);
  // Direct panel RAM transfer: no layout, GFX drawing, invert, or mirror.
  display.epd2.writeImage(setup_frame, 0, 0, board::width, board::height,
                        false, false, true);  // PROGMEM source.
  display.refresh(false);  // Full refresh.
  display.hibernate();  // Panel only; ESP remains awake for USB diagnostics.
  Serial.println("[T14] Frame transfer/refresh returned; panel hibernated. Inspect photo for fidelity.");
  printDiagnostics();
  lastDiagnosticMs = millis();
}

void loop() {
  const uint32_t now = millis();
  if (now - lastDiagnosticMs >= board::diagnosticIntervalMs) {
    lastDiagnosticMs = now;
    printDiagnostics();
  }
  delay(5);
}
