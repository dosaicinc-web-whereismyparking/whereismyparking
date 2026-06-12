const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Production Environment Config
const DEPLOY_CONFIG = {
  dbPrimaryIp: '49.12.37.22',
  supabaseNodeIp: '178.104.191.198',
  appNodes: ['178.105.209.94', '178.105.223.164'],
  postgresPassword: process.env.POSTGRES_PASSWORD,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  authSalt: process.env.AUTH_SALT,
  adminWhitelistedMobiles: '+919446976393',
  loadBalancerIp: '91.98.222.135'
};

// SSH commands executor
function runSsh(ip, command, stdinData = null) {
  const sshKeyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'id_ed25519');
  
  // StrictHostKeyChecking=no ignores unknown host key warnings
  const baseCmd = `ssh -i "${sshKeyPath}" -o StrictHostKeyChecking=no root@${ip}`;
  
  console.log(`[SSH -> ${ip}] Executing: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
  
  if (stdinData) {
    // Write data to a temp file and feed it to stdin
    const tempFile = path.join(__dirname, `temp_stdin_${ip}.txt`);
    fs.writeFileSync(tempFile, stdinData);
    try {
      const output = execSync(`${baseCmd} "${command.replace(/"/g, '\\"')}" < "${tempFile}"`, { encoding: 'utf8' });
      fs.unlinkSync(tempFile);
      return output;
    } catch (err) {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      throw err;
    }
  } else {
    return execSync(`${baseCmd} "${command}"`, { encoding: 'utf8' });
  }
}

// SCP files upload
function runScp(ip, localFile, remoteFile) {
  const sshKeyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'id_ed25519');
  console.log(`[SCP -> ${ip}] Uploading: ${path.basename(localFile)} to ${remoteFile}`);
  return execSync(`scp -i "${sshKeyPath}" -o StrictHostKeyChecking=no "${localFile}" root@${ip}:${remoteFile}`, { encoding: 'utf8' });
}

