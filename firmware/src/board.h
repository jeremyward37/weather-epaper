#pragma once

#include <stdint.h>

// RockBase-iot/NM-EPD-420 src/config.h, checked 2026-10-07:
// https://github.com/RockBase-iot/NM-EPD-420/blob/main/src/config.h
namespace board {
constexpr int epdSck = 2;
constexpr int epdMosi = 1;
constexpr int epdMiso = -1;  // Write-only panel, pin NC.
constexpr int epdCs = 46;
constexpr int epdDc = 4;
constexpr int epdRst = 5;
constexpr int epdBusy = 6;  // GYE042A87 BUSY is active HIGH.
constexpr int userButton = 45;  // External pull-up; LOW pressed; not RTC-capable.
constexpr int bootButton = 0;  // External pull-up; LOW pressed; boot strap / RTC.
constexpr int batteryAdc = 3;  // ADC1_CH2.
constexpr int adcEnable = 43;  // HIGH enables battery's 2:1 divider.
constexpr uint32_t batteryDivider = 2;
constexpr int temperatureEnable = 40;  // AHT20, HIGH on.
constexpr int amplifierEnable = 41;  // Audio PA, HIGH on.
constexpr int codecEnable = 44;  // ES8311, HIGH on.
constexpr int loraEnable = 47;  // LoRa supply, HIGH on.
constexpr int sdCs = 7;
constexpr int loraCs = 8;
constexpr uint16_t width = 400;
constexpr uint16_t height = 300;
constexpr uint32_t frameBytes = width * height / 8;
constexpr uint32_t adcSettleMs = 80;
constexpr uint32_t adcSamples = 24;
constexpr uint32_t diagnosticIntervalMs = 2000;
}  // namespace board
