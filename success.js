document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('success-close-btn');
    const redirectUrl = 'index.html';

    function redirectNow() {
        window.location.href = redirectUrl;
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', redirectNow);
    }
});
