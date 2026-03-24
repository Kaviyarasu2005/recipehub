
import socket

regions = [
    "ap-south-1",
    "ap-southeast-1",
    "us-east-1",
    "us-west-1",
    "eu-central-1",
    "eu-west-1",
    "ap-northeast-1",
    "ap-southeast-2",
]

project_ref = "ylhjaswvqpesyvmdlneo"

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        addr = socket.gethostbyname(host)
        print(f"Region {region} resolves to {addr}")
    except:
        print(f"Region {region} failed to resolve")
