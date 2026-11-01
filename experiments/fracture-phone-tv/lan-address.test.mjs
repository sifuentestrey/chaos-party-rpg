import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateLanIps,preferredLanIp,isPrivateIPv4} from './lan-address.mjs';
test('Mac Wi-Fi is preferred over a misleading VPN, tunnel, or VM adapter',()=>{
 const interfaces={utun4:[{family:'IPv4',internal:false,address:'10.22.0.14'}],
  bridge100:[{family:'IPv4',internal:false,address:'192.168.64.1'}],
  en1:[{family:'IPv4',internal:false,address:'192.168.1.81'}],
  en0:[{family:'IPv4',internal:false,address:'192.168.1.80'}],
  lo0:[{family:'IPv4',internal:true,address:'127.0.0.1'}]};
 const ips=candidateLanIps(interfaces,null);
 assert.deepEqual(ips.slice(0,2),['192.168.1.80','192.168.1.81']);
 // The relative order of equally low-priority VPN and VM adapters is not a
 // product contract; neither may outrank a real Wi-Fi or Ethernet interface.
 assert.deepEqual(new Set(ips.slice(2)),new Set(['10.22.0.14','192.168.64.1']));
 assert.equal(preferredLanIp(interfaces,null),'192.168.1.80');
});
test('Wi-Fi alternative URLs can fall back to a second real private adapter',()=>{
 const interfaces={wlp2s0:[{family:'IPv4',internal:false,address:'10.0.0.56'}],
  en0:[{family:'IPv4',internal:false,address:'192.168.3.9'}]};
 assert.deepEqual(candidateLanIps(interfaces,null).slice(0,2),['192.168.3.9','10.0.0.56']);
});
test('private override takes precedence; invalid, public or injected overrides are rejected',()=>{
 const interfaces={en0:[{family:'IPv4',internal:false,address:'192.168.1.80'}]};
 assert.equal(preferredLanIp(interfaces,'10.0.0.25'),'10.0.0.25');
 for(const ip of ['8.8.8.8','127.0.0.1','169.254.3.6','2001:db8::1','192.168.1.80/hi','10.0.0.1"><script>','172.32.0.1']){
  assert.equal(isPrivateIPv4(ip),false,ip);
  assert.throws(()=>candidateLanIps(interfaces,ip),/private IPv4/);
 }
 assert.equal(isPrivateIPv4('172.31.1.5'),true);
 assert.equal(isPrivateIPv4('10.3.0.14'),true);
});
test('duplicate, link-local and public addresses never enter a phone QR',()=>{
 const interfaces={en0:[{family:'IPv4',internal:false,address:'192.168.1.80'}, {family:'IPv4',internal:false,address:'169.254.6.7'}],
  wifi:[{family:'IPv4',internal:false,address:'192.168.1.80'}],
  eth0:[{family:'IPv4',internal:false,address:'203.0.113.10'}]};
 assert.deepEqual(candidateLanIps(interfaces,null),['192.168.1.80']);
 assert.equal(preferredLanIp({},null),'localhost');
});
