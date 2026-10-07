#pragma once
#include <cstdint>
#include <cstring>
#include <cstdio>
#include <string>
#include <map>
#include <functional>
#include <vector>
#include <stdexcept>
#include <cassert>
inline uint32_t clockMs=0;
inline std::function<bool(uint32_t)> held=[](uint32_t){return false;};
inline bool removeFails=false;
inline std::function<void()> onDelay=[]{};
inline bool staleNative=false, nativeSaveFails=false;
inline bool saved=false, connected=false, eraseFails=false, prefsFail=false, intent=false;
inline int begins=0, draws=0, refreshes=0, processes=0, apStarts=0, storageCalls=0;
inline std::map<std::string,std::string> metadata;
inline std::function<void()> onProcess=[]{};
inline uint32_t millis(){return clockMs;}
inline void delay(unsigned n){clockMs+=n;onDelay();if(clockMs>150000)throw std::runtime_error("unbounded test");}
constexpr int LOW=0, WIFI_STA=1, WL_CONNECTED=3, WIFI_IF_STA=0, ESP_OK=0, WIFI_STORAGE_FLASH=1;
inline int digitalRead(int){return held(clockMs)?0:1;}
struct Console{void println(const char*){} template<class...T>void printf(const char*,T...){} };inline Console Serial;
struct Text{std::string s;const char*c_str()const{return s.c_str();}};
struct IPAddress{IPAddress(int,int,int,int){} Text toString(){return {"192.168.4.1"};}};
struct Wifi {
 void persistent(bool){} bool mode(int){return true;}bool enableSTA(bool){return true;}
 bool disconnect(bool,bool erase){connected=false;if(erase&&!eraseFails)saved=false;return !eraseFails;}
 void setAutoReconnect(bool){} void begin(){++begins;} int status(){return connected?3:0;}
 IPAddress softAPIP(){return {192,168,4,1};}
};inline Wifi WiFi;
struct wifi_config_t{struct{uint8_t ssid[32]; uint8_t password[64];}sta;};
inline int esp_wifi_get_config(int,wifi_config_t*c){if(saved)memcpy(c->sta.ssid,staleNative?"fake-old-network":"fake-test-network",17);return 0;}
inline int esp_wifi_set_storage(int){++storageCalls;return 0;}
struct Preferences {
 bool begin(const char*,bool){return true;}
 size_t putBool(const char*k,bool v){if(prefsFail)return 0;metadata[k]=v?"1":"0";return 1;}
 bool getBool(const char*k,bool d){return metadata.count(k)?metadata[k]=="1":d;}
 bool isKey(const char*k){return metadata.count(k);}
 size_t putString(const char*k,const char*v){if(!prefsFail)metadata[k]=v;return strlen(v);}
 bool remove(const char*k){if(prefsFail||removeFails)return false;return metadata.erase(k);}
};
struct String {
 std::string value;size_t length()const{return value.length();}
 void toCharArray(char* dest,size_t count)const{snprintf(dest,count,"%s",value.c_str());}
};
struct FakeServer {String arg(const char*k){return {std::string(k)=="s"?"fake-test-network":""};}};
struct WiFiManager {
 bool active=false; FakeServer serverObject;FakeServer*server=&serverObject;std::function<void()> presave; std::function<void()> save;std::function<void(WiFiManager*)> ap;
 void setDebugOutput(bool v){assert(!v);}void setConfigPortalBlocking(bool v){assert(!v);}
 void setConfigPortalTimeout(unsigned n){assert(n==0);}void setSaveConnectTimeout(unsigned n){assert(n==1);}
 void setSaveConnect(bool v){assert(!v);}void setShowPassword(bool v){assert(!v);}
 void setMenu(std::vector<const char*>&v){assert(v.size()==1);}
 void setAPStaticIPConfig(IPAddress,IPAddress,IPAddress){}
 void setPreSaveConfigCallback(std::function<void()>f){presave=f;}
 void setSaveConfigCallback(std::function<void()>f){save=f;}
 void setAPCallback(std::function<void(WiFiManager*)>f){ap=f;}
 bool getConfigPortalActive(){return active;}
 bool startConfigPortal(const char*a,const char*b){assert(std::string(a)=="WeatherStation-Setup");assert(std::string(b)=="firstlight");active=true;++apStarts;ap(this);return false;}
 void stopConfigPortal(){active=false;}
 void process(){++processes;onProcess();if(intent){intent=false;presave();if(!nativeSaveFails){saved=true;staleNative=false;}save();}}
};
