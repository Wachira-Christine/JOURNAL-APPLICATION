document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const phone = urlParams.get('phone');

    // Display email and phone number on the page
    const contactinfo=document.getElementById('contactinfo');
    let contactText='';
    if(email) contactText+=`Email: <strong>${email}</strong>`;
    if(phone) {
        if(contactText) contactText+='<br>';
        contactText+=`Phone: <strong>${phone}</strong>`;
    }
    if(!contactText) contactText='No contact information provided.';
    contactinfo.innerHTML=contactText;

    //buttons and inputs
    const sendEmailCodeBtn = document.getElementById('sendEmailCodeBtn');
    const sendSmsCodeBtn = document.getElementById('sendSmsCodeBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const backtoLoginBtn = document.getElementById('backtoLoginBtn');
    const verificationCodeInput = document.getElementById('verificationCodeInput');

    //disabling sms button if no phone
    if(!phone) {
        sendSmsCodeBtn.disabled = true;
        sendSmsCodeBtn.classList.add('disabled');
    }

    verifyBtn.textContent = 'Verify & Continue';

    verifyBtn.addEventListener('click', () => {
        const code = verificationCodeInput.value;
        // Demo: accept '123456' as valid code
        if (code === '123456') {
            showNotification('Verification successful! Redirecting...', 'success');
            // Redirect to main journal page
            window.location.href = 'journal.html'; // Change to your main journal page
        } else {
            showNotification('Invalid verification code. Please try again.', 'error');
        }
    });

    resendCodeBtn.addEventListener('click', () => {
        showNotification('Verification code resent.', 'info');
        // TODO: Call backend API to resend code
    });

    backtoLoginBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // Your login page
    });

    // Simple notification function (you can replace with your existing one)
    function showNotification(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }
});

    
