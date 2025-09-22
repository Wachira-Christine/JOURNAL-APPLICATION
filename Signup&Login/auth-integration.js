// Enhanced authentication integration for the login page
// Add this to your existing script.js or create a separate auth-integration.js file

// API configuration
const API_BASE_URL = 'http://localhost:3000/api/auth'; // Adjust based on your backend URL

// Auth state management
let authState = {
    isAuthenticated: false,
    user: null,
    sessionId: null,
    requiresVerification: false,
    pendingVerificationEmail: null
};

// Enhanced form submission handlers
async function handleLogin(data) {
    try {
        showLoadingState(true);

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            if (result.requiresVerification) {
                // User needs to verify email
                authState.requiresVerification = true;
                authState.pendingVerificationEmail = data.email;
                showOTPVerificationForm();
                showNotification('Please verify your email with the OTP sent to you.', 'info');
            } else {
                // Successful login
                handleAuthSuccess(result);
            }
        } else {
            throw new Error(result.error || 'Login failed');
        }

    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        showLoadingState(false);
    }
}

async function handleSignup(data) {
    try {
        showLoadingState(true);

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Registration successful, show OTP verification
            authState.requiresVerification = true;
            authState.pendingVerificationEmail = data.email;
            showOTPVerificationForm();
            showNotification('Registration successful! Please verify your email with the OTP sent to you.', 'success');
        } else {
            throw new Error(result.error || 'Registration failed');
        }

    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        showLoadingState(false);
    }
}

async function handleOTPVerification(otpCode, email = authState.pendingVerificationEmail, otpType = 'EMAIL_VERIFICATION') {
    try {
        showLoadingState(true);

        const response = await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                otpCode: otpCode,
                otpType: otpType
            })
        });

        const result = await response.json();

        if (response.ok) {
            handleAuthSuccess(result);
        } else {
            throw new Error(result.error || 'OTP verification failed');
        }

    } catch (error) {
        console.error('OTP verification error:', error);
        showNotification(error.message || 'OTP verification failed. Please try again.', 'error');
    } finally {
        showLoadingState(false);
    }
}

