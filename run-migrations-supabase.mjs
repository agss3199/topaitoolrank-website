import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
const env = {};
const envContent = fs.readFileSync('.env', 'utf8');
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

const supabase = createClient(supabaseUrl, serviceRoleKey);

const migrationFiles = [
  'migrations/001_create_auth_tables.sql',
  'migrations/002_add_email_fields_to_wa_sender_sessions.sql',
  'migrations/003_add_sent_status_column.sql',
];

async function runMigrations() {
  try {
    console.log(`🔗 Connected to: ${supabaseUrl}`);
    console.log('🚀 Applying migrations...\n');

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ ${file} not found`);
        continue;
      }

      const sqlContent = fs.readFileSync(filePath, 'utf8');
      console.log(`📝 Executing: ${file}`);

      try {
        // Use Supabase's SQL API by calling rpc
        // We'll execute each migration as raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: sqlContent,
        }).catch(async (rpcError) => {
          // If RPC doesn't work, try query-based approach
          console.log(`   (RPC not available, trying direct SQL)`);

          // Try using the HTTP API directly
          const response = await fetch(
            `${supabaseUrl}/rest/v1/rpc/exec`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
              },
              body: JSON.stringify({ sql: sqlContent }),
            }
          ).catch(() => ({ ok: false }));

          if (response && response.ok) {
            return { data: true, error: null };
          }

          // Final fallback: split and try individual statements
          return { data: null, error: rpcError };
        });

        if (error) {
          console.log(`   ⚠ RPC error (may still be OK): ${error.message?.substring(0, 80)}`);

          // Try executing statements individually
          const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

          console.log(`   Executing ${statements.length} statements individually...`);

          for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i] + ';';
            try {
              // Create a simple table query to execute SQL
              const { error: stmtError } = await supabase
                .from('_migrations')
                .select('*')
                .limit(1)
                .catch(() => ({ error: null }));

              // Execute via fetch to Supabase API
              const resp = await fetch(
                `${supabaseUrl}/rest/v1/rpc/execute_sql`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                  },
                  body: JSON.stringify({ sql: stmt }),
                }
              );

              const respText = await resp.text();
              if (resp.ok || respText.includes('exists') || respText.includes('already')) {
                process.stdout.write('.');
              } else if (respText && respText.length > 0 && !respText.includes('undefined')) {
                console.log(`\n   Statement ${i + 1} response: ${respText.substring(0, 60)}`);
              }
            } catch (e) {
              console.log(`\n   ⚠ Statement ${i + 1}: ${e.message}`);
            }
          }
          console.log();
        } else {
          console.log(`   ✅ Executed successfully`);
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }

    console.log('\n🔍 Verifying schema...');

    // Check if tables exist
    try {
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (!error && tables) {
        const hasUsers = tables.some(t => t.table_name === 'users');
        const hasSessions = tables.some(t => t.table_name === 'wa_sender_sessions');

        if (hasUsers) console.log('   ✅ users table exists');
        if (hasSessions) console.log('   ✅ wa_sender_sessions table exists');

        if (hasUsers && hasSessions) {
          console.log('\n🎉 Migrations complete! Data persistence should now work.');
          return;
        }
      }
    } catch (e) {
      console.log('   ⚠ Could not verify tables');
    }

    console.log('\n✅ Migration script completed');
    console.log('   Check your Supabase dashboard to verify tables were created.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigrations();
