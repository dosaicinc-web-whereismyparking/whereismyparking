const token = process.env.HCLOUD_TOKEN || 'ILsZ7esek0Ql4ceuZA3JCDwhwxFXY7uDmjQUM0LCis4p0MPHipYtyL1NKRymMsRL';

async function hcloudApi(endpoint, method = 'GET') {
  const url = `https://api.hetzner.cloud/v1${endpoint}`;
  const headers = { 'Authorization': `Bearer ${token}` };
  const response = await fetch(url, { method, headers });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`API Error [${response.status}] ${endpoint}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function cleanup() {
  console.log('=== Cleaning up Hetzner resources ===');
  
  // 1. Get resources
  const serversData = await hcloudApi('/servers');
  const networksData = await hcloudApi('/networks');
  const firewallsData = await hcloudApi('/firewalls');
  const lbsData = await hcloudApi('/load_balancers');

  const targetServers = serversData.servers.filter(s => ['db-primary', 'supabase-node', 'app-1', 'app-2'].includes(s.name));
  const targetNetworks = networksData.networks.filter(n => n.name === 'parking-net');
  const targetFirewalls = firewallsData.firewalls.filter(f => ['parking-app-firewall', 'parking-db-firewall'].includes(f.name));
  const targetLBs = lbsData.load_balancers.filter(l => l.name === 'parking-lb');

  // Delete LBs
  for (const lb of targetLBs) {
    console.log(`Deleting Load Balancer ${lb.name} (${lb.id})...`);
    await hcloudApi(`/load_balancers/${lb.id}`, 'DELETE');
    console.log('✅ Deleted Load Balancer.');
  }

  // Delete Servers
  for (const server of targetServers) {
    console.log(`Deleting Server ${server.name} (${server.id})...`);
    await hcloudApi(`/servers/${server.id}`, 'DELETE');
    console.log('✅ Deleted Server.');
  }

  if (targetServers.length > 0) {
    console.log('Waiting for servers to be fully removed (10s)...');
    await new Promise(r => setTimeout(r, 10000));
  }

  // Delete Networks
  for (const net of targetNetworks) {
    console.log(`Deleting Network ${net.name} (${net.id})...`);
    try {
      await hcloudApi(`/networks/${net.id}`, 'DELETE');
      console.log('✅ Deleted Network.');
    } catch (err) {
      console.error(`❌ Failed to delete network: ${err.message}`);
    }
  }

  // Delete Firewalls
  for (const fw of targetFirewalls) {
    console.log(`Deleting Firewall ${fw.name} (${fw.id})...`);
    await hcloudApi(`/firewalls/${fw.id}`, 'DELETE');
    console.log('✅ Deleted Firewall.');
  }

  console.log('=== Cleanup complete! ===');
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
