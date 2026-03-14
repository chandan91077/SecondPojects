document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize AOS Animation
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 50
    });

    // 2. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    });

    // 3. Calculator Logic
    const calcService = document.getElementById('calc-service');
    const calcType = document.getElementById('calc-type');
    const calcCount = document.getElementById('calc-count');
    const calcResult = document.getElementById('calc-result');

    function calculateCost() {
        if (!calcService.value) return;
        
        const basePrice = parseFloat(calcService.options[calcService.selectedIndex].dataset.price);
        const multiplier = parseFloat(calcType.options[calcType.selectedIndex].dataset.multiplier);
        const count = parseInt(calcCount.value) || 1;

        const totalCost = basePrice * multiplier * count;
        
        // Format as Indian Rupee
        calcResult.textContent = `₹ ${totalCost.toLocaleString('en-IN')}`;
    }

    if (calcService && calcType && calcCount) {
        calcService.addEventListener('change', calculateCost);
        calcType.addEventListener('change', calculateCost);
        calcCount.addEventListener('input', calculateCost);
    }

    // 4. Form Submission & Client-Side Validation
    const bookingForm = document.getElementById('booking-form');
    const successBox = document.getElementById('success-box');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const resetFormBtn = document.getElementById('reset-form-btn');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isLiveServer = window.location.port === '5500';
            const apiUrl = isLiveServer ? 'http://localhost:3000/api/contact' : '/api/contact';
            
            // Basic validation
            let isValid = true;
            const phoneInput = document.getElementById('phone');
            const phoneError = document.getElementById('phone-error');
            
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phoneInput.value)) {
                phoneError.style.display = 'block';
                isValid = false;
            } else {
                phoneError.style.display = 'none';
            }

            if (!isValid) return;

            // Prepare UI for submission
            btnText.classList.add('d-none');
            submitSpinner.classList.remove('d-none');
            submitBtn.disabled = true;

            // Collect Data
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                serviceType: document.getElementById('serviceType').value,
                message: document.getElementById('message').value
            };

            try {
                // Send to Serverless Function (/api/contact)
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    // Show success
                    bookingForm.classList.add('d-none');
                    successBox.classList.remove('d-none');
                } else {
                    let errorMessage = 'Something went wrong.';
                    const responseText = await response.text();

                    if (responseText) {
                        try {
                            const errorData = JSON.parse(responseText);
                            errorMessage = errorData.message || errorMessage;
                        } catch {
                            errorMessage = responseText;
                        }
                    }

                    alert(`Error: ${errorMessage}`);
                }
            } catch (err) {
                console.error('Submission Error:', err);
                // Even on error during local dev without server, show success for demo if needed, but alert is better
                alert('We could not send your request at this time. Please call us directly.');
            } finally {
                // Restore UI
                btnText.classList.remove('d-none');
                submitSpinner.classList.add('d-none');
                submitBtn.disabled = false;
            }
        });
    }

    // Reset Form
    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', () => {
            bookingForm.reset();
            calcResult.textContent = '₹ 0';
            successBox.classList.add('d-none');
            bookingForm.classList.remove('d-none');
        });
    }
});
