document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.addEventListener('click', () => {
        // Clear session and redirect
        localStorage.clear();
        window.location.href = 'login.html';
    });
});
