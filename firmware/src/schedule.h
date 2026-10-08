#pragma once
#include <time.h>
#include <stdint.h>
namespace schedule {
// Caller configures the Mountain POSIX TZ before calling these pure functions.
bool inWindow(time_t now);
bool isSlot(time_t instant);
time_t nextSlot(time_t now); // Strictly future, including 22:00.
struct SleepPlan { time_t target; uint32_t seconds; };
SleepPlan nextWake(time_t now, time_t completedTarget, uint32_t lead = 20,
                   uint32_t debugInterval = 0);
// Keep the chosen target after an early timer wake, even if join crosses 22:00.
bool pendingTarget(time_t now, time_t target, uint32_t lead = 20);
}
