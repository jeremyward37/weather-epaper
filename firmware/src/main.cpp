#include <Arduino.h>
#include <SPI.h>
#include <GxEPD2_BW.h>
#include <other/GxEPD2_420_GYE042A87.h>
#include <driver/gpio.h>
#include <driver/rtc_io.h>
#include <esp_sleep.h>
#include <esp_log.h>
#include <Preferences.h>
#include <WiFi.h>
#include <esp_heap_caps.h>
#include <mbedtls/sha256.h>
#include <atomic>
#include "board.h"
#include "config.h"
#include "provisioning.h"
#include "schedule.h"
#include "frame_policy.h"
#include "net.h"
#include "../assets/setup_frame.h"

RTC_DATA_ATTR time_t chosenTarget = 0;
RTC_DATA_ATTR bool rtcWasSet = false;
#ifdef PROVISIONING_PERSISTENCE_TEST
RTC_DATA_ATTR bool persistenceSlept = false;
#endif
namespace {
GxEPD2_BW<GxEPD2_420_GYE042A87, board::height> display(
    GxEPD2_420_GYE042A87(board::epdCs, board::epdDc, board::epdRst, board::epdBusy));
static_assert(sizeof(setup_frame) == board::frameBytes && board::frameBytes == frame::bytes,
              "Frame contract is exactly 15000 bytes");
static_assert(GxEPD2_420_GYE042A87::WIDTH == board::width &&
              GxEPD2_420_GYE042A87::HEIGHT == board::height, "Panel dimensions");
Preferences metadata;
bool storageReady = false, displayReady = false, refreshRequested = false;
bool suppressWakeRelease = false;
std::atomic<uint32_t> busyStarted{0};
std::atomic<bool> panelTimedOut{false};
void ARDUINO_ISR_ATTR busyFell() { busyStarted.store(0); }
void busySample(const void*) {
  const uint32_t now = micros();
  const uint32_t first = busyStarted.load();
  if (!first) busyStarted.store(now ? now : 1);
  // Pinned driver gives BUSY ten seconds. Latch just before its void timeout.
  else if (now - first >= 9990000UL) panelTimedOut.store(true);
  delay(1);
}
unsigned setupGeneration = 0;
void log(const char* step, const char* outcome, uint32_t started) {
#if LOG_LEVEL > 0
  Serial.printf("[T16] ms=%lu step=%s duration_ms=%lu outcome=%s\n",
                static_cast<unsigned long>(millis()), step,
                static_cast<unsigned long>(millis() - started), outcome);
#else
  (void)step; (void)outcome; (void)started;
#endif
}
void outputLevel(int pin, uint8_t level) {
  gpio_hold_dis(static_cast<gpio_num_t>(pin)); pinMode(pin, OUTPUT); digitalWrite(pin, level);
}
void disableUnusedPeripherals() {
  gpio_deep_sleep_hold_dis();
  for (int pin : {board::temperatureEnable, board::amplifierEnable, board::codecEnable,
                  board::loraEnable, board::adcEnable, board::loraReset}) outputLevel(pin, LOW);
  outputLevel(board::sdCs, HIGH); outputLevel(board::loraCs, HIGH);
  for (int pin : {board::epdRst, board::epdCs, board::epdDc})
    gpio_hold_dis(static_cast<gpio_num_t>(pin));
}
void initializeDisplay() {
  if (displayReady) return;
  SPI.begin(board::epdSck, board::epdMiso, board::epdMosi, board::epdCs);
  outputLevel(board::epdCs, HIGH); outputLevel(board::epdDc, HIGH); outputLevel(board::epdRst, HIGH);
  display.init(0, true, 2, false);
  display.epd2.selectFastFullUpdate(true); display.setRotation(0); displayReady = true;
}
bool show(const uint8_t* buffer, bool programMemory) {
  busyStarted.store(0); panelTimedOut.store(false);
  pinMode(board::epdBusy, INPUT);
  attachInterrupt(board::epdBusy, busyFell, FALLING);
  display.epd2.setBusyCallback(busySample);
  initializeDisplay();
  display.epd2.writeImage(buffer, 0, 0, board::width, board::height, false, false, programMemory);
  if (!panelTimedOut.load()) display.refresh(false);
  display.hibernate();
  detachInterrupt(board::epdBusy);
  return !panelTimedOut.load() && digitalRead(board::epdBusy) == LOW;
}
void drawSetup() {
  const uint32_t started = millis();
  suppressWakeRelease = false;
  ++setupGeneration; const bool shown = show(setup_frame, true); refreshRequested = true;
  log("setup", shown ? "approved-frame-panel-hibernated" : "panel-timeout-photo-check-required", started);
}
void immediateRefresh() {
  if (suppressWakeRelease) { suppressWakeRelease = false; return; }
  refreshRequested = true;
}
void pollRuntimeButton() {
  provisioning::pollButton();
}
bool hasFrame() {
  if (!storageReady) return false;
  return metadata.getBool("framePending", false) || metadata.getBool("everShown", false) ||
         frame::validSha(metadata.getString("lastFrameSha", "").c_str());
}
float battery() {
  const uint32_t started = millis();
  outputLevel(board::adcEnable, HIGH); delay(board::adcSettleMs);
  uint32_t millivolts = 0, raw = 0;
  for (unsigned i = 0; i < config::adcSamples; ++i) {
    raw += analogRead(board::batteryAdc); millivolts += analogReadMilliVolts(board::batteryAdc);
    delay(1);
  }
  outputLevel(board::adcEnable, LOW);
  const float volts = static_cast<float>(millivolts) * board::batteryDivider / config::adcSamples / 1000.0f;
#if LOG_LEVEL > 0
  Serial.printf("[T16] ms=%lu step=adc duration_ms=%lu raw_avg=%lu volts=%.3f provisional=true\n",
      static_cast<unsigned long>(millis()), static_cast<unsigned long>(millis() - started),
      static_cast<unsigned long>(raw / config::adcSamples), volts);
#endif
  return volts;
}
bool clockReady() { return rtcWasSet && time(nullptr) >= 1704067200; }
void sleepNow(time_t completed) {
  // A low BOOT level would immediately retrigger ext0. Stay awake to honor a
  // held five-second reset, then wait for release before arming level wake.
  while (digitalRead(board::bootButton) == LOW) { pollRuntimeButton(); delay(5); }
  delay(35); pollRuntimeButton();
  if (refreshRequested) return;
  const uint32_t started = millis();
  if (displayReady) display.hibernate(); // Never initialize/touch retained panel on failure.
  WiFi.setAutoReconnect(false); WiFi.disconnect(true, false); WiFi.mode(WIFI_OFF);
  uint32_t seconds = config::noClockSleepSeconds;
  chosenTarget = 0;
  if (clockReady()) {
    const auto plan = schedule::nextWake(time(nullptr), completed, config::leadSeconds,
                                         config::debugIntervalSeconds);
    chosenTarget = plan.target; seconds = plan.seconds;
  } else if (config::debugIntervalSeconds) seconds = config::debugIntervalSeconds;
  for (int pin : {board::temperatureEnable, board::amplifierEnable, board::codecEnable,
                  board::loraEnable, board::adcEnable, board::loraReset, board::epdRst}) {
    outputLevel(pin, LOW); gpio_hold_en(static_cast<gpio_num_t>(pin));
  }
  for (int pin : {board::sdCs, board::loraCs, board::epdCs, board::epdDc}) {
    outputLevel(pin, HIGH); gpio_hold_en(static_cast<gpio_num_t>(pin));
  }
  gpio_deep_sleep_hold_en();
  esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_ALL);
  if (esp_sleep_enable_timer_wakeup(static_cast<uint64_t>(seconds) * 1000000ULL) != ESP_OK ||
      esp_sleep_enable_ext0_wakeup(static_cast<gpio_num_t>(board::bootButton), 0) != ESP_OK) {
    log("sleep", "wake-config-failed-restart", started); ESP.restart();
  }
#if LOG_LEVEL > 0
  Serial.printf("[T16] ms=%lu step=sleep seconds=%lu target_epoch=%lld debug_interval=%lu BOOT=ext0 USER=unused\n",
      static_cast<unsigned long>(millis()), static_cast<unsigned long>(seconds),
      static_cast<long long>(chosenTarget), static_cast<unsigned long>(config::debugIntervalSeconds));
#endif
  Serial.flush(); esp_deep_sleep_start();
}
void cycle(bool timerWake) {
  refreshRequested = false;
  pollRuntimeButton(); // A reset captured during early startup wins.
  const float volts = battery();
  uint32_t started = millis();
  bool connected = WiFi.status() == WL_CONNECTED;
  if (!connected) {
    if (!provisioning::hasCredentials()) {
      provisioning::runPortalBlocking(); connected = true;
    } else connected = provisioning::reconnectSaved();
  }
  log("wifi", connected ? "connected" : "failed-panel-retained", started);
  if (!connected && !provisioning::hasCredentials()) {
    // A deliberate BOOT reset in reconnect may have erased/tombstoned credentials.
    provisioning::runPortalBlocking(); connected = true;
  }
  if (storageReady) {
    const uint32_t failures = frame::failedJoinCount(metadata.getUInt("joinFailures", 0), connected);
    const bool saved = metadata.putUInt("joinFailures", failures) == sizeof(uint32_t) &&
                       metadata.getUInt("joinFailures", UINT32_MAX) == failures;
    if (!saved) log("metadata", "join-count-save-failed", started);
    if (!connected && frame::reopenPortal(hasFrame(), failures, config::portalFailureWakes)) {
      provisioning::runPortalBlocking(); connected = true;
      metadata.putUInt("joinFailures", 0);
    }
  }
  if (setupGeneration > 0) timerWake = false; // Newly provisioned: first-frame attempt now.
  time_t completed = timerWake ? chosenTarget : 0;
  if (!connected) { sleepNow(completed); return; }
  started = millis();
  const bool synced = net::syncTime();
  if (synced) rtcWasSet = true;
  log("ntp", synced ? "synced" : clockReady() ? "rtc-fallback" : "no-clock-panel-retained", started);
  pollRuntimeButton();
  if (!clockReady()) { sleepNow(0); return; }
  if (setupGeneration > 0) { timerWake = false; completed = 0; }
  // No delay on BOOT/cold/provisioned immediate refresh. Timer wakes retain the
  // nominal target and wait until it, including the final 22:00 attempt.
  if (timerWake && !chosenTarget && !config::debugIntervalSeconds && !schedule::inWindow(time(nullptr))) {
    sleepNow(0); return;
  }
  time_t target = timerWake ? chosenTarget : 0;
  if (target && !schedule::pendingTarget(time(nullptr), target, config::leadSeconds)) {
    log("schedule", "obsolete-target-skipped", millis()); sleepNow(0); return;
  }
  if (target) {
    const uint32_t waitStarted = millis();
    while (time(nullptr) < target && millis() - waitStarted < (config::leadSeconds + 60) * 1000) {
      pollRuntimeButton(); delay(5);
    }
    if (time(nullptr) < target) { sleepNow(target); return; }
    completed = target;
  }
  const bool low = frame::lowBattery(volts, storageReady && metadata.getBool("lastLow", false),
                                     config::lowThreshold, config::hysteresis);
  if (storageReady) metadata.putBool("lastLow", low);
  started = millis();
  uint8_t* buffer = static_cast<uint8_t*>(heap_caps_malloc(frame::bytes, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
  if (!buffer) buffer = static_cast<uint8_t*>(malloc(frame::bytes));
  const unsigned generation = setupGeneration;
  const bool fetched = net::fetch(low, time(nullptr), buffer);
  log("fetch", fetched ? (low ? "accepted-15000-lowbat" : "accepted-15000-normal") : "failed-panel-retained", started);
  pollRuntimeButton(); // Apply reset captured during bounded network work.
  if (!fetched || generation != setupGeneration || !storageReady) {
    free(buffer); sleepNow(completed); return;
  }
  uint8_t sha[32]{}; char hex[65]{};
  if (mbedtls_sha256(buffer, frame::bytes, sha, 0) != 0) {
    log("hash", "failed-panel-retained", millis()); free(buffer); sleepNow(completed); return;
  }
  for (unsigned i = 0; i < 32; ++i) snprintf(hex + 2 * i, 3, "%02x", sha[i]);
  pollRuntimeButton();
  if (generation != setupGeneration) { free(buffer); sleepNow(completed); return; }
  const String previous = metadata.getString("lastFrameSha", "");
  started = millis();
  if (!frame::redraw(previous.c_str(), hex)) {
    if (metadata.putBool("everShown", true) == 1 && metadata.getBool("everShown", false) &&
        metadata.isKey("framePending")) metadata.remove("framePending");
    log("display", "identical-no-redraw", started);
  }
  else {
    // Old hash must never survive a changed panel write: a failed final commit
    // could otherwise skip a later old frame while the panel still shows new pixels.
    if (!frame::invalidateIdentity(metadata)) {
      log("metadata", "sha-invalidation-failed-panel-retained", started);
      free(buffer); sleepNow(completed); return;
    }
    // A durable unknown-panel marker also covers a crash/failed BOTH commits
    // after the very first refresh. It suppresses automatic setup conservatively
    // without claiming that the physical panel definitely completed a refresh.
    if (metadata.putBool("framePending", true) != 1 || !metadata.getBool("framePending", false)) {
      log("metadata", "pending-save-failed-panel-retained", started);
      free(buffer); sleepNow(completed); return;
    }
    if (!show(buffer, false)) {
      log("display", "panel-timeout-sha-not-saved", started);
      free(buffer); refreshRequested = false; sleepNow(completed); return;
    }
    pollRuntimeButton();
    if (generation != setupGeneration) { free(buffer); sleepNow(completed); return; }
    if (metadata.putBool("everShown", true) != 1 || !metadata.getBool("everShown", false))
      log("metadata", "first-frame-save-failed", started);
    // Commit only after refresh/hibernate; interrupted commit causes a safe redraw.
    const bool saved = metadata.putString("lastFrameSha", hex) == 64 &&
                       metadata.getString("lastFrameSha", "") == hex;
    if (saved && metadata.getBool("everShown", false)) {
      if (metadata.isKey("framePending")) metadata.remove("framePending");
      if (metadata.isKey("framePending")) log("metadata", "pending-clear-failed", started);
    }
    log("display", saved ? "changed-refreshed-hibernated-sha-saved" : "refreshed-sha-save-failed", started);
  }
  free(buffer); refreshRequested = false;
  sleepNow(completed);
}
}
void setup() {
  rtc_gpio_deinit(static_cast<gpio_num_t>(board::bootButton));
  pinMode(board::bootButton, INPUT);
  // Initialize first wake sample/timer BEFORE Serial, ADC or network delays.
  suppressWakeRelease = esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_EXT0 &&
                        digitalRead(board::bootButton) == LOW;
  provisioning::initialize(drawSetup, immediateRefresh);
  disableUnusedPeripherals(); pinMode(board::userButton, INPUT);
  pinMode(board::batteryAdc, INPUT); analogReadResolution(12); analogSetAttenuation(ADC_11db);
  Serial.begin(115200);
  // Suppress SDK network logs that may include SSID; application logs are generic.
  esp_log_level_set("*", ESP_LOG_NONE);
  const uint32_t started = millis();
  while (!Serial && millis() - started < 1000) delay(5);
  setenv("TZ", config::timeZone, 1); tzset();
  storageReady = metadata.begin("weather", false);
  log("wake", esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_EXT0 ? "BOOT-immediate" :
      esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER ? "timer" : "cold-immediate", started);
#ifdef PROVISIONING_PERSISTENCE_TEST
  // Preserve the T15 bounded persistence test; deliberately bypass weather fetch.
  const bool saved = provisioning::hasCredentials() && provisioning::reconnectSaved();
  if (!saved) provisioning::runPortalBlocking();
  if (persistenceSlept && esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER) {
    Serial.println(saved ? "[T15 TEST] Timer wake reconnected; persistence observed" :
                          "[T15 TEST] FAIL timer wake required portal; persistence unproven");
  } else {
    const uint32_t connectedAt = millis();
    Serial.println("[T15 TEST] Connected; one 10s sleep in 30s, release BOOT");
    while (millis() - connectedAt < 30000 || digitalRead(board::bootButton) == LOW) {
      pollRuntimeButton(); delay(5);
    }
    persistenceSlept = true;
    WiFi.disconnect(true, false); WiFi.mode(WIFI_OFF);
    Serial.println("[T15 TEST] Entering one 10s timer sleep; USB CDC may disappear");
    Serial.flush(); esp_sleep_enable_timer_wakeup(10000000ULL); esp_deep_sleep_start();
  }
#else
  cycle(esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER);
#endif
}
void loop() {
  pollRuntimeButton();
#ifndef PROVISIONING_PERSISTENCE_TEST
  if (refreshRequested) cycle(false);
  else sleepNow(0);
#endif
  delay(5);
}
