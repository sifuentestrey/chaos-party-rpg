/** Pick a reachable private LAN address for the Mac TV/phone QR lobby.
 * Do not blindly select the first adapter: VPN/tunnel/virtual adapters may
 * appear before en0 and create a perfectly valid but unreachable QR URL.
 */
import os from 'node:os';
export function isPrivateIPv4(value) {
 if(typeof value!=='string'||!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value))return false;
 const p=value.split('.').map(Number);
 if(p.some(n=>n>255))return false;
 return p[0]===10 || (p[0]===172&&p[1]>=16&&p[1]<=31) || (p[0]===192&&p[1]===168);
}
export function candidateLanIps(networks=os.networkInterfaces(),override=process.env.CHAOS_LAN_IP) {
 if(override && !isPrivateIPv4(override))throw Error('CHAOS_LAN_IP must be a private IPv4 address on your Wi-Fi/LAN.');
 const out=[];
 for(const [name,adapters] of Object.entries(networks||{}))for(const info of adapters||[]) {
  if(!info||info.internal||!['IPv4',4].includes(info.family)||!isPrivateIPv4(info.address))continue;
  // Prefer the physical Mac Wi-Fi (usually en0), then Ethernet/Wi-Fi,
  // then other private adapters. Tunnel/VM addresses are LAST RESORT.
  const rank=/^en0$/.test(name)?0:/^en[1-9]\d*$/.test(name)?1:/^(?:wlan|wlp|wi-fi|wifi|eth|eno|enp)/i.test(name)?2:/^(?:utun|tun|tap|wg|tailscale|docker|veth|bridge|br-|vmnet|vbox)/i.test(name)?9:4;
  out.push({address:info.address,rank,name});
 }
 out.sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name)||a.address.localeCompare(b.address));
 const ips=[...(override?[override]:[]),...out.map(x=>x.address)];
 return [...new Set(ips)];
}
export function preferredLanIp(networks=os.networkInterfaces(),override=process.env.CHAOS_LAN_IP) {
 return candidateLanIps(networks,override)[0]||'localhost';
}
