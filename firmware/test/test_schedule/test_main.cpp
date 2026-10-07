#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <array>
#include <string>
#ifdef PIO_UNIT_TESTING
#include <unity.h>
void setUp() {}
void tearDown() {}
#endif
#include "schedule.h"
#include "frame_policy.h"
// UTC conversion is independent of configured local TZ.
time_t utc(int year, int month, int day, int hour, int minute = 0, int second = 0) {
  tm value{}; value.tm_year = year - 1900; value.tm_mon = month - 1;
  value.tm_mday = day; value.tm_hour = hour; value.tm_min = minute; value.tm_sec = second;
  return timegm(&value);
}
void scheduleAndPolicy() {
  setenv("TZ", "MST7MDT,M3.2.0,M11.1.0", 1); tzset();
  // July Mountain is UTC-6. Exact endpoints and strictly future next slot.
  assert(!schedule::inWindow(utc(2026,7,15,10,59,59)));
  assert(schedule::inWindow(utc(2026,7,15,11)));
  assert(schedule::inWindow(utc(2026,7,16,4)));
  assert(!schedule::inWindow(utc(2026,7,16,4,0,1)));
  assert(schedule::nextSlot(utc(2026,7,15,10,59,59)) == utc(2026,7,15,11));
  assert(schedule::nextSlot(utc(2026,7,15,11)) == utc(2026,7,15,11,30));
  assert(schedule::nextSlot(utc(2026,7,16,3,59,59)) == utc(2026,7,16,4));
  assert(schedule::nextSlot(utc(2026,7,16,4)) == utc(2026,7,16,11));
  // Count all35 nominal slots, including22:00; no22:30/overnight.
  time_t cursor = utc(2026,7,15,10,59,59);
  for (int slot = 0; slot < 35; ++slot) {
    cursor = schedule::nextSlot(cursor); assert(schedule::isSlot(cursor));
    assert(cursor == utc(2026,7,15,11) + slot * 1800);
  }
  assert(schedule::nextSlot(cursor) == utc(2026,7,16,11));
  // Spring DST:22:00 MST ->05:00 MDT is6 real hours; fall is8.
  assert(schedule::nextSlot(utc(2026,3,8,5)) == utc(2026,3,8,11));
  assert(schedule::nextSlot(utc(2026,11,1,4)) == utc(2026,11,1,12));
  assert(schedule::nextSlot(utc(2026,12,31,23)) == utc(2026,12,31,23,30));
  assert(schedule::nextSlot(utc(2027,1,1,5)) == utc(2027,1,1,12));
  // Early wake retains its chosen target and final-slot attempt across a late join.
  const time_t last = utc(2026,7,16,4);
  assert(schedule::pendingTarget(last - 20, last));
  assert(schedule::pendingTarget(last + 10, last));
  assert(!schedule::pendingTarget(last + 121, last));
  auto plan = schedule::nextWake(last - 100, 0);
  assert(plan.target == last && plan.seconds == 80);
  plan = schedule::nextWake(last - 5, 0);
  assert(plan.target == last && plan.seconds == 5); // Lead passed: wake AT target.
  plan = schedule::nextWake(last - 1, last);
  assert(plan.target == utc(2026,7,16,11) && plan.seconds == 7 * 3600 - 19);
  plan = schedule::nextWake(utc(2026,7,15,12,29,55), utc(2026,7,15,12));
  assert(plan.target == utc(2026,7,15,12,30) && plan.seconds == 5);
  plan = schedule::nextWake(last, last, 20, 120);
  assert(plan.target == last + 120 && plan.seconds == 100);
  assert(frame::lowBattery(0, false, 3.55f, .10f)); // USB0 is no charge inference.
  assert(frame::lowBattery(3.549f, false, 3.55f, .10f));
  assert(!frame::lowBattery(3.55f, false, 3.55f, .10f));
  assert(frame::lowBattery(3.60f, true, 3.55f, .10f));
  assert(!frame::lowBattery(3.651f, true, 3.55f, .10f));
  assert(frame::failedJoinCount(19, false) == 20);
  assert(frame::failedJoinCount(19, true) == 0);
  assert(frame::failedJoinCount(UINT32_MAX, false) == UINT32_MAX);
  assert(!frame::reopenPortal(false, 19, 20));
  assert(frame::reopenPortal(false, 20, 20));
  assert(!frame::reopenPortal(true, 1000, 20));
  const char* sha = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  assert(frame::validSha(sha)); assert(frame::redraw("", sha));
  assert(!frame::redraw(sha, sha));
  assert(frame::redraw("bad", sha));
  assert(!frame::validSha("ffffffff"));
  std::array<uint8_t, frame::bytes + 2> destination{}, pixels{};
  destination.front() = 77; destination.back() = 88;
  frame::Receiver exact(destination.data() + 1);
  assert(exact.append(pixels.data(), 9000)); assert(exact.append(pixels.data(), 6000));
  assert(exact.accept(200,15000,false,true,false,true));
  assert(!exact.accept(500,15000,false,true,false,true));
  assert(!exact.accept(200,-1,true,true,false,true));
  assert(!exact.accept(200,15000,false,false,false,true)); // HTML instead of raw.
  assert(!exact.accept(200,15000,false,true,true,true)); // Encoded payload.
  assert(!exact.accept(200,15000,false,true,false,false)); // Failed/stalled transfer.
  assert(!exact.accept(200,15001,false,true,false,true));
  assert(!exact.append(pixels.data(),1));
  assert(!exact.accept(200,15000,false,true,false,true)); // Oversize permanently failed.
  assert(destination.front()==77 && destination.back()==88);
  frame::Receiver shortBody(destination.data() + 1);
  assert(shortBody.append(pixels.data(),14999));
  assert(!shortBody.accept(200,15000,false,true,false,true));
  const std::string headers = "HTTP/1.1 200 OK\r\nContent-Length: 15000\r\nContent-Type: application/octet-stream\r\n\r\n";
  frame::HttpResponse http(destination.data() + 1);
  for (const auto byte : headers) assert(http.feed(reinterpret_cast<const uint8_t*>(&byte),1));
  assert(!http.finish()); assert(http.feed(pixels.data(),15000)); assert(http.finish());
  assert(!http.feed(pixels.data(),1)); assert(!http.finish());
  for (const std::string& invalid : {
       std::string("HTTP/1.1 200oops\r\nContent-Length: 15000\r\nContent-Type: application/octet-stream\r\n\r\n"),
       std::string("HTTP/1.1 404 Missing\r\nContent-Length: 15000\r\nContent-Type: application/octet-stream\r\n\r\n"),
       std::string("HTTP/1.1 200 OK\r\nContent-Length: 14999\r\nContent-Type: application/octet-stream\r\n\r\n"),
       std::string("HTTP/1.1 200 OK\r\nContent-Length: 15001\r\nContent-Type: application/octet-stream\r\n\r\n"),
       std::string("HTTP/1.1 200 OK\r\nContent-Length: 15000junk\r\nContent-Type: application/octet-stream\r\n\r\n"),
       std::string("HTTP/1.1 200 OK\r\nContent-Length: 15000\r\nContent-Length: 15000\r\nContent-Type: application/octet-stream\r\n\r\n"),
       std::string("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nContent-Type: application/octet-stream\r\n\r\n"),
       std::string("HTTP/1.1 200 OK\r\nContent-Length: 15000\r\nContent-Type: text/html\r\n\r\n"),
       std::string("HTTP/1.1 200 OK\r\nContent-Length: 15000\r\nContent-Type: application/octet-stream\r\nContent-Encoding: gzip\r\n\r\n")}) {
    frame::HttpResponse rejected(destination.data()+1);
    assert(!rejected.feed(reinterpret_cast<const uint8_t*>(invalid.data()), invalid.size()));
    assert(!rejected.finish());
  }
  frame::HttpResponse nulHeaders(destination.data()+1);
  std::string hidden = headers.substr(0,headers.size()-2) + std::string(1,'\0') + "Transfer-Encoding: chunked\r\n\r\n";
  assert(!nulHeaders.feed(reinterpret_cast<const uint8_t*>(hidden.data()), hidden.size()));
  frame::HttpResponse hugeHeaders(destination.data()+1);
  std::string huge(4097,'x');
  assert(!hugeHeaders.feed(reinterpret_cast<const uint8_t*>(huge.data()),huge.size()));
  assert(destination.front()==77 && destination.back()==88);
  struct FakeStorage {
    bool present = true, removeFailed = false;
    bool isKey(const char*) { return present; }
    bool remove(const char*) { if (!removeFailed) present = false; return !removeFailed; }
  } identity;
  identity.removeFailed = true; assert(!frame::invalidateIdentity(identity));
  identity.removeFailed = false; assert(frame::invalidateIdentity(identity));
  assert(!identity.present); // Failed final save cannot resurrect oldA/no-redraw bug.
  assert(frame::redraw(identity.present ? sha : "", sha));
  puts("PASS schedule-window-DST-target-debug and HTTP-frame-failure-policy");
}

int main() {
#ifdef PIO_UNIT_TESTING
  UNITY_BEGIN(); RUN_TEST(scheduleAndPolicy); return UNITY_END();
#else
  scheduleAndPolicy(); return 0;
#endif
}
