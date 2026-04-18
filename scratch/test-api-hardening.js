async function testNearbyHardening() {
  const cases = [
    { name: 'Invalid Lat', url: 'http://localhost:3000/api/parking/nearby?lat=91&lng=72.8' },
    { name: 'Invalid Lng', url: 'http://localhost:3000/api/parking/nearby?lat=19&lng=181' },
    { name: 'Out of India Lat', url: 'http://localhost:3000/api/parking/nearby?lat=45&lng=72.8' },
    { name: 'Out of India Lng', url: 'http://localhost:3000/api/parking/nearby?lat=19&lng=60' },
    { name: 'Valid India', url: 'http://localhost:3000/api/parking/nearby?lat=19.076&lng=72.877' }
  ];

  for (const c of cases) {
    try {
      const res = await fetch(c.url);
      const data = await res.json();
      console.log(`[${c.name}] Status: ${res.status}, Error: ${data.error || 'None'}`);
    } catch (e) {
      console.log(`[${c.name}] Fetch failed: ${e.message}`);
    }
  }
}

testNearbyHardening();
