// OAuth Login Handler for Third-Party App - kunstrike97
const OAUTH_APP_ID = '101333'; // kunstrike97 app ID
const OAUTH_BASE_URL = 'https://oauth.deriv.com/oauth2/authorize';
// Your ngrok redirect URL (must match what's registered in app.deriv.com)
const REDIRECT_URL = 'https://39c391c961ce.ngrok-free.app/redirect';

// Function to initiate OAuth login
export const initiateOAuthLogin = () => {
    // Build OAuth URL with proper parameters
    const params = new URLSearchParams({
        app_id: OAUTH_APP_ID,
        l: 'en', // language
        brand: 'deriv',
        redirect_uri: REDIRECT_URL,
        state: Date.now().toString() // Simple state for CSRF protection
    });

    const oauthUrl = `${OAUTH_BASE_URL}?${params.toString()}`;
    
    console.log('Redirecting to OAuth URL:', oauthUrl);
    
    // Redirect to OAuth login
    window.location.href = oauthUrl;
};

// Function to handle OAuth callback
export const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const accounts = [];
    
    // Extract all accounts from URL parameters
    let i = 1;
    while (urlParams.has(`acct${i}`)) {
        accounts.push({
            loginid: urlParams.get(`acct${i}`),
            token: urlParams.get(`token${i}`),
            currency: urlParams.get(`cur${i}`),
            is_virtual: urlParams.get(`acct${i}`).startsWith('VR') ? 1 : 0
        });
        i++;
    }
    
    if (accounts.length > 0) {
        // Store accounts in localStorage (Deriv's expected format)
        const accountsObj = {};
        accounts.forEach(acc => {
            accountsObj[acc.loginid] = {
                token: acc.token,
                currency: acc.currency,
                is_virtual: acc.is_virtual
            };
        });
        
        localStorage.setItem('client.accounts', JSON.stringify(accountsObj));
        
        // Set the first real account as active, or virtual if no real account
        const realAccount = accounts.find(acc => !acc.is_virtual);
        const activeAccount = realAccount || accounts[0];
        
        if (activeAccount) {
            localStorage.setItem('client.active_loginid', activeAccount.loginid);
            localStorage.setItem('client.active_token', activeAccount.token);
            
            // Set authorization token for WebSocket
            sessionStorage.setItem('client.token', activeAccount.token);
            
            return {
                success: true,
                accounts: accounts,
                activeAccount: activeAccount
            };
        }
    }
    
    return {
        success: false,
        error: 'No accounts found in OAuth response'
    };
};

// Function to check if user is logged in
export const isLoggedIn = () => {
    const token = localStorage.getItem('client.active_token') || sessionStorage.getItem('client.token');
    return !!token;
};

// Function to get current token
export const getCurrentToken = () => {
    return localStorage.getItem('client.active_token') || sessionStorage.getItem('client.token');
};

// Function to logout
export const logout = () => {
    // Clear all auth-related storage
    const keysToRemove = [
        'client.accounts',
        'client.active_loginid', 
        'client.active_token',
        'client.token',
        'deriv_accounts',
        'deriv_oauth_tokens',
        'current_loginid'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    // Redirect to home
    window.location.href = '/';
};

export default {
    initiateOAuthLogin,
    handleOAuthCallback,
    isLoggedIn,
    getCurrentToken,
    logout
};