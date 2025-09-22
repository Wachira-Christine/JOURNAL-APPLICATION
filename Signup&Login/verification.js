// Class representing the Verification Page logic
class Verification {
    /**

      @param {NotificationManager} notificationManager 
     */
    constructor(notificationManager) {
        this.notificationManager = notificationManager;

        // DOM elements
        this.verificationCodeInput = document.getElementById('verificationCode');
        this.verifyBtn = document.getElementById('verifyBtn');
        this.resendCodeBtn = document.getElementById('resendCodeBtn');
        this.backToLoginBtn = document.getElementById('backToLoginBtn');
        this.contactInfo = document.getElementById('contactinfo');

         // API base
        this.API_BASE_URL = 'http://localhost:3000/api/auth';

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
     * Verify the code input by the user
     */
    async verifyCode() {
        const code = this.verificationCodeInput.value.trim();

       if (!/^\d{6}$/.test(code)) {
            this.notificationManager.show('Please enter a valid 6-digit OTP.', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.email,
                    otpCode: code,
                    otpType: 'EMAIL_VERIFICATION'
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.notificationManager.show('Verification successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '../JOURNALPAGE/journal.html';
                }, 1500);
            } else {
                throw new Error(result.error || 'OTP verification failed');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.notificationManager.show(error.message || 'Verification failed. Please try again.', 'error');
        }
    }

    /**
     * Resend verification code
     */
    async resendCode() {
       try {
            const response = await fetch(`${this.API_BASE_URL}/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.email, otpType: 'EMAIL_VERIFICATION' })
            });

            if (response.ok) {
                this.notificationManager.show('OTP sent successfully!', 'success');
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            this.notificationManager.show(error.message || 'Failed to resend OTP.', 'error');
        }
    }

    /**
     * Go back to login page
     */
    goBackToLogin() {
        window.location.href = '../Signup&Login/index.html';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const notifications = new NotificationManager();
    if (document.querySelector('#verifyBtn')) {
        new Verification(notifications);
    }
});
