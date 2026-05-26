const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  location: 'fsn1', // Falkenstein, Germany
  networkZone: 'eu-central',
  networkName: 'parking-net',
  networkRange: '10.0.0.0/16',
  subnetRange: '10.0.0.0/24',
  sshKeyName: 'dosaic-parking-key',
  sshPublicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJg/YQUwWGw+3jcBPK0KunwLhwgzxPy6Lxy/P/YA7m1w acer@DESKTOP-C56EQTT',
  servers: [
    {
      name: 'db-primary',
      serverType: 'cpx32', // 4 vCPU, 8 GB RAM (~€13.99/mo)
      image: 'ubuntu-24.04',
      privateIp: '10.0.0.2',
      firewall: 'parking-db-firewall'
    },
    {
      name: 'supabase-node',
      serverType: 'cpx32', // 4 vCPU, 8 GB RAM (~€13.99/mo)
      privateIp: '10.0.0.3',
      image: 'ubuntu-24.04',
      firewall: 'parking-db-firewall'
    },
    {
      name: 'app-1',
      serverType: 'cpx22', // 2 vCPU, 4 GB RAM (~€7.99/mo)
      privateIp: '10.0.0.4',
      image: 'ubuntu-24.04',
      firewall: 'parking-app-firewall'
    },
    {
      name: 'app-2',
      serverType: 'cpx22', // 2 vCPU, 4 GB RAM (~€7.99/mo)
      privateIp: '10.0.0.5',
      image: 'ubuntu-24.04',
      firewall: 'parking-app-firewall'
    }
  ],
  loadBalancer: {
    name: 'parking-lb',
    type: 'lb11', // ~€6/mo
    listenPort: 80,
    destinationPort: 80
  }
};

// Retrieve API Token
const token = process.env.HCLOUD_TOKEN || 'ILsZ7esek0Ql4ceuZA3JCDwhwxFXY7uDmjQUM0LCis4p0MPHipYtyL1NKRymMsRL';

if (!token) {
  console.error('Error: HCLOUD_TOKEN environment variable or hardcoded fallback is missing.');
  process.exit(1);
}

const args = process.argv.slice(2);
const isApply = args.includes('--apply');

// Helper to make API calls to Hetzner Cloud
async function hcloudApi(endpoint, method = 'GET', body = null) {
  const url = `https://api.hetzner.cloud/v1${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error [${response.status}] ${endpoint}: ${JSON.stringify(data)}`);
  }

  return data;
}

// Helper to wait for an asynchronous action to complete
async function waitForAction(actionId) {
  if (!actionId) return;
  process.stdout.write(`Waiting for action ${actionId} to complete`);
  while (true) {
    const res = await hcloudApi(`/actions/${actionId}`);
    if (res.action.status === 'success') {
      console.log(` -> ✅ Success`);
      break;
    }
    if (res.action.status === 'error') {
      console.log(` -> ❌ Failed`);
      throw new Error(`Action ${actionId} failed: ${JSON.stringify(res.action.error)}`);
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 1000));
  }
}

// Generate simple Cloud-Init User Data for servers to pre-install Docker
function getUserData(serverName) {
  return `#cloud-config
package_update: true
package_upgrade: true
packages:
  - apt-transport-https
  - ca-certificates
  - curl
  - gnupg
  - lsb-release
  - ufw
  - git

runcmd:
  # Install Docker
  - mkdir -p /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  - apt-get update
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  # Start and enable Docker
  - systemctl enable docker
  - systemctl start docker
  # Setup basic firewall
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp
  - ufw allow from 10.0.0.0/16
  - ufw --force enable
  # Log completion
  - echo "Cloud-init finished on ${serverName}" > /var/log/cloud-init-done.log
`;
}

