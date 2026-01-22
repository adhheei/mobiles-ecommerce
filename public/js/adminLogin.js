document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!email || !password) {
                Swal.fire('Error', 'Please fill in all fields', 'error');
                return;
            }

            try {
                // Show loading
                Swal.fire({
                    title: 'Logging in...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (data.success) {
                    // Save token if needed (e.g., localStorage)
                    // localStorage.setItem('adminToken', data.token);

                    Swal.fire({
                        icon: 'success',
                        title: 'Login Successful',
                        text: 'Redirecting to dashboard...',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/Admin/adminDashboard.html';
                    });
                } else {
                    Swal.fire('Login Failed', data.error || 'Invalid credentials', 'error');
                }

            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'Something went wrong. Please try again.', 'error');
            }
        });
    }
});
