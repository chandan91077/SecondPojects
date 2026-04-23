document.addEventListener('DOMContentLoaded', () => {
    const countdownEl = document.getElementById('countdown');
    const closeBtn = document.getElementById('success-close-btn');
    const redirectUrl = 'index.html#book-now';
    let remaining = 5;
    let timer;

    function redirectNow() {
        if (timer) {
            clearInterval(timer);
        }
        window.location.href = redirectUrl;
    }

    if (countdownEl) {
        countdownEl.textContent = String(remaining);
    }

    timer = setInterval(() => {
        remaining -= 1;

        if (countdownEl) {
            countdownEl.textContent = String(Math.max(remaining, 0));
        }

        if (remaining <= 0) {
            redirectNow();
        }
    }, 1000);

    if (closeBtn) {
        closeBtn.addEventListener('click', redirectNow);
    }
});