async function handleResendOTP(email = authState.pendingVerificationEmail, otpType = 'EMAIL_VERIFICATION') {
    try {
        showLoadingState(true);

        const response = await fetch(`${API_BASE_URL}/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                otpType: otpType
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('OTP sent successfully!', 'success');
        } else {
            throw new Error(result.error || 'Failed to resend OTP');
        }

    } catch (error) {
        console.error('Resend OTP error:', error);
        showNotification(error.message || 'Failed to resend OTP. Please try again.', 'error');
    } finally {
        showLoadingState(false);
    }
}

async function handleForgotPassword() {
    const email = emailInput.value.trim();

    if (!email) {
        showNotification('Please enter your email address first.', 'warning');
        emailInput.focus();
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
    }

    try {
        showLoadingState(true);

        const response = await fetch(`${API_BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (response.ok) {
            // Show password reset form
            authState.pendingVerificationEmail = email;
            showPasswordResetForm();
            showNotification('If the email exists, a password reset OTP has been sent.', 'info');
        } else {
            throw new Error(result.error || 'Failed to send password reset OTP');
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        showNotification(error.message || 'Failed to process password reset request.', 'error');
    } finally {
        showLoadingState(false);
    }
}

async function handlePasswordReset(otpCode, newPassword, email = authState.pendingVerificationEmail) {
    try {
        showLoadingState(true);

        const response = await fetch(`${API_BASE_URL}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                otpCode: otpCode,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Password reset successfully! You can now log in with your new password.', 'success');
            hidePasswordResetForm();
            switchToLogin();
            emailInput.value = email; // Pre-fill email
        } else {
            throw new Error(result.error || 'Password reset failed');
        }

    } catch (error) {
        console.error('Password reset error:', error);
        showNotification(error.message || 'Password reset failed. Please try again.', 'error');
    } finally {
        showLoadingState(false);
    }
}

// UI management functions
function showOTPVerificationForm() {
    const otpModal = createOTPModal();
    document.body.appendChild(otpModal);
}

function showPasswordResetForm() {
    const resetModal = createPasswordResetModal();
    document.body.appendChild(resetModal);
}

function hidePasswordResetForm() {
    const resetModal = document.getElementById('passwordResetModal');
    if (resetModal) {
        resetModal.remove();
    }
}

function createOTPModal() {
    const modal = document.createElement('div');
    modal.id = 'otpModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-amber-900 mb-2">Verify Your Email</h2>
                <p class="text-amber-700">Enter the 6-digit code sent to your email</p>
                <p class="text-sm text-amber-600 mt-2">${authState.pendingVerificationEmail}</p>
            </div>
            
            <div class="space-y-4">
                <div class="flex justify-center space-x-2">
                    ${[...Array(6)].map((_, i) => `
                        <input type="text" maxlength="1" 
                               class="w-12 h-12 text-center text-xl font-bold border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                               id="otp-${i}" onkeyup="handleOTPInput(this, ${i})">
                    `).join('')}
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="submitOTP()" 
                            class="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all">
                        Verify
                    </button>
                    <button onclick="closeOTPModal()" 
                            class="px-6 py-3 border border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all">
                        Cancel
                    </button>
                </div>
                
                <div class="text-center">
                    <button onclick="handleResendOTP()" 
                            class="text-amber-600 hover:text-amber-800 text-sm font-medium">
                        Didn't receive the code? Resend
                    </button>
                </div>
            </div>
        </div>
    `;

}

function createPasswordResetModal() {
    const modal = document.createElement('div');
    modal.id = 'passwordResetModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-amber-900 mb-2">Reset Password</h2>
                <p class="text-amber-700">Enter the OTP and your new password</p>
                <p class="text-sm text-amber-600 mt-2">${authState.pendingVerificationEmail}</p>
            </div>
            
            <div class="space-y-4">
                <div class="flex justify-center space-x-2 mb-4">
                    ${[...Array(6)].map((_, i) => `
                        <input type="text" maxlength="1" 
                               class="w-12 h-12 text-center text-xl font-bold border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                               id="reset-otp-${i}" onkeyup="handleResetOTPInput(this, ${i})">
                    `).join('')}
                </div>
                
                <div class="relative">
                    <input type="password" id="newPassword" placeholder="New Password" 
                           class="w-full p-3 border-2 border-amber-300 rounded-xl focus:border-amber-500 focus:outline-none">
                </div>
                
                <div class="relative">
                    <input type="password" id="confirmPassword" placeholder="Confirm New Password" 
                           class="w-full p-3 border-2 border-amber-300 rounded-xl focus:border-amber-500 focus:outline-none">
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="submitPasswordReset()" 
                            class="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all">
                        Reset Password
                    </button>
                    <button onclick="closePasswordResetModal()" 
                            class="px-6 py-3 border border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all">
                        Cancel
                    </button>
                </div>
                
                <div class="text-center">
                    <button onclick="handleResendOTP(authState.pendingVerificationEmail, 'PASSWORD_RESET')" 
                            class="text-amber-600 hover:text-amber-800 text-sm font-medium">
                        Resend OTP
                    </button>
                </div>
            </div>
        </div>
    `;

    return modal;
}

// OTP input handling
function handleOTPInput(input, index) {
    if (input.value.length === 1) {
        if (index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    } else if (input.value.length === 0) {
        if (index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    }
}

function handleResetOTPInput(input, index) {
    if (input.value.length === 1) {
        if (index < 5) {
            document.getElementById(`reset-otp-${index + 1}`).focus();
        }
    } else if (input.value.length === 0) {
        if (index > 0) {
            document.getElementById(`reset-otp-${index - 1}`).focus();
        }
    }
}

function getOTPFromInputs(prefix = 'otp') {
    let otp = '';
    for (let i = 0; i < 6; i++) {
        const input = document.getElementById(`${prefix}-${i}`);
        if (input && input.value) {
            otp += input.value;
        }
    }
    return otp;
}

// Modal submission handlers
async function submitOTP() {
    const otpCode = getOTPFromInputs();

    if (otpCode.length !== 6) {
        showNotification('Please enter all 6 digits of the OTP code.', 'warning');
        return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
        showNotification('OTP must contain only numbers.', 'error');
        return;
    }

    await handleOTPVerification(otpCode);
}

async function submitPasswordReset() {
    const otpCode = getOTPFromInputs('reset-otp');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (otpCode.length !== 6) {
        showNotification('Please enter all 6 digits of the OTP code.', 'warning');
        return;
    }

    if (!newPassword || newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    await handlePasswordReset(otpCode, newPassword);
}

function closeOTPModal() {
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.remove();
    }
    authState.requiresVerification = false;
    authState.pendingVerificationEmail = null;
}

function closePasswordResetModal() {
    const modal = document.getElementById('passwordResetModal');
    if (modal) {
        modal.remove();
    }
    authState.pendingVerificationEmail = null;
}

// Authentication success handler
function handleAuthSuccess(result) {
    authState.isAuthenticated = true;
    authState.user = result.user;
    authState.sessionId = result.sessionId;
    authState.requiresVerification = false;

    // Store session data
    if (typeof Storage !== 'undefined') {
        localStorage.setItem('authState', JSON.stringify({
            sessionId: result.sessionId,
            user: result.user,
            timestamp: Date.now()
        }));
    }

    // Close any open modals
    closeOTPModal();
    closePasswordResetModal();

    showNotification(`Welcome back, ${result.user.name}!`, 'success');

    // Redirect to dashboard after a short delay
    setTimeout(() => {
        window.location.href = '../JOURNALPAGE/entrypage.html';
    }, 1500);
}

// Session management
async function checkSession() {
    if (typeof Storage !== 'undefined') {
        const stored = localStorage.getItem('authState');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Check if session is less than 24 hours old
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    authState.isAuthenticated = true;
                    authState.user = data.user;
                    authState.sessionId = data.sessionId;

                    // Optionally verify session with server
                    const isValid = await verifySession(data.sessionId);
                    if (isValid) {
                        // Redirect to dashboard if already authenticated
                        window.location.href = '/dashboard';
                    } else {
                        // Clear invalid session
                        localStorage.removeItem('authState');
                        authState.isAuthenticated = false;
                        authState.user = null;
                        authState.sessionId = null;
                    }
                }
            } catch (e) {
                console.warn('Could not parse stored auth state:', e);
                localStorage.removeItem('authState');
            }
        }
    }
}

async function verifySession(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId })
        });

        return response.ok;
    } catch (error) {
        console.error('Session verification error:', error);
        return false;
    }
}

async function logout() {
    try {
        if (authState.sessionId) {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: authState.sessionId })
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear local state
    authState.isAuthenticated = false;
    authState.user = null;
    authState.sessionId = null;

    if (typeof Storage !== 'undefined') {
        localStorage.removeItem('authState');
    }

    showNotification('Logged out successfully.', 'success');
}

// Loading state management
function showLoadingState(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    const socialBtns = document.querySelectorAll('.social-btn');

    if (isLoading) {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            `;
        }

        socialBtns.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.6';
        });
    } else {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'Sign In' : 'Create Account';
        }

        socialBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }
}

