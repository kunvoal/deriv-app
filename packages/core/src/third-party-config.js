// Third-Party OAuth Configuration for kunstrike97
// This file configures the app to work as a third-party client instead of internal Deriv app

/**
 * IMPORTANT: This configuration is for third-party development.
 * It bypasses internal Deriv staging servers and uses public OAuth endpoints.
 */

// Your registered App ID from app.deriv.com
export const THIRD_PARTY_APP_ID = '101333'; // Replace with your actual App ID

// OAuth Configuration
export const OAUTH_CONFIG = {
    // Use the public OAuth URL instead of staging
    oauth_url: 'https://oauth.deriv.com/oauth2/authorize',
    
    // Your redirect URL (must match what's registered in your app)
    redirect_url: 'https://39c391c961ce.ngrok-free.app/redirect',
    
    // Alternative redirect URLs for testing
    redirect_urls: {
        local: 'https://local.kunstrike97.com:8443/redirect',
        localhost: 'https://localhost:8443/redirect',
        ngrok: 'https://39c391c961ce.ngrok-free.app/redirect',
        production: 'https://kunstrike97.com/callback' // Your future production URL
    }
};

// WebSocket Configuration
export const WS_CONFIG = {
    // Use production WebSocket servers for third-party access
    server_url: 'green.derivws.com', // For real accounts
    demo_server_url: 'blue.derivws.com', // For demo accounts
};

// Override the internal getAppId function
export const getThirdPartyAppId = () => {
    // Check if we have a custom app_id in localStorage for testing
    const custom_app_id = localStorage.getItem('third_party.app_id');
    if (custom_app_id) return custom_app_id;
    
    // Return your registered App ID
    return THIRD_PARTY_APP_ID;
};

// Override the OAuth URL generation
export const getThirdPartyOAuthUrl = (params = {}) => {
    const {
        language = 'en',
        brand = 'deriv',
        redirect_uri = OAUTH_CONFIG.redirect_url
    } = params;
    
    const url_params = new URLSearchParams({
        app_id: getThirdPartyAppId(),
        l: language,
        brand: brand,
        redirect_uri: redirect_uri,
        state: Date.now().toString() // Simple CSRF protection
    });
    
    // Add any marketing parameters if they exist
    const signup_device = getCookie('signup_device');
    const date_first_contact = getCookie('date_first_contact');
    
    if (signup_device) url_params.append('signup_device', signup_device);
    if (date_first_contact) url_params.append('date_first_contact', date_first_contact);
    
    return `${OAUTH_CONFIG.oauth_url}?${url_params.toString()}`;
};

// Helper function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Export configuration checker
export const isThirdPartyMode = () => {
    // Check if we're running in third-party mode
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    const isNgrok = window.location.hostname.includes('ngrok');
    const isNotDerivDomain = !window.location.hostname.includes('deriv.com') &&
                             !window.location.hostname.includes('deriv.me') &&
                             !window.location.hostname.includes('deriv.be');
    
    return isLocalhost || isNgrok || isNotDerivDomain;
};

// WebSocket URL override for third-party
export const getThirdPartyWebSocketURL = (is_real_account = false) => {
    const server = is_real_account ? WS_CONFIG.server_url : WS_CONFIG.demo_server_url;
    return `wss://${server}/websockets/v3?app_id=${getThirdPartyAppId()}&l=en&brand=deriv`;
};

// Export all configurations
export default {
    THIRD_PARTY_APP_ID,
    OAUTH_CONFIG,
    WS_CONFIG,
    getThirdPartyAppId,
    getThirdPartyOAuthUrl,
    isThirdPartyMode,
    getThirdPartyWebSocketURL
};