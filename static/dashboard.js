document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                // Call Flask logout to clear server session
                await fetch('/logout');

                // Clear client-side storage
                sessionStorage.clear();
                localStorage.removeItem('user_id');
                localStorage.removeItem('username');

                // Redirect to home page
                window.location.href = '/';
            } catch (error) {
                console.error('Logout error:', error);
                // Still redirect even if fetch fails
                window.location.href = '/';
            }
        });
    }
});