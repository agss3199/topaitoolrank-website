const fs = require('fs');
const path = require('path');

// Read from .env directly
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE environment variables in .env');
  process.exit(1);
}

console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`);

const migrationFiles = [
  'migrations/001_create_auth_tables.sql',
  'migrations/002_add_email_fields_to_wa_sender_sessions.sql',
  'migrations/003_add_sent_status_column.sql',
];

async function runMigrations() {
  try {
    console.log('🚀 Applying Supabase migrations...\n');

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`📝 Running: ${file}`);

      // Split statements by semicolon and execute each
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      for (const statement of statements) {
        try {
          // Call Supabase SQL API directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ sql: statement + ';' }),
          });

          const responseBody = await response.text();

          // Check for success or "already exists" errors (which are OK)
          if (response.ok || responseBody.includes('already exists') || responseBody.includes('If not exists')) {
            successCount++;
          } else if (responseBody.includes('error')) {
            console.log(`   ⚠ ${statement.substring(0, 60)}...`);
            console.log(`      Error: ${responseBody.substring(0, 100)}`);
          }
        } catch (e) {
          console.log(`   ⚠ Failed to execute: ${statement.substring(0, 60)}...`);
          console.log(`      ${e.message}`);
        }
      }

      console.log(`   ✅ ${file} (${successCount}/${statements.length} statements)`);
    }

    console.log('\n✅ Migration process completed!');
    console.log('   Checking table creation...\n');

    // Verify by checking if tables exist
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/information_schema.tables`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/json',
      },
    });

    if (checkResponse.ok) {
      const tables = await checkResponse.json();
      const usersTbl = tables.find(t => t.table_name === 'users');
      const sessionsTbl = tables.find(t => t.table_name === 'wa_sender_sessions');

      if (usersTbl) console.log('   ✅ Table: users');
      if (sessionsTbl) console.log('   ✅ Table: wa_sender_sessions');

      if (usersTbl && sessionsTbl) {
        console.log('\n🎉 All tables created successfully!');
        console.log('   Your sheet data should now persist on page refresh.');
      }
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();
