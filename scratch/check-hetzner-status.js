const token = 'ILsZ7esek0Ql4ceuZA3JCDwhwxFXY7uDmjQUM0LCis4p0MPHipYtyL1NKRymMsRL';

async function hcloudApi(endpoint) {
  const url = `https://api.hetzner.cloud/v1${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

async function run() {
  const nets = await hcloudApi('/networks');
  console.log('--- NETWORKS ---');
  console.log(JSON.stringify(nets, null, 2));

  const servers = await hcloudApi('/servers');
  console.log('--- SERVERS ---');
  servers.servers.forEach(s => {
    console.log(`${s.name} | ID: ${s.id} | Status: ${s.status} | Private IPs:`, s.private_net);
  });
}

run().catch(console.error);
