import sys
import json
import urllib.request
import urllib.error

def fetch_openapi(url="http://localhost:8000/openapi.json"):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except urllib.error.URLError as e:
        print(f"Error fetching backend documentation from {url}: {e}")
        sys.exit(1)

def main():
    if len(sys.argv) > 1 and sys.argv[1] in ('-h', '--help'):
        print("Usage: python fetch_backend_docs.py [endpoint_path]")
        print("Fetches the OpenAPI documentation from the backend (http://localhost:8000).")
        print("If an endpoint_path is provided (e.g., '/users'), it returns the documentation for that specific endpoint.")
        sys.exit(0)

    docs = fetch_openapi()
    
    if len(sys.argv) > 1:
        path = sys.argv[1]
        paths = docs.get("paths", {})
        if path in paths:
            print(json.dumps({path: paths[path]}, indent=2))
        else:
            print(f"Endpoint '{path}' not found in documentation.")
            print("Available endpoints:")
            for p in paths.keys():
                print(f"  {p}")
            sys.exit(1)
    else:
        print(json.dumps(docs, indent=2))

if __name__ == "__main__":
    main()
