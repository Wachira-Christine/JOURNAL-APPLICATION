// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear client-side storage
            sessionStorage.clear();
            localStorage.removeItem('user_id');
            localStorage.removeItem('username');

            // Redirect to home
            window.location.href = '/logout';
        });
    }
});