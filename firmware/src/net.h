#pragma once
#include <stdint.h>
#include <time.h>
namespace net {
// Fetch deadline includes bounded asynchronous DNS, TLS, headers and body.
bool fetch(bool lowBattery, time_t epoch, uint8_t* buffer);
bool syncTime();
}
