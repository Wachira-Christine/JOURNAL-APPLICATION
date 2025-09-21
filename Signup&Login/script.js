// DOM elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const nameField = document.getElementById('nameField');
const loginOptions = document.getElementById('loginOptions');
const submitBtn = document.getElementById('submitBtn');
const authToggleText = document.getElementById('authToggleText');
const authToggleLink = document.getElementById('authToggleLink');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');

// Form inputs
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const rememberMeInput = document.getElementById('rememberMe');

// State management
let isLoginMode = true;
let showPassword = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateFormState();
});

// Event listeners setup
function setupEventListeners() {
    // Toggle between login and signup
    loginBtn.addEventListener('click', () => switchToLogin());
    signupBtn.addEventListener('click', () => switchToSignup());
    authToggleLink.addEventListener('click', () => toggleAuthMode());

    // Password visibility toggle
    togglePassword.addEventListener('click', togglePasswordVisibility);

    // Form submission
    submitBtn.addEventListener('click', handleFormSubmit);

    // Social login buttons
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', handleSocialLogin);
    });

    // Forgot password
    const forgotPasswordBtn = document.querySelector('.forgot-password');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', handleForgotPassword);
    }

    // Form validation on input
    [nameInput, emailInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', validateForm);
            input.addEventListener('blur', validateField);
        }
    });
}

// Switch to login mode
function switchToLogin() {
    isLoginMode = true;
    updateFormState();
    updateToggleButtons();
}

// Switch to signup mode
function switchToSignup() {
    isLoginMode = false;
    updateFormState();
    updateToggleButtons();
}

// Toggle between login and signup modes
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    updateFormState();
    updateToggleButtons();
}

// Update form state based on current mode
function updateFormState() {
    if (isLoginMode) {
        // Login mode
        nameField.classList.add('hidden');
        loginOptions.style.display = 'flex';
        submitBtn.textContent = 'Sign In';
        authToggleText.innerHTML = `
            Don't have an account? 
            <button id="authToggleLink" class="auth-link">Sign up here</button>
        `;

        // Remove required attribute from name field
        if (nameInput) nameInput.removeAttribute('required');
    } else {
        // Signup mode
        nameField.classList.remove('hidden');
        loginOptions.style.display = 'none';
        submitBtn.textContent = 'Create Account';
        authToggleText.innerHTML = `
            Already have an account? 
            <button id="authToggleLink" class="auth-link">Sign in here</button>
        `;

        // Add required attribute to name field
        if (nameInput) nameInput.setAttribute('required', 'required');
    }

    // Re-attach event listener to the new toggle link
    const newToggleLink = document.getElementById('authToggleLink');
    if (newToggleLink) {
        newToggleLink.addEventListener('click', toggleAuthMode);
    }

    // Add animation
    const loginCard = document.querySelector('.login-card');
    loginCard.classList.add('fade-in');
    setTimeout(() => loginCard.classList.remove('fade-in'), 300);
}

// Update toggle button states
function updateToggleButtons() {
    if (isLoginMode) {
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        signupBtn.classList.add('active');
        loginBtn.classList.remove('active');
    }
}

// Toggle password visibility
function togglePasswordVisibility() {
    showPassword = !showPassword;

    if (showPassword) {
        passwordInput.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        passwordInput.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }
}

// Form validation
function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = !isLoginMode ? nameInput.value.trim() : 'valid';

    const isValid = isValidEmail(email) &&
                   password.length >= 6 &&
                   name.length > 0;

    submitBtn.disabled = !isValid;
    submitBtn.style.opacity = isValid ? '1' : '0.6';
    submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';

    return isValid;
}

// Validate individual field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();

    // Remove existing error styling
    field.classList.remove('error');

    // Validate based on field type
    let isValid = true;

    switch (field.type) {
        case 'email':
            isValid = isValidEmail(value);
            break;
        case 'password':
            isValid = value.length >= 6;
            break;
        case 'text':
            isValid = value.length > 0;
            break;
    }

    // Add error styling if invalid
    if (!isValid && value.length > 0) {
        field.classList.add('error');
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        showNotification('Please fill in all required fields correctly.', 'error');
        return;
    }

    // Collect form data
    const formData = {
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        rememberMe: isLoginMode ? rememberMeInput.checked : false
    };

    if (!isLoginMode) {
        formData.name = nameInput.value.trim();
    }

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Handle success/error
        if (isLoginMode) {
            handleLogin(formData);
        } else {
            handleSignup(formData);
        }
    }, 2000);
}

