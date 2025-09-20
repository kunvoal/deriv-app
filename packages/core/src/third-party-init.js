/**
 * Third-Party OAuth Initializer
 * This module integrates OAuth tokens from third-party login with the main Deriv app
 */

// Check if we have OAuth tokens from third-party login
export const initThirdPartyAuth = () => {
    console.log('[Third-Party] Checking for OAuth tokens...');
    
    // Get tokens from localStorage (set by OAuth redirect)
    const activeLoginId = localStorage.getItem('active_loginid');
    const accounts = JSON.parse(localStorage.getItem('client.accounts') || '{}');
    const oauthResponse = JSON.parse(localStorage.getItem('oauth_response') || '{}');
    
    if (activeLoginId && accounts[activeLoginId]) {
        console.log('[Third-Party] Found OAuth tokens for:', activeLoginId);
        
        const account = accounts[activeLoginId];
        const token = account.token;
        
        // Store tokens in sessionStorage for the app to use
        sessionStorage.setItem('active_token', token);
        sessionStorage.setItem('active_loginid', activeLoginId);
        sessionStorage.setItem(`token_${activeLoginId}`, token);
        
        // Set the app_id for WebSocket connections
        localStorage.setItem('config.app_id', '101333');
        
        // Mark as third-party authenticated
        sessionStorage.setItem('third_party_auth', 'true');
        sessionStorage.setItem('oauth_completed', 'true');
        
        console.log('[Third-Party] OAuth initialization complete');
        
        return {
            isAuthenticated: true,
            loginId: activeLoginId,
            token: token,
            accounts: accounts,
            isVirtual: account.is_virtual === 1
        };
    }
    
    console.log('[Third-Party] No OAuth tokens found');
    return {
        isAuthenticated: false
    };
};

// Connect to WebSocket with OAuth token
export const connectWithOAuthToken = (onMessage, onError) => {
    const auth = initThirdPartyAuth();
    
    if (!auth.isAuthenticated) {
        console.error('[Third-Party] Not authenticated, cannot connect WebSocket');
        if (onError) onError(new Error('Not authenticated'));
        return null;
    }
    
    // Choose server based on account type
    const wsUrl = auth.isVirtual 
        ? 'wss://blue.derivws.com/websockets/v3'
        : 'wss://green.derivws.com/websockets/v3';
    
    // For third-party apps with tokens, don't include app_id in URL
    const url = `${wsUrl}?l=EN&brand=deriv`;
    
    console.log('[Third-Party] Connecting to WebSocket:', url);
    
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
        console.log('[Third-Party] WebSocket connected, sending authorize...');
        
        // Send authorization with token
        ws.send(JSON.stringify({
            authorize: auth.token
        }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.msg_type === 'authorize') {
            if (data.authorize) {
                console.log('[Third-Party] Authorized successfully:', data.authorize.loginid);
                
                // Subscribe to balance
                ws.send(JSON.stringify({
                    balance: 1,
                    subscribe: 1
                }));
                
                // Get account settings
                ws.send(JSON.stringify({
                    get_settings: 1
                }));
                
                // Get trading times
                ws.send(JSON.stringify({
                    trading_times: new Date().toISOString().split('T')[0]
                }));
            } else if (data.error) {
                console.error('[Third-Party] Authorization failed:', data.error);
            }
        }
        
        if (onMessage) onMessage(data);
    };
    
    ws.onerror = (error) => {
        console.error('[Third-Party] WebSocket error:', error);
        if (onError) onError(error);
    };
    
    ws.onclose = () => {
        console.log('[Third-Party] WebSocket disconnected');
    };
    
    return ws;
};

// Check if running as third-party app
export const isThirdPartyMode = () => {
    return localStorage.getItem('config.app_id') === '101333' ||
           localStorage.getItem('third_party.app_id') === '101333' ||
           sessionStorage.getItem('third_party_auth') === 'true';
};

// Export for use in main app
export default {
    initThirdPartyAuth,
    connectWithOAuthToken,
    isThirdPartyMode
};