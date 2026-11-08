#pragma once
#include <stdint.h>
#ifndef LOG_LEVEL
#define LOG_LEVEL 1
#endif
#ifndef DEBUG_INTERVAL_S
#define DEBUG_INTERVAL_S 0
#endif
#ifndef FAILED_JOIN_PORTAL_WAKES
#define FAILED_JOIN_PORTAL_WAKES 20
#endif
#ifndef FRAME_BASE_URL
#define FRAME_BASE_URL "https://weather.builtbyjer.com/"
#endif
namespace config {
constexpr const char* baseUrl = FRAME_BASE_URL;
constexpr const char* timeZone = "MST7MDT,M3.2.0,M11.1.0";
constexpr uint32_t joinMs = 20000, ntpMs = 10000, fetchMs = 15000;
constexpr uint32_t leadSeconds = 20, noClockSleepSeconds = 1800;
constexpr uint32_t portalFailureWakes = FAILED_JOIN_PORTAL_WAKES;
constexpr float lowThreshold = 3.55f, hysteresis = 0.10f; // Provisional until T17.
constexpr unsigned adcSamples = 16;
constexpr uint32_t debugIntervalSeconds = DEBUG_INTERVAL_S;
static_assert(DEBUG_INTERVAL_S == 0 || (DEBUG_INTERVAL_S >= 60 && DEBUG_INTERVAL_S <= 1800),
              "Debug interval must be bounded to 60..1800 seconds");
static_assert(FAILED_JOIN_PORTAL_WAKES > 0, "Portal wake threshold must be positive");
}
