import os
import sys

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    print("Error: The 'google-auth-oauthlib' library is not installed.")
    print("Please install it by running: pip install google-auth-oauthlib")
    sys.exit(1)

# Scopes required to send emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    # Look for credentials.json in various folders
    possible_paths = [
        'credentials.json',
        'backend/credentials.json',
        '../credentials.json',
        'd:/vue js/Unthinkable/backend/credentials.json'
    ]
    
    credentials_path = None
    for p in possible_paths:
        if os.path.exists(p):
            credentials_path = p
            break
            
    if not credentials_path:
        print("\n[ERROR] credentials.json not found!")
        print("Please follow these steps:")
        print("1. Locate your downloaded OAuth credentials JSON file from Google Cloud.")
        print("2. Copy it into the backend directory: 'd:/vue js/Unthinkable/backend/'")
        print("3. Rename it to 'credentials.json'")
        print(f"4. Re-run this script.\n")
        sys.exit(1)
        
    print(f"Using credentials file: {credentials_path}")
    
    try:
        flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
        # run_local_server will open a web browser for authentication
        # We use 'localhost' (default) to match Google's desktop app redirect URI expectations
        creds = flow.run_local_server(host='localhost', port=0)
        
        print("\n" + "="*50)
        print("   SUCCESS! COPY THESE VALUES TO YOUR .env FILE")
        print("="*50)
        print(f"GMAIL_CLIENT_ID={creds.client_id}")
        print(f"GMAIL_CLIENT_SECRET={creds.client_secret}")
        print(f"GMAIL_REFRESH_TOKEN={creds.refresh_token}")
        print("="*50 + "\n")
        
        # Try to automatically append to .env
        env_path = 'd:/vue js/Unthinkable/backend/.env'
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                content = f.read()
            
            # Check if fields already exist
            updates = []
            if "GMAIL_CLIENT_ID" not in content:
                updates.append(f"GMAIL_CLIENT_ID={creds.client_id}")
            if "GMAIL_CLIENT_SECRET" not in content:
                updates.append(f"GMAIL_CLIENT_SECRET={creds.client_secret}")
            if "GMAIL_REFRESH_TOKEN" not in content:
                updates.append(f"GMAIL_REFRESH_TOKEN={creds.refresh_token}")
                
            if updates:
                with open(env_path, 'a') as f:
                    f.write("\n# Gmail API Authentication Credentials\n" + "\n".join(updates) + "\n")
                print(f"Successfully appended keys directly to your {env_path} file!")
            else:
                print("Gmail keys already existed in your .env. No changes were appended.")
        else:
            print(f"Could not find .env file at {env_path} to auto-write values.")
            
    except Exception as e:
        print(f"\n[ERROR] An error occurred during authentication: {str(e)}")
        print("Please check that your client ID credential type is set to 'Desktop app' in Google Cloud Console.")

if __name__ == '__main__':
    main()