async function deploy() {
  console.log('=============================================');
  console.log('🚀 STARTING AUTONOMOUS HETZNER STACK DEPLOYMENT');
  console.log('=============================================\n');

  // ---------------------------------------------------------------------------
  // STEP 1: CONFIGURE db-primary
  // ---------------------------------------------------------------------------
  console.log('--- Step 1: Configuring db-primary (Postgres + PostGIS) ---');
  
  // Start Postgres container
  const pgStartCmd = `docker pull supabase/postgres:15.14.1.129 && docker rm -f postgres || true && docker volume rm pgdata || true && docker run -d --name postgres -v pgdata:/var/lib/postgresql/data -e POSTGRES_PASSWORD=${DEPLOY_CONFIG.postgresPassword} -p 5432:5432 --restart always supabase/postgres:15.14.1.129`;
  runSsh(DEPLOY_CONFIG.dbPrimaryIp, pgStartCmd);
  console.log('✅ Postgres container started on db-primary.');

  // Wait for database to be ready and initialize schemas
  console.log('Waiting 45 seconds for database to start and initialize schemas...');
  await new Promise(r => setTimeout(r, 45000));

  // Collect migration SQLs in order
  console.log('Reading migration files...');
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let combinedSql = '';
  for (const file of migrationFiles) {
    console.log(`   - Adding ${file}`);
    combinedSql += fs.readFileSync(path.join(migrationsDir, file), 'utf8') + '\n';
  }

  // Apply migrations
  console.log('Applying SQL migrations on db-primary...');
  runSsh(DEPLOY_CONFIG.dbPrimaryIp, `docker exec -i postgres psql -U postgres`, combinedSql);
  console.log('✅ SQL migrations applied successfully.');

  // ---------------------------------------------------------------------------
  // STEP 2: CONFIGURE supabase-node
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 2: Configuring supabase-node ---');
  
  // Create supabase config directory
  runSsh(DEPLOY_CONFIG.supabaseNodeIp, 'mkdir -p ~/supabase');

  // Upload docker-compose.prod.yml
  const localProdCompose = path.join(__dirname, '..', 'supabase', 'docker-compose.prod.yml');
  runScp(DEPLOY_CONFIG.supabaseNodeIp, localProdCompose, '~/supabase/docker-compose.yml');

  // Create .env content
  const supabaseEnv = `
POSTGRES_PASSWORD=${DEPLOY_CONFIG.postgresPassword}
JWT_SECRET=${DEPLOY_CONFIG.jwtSecret}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${DEPLOY_CONFIG.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${DEPLOY_CONFIG.serviceKey}
SUPABASE_API_URL=http://10.0.0.3:54321
GOTRUE_SITE_URL=http://${DEPLOY_CONFIG.loadBalancerIp}
  `.trim();

  runSsh(DEPLOY_CONFIG.supabaseNodeIp, 'cat > ~/supabase/.env', supabaseEnv);
  console.log('✅ Env file and compose config uploaded to supabase-node.');

  // Launch Supabase containers
  console.log('Launching Supabase services on supabase-node...');
  runSsh(DEPLOY_CONFIG.supabaseNodeIp, 'cd ~/supabase && docker compose down && docker compose pull && docker compose up -d');
  console.log('✅ Supabase services launched successfully.');

  // ---------------------------------------------------------------------------
  // STEP 3: CONFIGURE APP NODES
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 3: Packing & Building App Nodes (app-1, app-2) ---');
  
  // Package codebase locally into deploy.tar.gz
  const tarFile = path.join(__dirname, '..', 'deploy.tar.gz');
  console.log('Creating codebase package tarball (deploy.tar.gz)...');
  if (fs.existsSync(tarFile)) fs.unlinkSync(tarFile);
  
  execSync(`tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude="deploy.tar.gz" -czf "${tarFile}" .`, {
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Codebase package created.');

  // Build Env production string for Next.js build-time variables
  const nextEnv = `
DATABASE_URL=postgresql://postgres:${DEPLOY_CONFIG.postgresPassword}@10.0.0.2:5432/postgres?sslmode=disable
NEXT_PUBLIC_SUPABASE_URL=http://10.0.0.3:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=${DEPLOY_CONFIG.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${DEPLOY_CONFIG.serviceKey}
SUPABASE_JWT_SECRET=${DEPLOY_CONFIG.jwtSecret}
SUPABASE_INTERNAL_URL=http://10.0.0.3:54321
SUPABASE_AUTH_URL=http://10.0.0.3:9999
NEXT_PUBLIC_DEV_BYPASS_AUTH=false
AUTH_SALT=${DEPLOY_CONFIG.authSalt}
ADMIN_WHITELISTED_MOBILES=${DEPLOY_CONFIG.adminWhitelistedMobiles}
NEXT_PUBLIC_MAP_PROVIDER=maplibre
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
  `.trim();

  // Deploy to each app server
  for (const appIp of DEPLOY_CONFIG.appNodes) {
    console.log(`\nDeploying to App Server: ${appIp}`);
    
    // Install Nginx if missing
    console.log('   - Ensuring Nginx is installed...');
    runSsh(appIp, 'apt-get update && apt-get install -y nginx');

    // Upload Nginx config
    console.log('   - Configuring Nginx reverse proxy...');
    const localNginxConf = path.join(__dirname, '..', 'nginx', 'nginx.conf');
    const remoteNginxConf = '/etc/nginx/sites-available/whereismyparking';
    
    // Write config file via pipe
    const nginxContent = fs.readFileSync(localNginxConf, 'utf8');
    runSsh(appIp, `tee ${remoteNginxConf} > /dev/null`, nginxContent);

    // Symlink and restart nginx
    const nginxReloadCmd = `ln -sf ${remoteNginxConf} /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default && systemctl restart nginx`;
    runSsh(appIp, nginxReloadCmd);
    console.log('   - Nginx configured and restarted.');

    // Upload Codebase Tarball
    runScp(appIp, tarFile, '~/deploy.tar.gz');

    // Extract codebase
    console.log('   - Extracting codebase...');
    const extractCmd = `rm -rf ~/app && mkdir -p ~/app && tar -xzf ~/deploy.tar.gz -C ~/app && rm -f ~/deploy.tar.gz`;
    runSsh(appIp, extractCmd);

    // Write production env file before docker build (crucial for build-time vars)
    console.log('   - Writing production .env.production file...');
    runSsh(appIp, 'cat > ~/app/.env.production', nextEnv);

    // Build and run Next.js Docker container
    console.log('   - Building Next.js Docker image (this takes ~1-2 mins)...');
    const buildCmd = `docker pull node:20-alpine && cd ~/app && docker build --build-arg NEXT_PUBLIC_SUPABASE_URL=http://10.0.0.3:54321 --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=${DEPLOY_CONFIG.anonKey} --build-arg NEXT_PUBLIC_MAP_PROVIDER=maplibre --build-arg NEXT_PUBLIC_MAPLIBRE_STYLE_URL=https://tiles.openfreemap.org/styles/liberty -t whereismyparking . && docker rm -f whereismyparking-app || true && docker run -d --name whereismyparking-app -p 3000:3000 --env-file ~/app/.env.production --restart always whereismyparking`;
    runSsh(appIp, buildCmd);
    console.log(`✅ App container launched successfully on ${appIp}.`);
  }

  // Clean up local tarball
  if (fs.existsSync(tarFile)) fs.unlinkSync(tarFile);

  console.log('\n=============================================');
  console.log('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
  console.log(`Load Balancer IP: http://${DEPLOY_CONFIG.loadBalancerIp}`);
  console.log(`App Node 1: http://${DEPLOY_CONFIG.appNodes[0]}`);
  console.log(`App Node 2: http://${DEPLOY_CONFIG.appNodes[1]}`);
  console.log(`Supabase API (GoTrue/PostgREST): http://${DEPLOY_CONFIG.supabaseNodeIp}:54321`);
  console.log('\nDeployment validation:');
  console.log(`Run health check: curl http://${DEPLOY_CONFIG.loadBalancerIp}/api/health`);
}

deploy().catch(err => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});
