#pragma once
#include <stdint.h>
namespace provisioning {
enum class ButtonEvent { None, Refresh, Reset };
// Production controller used during reconnect, portal and awake loop.
// First sample begins a held wake-button timer; unsigned math handles rollover.
class BootButton {
 public:
  ButtonEvent sample(bool pressed, uint32_t now) {
    if (pressed != raw_) { raw_ = pressed; changed_ = now; }
    if (pressed && !active_ && now - changed_ >= 30) {
      active_ = true; fired_ = false; started_ = changed_;
    }
    if (active_ && pressed && !fired_ && now - started_ >= 5000) {
      fired_ = true; return ButtonEvent::Reset;
    }
    if (active_ && !pressed && now - changed_ >= 30) {
      active_ = false;
      if (!fired_) return ButtonEvent::Refresh;
    }
    return ButtonEvent::None;
  }
 private:
  bool raw_ = false, active_ = false, fired_ = false;
  uint32_t changed_ = 0, started_ = 0;
};
}
