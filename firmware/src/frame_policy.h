#pragma once
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <strings.h>

namespace frame {
constexpr size_t bytes = 15000;
inline bool lowBattery(float volts, bool previousLow, float threshold, float hysteresis) {
  return volts < threshold || (previousLow && volts < threshold + hysteresis);
}
inline bool validSha(const char* sha) {
  if (!sha || strlen(sha) != 64) return false;
  for (unsigned i = 0; i < 64; ++i)
    if (!((sha[i] >= '0' && sha[i] <= '9') || (sha[i] >= 'a' && sha[i] <= 'f'))) return false;
  return true;
}
template<class Storage> bool invalidateIdentity(Storage& storage) {
  if (storage.isKey("lastFrameSha")) storage.remove("lastFrameSha");
  return !storage.isKey("lastFrameSha");
}
inline bool redraw(const char* previous, const char* current) {
  return !validSha(previous) || strcmp(previous, current) != 0;
}
inline uint32_t failedJoinCount(uint32_t previous, bool joined) {
  return joined ? 0 : previous == UINT32_MAX ? previous : previous + 1;
}
inline bool reopenPortal(bool everShown, uint32_t failures, uint32_t threshold) {
  return !everShown && failures >= threshold;
}
// Raw pixels have no magic/header; every 15000-byte sequence is a valid bitmap.
// Reject invalid HTTP framing, non-200, encoded/chunked/short/oversize bodies.
class Receiver {
 public:
  explicit Receiver(uint8_t* buffer): buffer_(buffer) {}
  bool append(const void* data, size_t count) {
    if (failed_ || count > bytes - count_) { failed_ = true; return false; }
    memcpy(buffer_ + count_, data, count); count_ += count; return true;
  }
  bool accept(int status, int64_t length, bool chunked, bool binary,
              bool encoded, bool finished) const {
    return !failed_ && finished && status == 200 && length == static_cast<int64_t>(bytes) &&
           count_ == bytes && !chunked && binary && !encoded;
  }
  size_t count() const { return count_; }
 private:
  uint8_t* buffer_; size_t count_ = 0; bool failed_ = false;
};
// Bounded HTTP/1 response parser shared by production TLS reads and native tests.
class HttpResponse {
 public:
  explicit HttpResponse(uint8_t* buffer): receiver_(buffer) {}
  bool feed(const uint8_t* data, size_t count) {
    if (bad_) return false;
    size_t consumed = 0;
    while (!headersDone_ && consumed < count) {
      if (headerCount_ == sizeof(headers_) - 1) { bad_ = true; return false; }
      const uint8_t byte = data[consumed++];
      if ((byte < 32 && byte != '\r' && byte != '\n' && byte != '\t') || byte == 127 ||
          (byte == '\n' && (!headerCount_ || headers_[headerCount_ - 1] != '\r')) ||
          (headerCount_ && headers_[headerCount_ - 1] == '\r' && byte != '\n')) {
        bad_ = true; return false;
      }
      headers_[headerCount_++] = static_cast<char>(byte);
      headers_[headerCount_] = 0;
      if (headerCount_ >= 4 && !memcmp(headers_ + headerCount_ - 4, "\r\n\r\n", 4)) {
        headersDone_ = true;
        if (!parseHeaders()) { bad_ = true; return false; }
      }
    }
    if (headersDone_ && !receiver_.append(data + consumed, count - consumed)) {
      bad_ = true; return false;
    }
    return true;
  }
  bool finish() const {
    return headersDone_ && !bad_ && receiver_.accept(200, bytes, false, true, false, true);
  }
 private:
  bool parseHeaders() {
    char* end = strstr(headers_, "\r\n");
    if (!end) return false;
    *end = 0;
    if (strlen(headers_) < 13 ||
        (strncmp(headers_, "HTTP/1.1 ", 9) && strncmp(headers_, "HTTP/1.0 ", 9)) ||
        strncmp(headers_ + 9, "200 ", 4)) return false;
    bool length = false, binary = false, encodingSeen = false;
    char* line = end + 2;
    while (*line) {
      if (line[0] == '\r' && line[1] == '\n') break;
      end = strstr(line, "\r\n"); if (!end) return false; *end = 0;
      char* colon = strchr(line, ':');
      if (!colon || line[0] == ' ' || line[0] == '\t') return false;
      if (colon == line) return false;
      for (const char* c = line; c < colon; ++c)
        if (!((*c >= 'a' && *c <= 'z') || (*c >= 'A' && *c <= 'Z') ||
              (*c >= '0' && *c <= '9') || strchr("!#$%&'*+-.^_`|~", *c))) return false;
      *colon = 0; char* value = colon + 1;
      while (*value == ' ' || *value == '\t') ++value;
      char* tail = value + strlen(value);
      while (tail > value && (tail[-1] == ' ' || tail[-1] == '\t')) *--tail = 0;
      if (!strcasecmp(line, "Content-Length")) {
        if (length || !*value) return false;
        size_t amount = 0;
        for (const char* digit = value; *digit; ++digit) {
          if (*digit < '0' || *digit > '9' || amount > bytes) return false;
          amount = amount * 10 + (*digit - '0');
        }
        if (amount != bytes) return false;
        length = true;
      } else if (!strcasecmp(line, "Content-Type")) {
        if (binary || strcasecmp(value, "application/octet-stream")) return false;
        binary = true;
      } else if (!strcasecmp(line, "Transfer-Encoding")) return false;
      else if (!strcasecmp(line, "Content-Encoding")) {
        if (encodingSeen || strcasecmp(value, "identity")) return false;
        encodingSeen = true;
      }
      line = end + 2;
    }
    return length && binary;
  }
  Receiver receiver_; char headers_[4097]{}; size_t headerCount_ = 0;
  bool headersDone_ = false, bad_ = false;
};
}
