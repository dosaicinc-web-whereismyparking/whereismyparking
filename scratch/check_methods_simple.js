const { createClient } = require('@supabase/supabase-js');

async function check() {
  const supabase = createClient('http://localhost:54321', 'placeholder');
  const admin = supabase.auth.admin;
  console.log('Available methods on supabase.auth.admin:');
  
  let obj = admin;
  while (obj) {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (typeof admin[prop] === 'function') {
        console.log(' - ' + prop);
      }
    });
    obj = Object.getPrototypeOf(obj);
  }
}

check();