// Enhanced error handling
function handleAPIError(error, context = '') {
    console.error(`API Error (${context}):`, error);

    if (error.message.includes('rate limit')) {
        showNotification('Too many requests. Please wait a moment before trying again.', 'warning');
    } else if (error.message.includes('network')) {
        showNotification('Network error. Please check your internet connection.', 'error');
    } else {
        showNotification(error.message || 'An unexpected error occurred.', 'error');
    }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkSession();

    // Override the original form submission handler
    const originalHandleFormSubmit = handleFormSubmit;
    handleFormSubmit = function(event) {
        event.preventDefault();

        if (!validateForm()) {
            showNotification('Please fill in all required fields correctly.', 'error');
            return;
        }

        const formData = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        if (!isLoginMode) {
            formData.name = nameInput.value.trim();
        }

        if (isLoginMode) {
            handleLogin(formData);
        } else {
            handleSignup(formData);
        }
    };

    // Keyboard shortcuts for modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeOTPModal();
            closePasswordResetModal();
        }

        if (event.key === 'Enter') {
            if (document.getElementById('otpModal')) {
                submitOTP();
            } else if (document.getElementById('passwordResetModal')) {
                submitPasswordReset();
            }
        }
    });
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        handleSignup,
        handleOTPVerification,
        handleResendOTP,
        handleForgotPassword,
        handlePasswordReset,
        logout,
        authState
    };
}