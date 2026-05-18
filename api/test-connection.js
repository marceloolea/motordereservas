require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Supabase...\n');
    
    // Probar conexión listando tablas
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('✅ Conexión exitosa a Supabase!');
    console.log('📊 Tabla "users" accesible');
    console.log('👤 Usuarios encontrados:', data.length);
    
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}

testConnection();
