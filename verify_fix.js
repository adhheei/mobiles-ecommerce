const http = require('http');

function makeRequest(path, method, body, cookie = null) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5000, // or process.env.PORT
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                ...(cookie ? { 'Cookie': cookie } : {})
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: responseBody ? JSON.parse(responseBody) : {}
                });
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

(async () => {
    try {
        console.log("=== VERIFYING LOGIN FIX ===");

        // 1. Try Admin Login (Should be BLOCKED)
        console.log("\n1. Testing Admin Login (admin@gmail.com)...");
        const adminRes = await makeRequest('/api/auth/login', 'POST', {
            email: 'admin@gmail.com',
            password: 'password123'
        });

        if (adminRes.statusCode === 403) {
            console.log("✅ Admin blocked correctly (403). Message:", adminRes.body.message);
        } else {
            console.error("❌ Admin NOT blocked! Status:", adminRes.statusCode, adminRes.body);
        }

        // 1.5 Try Admin Login via Admin Portal (Should SUCCEED with COOKIE, NO TOKEN IN BODY)
        console.log("\n1.5. Testing Admin Login via Admin Portal (/api/admin/login)...");
        const adminPortalRes = await makeRequest('/api/admin/login', 'POST', {
            email: 'admin@gmail.com',
            password: 'password123'
        });

        if (adminPortalRes.statusCode === 200) {
            console.log("✅ Admin Login Successful (200).");
            const cookies = adminPortalRes.headers['set-cookie'];
            if (cookies && cookies.some(c => c.startsWith('admin_jwt='))) {
                console.log("✅ Admin JWT Cookie IS SET.");
            } else {
                console.error("❌ Admin JWT Cookie MISSING!");
            }

            if (!adminPortalRes.body.token) {
                console.log("✅ Token successfully REMOVED from response body.");
            } else {
                console.error("❌ Token STILL PRESENT in response body!", JSON.stringify(adminPortalRes.body));
            }
        } else {
            console.error("❌ Admin Portal Login Failed! Status:", adminPortalRes.statusCode, adminPortalRes.body);
        }

        // 2. Create Temp User
        const timestamp = Date.now();
        const userEmail = `user${timestamp}@test.com`;
        const userPass = 'password123';
        console.log(`\n2. Creating Test User (${userEmail})...`);

        await makeRequest('/api/auth/signup', 'POST', {
            firstName: 'Test',
            lastName: 'User',
            email: userEmail,
            phone: `99${timestamp.toString().slice(-8)}`,
            password: userPass,
            confirmPassword: userPass
        });

        // 3. Try User Login (Should SUCCEED and SET COOKIE)
        console.log("\n3. Testing User Login...");
        const userRes = await makeRequest('/api/auth/login', 'POST', {
            email: userEmail,
            password: userPass
        });

        if (userRes.statusCode === 200) {
            console.log("✅ User login successful (200).");

            const cookies = userRes.headers['set-cookie'];
            if (cookies && cookies.some(c => c.startsWith('jwt='))) {
                console.log("✅ JWT Cookie IS SET.");
                console.log("   Cookies:", cookies);

                // Verify Payload manually (without verifying signature here, just structure)
                const jwtCookie = cookies.find(c => c.startsWith('jwt='));
                const token = jwtCookie.split(';')[0].split('=')[1];
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                console.log("   Payload Role:", payload.role);
                if (payload.role === 'user') {
                    console.log("✅ Role 'user' correctly verified in payload.");
                } else {
                    console.error("❌ Role MISSING or WRONG in payload:", payload.role);
                }

                // 4. Verify Logout
                console.log("\n4. Testing Logout...");
                const logoutRes = await makeRequest('/api/auth/logout', 'POST', {}, jwtCookie);
                if (logoutRes.statusCode === 200) {
                    console.log("✅ Logout successful.");
                    const logoutCookies = logoutRes.headers['set-cookie'];
                    if (logoutCookies && logoutCookies.some(c => c.includes('jwt=none'))) {
                        console.log("✅ JWT Cookie CLEARED (set to none).");
                    } else {
                        console.error("❌ JWT Cookie NOT CLEARED properly!");
                    }
                } else {
                    console.error("❌ Logout failed!", logoutRes.statusCode);
                }

            } else {
                console.error("❌ JWT Cookie MISSING!");
            }
        } else {
            console.error("❌ User login failed! Status:", userRes.statusCode, userRes.body);
        }

    } catch (err) {
        console.error("Verification Error:", err);
    }
})();
