# OAuth Setup Instructions for Deriv App

## Your App Details
- **App Name**: kunstrike97
- **App ID**: 101333
- **Status**: Awaiting OAuth configuration

## Quick Setup with ngrok (Recommended for Testing)

### Step 1: Install ngrok
```powershell
# Download from https://ngrok.com/download
# Or via Chocolatey:
choco install ngrok

# Or download directly and extract to a folder in your PATH
```

### Step 2: Start your local server
```powershell
cd C:\Users\Dell\Downloads\deriv-app
npm run serve core
# Server will run on https://localhost:8443
```

### Step 3: Create ngrok tunnel (in new terminal)
```powershell
ngrok http 8443
```

You'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.3.1
Region                        United States (us)
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:8443
```

### Step 4: Complete OAuth Registration

Use the ngrok HTTPS URL for your OAuth settings:

**Redirect URL**: `https://abc123xyz.ngrok.io/callback`
(Replace `abc123xyz` with your actual ngrok subdomain)

**OAuth Scopes to Select**:
- ✅ **Read** - View account information
- ✅ **Trade** - Execute trades
- ✅ **Trading information** - View trading history
- ✅ **Payments** - Handle deposits/withdrawals
- ❌ **Admin** - Not needed for testing

## Alternative: GitHub Pages (Permanent Free Solution)

If ngrok expires or you want a permanent solution:

### Step 1: Create GitHub Repository
1. Go to GitHub and create a new repository (e.g., `deriv-oauth-callback`)
2. Make it public

### Step 2: Upload callback.html
1. Upload the `github-pages-callback.html` file to your repo
2. Rename it to `index.html`

### Step 3: Enable GitHub Pages
1. Go to Settings → Pages
2. Source: Deploy from branch
3. Branch: main, folder: / (root)
4. Save

### Step 4: Use GitHub Pages URL
Your OAuth redirect URL will be:
`https://[your-github-username].github.io/deriv-oauth-callback/`

Example: `https://kunstrike97.github.io/deriv-oauth-callback/`

## Testing the OAuth Flow

### 1. Update your code with the redirect URL:
```javascript
// In packages/core/src/oauth-login.js
const OAUTH_APP_ID = '101333';
const REDIRECT_URL = 'https://your-ngrok-id.ngrok.io/callback'; // Update this!
```

### 2. Test login flow:
```javascript
// Open browser console at https://localhost:8443 and run:
window.location.href = 'https://oauth.deriv.com/oauth2/authorize?app_id=101333&redirect_uri=' + 
  encodeURIComponent('https://your-ngrok-id.ngrok.io/callback');
```

### 3. After successful OAuth:
The callback page will show your tokens. Copy them and use in your app:
```javascript
localStorage.setItem('deriv_token', 'YOUR_TOKEN_HERE');
localStorage.setItem('deriv_loginid', 'YOUR_LOGINID_HERE');
```

## Important Notes

1. **ngrok URLs change** each time you restart ngrok (unless you have a paid account)
2. **Update the redirect URL** in Deriv's app settings whenever your ngrok URL changes
3. **For production**, you'll need a real domain with HTTPS
4. **Keep your tokens secure** - never commit them to Git

## Troubleshooting

### "Invalid redirect URL" error
- Make sure URL includes `https://` (not http)
- Don't use `localhost` - use ngrok or GitHub Pages
- URL must be publicly accessible

### "App not found" error
- Verify App ID is correct (101333)
- Make sure app is not suspended

### Token not working
- Check if you selected the right scopes
- Ensure you're using a real account (CR) for trading, not virtual (VR)
- Tokens expire - you may need to re-authenticate

## Complete Registration Checklist

For your Deriv app registration form:

- [ ] **App Name**: kunstrike97 ✅
- [ ] **App ID**: 101333 ✅
- [ ] **Redirect URL**: `https://[your-ngrok-id].ngrok.io/callback` (get from ngrok)
- [ ] **Verification URL**: Leave empty
- [ ] **Markup**: 0%
- [ ] **Scopes**: Read, Trade, Trading Information, Payments
- [ ] Click "Save Changes" or "Update"

Once configured, you can start using OAuth authentication!