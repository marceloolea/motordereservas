const supabase = require('./database');

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

module.exports = testConnection;