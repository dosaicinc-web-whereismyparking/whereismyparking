const token = 'ILsZ7esek0Ql4ceuZA3JCDwhwxFXY7uDmjQUM0LCis4p0MPHipYtyL1NKRymMsRL';

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

async function run() {
  console.log('=============================================');
  console.log('🛡️ UPDATING HETZNER CLOUD FIREWALL RULES');
  console.log('=============================================\n');

  // Fetch firewalls
  const fwRes = await hcloudApi('/firewalls');
  const firewalls = fwRes.firewalls;

  for (const fw of firewalls) {
    if (fw.name === 'parking-app-firewall' || fw.name === 'parking-db-firewall') {
      console.log(`Updating rules for firewall: "${fw.name}" (ID: ${fw.id})...`);
      
      const newRules = [
        ...fw.rules, // Keep existing rules (e.g. SSH, HTTP)
        {
          direction: 'in',
          protocol: 'tcp',
          port: 'any',
          source_ips: ['10.0.0.0/16'],
          description: 'Allow TCP from Private Network'
        },
        {
          direction: 'in',
          protocol: 'udp',
          port: 'any',
          source_ips: ['10.0.0.0/16'],
          description: 'Allow UDP from Private Network'
        },
        {
          direction: 'in',
          protocol: 'icmp',
          source_ips: ['10.0.0.0/16'],
          description: 'Allow ICMP from Private Network'
        }
      ];

      // Update firewall rules
      await hcloudApi(`/firewalls/${fw.id}/actions/set_rules`, 'POST', { rules: newRules });
      console.log(`✅ Rules updated successfully for "${fw.name}".`);
    }
  }
  console.log('\nAll firewalls updated successfully!');
}

run().catch(console.error);
