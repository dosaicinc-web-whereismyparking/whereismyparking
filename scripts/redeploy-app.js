/**
 * Fast app-only redeploy — rebuilds Docker image on each app node
 * and restarts the container. Skips DB/Supabase setup.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const APP_NODES = [
  { name: 'app-1', ip: '178.105.209.94' }
  // { name: 'app-2', ip: '178.105.223.164' } // Currently unreachable
];

const SSH_KEY = 'C:\\Users\\ACER\\.ssh\\id_ed25519';
const PROJECT_ROOT = path.resolve(__dirname, '..');

function runSsh(ip, cmd) {
  console.log(`[SSH -> ${ip}] ${cmd.substring(0, 100)}...`);
  return execSync(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no root@${ip} "${cmd.replace(/"/g, '\\"')}"`, {
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: 300000
  });
}

function runScpDir(ip, localDir, remotePath) {
  console.log(`[SCP -> ${ip}] Uploading archive...`);
  // Create tar excluding node_modules and .next
  execSync(`tar -czf deploy.tar.gz --exclude=node_modules --exclude=.next --exclude=.git --exclude=deploy.tar.gz .`, {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  execSync(`scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no deploy.tar.gz root@${ip}:~/deploy.tar.gz`, {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  fs.unlinkSync(path.join(PROJECT_ROOT, 'deploy.tar.gz'));
}

// Read existing .env.production from one of the app nodes to reuse
function getEnvFromNode(ip) {
  try {
    return execSync(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no root@${ip} "cat ~/app/.env.production"`, {
      stdio: 'pipe',
      encoding: 'utf8'
    }).trim();
  } catch { return null; }
}

async function redeployNode(node) {
  console.log(`\n========================================`);
  console.log(`Redeploying to ${node.name} (${node.ip})`);
  console.log(`========================================`);

  const envContent = getEnvFromNode(node.ip);

  // Upload new code
  runScpDir(node.ip, PROJECT_ROOT, '~/');
  runSsh(node.ip, 'rm -rf ~/app && mkdir -p ~/app && tar -xzf ~/deploy.tar.gz -C ~/app && rm -f ~/deploy.tar.gz');

  // Restore .env.production
  if (envContent) {
    execSync(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no root@${node.ip} "cat > ~/app/.env.production"`, {
      input: envContent + '\n',
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8'
    });
    console.log('Restored .env.production');
  }

  // Parse NEXT_PUBLIC_ build args from env content
  let buildArgs = '';
  if (envContent) {
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('NEXT_PUBLIC_') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').replace(/'/g, '');
        buildArgs += ` --build-arg ${key}='${val}'`;
      }
    }
  }

  // Rebuild Docker image with build args
  console.log('Building Docker image (may take 1-2 min)...');
  const buildCmd = `cd ~/app && docker build${buildArgs} -t whereismyparking:latest . 2>&1`;
  const buildOutput = runSsh(node.ip, buildCmd);
  const lastLines = buildOutput.split('\n').slice(-10).join('\n');
  console.log(lastLines);

  if (buildOutput.includes('ERROR') || buildOutput.includes('exit code: 1')) {
    throw new Error(`Docker build FAILED on ${node.name}. Aborting to preserve old container.`);
  }

  // Swap container with zero-downtime (start new, stop old)
  runSsh(node.ip, 'docker stop whereismyparking-app || true; docker rm whereismyparking-app || true');
  runSsh(node.ip, [
    'docker run -d',
    '--name whereismyparking-app',
    '--restart always',
    '-p 3000:3000',
    '--env-file ~/app/.env.production',
    'whereismyparking:latest'
  ].join(' '));

  // Sync static assets for Nginx cache proxy to work correctly
  console.log('Syncing Next.js static assets for Nginx...');
  runSsh(node.ip, 'mkdir -p ~/app/.next && docker cp whereismyparking-app:/app/.next/static ~/app/.next/');

  console.log(`✅ ${node.name} redeployed successfully.`);
}

async function purgeCloudflareCache() {
  // Read CF credentials from setup-cloudflare.js constants (source of truth)
  const CF_TOKEN = 'cfut_PnQ1xFWoyQ6YagUm0pS9dHyEvAMDDKYF1WDqZrSPf7b77454';
  const ZONE_ID  = 'bc5bb34362fc41afd02c80de73001192';

  console.log('\n🌐 Purging Cloudflare cache...');
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ purge_everything: true }),
    });
    const data = await res.json();
    if (data.success) {
      console.log('✅ Cloudflare cache purged successfully.');
    } else {
      console.warn('⚠️  Cloudflare cache purge failed:', JSON.stringify(data.errors));
    }
  } catch (err) {
    console.warn('⚠️  Cloudflare cache purge error:', err.message);
  }
}

async function main() {
  console.log('🔄 Fast app redeploy starting...\n');

  // Redeploy both nodes in parallel
  await Promise.all(APP_NODES.map(n => redeployNode(n)));

  // Purge Cloudflare cache after every deploy to prevent stale chunk 404s on mobile/desktop.
  // Stale CF cache entries cause "This page couldn't load" errors after builds change chunk names.
  await purgeCloudflareCache();

  console.log('\n🎉 Both app nodes redeployed!');
  console.log('Waiting 15s for containers to start, then checking health...');
  await new Promise(r => setTimeout(r, 15000));

  for (const node of APP_NODES) {
    try {
      const result = execSync(`ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no root@${node.ip} "curl -s http://localhost:3000/api/health"`, {
        encoding: 'utf8', timeout: 15000
      });
      console.log(`${node.name} health: ${result.trim()}`);
    } catch (e) {
      console.error(`${node.name} health check FAILED:`, e.message);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
