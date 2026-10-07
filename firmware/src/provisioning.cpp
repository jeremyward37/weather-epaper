#include "provisioning.h"
#include "button.h"
#include "board.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <Preferences.h>
#include <esp_wifi.h>
#ifdef ARDUINO_ARCH_ESP32
#include <esp_timer.h>
#include <atomic>
#endif

namespace provisioning {
namespace {
constexpr uint32_t connectMs = 20000;
Preferences preferences;
BootButton button;
Hook setupHook = nullptr, refreshHook = nullptr;
bool storageReady = false, resetRequested = false, saveRequested = false;
#ifdef ARDUINO_ARCH_ESP32
std::atomic<unsigned> buttonEvents{0};
esp_timer_handle_t buttonTimer = nullptr;
void captureButton(void*) {
  const auto event = button.sample(digitalRead(board::bootButton) == LOW, millis());
  if (event == ButtonEvent::Reset) buttonEvents.fetch_or(2);
  else if (event == ButtonEvent::Refresh) buttonEvents.fetch_or(1);
}
ButtonEvent sampleButton() {
  const unsigned events = buttonEvents.exchange(0);
  return events & 2 ? ButtonEvent::Reset :
         events & 1 ? ButtonEvent::Refresh : ButtonEvent::None;
}
#else
// Portable tests feed the same deployed controller at controlled timestamps.
ButtonEvent sampleButton() {
  return button.sample(digitalRead(board::bootButton) == LOW, millis());
}
#endif
bool storeConnected() {
  if (!storageReady || preferences.putBool("provisioned", true) != 1) {
    Serial.println("[T15] Metadata save failed; setup remains open"); return false;
  }
  // Empty explicit slot for T16: no downloaded frame accepted yet.
  if (!preferences.isKey("lastFrameSha")) {
    preferences.putString("lastFrameSha", "");
    if (!preferences.isKey("lastFrameSha")) {
      Serial.println("[T15] Frame metadata save failed; setup remains open"); return false;
    }
  }
  if (preferences.isKey("resetPending") && !preferences.remove("resetPending")) {
    Serial.println("[T15] Reset metadata save failed; setup remains open"); return false;
  }
  return true;
}
void sampleDuringConnection() {
  if (sampleButton() == ButtonEvent::Reset) resetRequested = true;
  // Short press during setup/reconnect is covered by that connection attempt.
}
}
void initialize(Hook drawSetup, Hook immediateRefresh) {
  setupHook = drawSetup; refreshHook = immediateRefresh;
  storageReady = preferences.begin("weather", false);
  if (!storageReady) Serial.println("[T15] Metadata storage unavailable");
#ifdef ARDUINO_ARCH_ESP32
  // Independent sampling keeps a five-second hold latched even while the
  // library handles its captive-response/save delays. No I/O in this callback.
  button.sample(digitalRead(board::bootButton) == LOW, millis());
  esp_timer_create_args_t timerArgs{};
  timerArgs.callback = captureButton;
  timerArgs.name = "boot-button";
  if (esp_timer_create(&timerArgs, &buttonTimer) != ESP_OK ||
      esp_timer_start_periodic(buttonTimer, 5000) != ESP_OK) {
    Serial.println("[T15] Button timer unavailable; restart required");
    // Do not silently run without the required reset path.
    ESP.restart();
  }
#else
  sampleButton();
#endif
}
bool hasCredentials() {
  WiFi.persistent(true);
  WiFi.mode(WIFI_STA);
  if (esp_wifi_set_storage(WIFI_STORAGE_FLASH) != ESP_OK) return false;
  if (!storageReady || preferences.getBool("resetPending", false)) return false;
  wifi_config_t config{};
  // Native flash config is authoritative; flag is metadata, never a second
  // credential copy or a gate vulnerable to interrupted Preferences writes.
  const bool saved = esp_wifi_get_config(WIFI_IF_STA, &config) == ESP_OK &&
                     config.sta.ssid[0] != 0;
  memset(&config, 0, sizeof(config));
  return saved;
}
void clearCredentials() {
  // Setup replaces the old panel image, so also invalidate its frame identity.
  if (storageReady) {
    if (preferences.putBool("resetPending", true) != 1)
      Serial.println("[T15] Reset intent save failed");
    if (preferences.putBool("provisioned", false) != 1)
      Serial.println("[T15] Metadata reset failed");
    preferences.remove("lastFrameSha");
  }
  WiFi.persistent(true);
  WiFi.enableSTA(true);
  esp_wifi_set_storage(WIFI_STORAGE_FLASH);
  if (!WiFi.disconnect(false, true))
    Serial.println("[T15] Credential erase failed; enter replacement Wi-Fi in setup");
  WiFi.persistent(false);
  resetRequested = false;
  Serial.println("[T15] Credential reset requested");
}
bool reconnectSaved() {
  WiFi.setAutoReconnect(true);
  WiFi.begin();  // No arguments: use native flash configuration.
  const uint32_t started = millis();
  while (millis() - started < connectMs) {
    sampleDuringConnection();
    if (resetRequested) { clearCredentials(); return false; }
    if (WiFi.status() == WL_CONNECTED) {
      if (!storeConnected()) return false;
      Serial.println("[T15] Saved Wi-Fi connected; panel retained"); return true;
    }
    delay(5);
  }
  WiFi.disconnect(false, false);
  Serial.println("[T15] Saved Wi-Fi unavailable; entering setup"); return false;
}
void runPortalBlocking() {
  if (storageReady) preferences.remove("lastFrameSha");
  if (setupHook) setupHook();
  WiFiManager manager;
  manager.setDebugOutput(false);
  manager.setConfigPortalBlocking(false);
  manager.setConfigPortalTimeout(0);
  manager.setSaveConnectTimeout(1);  // v2.0.17 still waits even with connect=false.
  manager.setSaveConnect(false);  // NVS save, asynchronous begin below.
  manager.setShowPassword(false);
  std::vector<const char*> menu{"wifi"};
  manager.setMenu(menu);
  manager.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1),
                              IPAddress(255,255,255,0));
  char expectedSsid[33]{}, expectedPassword[65]{};
  bool validSubmission = false;
  manager.setPreSaveConfigCallback([&] {
    const String ssid = manager.server->arg("s");
    const String password = manager.server->arg("p");
    validSubmission = ssid.length() > 0 && ssid.length() <= 32 &&
                      password.length() <= 64;
    memset(expectedSsid, 0, sizeof(expectedSsid));
    memset(expectedPassword, 0, sizeof(expectedPassword));
    if (validSubmission) {
      ssid.toCharArray(expectedSsid, sizeof(expectedSsid));
      password.toCharArray(expectedPassword, sizeof(expectedPassword));
    }
  });
  manager.setSaveConfigCallback([] { saveRequested = true; });
  manager.setAPCallback([](WiFiManager*) {
    Serial.printf("[T15] Setup AP IP: %s\n", WiFi.softAPIP().toString().c_str());
  });
  saveRequested = false;
  bool connecting = false;
  uint32_t started = 0;
  for (;;) {
    if (!manager.getConfigPortalActive()) {
      // Nonblocking start returns false even when active: inspect portal state.
      manager.startConfigPortal("WeatherStation-Setup", "firstlight");
      if (!manager.getConfigPortalActive()) {
        Serial.println("[T15] Setup AP start failed; retrying"); delay(1000);
      }
    }
    sampleDuringConnection();
    if (resetRequested) {
      manager.stopConfigPortal(); clearCredentials();
      connecting = saveRequested = false;
      continue;  // Setup is already displayed; avoid repeated redraws.
    }
    manager.process();
    sampleDuringConnection();  // Reset latched during library wait wins over save.
    if (resetRequested) continue;
    if (saveRequested) {
      saveRequested = false;
      wifi_config_t submitted{};
      // v2.0.17 fires save callback with connect=false even if native save
      // failed. Verify this exact submission, never accept a stale connection.
      const bool verified = validSubmission &&
          esp_wifi_get_config(WIFI_IF_STA, &submitted) == ESP_OK &&
          memcmp(submitted.sta.ssid, expectedSsid, 32) == 0 &&
          memcmp(submitted.sta.password, expectedPassword, 64) == 0;
      memset(&submitted, 0, sizeof(submitted));
      memset(expectedSsid, 0, sizeof(expectedSsid));
      memset(expectedPassword, 0, sizeof(expectedPassword));
      validSubmission = false;
      if (!verified) {
        connecting = false;
        Serial.println("[T15] Wi-Fi save not verified; setup remains open");
        delay(5);
        continue;
      }
      WiFi.setAutoReconnect(false); WiFi.disconnect(false, false); WiFi.begin();
      connecting = true; started = millis();
      Serial.println("[T15] Trying submitted Wi-Fi");
    }
    if (connecting && WiFi.status() == WL_CONNECTED) {
      if (storeConnected()) {
        manager.stopConfigPortal(); WiFi.mode(WIFI_STA);
        WiFi.setAutoReconnect(true);
        Serial.println("[T15] Provisioning complete; setup frame retained"); return;
      }
      connecting = false;
    }
    if (connecting && millis() - started >= connectMs) {
      WiFi.disconnect(false, false); connecting = false;
      Serial.println("[T15] Submitted Wi-Fi unavailable; setup remains open");
    }
    delay(5);
  }
}
void pollButton() {
  const auto event = sampleButton();
  if (event == ButtonEvent::Reset) { clearCredentials(); runPortalBlocking(); }
  else if (event == ButtonEvent::Refresh && refreshHook) refreshHook();
}
}
