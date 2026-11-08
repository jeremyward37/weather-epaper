#include "net.h"
#include "config.h"
#include "frame_policy.h"
#include <Arduino.h>
#include <esp_tls.h>
#include <esp_crt_bundle.h>
#include <esp_sntp.h>
#include <esp_log.h>
#include <lwip/dns.h>
#include <lwip/tcpip.h>
#include <atomic>
#include <strings.h>
#include <memory>
#include <new>

namespace net {
namespace {
// Persistent storage: a DNS completion may arrive after the caller's deadline.
struct Resolver {
  char host[128]{}; ip_addr_t address{};
  std::atomic<bool> done{false}, success{false}, busy{false};
} resolver;
void resolved(const char*, const ip_addr_t* address, void*) {
  if (address) resolver.address = *address;
  resolver.success.store(address != nullptr);
  resolver.done.store(true); // Publishes address before the caller reads it.
}
void startResolve(void*) {
  ip_addr_t address{};
  const err_t result = dns_gethostbyname(resolver.host, &address, resolved, nullptr);
  if (result == ERR_OK) resolved(nullptr, &address, nullptr);
  else if (result != ERR_INPROGRESS) resolved(nullptr, nullptr, nullptr);
}

}
bool syncTime() {
  // Each wake must observe a NEW sync, not merely a plausible RTC timestamp.
  esp_sntp_stop();
  esp_sntp_set_sync_status(SNTP_SYNC_STATUS_RESET);
  configTzTime(config::timeZone, "pool.ntp.org", "time.nist.gov");
  const uint32_t started = millis();
  while (millis() - started < config::ntpMs) {
    if (esp_sntp_get_sync_status() == SNTP_SYNC_STATUS_COMPLETED) {
      esp_sntp_stop(); return time(nullptr) >= 1704067200;
    }
    delay(5);
  }
  esp_sntp_stop(); return false;
}
bool fetch(bool lowBattery, time_t epoch, uint8_t* buffer) {
  if (!buffer) return false;
  const uint32_t started = millis();
  const String base(config::baseUrl);
  if (!base.startsWith("https://") || !base.endsWith("/")) return false;
  const int slash = base.indexOf('/', 8);
  if (slash < 9) return false;
  const String host = base.substring(8, slash);
  // Configuration is an HTTPS DNS host on 443, with an optional path prefix.
  if (host.length() >= sizeof(resolver.host) || host.indexOf(':') >= 0 || host.indexOf('@') >= 0) return false;
  if (resolver.busy.load() && !resolver.done.load()) return false;
  resolver.busy.store(true); resolver.done.store(false); resolver.success.store(false);
  host.toCharArray(resolver.host, sizeof(resolver.host));
  if (tcpip_try_callback(startResolve, nullptr) != ERR_OK) {
    resolver.busy.store(false); return false;
  }
  while (!resolver.done.load() && millis() - started < config::fetchMs) delay(5);
  if (!resolver.done.load()) return false;
  resolver.busy.store(false);
  if (!resolver.success.load() || millis() - started >= config::fetchMs) return false;
  char address[IPADDR_STRLEN_MAX]{};
  ipaddr_ntoa_r(&resolver.address, address, sizeof(address));
  const String path = base.substring(slash) + (lowBattery ? "frame-lowbat.bin" : "frame.bin") +
                      "?t=" + String(static_cast<unsigned long>(epoch));
  esp_tls_cfg_t settings{};
  // Numeric connect address avoids blocking getaddrinfo. common_name supplies
  // the original hostname for BOTH SNI and required certificate verification.
  settings.common_name = host.c_str();
  settings.crt_bundle_attach = esp_crt_bundle_attach;
  settings.skip_common_name = false;
  settings.non_block = true;
  settings.timeout_ms = config::fetchMs - (millis() - started);
  esp_tls_t* tls = esp_tls_init();
  if (!tls) return false;
  int connected = 0;
  while (millis() - started < config::fetchMs) {
    connected = esp_tls_conn_new_async(address, strlen(address), 443, &settings, tls);
    if (connected != 0) break;
    delay(5);
  }
  const String request = String("GET ") + path + " HTTP/1.1\r\nHost: " + host +
      "\r\nAccept-Encoding: identity\r\nConnection: close\r\n\r\n";
  size_t sent = 0;
  if (connected == 1) {
    while (sent < request.length() && millis() - started < config::fetchMs) {
      const int result = esp_tls_conn_write(tls, request.c_str() + sent, request.length() - sent);
      if (result > 0) sent += result;
      else if (result != ESP_TLS_ERR_SSL_WANT_READ && result != ESP_TLS_ERR_SSL_WANT_WRITE) break;
      delay(5);
    }
  }
  std::unique_ptr<frame::HttpResponse> response(new (std::nothrow) frame::HttpResponse(buffer));
  if (!response) { esp_tls_conn_destroy(tls); return false; }
  bool accepted = false;
  uint8_t chunk[1024];
  if (connected == 1 && sent == request.length()) {
    while (millis() - started < config::fetchMs) {
      const int result = esp_tls_conn_read(tls, chunk, sizeof(chunk));
      if (result > 0) {
        if (!response->feed(chunk, result)) break;
      } else if (result == 0) { // EOF required: rejects extra bytes beyond declared body.
        accepted = response->finish(); break;
      } else if (result != ESP_TLS_ERR_SSL_WANT_READ && result != ESP_TLS_ERR_SSL_WANT_WRITE) break;
      delay(5); // Deadline stays fixed even for trickled header/body bytes.
    }
  }
  esp_tls_conn_destroy(tls);
  return accepted && millis() - started < config::fetchMs;
}
}
