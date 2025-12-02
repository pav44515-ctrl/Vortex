// ===================================
// PASSWORD SECURITY ENHANCEMENTS
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    setupPasswordSecurity();
});

function setupPasswordSecurity() {
    const signupPassword = document.getElementById('signupPassword');
    const loginPassword = document.getElementById('loginPassword');

    // Password strength checker
    if (signupPassword) {
        // Add minimum length requirement
        signupPassword.minLength = 8;

        signupPassword.addEventListener('input', (e) => {
            const password = e.target.value;
            checkPasswordStrength(password);
        });
    }

    // Add visibility toggles for all password fields
    addPasswordToggle('loginPassword');
    addPasswordToggle('signupPassword');
}

function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    // Calculate normalized strength (0-4 scale)
    const normalizedStrength = Math.min(4, strength);

    const strengths = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['#ff4444', '#ff8800', '#ffbb00', '#00cc66', '#00ff88'];

    feedback = strengths[normalizedStrength];
    const color = colors[normalizedStrength];

    // Show strength indicator
    showPasswordStrengthFeedback(normalizedStrength, feedback, color);
}

function showPasswordStrengthFeedback(strength, text, color) {
    // Create strength indicator if it doesn't exist
    let strengthDiv = document.getElementById('passwordStrength');

    if (!strengthDiv) {
        const signupPassword = document.getElementById('signupPassword');
        if (!signupPassword) return;

        strengthDiv = document.createElement('div');
        strengthDiv.id = 'passwordStrength';
        strengthDiv.style.cssText = 'margin-top: 0.5rem; font-size: 0.75rem;';

        const barsDiv = document.createElement('div');
        barsDiv.style.cssText = 'display: flex; gap: 0.25rem; margin-bottom: 0.25rem;';

        for (let i = 0; i < 4; i++) {
            const bar = document.createElement('div');
            bar.className = 'strength-bar';
            bar.style.cssText = 'flex: 1; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; transition: background 0.3s;';
            barsDiv.appendChild(bar);
        }

        strengthDiv.appendChild(barsDiv);

        const textSpan = document.createElement('span');
        textSpan.id = 'strengthText';
        textSpan.style.color = 'var(--color-text-secondary)';
        strengthDiv.appendChild(textSpan);

        signupPassword.parentNode.insertBefore(strengthDiv, signupPassword.nextSibling);
    }

    // Update bars
    const bars = strengthDiv.querySelectorAll('.strength-bar');
    bars.forEach((bar, index) => {
        if (index <= strength) {
            bar.style.background = color;
        } else {
            bar.style.background = 'rgba(255,255,255,0.1)';
        }
    });

    // Update text
    const textSpan = document.getElementById('strengthText');
    if (textSpan) {
        textSpan.textContent = `Password Strength: ${text}`;
        textSpan.style.color = color;
    }
}

function addPasswordToggle(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;

    // Create toggle button
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';

    // Wrap input
    passwordInput.parentNode.insertBefore(wrapper, passwordInput);
    wrapper.appendChild(passwordInput);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 0; z-index: 10;';
    toggleBtn.title = 'Toggle password visibility';

    toggleBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '🔒';
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '👁️';
        }
    });

    wrapper.appendChild(toggleBtn);
}

// Add better form validation
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        const password = document.getElementById('signupPassword').value;

        if (password.length < 8) {
            e.preventDefault();
            showNotification('Password must be at least 8 characters long', 'error');
            return false;
        }

        // Check for at least one number or special character
        if (!/\d/.test(password) && !/[^a-zA-Z]/.test(password)) {
            e.preventDefault();
            showNotification('Password should include numbers or special characters for better security', 'error');
            return false;
        }
    });
}
