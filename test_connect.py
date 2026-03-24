
import psycopg2
import sys

regions = [
    "ap-south-1",
    "ap-southeast-1",
    "us-east-1",
    "eu-central-1",
]

project_ref = "ylhjaswvqpesyvmdlneo"
password = "Admin@recipehub7"

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    user = f"postgres.{project_ref}"
    print(f"Trying region {region}...")
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port="5432",
            connect_timeout=5
        )
        print(f"SUCCESS in {region}!")
        conn.close()
        sys.exit(0)
    except Exception as e:
        msg = str(e)
        if "Tenant or user not found" in msg:
            print(f"Region {region}: Tenant NOT found")
        elif "authentication failed" in msg:
            print(f"Region {region}: Tenant FOUND, but password failed")
        else:
            print(f"Region {region}: Other error: {msg}")
