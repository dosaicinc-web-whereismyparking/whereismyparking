import { supabaseAdmin } from '../src/lib/supabase';


async function checkMethods() {
  if (!supabaseAdmin) {
    console.log('supabaseAdmin not initialized');
    return;
  }
  const admin = supabaseAdmin.auth.admin;
  console.log('GoTrueAdminApi methods:', Object.keys(Object.getPrototypeOf(admin)));
}

checkMethods();
