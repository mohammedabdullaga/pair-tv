// Configuration - HARDCODED API ENDPOINT
const CONFIG = {
    API_BASE: 'https://api.playmetod.store',
    VERSION: '2.0',
};

// Verify API endpoint is correct (for debugging)
if (CONFIG.API_BASE.includes('tv.playmetod.store')) {
    console.error('❌ ERROR: API_BASE is pointing to tv.playmetod.store! It should be api.playmetod.store');
    alert('⚠️ Configuration error detected. Please contact support.');
}

// DOM Elements
const form = document.getElementById('proxyForm');
const pairingCodeInput = document.getElementById('pairingCode');
const proxyHostInput = document.getElementById('proxyHost');
const proxyPortInput = document.getElementById('proxyPort');
const proxyUserInput = document.getElementById('proxyUser');
const proxyPassInput = document.getElementById('proxyPass');
const submitBtn = document.getElementById('submitBtn');
const togglePasswordBtn = document.getElementById('togglePassword');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const loadingMessage = document.getElementById('loadingMessage');
const errorTitle = document.getElementById('errorTitle');
const errorDescription = document.getElementById('errorDescription');

// Toggle password visibility
togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = proxyPassInput.type === 'password';
    proxyPassInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
});

// Format pairing code input (only numbers, auto-format)
pairingCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
});

// Format port input
proxyPortInput.addEventListener('input', (e) => {
    if (e.target.value > 65535) {
        e.target.value = 65535;
    }
    if (e.target.value < 1 && e.target.value !== '') {
        e.target.value = 1;
    }
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!form.checkValidity()) {
        showError('Please fill in all required fields correctly');
        return;
    }

    // Validate pairing code format
    if (pairingCodeInput.value.length !== 6) {
        showError('Pairing code must be exactly 6 digits');
        pairingCodeInput.focus();
        return;
    }

    // Validate port
    const port = parseInt(proxyPortInput.value);
    if (isNaN(port) || port < 1 || port > 65535) {
        showError('Port must be between 1 and 65535');
        proxyPortInput.focus();
        return;
    }

    // Prepare request data
    const requestData = {
        pairing_code: pairingCodeInput.value,
        host: proxyHostInput.value.trim(),
        port: port,
        username: proxyUserInput.value.trim() || null,
        password: proxyPassInput.value.trim() || null
    };

    // Send to backend
    await submitProxyConfiguration(requestData);
});

async function submitProxyConfiguration(data) {
    try {
        // Show loading state
        showLoading();
        submitBtn.disabled = true;

        // Make API request to correct endpoint
        const apiUrl = `${CONFIG.API_BASE}/app/proxy/configure`;
        console.log('📤 Sending request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('📥 Response status:', response.status);

        // Handle response
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success:', result);
            showSuccess();
            
            // Clear form and reset after 3 seconds
            setTimeout(() => {
                form.reset();
                hideMessages();
                submitBtn.disabled = false;
                pairingCodeInput.focus();
            }, 3000);
        } else {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            let errorMsg = error.detail || `HTTP ${response.status}: ${response.statusText}`;
            
            // Provide helpful error messages
            if (response.status === 400) {
                if (errorMsg.includes('Invalid pairing code')) {
                    errorMsg = 'Invalid pairing code. Please check the code on your TV and try again.';
                } else if (errorMsg.includes('expired')) {
                    errorMsg = 'Pairing code has expired. Please get a new code from your TV.';
                }
            } else if (response.status === 404) {
                errorMsg = 'Could not find TV with this pairing code.';
            } else if (response.status === 500) {
                errorMsg = 'Server error. Please try again later.';
            }
            
            showError(errorMsg);
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        let errorMsg = 'Network error. Please check your connection and try again.';
        
        if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Could not reach the server. Make sure you are connected to the internet.';
        }
        
        showError(errorMsg);
        submitBtn.disabled = false;
    }
}

// Message display functions
function showSuccess() {
    hideMessages();
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    loadingMessage.classList.add('hidden');
    scrollToMessage();
}

function showError(message) {
    hideMessages();
    errorDescription.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    loadingMessage.classList.add('hidden');
    scrollToMessage();
}

function showLoading() {
    hideMessages();
    loadingMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    scrollToMessage();
}

function hideMessages() {
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingMessage.classList.add('hidden');
}

function scrollToMessage() {
    setTimeout(() => {
        const activeMessage = document.querySelector('.message:not(.hidden)');
        if (activeMessage) {
            activeMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Focus on pairing code input on page load
document.addEventListener('DOMContentLoaded', () => {
    pairingCodeInput.focus();
    
    // Show browser support message if needed
    if (!navigator.onLine) {
        showError('You are offline. Please check your internet connection.');
    }
    
    // Listen for online/offline events
    window.addEventListener('offline', () => {
        showError('You have gone offline. Please reconnect to the internet.');
    });
    
    window.addEventListener('online', () => {
        hideMessages();
    });
});

// Handle autofill
document.addEventListener('autocomplete', (e) => {
    if (e.target.tagName === 'INPUT') {
        setTimeout(() => {
            e.target.dispatchEvent(new Event('change', { bubbles: true }));
        }, 0);
    }
});

// Prevent form submission on Enter in input fields (except submit button)
['pairingCode', 'proxyHost', 'proxyPort', 'proxyUser', 'proxyPass'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                // Only submit if all fields are valid
                if (form.checkValidity()) {
                    e.preventDefault();
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }
});

// Log version and configuration for debugging
console.log('🎬 Playme Proxy Configuration v' + CONFIG.VERSION);
console.log('✅ API Base:', CONFIG.API_BASE);
console.log('👤 User Agent:', navigator.userAgent);