// Handle login
function handleLogin(data) {
    console.log('Login attempt:', data);

    // Here you would typically send data to your authentication API
    // For demo purposes, we'll just show a success message
    showNotification('Login successful! Redirecting...', 'success');

    // Simulate redirect after successful login
    setTimeout(() => {
        // window.location.href = '/dashboard';
        console.log('Redirecting to dashboard...');
    }, 1500);
}

// Handle signup
function handleSignup(data) {
    console.log('Signup attempt:', data);

    // Here you would typically send data to your registration API
    // For demo purposes, we'll just show a success message
    showNotification('Account created successfully! Please check your email for verification.', 'success');

    // Switch to login mode after successful signup
    setTimeout(() => {
        switchToLogin();
        emailInput.value = data.email; // Pre-fill email
    }, 2000);
}

// Handle social login
function handleSocialLogin(event) {
    const button = event.currentTarget;
    const provider = button.textContent.includes('Google') ? 'Google' : 'Facebook';

    console.log(`${provider} login initiated`);

    // Show loading state
    const originalHTML = button.innerHTML;
    button.innerHTML = `
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Connecting...</span>
    `;
    button.disabled = true;

    // Simulate OAuth process
    setTimeout(() => {
        // Reset button
        button.innerHTML = originalHTML;
        button.disabled = false;

        // Here you would typically redirect to OAuth provider
        // For demo purposes, we'll show a success message
        showNotification(`${provider} authentication successful!`, 'success');

        // Simulate redirect after successful OAuth
        setTimeout(() => {
            console.log('Redirecting to dashboard...');
            // window.location.href = '/dashboard';
        }, 1500);
    }, 2000);
}

// Handle forgot password
function handleForgotPassword() {
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

    console.log('Password reset requested for:', email);
    showNotification('Password reset link sent to your email!', 'success');
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Form auto-save functionality (optional)
function saveFormData() {
    if (typeof Storage !== 'undefined') {
        const formData = {
            email: emailInput.value,
            rememberMe: rememberMeInput.checked,
            timestamp: Date.now()
        };
        localStorage.setItem('journalLoginForm', JSON.stringify(formData));
    }
}

// Load saved form data (optional)
function loadFormData() {
    if (typeof Storage !== 'undefined') {
        const saved = localStorage.getItem('journalLoginForm');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Only load if saved within last 24 hours
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    emailInput.value = data.email || '';
                    if (rememberMeInput) {
                        rememberMeInput.checked = data.rememberMe || false;
                    }
                }
            } catch (e) {
                console.warn('Could not load saved form data:', e);
            }
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Enter key submits form
    if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement.matches('input')) {
            event.preventDefault();
            handleFormSubmit(event);
        }
    }

    // Escape key clears notifications
    if (event.key === 'Escape') {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(n => n.remove());
    }
});

// Initialize form data loading
document.addEventListener('DOMContentLoaded', function() {
    loadFormData();

    // Save form data on input (debounced)
    let saveTimeout;
    [emailInput, rememberMeInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveFormData, 500);
            });
        }
    });
});

// Accessibility improvements
function setupAccessibility() {
    // Add ARIA labels
    submitBtn.setAttribute('aria-label', isLoginMode ? 'Sign in to your account' : 'Create new account');

    // Focus management
    const firstInput = isLoginMode ? emailInput : nameInput;
    if (firstInput) {
        firstInput.focus();
    }

    // Screen reader announcements
    const srAnnouncement = document.createElement('div');
    srAnnouncement.setAttribute('aria-live', 'polite');
    srAnnouncement.setAttribute('aria-atomic', 'true');
    srAnnouncement.className = 'sr-only';
    srAnnouncement.textContent = isLoginMode ? 'Login form displayed' : 'Registration form displayed';
    document.body.appendChild(srAnnouncement);

    setTimeout(() => srAnnouncement.remove(), 1000);
}

// Call accessibility setup when form state changes
const originalUpdateFormState = updateFormState;
updateFormState = function() {
    originalUpdateFormState();
    setupAccessibility();
};

// Performance optimization - debounce validation
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounced validation
const debouncedValidation = debounce(validateForm, 300);

// Replace direct validation calls with debounced version
[nameInput, emailInput, passwordInput].forEach(input => {
    if (input) {
        input.removeEventListener('input', validateForm);
        input.addEventListener('input', debouncedValidation);
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        validateForm,
        handleLogin,
        handleSignup,
        showNotification
    };
}