#include "net_fake.h"
#include <atomic>
#include <strings.h>
#include <memory>
#include <new>
#include "../../src/net.cpp"
int main(int argc,char** argv) {
 assert(argc==2);const std::string scenario(argv[1]);
 uint8_t frame[15000]{};
 const std::string headers="HTTP/1.1 200 OK\r\nContent-Length: 15000\r\nContent-Type: application/octet-stream\r\n\r\n";
 fakeNet::response=headers+std::string(15000,'x');
 if(scenario=="success") {
   assert(net::fetch(false,1784124000,frame));assert(frame[0]=='x'&&frame[14999]=='x');
   assert(fakeNet::request.find("GET /frame.bin?t=1784124000 HTTP/1.1\r\nHost: weather.builtbyjer.com\r\n") == 0);
   assert(fakeNet::request.find("Connection: close")!=std::string::npos&&fakeNet::destroyed);
 } else if(scenario=="lowbat") {
   assert(net::fetch(true,1784124000,frame));assert(fakeNet::request.find("GET /frame-lowbat.bin?")==0);
 } else if(scenario=="tls-invalid") {
   fakeNet::invalidCert=true;assert(!net::fetch(false,1784124000,frame));assert(fakeNet::request.empty()&&fakeNet::destroyed);
 } else if(scenario=="dns-deadline") {
   fakeNet::dnsStalls=true;assert(!net::fetch(false,1784124000,frame));assert(fake::ms==15000);
   assert(!net::fetch(false,1784124000,frame));assert(fake::ms==15000); // Late callback storage is still alive.
   ip_addr_t address{};fakeNet::lateCallback(nullptr,&address,nullptr);
   fakeNet::dnsStalls=false;assert(net::fetch(false,1784124000,frame));
 } else if(scenario=="tls-deadline") {
   fakeNet::tlsStalls=true;assert(!net::fetch(false,1784124000,frame));assert(fake::ms==15000&&fakeNet::destroyed);
 } else if(scenario=="write-deadline") {
   fakeNet::writeStalls=true;assert(!net::fetch(false,1784124000,frame));assert(fake::ms==15000&&fakeNet::destroyed);
 } else if(scenario=="read-deadline") {
   fakeNet::readStalls=true;assert(!net::fetch(false,1784124000,frame));assert(fake::ms==15000&&fakeNet::destroyed);
 } else if(scenario=="drip-deadline") {
   fakeNet::drip=true;assert(!net::fetch(false,1784124000,frame));assert(fake::ms==15000&&fakeNet::destroyed);
   assert(fakeNet::offset<fakeNet::response.size());
 } else if(scenario=="short") {
   fakeNet::response.resize(fakeNet::response.size()-1);assert(!net::fetch(false,1784124000,frame));
 } else if(scenario=="oversize") {
   fakeNet::response+='x';assert(!net::fetch(false,1784124000,frame));
 } else if(scenario=="ntp-freshness") {
   fake::ntpFails=true;fakeNet::syncStatus=SNTP_SYNC_STATUS_COMPLETED;
   assert(!net::syncTime());assert(fake::ms==10000); // Old COMPLETED cannot pretend to be fresh.
   fake::ntpFails=false;assert(net::syncTime());assert(fake::ms==10100);
 } else return 2;
 printf("PASS deployed-net %s\n",scenario.c_str());
}
