#!/usr/bin/env python3
import os
import sys
import psycopg2
import re

# Load .env file
env = {}
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, *value_parts = line.split('=')
                env[key.strip()] = '='.join(value_parts).strip()

supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
service_role_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not service_role_key:
    print("❌ Missing SUPABASE environment variables in .env")
    sys.exit(1)

# Extract project ID and region from Supabase URL
# URL format: https://[project-ref].supabase.co
match = re.search(r'https://([a-z0-9]+)\.supabase\.co', supabase_url)
if not match:
    print("❌ Invalid Supabase URL format")
    sys.exit(1)

project_ref = match.group(1)

# Supabase PostgreSQL connection details
# Default port: 5432
# Database: postgres
# User: postgres
# Password is in the service role JWT, but we need the actual postgres password
# Actually, let me try using psql with the connection string

print(f"🔗 Connecting to Supabase PostgreSQL (project: {project_ref})")
print(f"   URL: {supabase_url}")

# Try to connect using Supabase's PostgreSQL endpoint
# For Supabase, the connection string is:
# postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# We don't have the postgres password, but we can try connecting without it
# or using the service role key's decoded info

try:
    from jwt import decode as jwt_decode

    # Decode the service role JWT to get potential info
    decoded = jwt_decode(service_role_key, options={"verify_signature": False})
    print(f"   Service role decoded: role={decoded.get('role')}")
except Exception as e:
    print(f"   Could not decode JWT: {e}")

print("\n⚠️  Direct PostgreSQL connection requires database password")
print("    which is not available in the .env file.")
print("\n📋 ALTERNATIVE: Please manually apply migrations via Supabase Dashboard\n")
print("   See: MIGRATION_INSTRUCTIONS.md\n")
print("   Steps:")
print("   1. Go to https://app.supabase.com")
print("   2. Select project: tdedjksugbqgkxsrzzjo")
print("   3. SQL Editor → New Query")
print("   4. Copy-paste each migration file and run\n")
