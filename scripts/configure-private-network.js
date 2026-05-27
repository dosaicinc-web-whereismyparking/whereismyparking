const { execSync } = require('child_process');
const path = require('path');

const IPs = [
  '49.12.37.22',       // db-primary
  '178.104.191.198',   // supabase-node
  '178.105.209.94',    // app-1
  '178.105.223.164'    // app-2
];

function runSsh(ip, command) {
  const sshKeyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'id_ed25519');
  const baseCmd = `ssh -i "${sshKeyPath}" -o StrictHostKeyChecking=no root@${ip}`;
  return execSync(`${baseCmd} "${command.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
}

async function run() {
  console.log('=============================================');
  console.log('⚙️ CONFIGURING PRIVATE NETWORK ON ALL NODES');
  console.log('=============================================\n');

  for (const ip of IPs) {
    console.log(`Configuring private network on ${ip}...`);
    try {
      // Find private interface (exclude loopback, eth0, docker interfaces)
      const ifaceOutput = runSsh(ip, "ip -o link show | awk -F': ' '{print $2}' | grep -v lo | grep -v eth0 | grep -v docker | grep -v veth | head -n 1");
      const iface = ifaceOutput.trim();
      
      if (!iface) {
        console.error(`   - No private interface found on ${ip}`);
        continue;
      }
      console.log(`   - Found private interface: "${iface}"`);
      
      const netplanLines = [
        "network:",
        "  version: 2",
        "  ethernets:",
        `    ${iface}:`,
        "      dhcp4: true"
      ];
      
      console.log(`   - Writing netplan config to /etc/netplan/60-private.yaml...`);
      const writeCmd = netplanLines.map((line, idx) => `echo '${line}' ${idx === 0 ? '>' : '>>'} /etc/netplan/60-private.yaml`).join(' && ');
      runSsh(ip, `${writeCmd} && chmod 600 /etc/netplan/60-private.yaml`);
      
      console.log(`   - Bringing interface ${iface} UP...`);
      runSsh(ip, `ip link set ${iface} up`);
      
      console.log(`   - Applying netplan config...`);
      runSsh(ip, `netplan apply`);
      
      console.log(`   - Verifying IP assignment...`);
      const ipShow = runSsh(ip, `ip a show ${iface}`);
      console.log(ipShow);
      console.log(`✅ Private network configured on ${ip}\n`);
    } catch (err) {
      console.error(`❌ Failed on ${ip}:`, err.message);
    }
  }
}

run();
