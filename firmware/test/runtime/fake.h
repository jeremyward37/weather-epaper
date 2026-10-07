#pragma once
#include <cstdint>
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <ctime>
#include <string>
#include <map>
#include <functional>
#include <stdexcept>
#include <cassert>
namespace fake {
inline uint32_t ms=0;
inline time_t epoch=1784124000;
inline bool saved=true, connected=false, joinFails=false, ntpFails=false, fetchFails=false;
inline bool removeFails=false, shaSaveFails=false, panelFails=false, everSaveFails=false, pendingSaveFails=false;
inline bool buttonLow=false;
inline int wake=0, initCalls=0, writes=0, refreshes=0, portals=0, joins=0, fetches=0;
inline int panel=1, incoming=2, pending=0;
inline uint64_t sleepUs=0;
inline std::string fetchedFile;
inline std::map<std::string,std::string> values;
inline std::map<int,int> pins;
inline std::function<void()> afterFetch=[]{};
inline std::function<void()> onPoll=[]{};
struct Slept {};
}
#define RTC_DATA_ATTR
#define ARDUINO_ISR_ATTR
#define PROGMEM
constexpr int LOW=0, HIGH=1, INPUT=0, OUTPUT=1, FALLING=2, ADC_11db=3;
constexpr int WIFI_OFF=0, WIFI_STA=1, WL_CONNECTED=3, ESP_OK=0, ESP_LOG_NONE=0;
constexpr int ESP_SLEEP_WAKEUP_EXT0=2, ESP_SLEEP_WAKEUP_TIMER=4, ESP_SLEEP_WAKEUP_ALL=9;
constexpr int MALLOC_CAP_SPIRAM=1, MALLOC_CAP_8BIT=2;
using gpio_num_t=int;
inline uint32_t millis(){return fake::ms;}
inline uint32_t micros(){return fake::ms*1000;}
inline void delay(uint32_t n){fake::ms+=n; if(fake::ms>1000000)throw std::runtime_error("unbounded runtime");}
inline int digitalRead(int pin){return pin==0 ? (fake::buttonLow?LOW:HIGH):fake::pins[pin];}
inline void digitalWrite(int pin,int level){fake::pins[pin]=level;}
inline void pinMode(int,int){}
inline void attachInterrupt(int,void(*)(),int){}
inline void detachInterrupt(int){}
inline void analogReadResolution(int){}
inline void analogSetAttenuation(int){}
inline int analogRead(int){return 0;}
inline int analogReadMilliVolts(int){return 0;}
struct Console {
 void begin(int){} operator bool()const{return true;}
 void println(const char*){} void flush(){}
 template<class... Args>void printf(const char*,Args...){}
};inline Console Serial;
struct Device {void restart(){throw std::runtime_error("restart");}};inline Device ESP;
class String {
 public:
  std::string value;
  String(const char* s=""):value(s){} String(std::string s):value(s){}
  String(unsigned long n):value(std::to_string(n)){}
  size_t length()const{return value.size();}
  const char* c_str()const{return value.c_str();}
  bool operator==(const char* rhs)const{return value==rhs;}
  bool startsWith(const char* s)const{return value.rfind(s,0)==0;}
  bool endsWith(const char* s)const{std::string suffix(s);return value.size()>=suffix.size()&&value.compare(value.size()-suffix.size(),suffix.size(),suffix)==0;}
  int indexOf(char c,int from=0)const{auto i=value.find(c,from);return i==std::string::npos?-1:static_cast<int>(i);}
  String substring(int from)const{return value.substr(from);}
  String substring(int from,int to)const{return value.substr(from,to-from);}
  void toCharArray(char* out,size_t size)const{snprintf(out,size,"%s",value.c_str());}
  friend String operator+(const String& a,const String& b){return a.value+b.value;}
};
struct Preferences {
 bool begin(const char*,bool){return true;}
 bool isKey(const char* k){return fake::values.count(k);}
 bool remove(const char* k){if(fake::removeFails)return false;return fake::values.erase(k);}
 bool getBool(const char* k,bool defaultValue){return isKey(k)?fake::values[k]=="1":defaultValue;}
 size_t putBool(const char* k,bool v){if((std::string(k)=="everShown"&&fake::everSaveFails)||(std::string(k)=="framePending"&&fake::pendingSaveFails))return 0;fake::values[k]=v?"1":"0";return 1;}
 uint32_t getUInt(const char* k,uint32_t v){return isKey(k)?static_cast<uint32_t>(std::stoul(fake::values[k])):v;}
 size_t putUInt(const char* k,uint32_t v){fake::values[k]=std::to_string(v);return 4;}
 String getString(const char* k,const char* v){return isKey(k)?fake::values[k]:std::string(v);}
 size_t putString(const char* k,const char* v){if(fake::shaSaveFails)return 0;fake::values[k]=v;return strlen(v);}
};
struct Wifi {
 int status(){return fake::connected?3:0;}
 void setAutoReconnect(bool){} bool disconnect(bool,bool){fake::connected=false;return true;}
 bool mode(int mode){if(mode==WIFI_OFF)fake::connected=false;return true;}
};inline Wifi WiFi;
struct Spi {void begin(int,int,int,int){}};inline Spi SPI;
inline void gpio_hold_dis(int){} inline void gpio_hold_en(int){}
inline void gpio_deep_sleep_hold_dis(){} inline void gpio_deep_sleep_hold_en(){}
inline void rtc_gpio_deinit(int){}
inline void esp_log_level_set(const char*,int){}
inline int esp_sleep_get_wakeup_cause(){return fake::wake;}
inline void esp_sleep_disable_wakeup_source(int){}
inline int esp_sleep_enable_timer_wakeup(uint64_t us){fake::sleepUs=us;return 0;}
inline int esp_sleep_enable_ext0_wakeup(int,int){return 0;}
inline void esp_deep_sleep_start(){throw fake::Slept{};}
inline void* heap_caps_malloc(size_t count,int){return malloc(count);}
inline int mbedtls_sha256(const uint8_t* pixels,size_t count,uint8_t* sha,int){assert(count==15000);memset(sha,pixels[0],32);return 0;}
class GxEPD2_420_GYE042A87 {
 public:
 static constexpr int WIDTH=400,HEIGHT=300;
 void(*callback)(const void*)=nullptr;
 GxEPD2_420_GYE042A87(int,int,int,int){}
 void selectFastFullUpdate(bool){} void setBusyCallback(void(*fn)(const void*)){callback=fn;}
 void writeImage(const uint8_t* bytes,int,int,int,int,bool,bool,bool){++fake::writes;fake::pending=bytes[0];}
};
template<class Driver,int Height>struct GxEPD2_BW {
 Driver epd2;
 explicit GxEPD2_BW(Driver driver):epd2(driver){}
 void init(int,bool,int,bool){++fake::initCalls;} void setRotation(int){}
 void refresh(bool){++fake::refreshes;fake::panel=fake::pending;
   if(fake::panelFails){fake::pins[6]=HIGH;epd2.callback(nullptr);delay(9991);epd2.callback(nullptr);}}
 void hibernate(){fake::pins[6]=LOW;}
};
