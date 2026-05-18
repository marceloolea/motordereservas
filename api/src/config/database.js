const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Existe' : 'No existe');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Existe' : 'No existe');
  throw new Error('Faltan variables de entorno de Supabase');
}

// Cliente con anon key (respeta RLS - para futuro)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con service role (bypasea RLS - para desarrollo)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, supabaseAdmin };
