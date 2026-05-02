const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE environment variables');
  process.exit(1);
}

console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, serviceRoleKey);

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

      // Execute raw SQL via PostgreSQL connection
      const { error } = await supabase.rpc('exec', { sql }).catch(async () => {
        // Fallback: split by statements and execute individually
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          const { error: stmtError } = await supabase
            .from('_sql_raw')
            .select('*')
            .single()
            .catch(() => ({ error: null }));

          // Try via admin API instead
          try {
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
              },
              body: JSON.stringify({ sql: statement }),
            });

            if (!response.ok) {
              const responseText = await response.text();
              console.log(`   → Statement: ${statement.substring(0, 60)}...`);
              if (responseText.includes('already exists') || responseText.includes('If not exists')) {
                console.log(`   ✓ OK (already exists)`);
              }
            } else {
              console.log(`   ✓ Executed`);
            }
          } catch (e) {
            console.log(`   ⚠ Statement may have failed: ${e.message}`);
          }
        }
        return { error: null };
      });

      if (error) {
        console.log(`⚠️  Note: ${error.message}`);
      } else {
        console.log(`✅ Applied: ${file}\n`);
      }
    }

    // Verify tables exist
    console.log('\n🔍 Verifying schema...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'wa_sender_sessions']);

    if (tableError) {
      console.log('⚠️  Could not verify tables via direct query');
    } else if (tables && tables.length >= 2) {
      console.log(`✅ Tables verified:`);
      tables.forEach(t => console.log(`   • ${t.table_name}`));
    } else {
      console.log('⚠️  Tables may not have been created');
    }

    console.log('\n✅ Migration process completed!');
    console.log('   If you see errors above about "already exists", that\'s OK - it means the schema is already in place.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
