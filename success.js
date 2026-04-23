document.addEventListener('DOMContentLoaded', () => {
    const countdownEl = document.getElementById('countdown');
    const redirectUrl = 'index.html#book-now';
    let remaining = 5;

    if (countdownEl) {
        countdownEl.textContent = String(remaining);
    }

    const timer = setInterval(() => {
        remaining -= 1;

        if (countdownEl) {
            countdownEl.textContent = String(Math.max(remaining, 0));
        }

        if (remaining <= 0) {
            clearInterval(timer);
            window.location.href = redirectUrl;
        }
    }, 1000);
});
