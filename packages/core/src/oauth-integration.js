/**
 * OAuth Integration for Deriv Third-Party App
 * App Name: kunstrike97
 * App ID: 101333
 */

// Configuration
const CONFIG = {
    APP_ID: '101333',
    OAUTH_URL: 'https://oauth.deriv.com/oauth2/authorize',
    REDIRECT_URL: 'https://39c391c961ce.ngrok-free.app/redirect',
    WS_URL: {
        DEMO: 'wss://blue.derivws.com/websockets/v3',
        REAL: 'wss://green.derivws.com/websockets/v3'
    }
};

// WebSocket instance
let ws = null;
let reconnectTimeout = null;

/**
 * Initiate OAuth login flow
 */
export const initiateLogin = () => {
    // Store current URL to redirect back after login
    sessionStorage.setItem('redirect_url', window.location.pathname);
    
    // Build OAuth URL with required parameters
    const params = new URLSearchParams({
        app_id: CONFIG.APP_ID,
        l: 'en',
        brand: 'deriv',
        redirect_uri: CONFIG.REDIRECT_URL
    });
    
    const oauthUrl = `${CONFIG.OAUTH_URL}?${params.toString()}`;
    console.log('Redirecting to Deriv OAuth:', oauthUrl);
    
    // Redirect to Deriv OAuth page
    window.location.href = oauthUrl;
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = () => {
    const activeLoginId = localStorage.getItem('active_loginid');
    const token = sessionStorage.getItem('active_token');
    return !!(activeLoginId && token);
};

/**
 * Get current account details
 */
export const getCurrentAccount = () => {
    const loginId = localStorage.getItem('active_loginid');
    if (!loginId) return null;
    
    const accounts = JSON.parse(localStorage.getItem('client.accounts') || '{}');
    return accounts[loginId] ? { loginId, ...accounts[loginId] } : null;
};

/**
 * Connect to Deriv WebSocket API
 */
export const connectWebSocket = (onMessage, onError) => {
    const account = getCurrentAccount();
    if (!account) {
        console.error('No active account found');
        if (onError) onError(new Error('No active account'));
        return null;
    }
    
    const token = sessionStorage.getItem('active_token');
    if (!token) {
        console.error('No active token found');
        if (onError) onError(new Error('No active token'));
        return null;
    }
    
    // Determine which WebSocket server to use
    const wsUrl = account.is_virtual ? CONFIG.WS_URL.DEMO : CONFIG.WS_URL.REAL;
    const url = `${wsUrl}?app_id=${CONFIG.APP_ID}&l=en&brand=deriv`;
    
    console.log('Connecting to WebSocket:', url);
    
    // Close existing connection if any
    if (ws) {
        ws.close();
    }
    
    // Create new WebSocket connection
    ws = new WebSocket(url);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Authorize with token
        ws.send(JSON.stringify({
            authorize: token
        }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle authorization response
        if (data.msg_type === 'authorize') {
            if (data.authorize) {
                console.log('Authorized:', data.authorize);
                
                // Get balance
                ws.send(JSON.stringify({
                    balance: 1,
                    subscribe: 1
                }));
                
                // Get account settings
                ws.send(JSON.stringify({
                    get_settings: 1
                }));
            } else if (data.error) {
                console.error('Authorization failed:', data.error);
                if (onError) onError(data.error);
            }
        }
        
        // Pass message to handler
        if (onMessage) onMessage(data);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        
        // Auto-reconnect after 3 seconds
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
            if (isLoggedIn()) {
                console.log('Attempting to reconnect...');
                connectWebSocket(onMessage, onError);
            }
        }, 3000);
    };
    
    return ws;
};

/**
 * Send a message to WebSocket
 */
export const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
    }
    console.error('WebSocket not connected');
    return false;
};

/**
 * Logout user
 */
export const logout = () => {
    // Close WebSocket
    if (ws) {
        ws.close();
        ws = null;
    }
    
    // Clear storage
    const keysToRemove = [
        'client.accounts',
        'client.active_loginid',
        'active_loginid',
        'active_token',
        'oauth_completed'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    // Clear all token keys from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('token_')) {
            sessionStorage.removeItem(key);
        }
    });
    
    // Redirect to home
    window.location.href = '/';
};

/**
 * Get account balance
 */
export const getBalance = (callback) => {
    sendMessage({
        balance: 1,
        subscribe: 1
    });
    
    // Set up one-time listener for balance
    const originalOnMessage = ws.onmessage;
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.msg_type === 'balance') {
            callback(data.balance);
            ws.onmessage = originalOnMessage;
        }
        originalOnMessage(event);
    };
};

// Export all functions
export default {
    initiateLogin,
    isLoggedIn,
    getCurrentAccount,
    connectWebSocket,
    sendMessage,
    logout,
    getBalance,
    CONFIG
};