async function run() {
  console.log('=== Hetzner Cloud Provisioning tool ===');
  console.log(`Action: ${isApply ? 'APPLY (Creating resources)' : 'PLAN (Dry Run)'}`);
  console.log(`Target Location: ${CONFIG.location} (Germany)`);
  console.log(`SSH Key to install: "${CONFIG.sshKeyName}"`);
  console.log('--------------------------------------');

  // Verify connection by fetching locations
  try {
    const locationsResult = await hcloudApi('/locations');
    const validLocation = locationsResult.locations.find(l => l.name === CONFIG.location);
    if (!validLocation) {
      console.error(`Error: Location ${CONFIG.location} is not available.`);
      process.exit(1);
    }
    console.log('✅ Connection to Hetzner Cloud API verified successfully.');
  } catch (error) {
    console.error('❌ Failed to connect to Hetzner Cloud API:', error.message);
    process.exit(1);
  }

  if (!isApply) {
    // Print the Plan and Exit
    console.log('\n--- PROVISIONING PLAN ---');
    console.log(`[1] Network: Create "${CONFIG.networkName}" (${CONFIG.networkRange}) with subnet "${CONFIG.subnetRange}"`);
    console.log(`[2] SSH Key: Register "${CONFIG.sshKeyName}"`);
    console.log(`[3] Firewalls:`);
    console.log(`    - "parking-app-firewall" (Allow SSH port 22, HTTP port 80 public)`);
    console.log(`    - "parking-db-firewall" (Allow SSH port 22 public, block other public ports)`);
    console.log(`[4] Servers to create:`);
    let totalCost = 5.90; // LB11 cost
    for (const server of CONFIG.servers) {
      const cost = server.serverType === 'cpx32' ? 13.99 : 7.99;
      totalCost += cost;
      console.log(`    - "${server.name}" (${server.serverType.toUpperCase()}, ~€${cost}/mo) - Private IP: ${server.privateIp}`);
    }
    console.log(`[5] Load Balancer: Create "${CONFIG.loadBalancer.name}" (${CONFIG.loadBalancer.type.toUpperCase()}, ~€5.90/mo)`);
    console.log(`    - Setup HTTP listener on port 80 forwarding to port 80 on targets`);
    console.log(`    - Set path /api/health for health checks`);
    console.log(`    - Attach "app-1" and "app-2" as targets`);
    console.log('--------------------------------------');
    console.log(`Total Estimated Monthly Cost: ~€${totalCost.toFixed(2)} (plus VAT, hourly billing applies)`);
    console.log('\nNOTE: No resources have been created yet.');
    console.log('To execute this plan, run the command with the --apply flag:');
    console.log('  node scripts/provision-hetzner.js --apply');
    return;
  }

  // --- APPLY MODE ---
  console.log('\nApplying Plan...');

  // 1. Create Network
  console.log(`\nCreating network "${CONFIG.networkName}"...`);
  const networkRes = await hcloudApi('/networks', 'POST', {
    name: CONFIG.networkName,
    ip_range: CONFIG.networkRange,
    subnets: [
      {
        type: 'cloud',
        ip_range: CONFIG.subnetRange,
        network_zone: CONFIG.networkZone
      }
    ]
  });
  const networkId = networkRes.network.id;
  console.log(`✅ Network created. ID: ${networkId}`);

  // 2. Register SSH Key
  console.log(`\nRegistering SSH key "${CONFIG.sshKeyName}"...`);
  let sshKeyId;
  try {
    const sshRes = await hcloudApi('/ssh_keys', 'POST', {
      name: CONFIG.sshKeyName,
      public_key: CONFIG.sshPublicKey
    });
    sshKeyId = sshRes.ssh_key.id;
    console.log(`✅ SSH Key registered. ID: ${sshKeyId}`);
  } catch (err) {
    if (err.message.includes('uniq') || err.message.includes('unique') || err.message.includes('already exists')) {
      console.log('ℹ️ SSH Key already exists. Querying existing keys...');
      const existingKeys = await hcloudApi('/ssh_keys');
      const foundKey = existingKeys.ssh_keys.find(k => k.name === CONFIG.sshKeyName);
      if (foundKey) {
        sshKeyId = foundKey.id;
        console.log(`✅ Found existing SSH Key. ID: ${sshKeyId}`);
      } else {
        throw new Error('Could not find existing SSH key with that name, but creation failed.');
      }
    } else {
      throw err;
    }
  }

  // 3. Create Firewalls
  console.log('\nCreating Firewalls...');
  
  // App Firewall
  const appFirewallRes = await hcloudApi('/firewalls', 'POST', {
    name: 'parking-app-firewall',
    rules: [
      {
        direction: 'in',
        protocol: 'tcp',
        port: '22',
        source_ips: ['0.0.0.0/0', '::/0'],
        description: 'Allow SSH'
      },
      {
        direction: 'in',
        protocol: 'tcp',
        port: '80',
        source_ips: ['0.0.0.0/0', '::/0'],
        description: 'Allow HTTP from LB'
      }
    ]
  });
  const appFirewallId = appFirewallRes.firewall.id;
  console.log(`✅ App Firewall created. ID: ${appFirewallId}`);

  // DB/Supabase Firewall (Only SSH allowed publicly)
  const dbFirewallRes = await hcloudApi('/firewalls', 'POST', {
    name: 'parking-db-firewall',
    rules: [
      {
        direction: 'in',
        protocol: 'tcp',
        port: '22',
        source_ips: ['0.0.0.0/0', '::/0'],
        description: 'Allow SSH'
      }
    ]
  });
  const dbFirewallId = dbFirewallRes.firewall.id;
  console.log(`✅ DB/Supabase Firewall created. ID: ${dbFirewallId}`);

  const firewallIds = {
    'parking-app-firewall': appFirewallId,
    'parking-db-firewall': dbFirewallId
  };

  // 4. Create Servers
  console.log('\nProvisioning Servers (this may take up to a minute)...');
  const createdServers = [];

  for (const serverConf of CONFIG.servers) {
    console.log(`Creating server "${serverConf.name}" (${serverConf.serverType.toUpperCase()})...`);
    
    const firewallId = firewallIds[serverConf.firewall];
    const serverPayload = {
      name: serverConf.name,
      server_type: serverConf.serverType,
      image: serverConf.image,
      location: CONFIG.location,
      ssh_keys: [sshKeyId],
      firewalls: firewallId ? [{ firewall: firewallId }] : [],
      user_data: getUserData(serverConf.name),
      public_net: {
        enable_ipv4: true,
        enable_ipv6: true
      }
    };

    const serverRes = await hcloudApi('/servers', 'POST', serverPayload);
    const serverId = serverRes.server.id;
    const publicIp = serverRes.server.public_net.ipv4.ip;
    console.log(`   - Server created. ID: ${serverId}, Public IP: ${publicIp}`);

    // Wait briefly for server status to transition
    createdServers.push({
      id: serverId,
      name: serverConf.name,
      privateIp: serverConf.privateIp,
      publicIp
    });
  }

  // Wait 10 seconds for servers to initialize before attaching network interfaces
  console.log('\nWaiting for servers to initialize before network attachment...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Attach each server to the private network with the configured static IP
  console.log('\nAttaching servers to private network with static IPs...');
  for (const server of createdServers) {
    console.log(`Attaching "${server.name}" to private network with IP ${server.privateIp}...`);
    try {
      const attachRes = await hcloudApi(`/servers/${server.id}/actions/attach_to_network`, 'POST', {
        network: networkId,
        ip: server.privateIp
      });
      await waitForAction(attachRes.action.id);
      console.log(`   - Attached successfully.`);
    } catch (err) {
      console.error(`   - Failed to attach server ${server.name}:`, err.message);
    }
  }

  // 5. Create Load Balancer
  console.log(`\nCreating Load Balancer "${CONFIG.loadBalancer.name}"...`);
  const lbPayload = {
    name: CONFIG.loadBalancer.name,
    load_balancer_type: CONFIG.loadBalancer.type,
    location: CONFIG.location,
    algorithm: {
      type: 'round_robin'
    },
    services: [
      {
        listen_port: CONFIG.loadBalancer.listenPort,
        destination_port: CONFIG.loadBalancer.destinationPort,
        protocol: 'http',
        proxy_protocol: false,
        health_check: {
          protocol: 'http',
          port: CONFIG.loadBalancer.destinationPort,
          interval: 15,
          timeout: 10,
          retries: 3,
          http: {
            path: '/api/health',
            tls: false,
            status_codes: ['200']
          }
        }
      }
    ]
  };

  const lbRes = await hcloudApi('/load_balancers', 'POST', lbPayload);
  const lbId = lbRes.load_balancer.id;
  const lbPublicIp = lbRes.load_balancer.public_net.ipv4.ip;
  console.log(`✅ Load Balancer created. ID: ${lbId}, Public IP: ${lbPublicIp}`);

  // Attach load balancer to private network
  console.log('\nAttaching Load Balancer to private network...');
  const lbAttachRes = await hcloudApi(`/load_balancers/${lbId}/actions/attach_to_network`, 'POST', {
    network: networkId
  });
  await waitForAction(lbAttachRes.action.id);
  console.log('✅ Attached Load Balancer to network.');

  // Add App servers as load balancer targets
  console.log('\nAdding App nodes as Load Balancer targets...');
  const appServers = createdServers.filter(s => s.name.startsWith('app-'));
  for (const appServer of appServers) {
    console.log(`Adding target server "${appServer.name}" (ID: ${appServer.id}) to Load Balancer...`);
    const targetActionRes = await hcloudApi(`/load_balancers/${lbId}/actions/add_target`, 'POST', {
      type: 'server',
      server: {
        id: appServer.id
      },
      use_private_ip: true
    });
    await waitForAction(targetActionRes.action.id);
    console.log(`   - Target added.`);
  }

  console.log('\n======================================');
  console.log('🎉 PROVISIONING COMPLETED SUCCESSFULLY!');
  console.log('======================================\n');
  console.log('Resources created:');
  console.log(`- Private Network: ID ${networkId} (${CONFIG.networkRange})`);
  console.log(`- Load Balancer: Public IP ${lbPublicIp}`);
  console.log('Servers list:');
  for (const s of createdServers) {
    console.log(`- ${s.name.padEnd(15)} | ID: ${s.id.toString().padEnd(8)} | Public: ${s.publicIp.padEnd(15)} | Private: ${s.privateIp}`);
  }
  console.log('\nNext steps:');
  console.log('1. Wait 2-3 minutes for cloud-init to finish installing Docker on the nodes.');
  console.log('2. SSH into nodes to verify: ssh -i <private_key> ubuntu@<node_public_ip>');
  console.log('3. Save these IPs and configure environment variables in your deployment files.');
}

run().catch(err => {
  console.error('\n❌ Provisioning failed:', err.message);
  process.exit(1);
});
