document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.addEventListener('click', function() {
        // Clear all saved session data
        sessionStorage.clear();
        localStorage.removeItem('userSession');

        // Redirect the user back to the login page
        window.location.href = '../Signup&Login/index.html';
    });
});
