#pragma once
#include "fake.h"
struct ip_addr;
namespace fakeNet {
inline bool dnsStalls=false,tlsStalls=false,writeStalls=false,readStalls=false,drip=false,invalidCert=false;
inline std::string response,request;
inline size_t offset=0;
inline bool destroyed=false;
inline uint32_t ntpStarted=0;
inline int syncStatus=2;
inline void(*lateCallback)(const char*,const struct ip_addr*,void*)=nullptr;
}
struct ip_addr {int address=1;};using ip_addr_t=ip_addr;using err_t=int;
constexpr int ERR_OK=0,ERR_INPROGRESS=-5;
constexpr int IPADDR_STRLEN_MAX=46;
inline int tcpip_try_callback(void(*fn)(void*),void* arg){fn(arg);return 0;}
inline int dns_gethostbyname(const char* name,ip_addr_t* out,void(*fn)(const char*,const ip_addr_t*,void*),void*){
 assert(std::string(name)=="weather.builtbyjer.com");
 if(fakeNet::dnsStalls){fakeNet::lateCallback=fn;return ERR_INPROGRESS;}out->address=1;return 0;
}
inline char* ipaddr_ntoa_r(const ip_addr_t*,char* out,int size){snprintf(out,size,"203.0.113.1");return out;}
constexpr int SNTP_SYNC_STATUS_RESET=0,SNTP_SYNC_STATUS_COMPLETED=2;
inline void esp_sntp_stop(){}
inline void esp_sntp_set_sync_status(int status){fakeNet::syncStatus=status;}
inline int esp_sntp_get_sync_status(){if(!fake::ntpFails&&fake::ms-fakeNet::ntpStarted>=100)fakeNet::syncStatus=2;return fakeNet::syncStatus;}
inline void configTzTime(const char*,const char* a,const char* b){assert(std::string(a)=="pool.ntp.org"&&std::string(b)=="time.nist.gov");fakeNet::ntpStarted=fake::ms;}
inline int esp_crt_bundle_attach(void*){return 0;}
constexpr int ESP_TLS_ERR_SSL_WANT_READ=-100,ESP_TLS_ERR_SSL_WANT_WRITE=-101;
struct esp_tls_cfg_t {
 const char* common_name=nullptr;int(*crt_bundle_attach)(void*)=nullptr;
 bool skip_common_name=false,non_block=false;int timeout_ms=0;
};
struct esp_tls_t{};
inline esp_tls_t* esp_tls_init(){return new esp_tls_t;}
inline int esp_tls_conn_new_async(const char* host,int len,int port,const esp_tls_cfg_t* cfg,esp_tls_t*) {
 assert(std::string(host,len)=="203.0.113.1"&&port==443);
 assert(std::string(cfg->common_name)=="weather.builtbyjer.com"&&cfg->crt_bundle_attach);
 assert(!cfg->skip_common_name&&cfg->non_block&&cfg->timeout_ms>0&&cfg->timeout_ms<=15000);
 return fakeNet::invalidCert?-1:fakeNet::tlsStalls?0:1;
}
inline int esp_tls_conn_write(esp_tls_t*,const void* data,size_t len){
 if(fakeNet::writeStalls)return ESP_TLS_ERR_SSL_WANT_WRITE;
 const size_t amount=len>17?17:len;fakeNet::request.append(static_cast<const char*>(data),amount);return amount;
}
inline int esp_tls_conn_read(esp_tls_t*,void* out,size_t size){
 if(fakeNet::readStalls)return ESP_TLS_ERR_SSL_WANT_READ;
 if(fakeNet::offset==fakeNet::response.size())return 0;
 size_t amount=fakeNet::response.size()-fakeNet::offset;if(amount>size)amount=size;if(fakeNet::drip)amount=1;
 memcpy(out,fakeNet::response.data()+fakeNet::offset,amount);fakeNet::offset+=amount;return amount;
}
inline void esp_tls_conn_destroy(esp_tls_t* tls){fakeNet::destroyed=true;delete tls;}
