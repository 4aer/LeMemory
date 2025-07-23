// User management system (in-memory storage)
const userSystem = {
    users: JSON.parse(localStorage.getItem('lebron-game-users') || '{}'),
    currentUser: localStorage.getItem('lebron-game-current-user'),
    
    saveUsers() {
        localStorage.setItem('lebron-game-users', JSON.stringify(this.users));
    },
    
    register(username, email, password) {
        if (this.users[username]) {
            throw new Error('Username already exists');
        }
        
        if (Object.values(this.users).some(user => user.email === email)) {
            throw new Error('Email already registered');
        }
        
        this.users[username] = {
            email: email,
            password: password, // In real prod app, this would be hashed
            createdAt: new Date().toISOString(),
            bestScores: {}
        };
        
        this.saveUsers();
        return true;
    },
    
    login(username, password) {
        const user = this.users[username];
        if (!user || user.password !== password) {
            throw new Error('Invalid username or password');
        }
        
        this.currentUser = username;
        localStorage.setItem('lebron-game-current-user', username);
        return true;
    },
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('lebron-game-current-user');
    },
    
    getCurrentUser() {
        return this.currentUser ? this.users[this.currentUser] : null;
    }
};

// Tab switching functionality
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    // Update forms
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tab}-form`).classList.add('active');

    clearMessages();
}

// Password visibility toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
// Message system
function showMessage(message, type = 'success') {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="${type}-message">${message}</div>`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function clearMessages() {
    document.getElementById('message-container').innerHTML = '';
}

// Form validation
function validatePassword(password) {
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }
    return true;
}

// Event listeners
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    try {
        userSystem.login(username, password);
        showMessage(`Welcome back, ${username}!`);
        
        // Show success state after a delay
        setTimeout(() => {
            document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
            document.querySelector('.form-tabs').style.display = 'none';
            document.getElementById('success-state').style.display = 'block';
        }, 1500);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    try {
        // Validation
        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }
        
        validateEmail(email);
        validatePassword(password);
        
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        // Register user
        userSystem.register(username, email, password);
        userSystem.login(username, password);
        
        showMessage(`Account created successfully! Welcome to LeMemory, ${username}!`);
        
        // Show success state after a delay
        setTimeout(() => {
            document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
            document.querySelector('.form-tabs').style.display = 'none';
            document.getElementById('success-state').style.display = 'block';
        }, 1500);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Forgot password functionality
function showForgotPassword() {
    const email = prompt('Enter your email address to reset your password:');
    if (email) {
        // might add soon
        showMessage('Password reset instructions have been sent to your email!');
    }
}

// Start game functionality
function startGame() {
    // loading
    showMessage('Launching LeMemory Game... Get ready to match those LeBron cards!');
    
    // simulate game start
    setTimeout(() => {
        window.location.href = 'main/index.html'; // Redirect to game
    }, 2000);
}

// Check if user is already logged in
window.addEventListener('load', () => {
    if (userSystem.currentUser) {
        const username = userSystem.currentUser;
        showMessage(`Welcome back, ${username}!`);
        
        setTimeout(() => {
            document.querySelectorAll('.form').forEach(form => form.style.display = 'none');
            document.querySelector('.form-tabs').style.display = 'none';
            document.getElementById('success-state').style.display = 'block';
        }, 1000);
    }
});

// Add some interactive animations
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
        this.parentElement.style.transition = 'transform 0.2s ease';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});