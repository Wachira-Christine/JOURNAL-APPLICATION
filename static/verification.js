   // Class representing the Verification Page logic
class Verification {
    /**
     * @param {NotificationManager} notificationManager
     */
    constructor(notificationManager) {
        this.notificationManager = notificationManager;

        // DOM elements
        this.verificationCodeInput = document.getElementById('verificationCode');
        this.verifyBtn = document.getElementById('verifyBtn');
        this.resendCodeBtn = document.getElementById('resendCodeBtn');
        this.backToLoginBtn = document.getElementById('backToLoginBtn');
        this.contactInfo = document.getElementById('contactinfo');

        // API base - UPDATED to match your Flask backend
        this.API_BASE_URL = 'http://127.0.0.1:5000'; // Changed from localhost:3000

        // Initialize page state
        this.loadParams();
        this.setupEventListeners();
    }

    /**
     * Load query parameters (email, phone) from URL and display them
     */
    loadParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.email = urlParams.get('email');
        this.phone = urlParams.get('phone');

        let contactText = '';
        if (this.email) contactText += `Email: <strong>${this.email}</strong>`;
        if (this.phone) {
            if (contactText) contactText += '<br>';
            contactText += `Phone: <strong>${this.phone}</strong>`;
        }
        if (!contactText) contactText = 'No contact information provided.';
        this.contactInfo.innerHTML = contactText;
    }

    /**
     * Attach event listeners to buttons
     */
    setupEventListeners() {
        this.verifyBtn.addEventListener('click', () => this.verifyCode());
        this.resendCodeBtn.addEventListener('click', () => this.resendCode());
        this.backToLoginBtn.addEventListener('click', () => this.goBackToLogin());

        // Disable SMS button if no phone number
        const sendSmsBtn = document.getElementById('sendSMSCodeBtn');
        if (!this.phone && sendSmsBtn) {
            sendSmsBtn.disabled = true;
            sendSmsBtn.classList.add('disabled');
        }

        // Allow pressing Enter to submit
        this.verificationCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyCode();
        });
    }

    /**
     * Verify the code input by the user - UPDATED FOR YOUR BACKEND
     */
    async verifyCode() {
        const code = this.verificationCodeInput.value.trim();

        if (!/^\d{6}$/.test(code)) {
            this.notificationManager.show('Please enter a valid 6-digit OTP.', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/verify_otp`, { // Changed endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: this.email,
                    otp: code  // Changed from otpCode to otp
                })
            });

            const result = await response.json();

            if (result.success) { // Changed from response.ok to result.success
                this.notificationManager.show(result.message || 'Verification successful! Redirecting...', 'success');

                // Store user session
                if (result.user_id) {
                    localStorage.setItem('user_id', result.user_id);
                    localStorage.setItem('username', result.username);
                }

                setTimeout(() => {
                    window.location.href = result.redirect_url || '/dashboard'; // Your journal page
                }, 1500);
            } else {
                throw new Error(result.message || 'OTP verification failed');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.notificationManager.show(error.message || 'Verification failed. Please try again.', 'error');
        }
    }

    /**
     * Resend verification code - UPDATED FOR YOUR BACKEND
     */
    async resendCode() {
        try {
            // You'll need to add a resend OTP endpoint to your Flask app
            const response = await fetch(`${this.API_BASE_URL}/resend_otp`, { // New endpoint needed
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: this.email,
                    username: this.getUsernameFromEmail() // You might need this
                })
            });

            const result = await response.json();

            if (result.success) {
                this.notificationManager.show(result.message || 'OTP sent successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            this.notificationManager.show(error.message || 'Failed to resend OTP.', 'error');
        }
    }

    /**
     * Helper to get username from email (you might need this)
     */
    async getUsernameFromEmail() {
        // You might need to fetch the username from your database
        // This is optional depending on your resend OTP implementation
        return this.email.split('@')[0]; // Simple fallback
    }

    /**
     * Go back to login page
     */
    goBackToLogin() {
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const notifications = new NotificationManager();
    if (document.querySelector('#verifyBtn')) {
        new Verification(notifications);
    }
});