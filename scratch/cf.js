const token = '***REMOVED-CF-TOKEN***';
async function run() {
  const res = await fetch('https://api.cloudflare.com/client/v4/zones', {
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (data.success) {
    data.result.forEach(z => console.log(z.name, z.id));
  } else {
    console.error(data.errors);
  }
}
run();
