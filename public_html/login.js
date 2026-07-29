const localDev = "http://localhost:3006";
const form = document.getElementById('login-form');
const errorDiv = document.getElementById('error-message');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {   
        const res = await fetch(localDev + '/api/log/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            window.location.href = './dashboard.html';
        } else {
            errorDiv.textContent = data.error || 'Invalid email or password.';
            errorDiv.hidden = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    } catch (err) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});

const guestBtn = document.getElementById('guest-login-btn');
if (guestBtn) {
    guestBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(localDev + '/api/log/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                window.location.href = './dashboard.html';
            }
        } catch (err) {
            errorDiv.textContent = 'Network error during guest login.';
            errorDiv.hidden = false;
        }
    });
}