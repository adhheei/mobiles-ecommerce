const http = require('http');

function makeRequest(path, method, body, cookie = null) {
    return new Promise((resolve, reject) => {
        // Only stringify if body is truthy (not null/undefined)
        const data = body ? JSON.stringify(body) : '';

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...(cookie ? { 'Cookie': cookie } : {})
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                let parsedBody = {};
                try {
                    parsedBody = responseBody ? JSON.parse(responseBody) : {};
                } catch (e) {
                    console.error("JSON Parse Error:", responseBody);
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parsedBody
                });
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

(async () => {
    try {
        console.log("=== ADDRESS CRUD VERIFICATION ===");

        // 1. Create/Login User
        const tempUserEmail = `testaddr${Date.now()}@test.com`;
        console.log(`\n1. Creating Temp User: ${tempUserEmail}`);

        await makeRequest('/api/auth/signup', 'POST', {
            firstName: 'Addr',
            lastName: 'Test',
            email: tempUserEmail,
            phone: `88${Date.now().toString().slice(-8)}`,
            password: 'password123',
            confirmPassword: 'password123'
        });

        const loginRes = await makeRequest('/api/auth/login', 'POST', {
            email: tempUserEmail,
            password: 'password123'
        });

        if (loginRes.statusCode !== 200) {
            console.error("Login Failed", loginRes.body);
            return;
        }

        const cookie = loginRes.headers['set-cookie'][0];
        console.log("   Logged in, Cookie obtained.");

        // 2. Add Address
        console.log("\n2. Adding New Address...");
        const addRes = await makeRequest('/api/addresses', 'POST', {
            fullName: "Test User",
            phone: "1234567890",
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            pincode: "123456",
            country: "India",
            addressType: "Home",
            isDefault: true
        }, cookie);

        if (addRes.statusCode === 201) {
            console.log("✅ Address Added:", addRes.body.address._id);
        } else {
            console.error("❌ Add Failed:", addRes.statusCode, addRes.body);
            return;
        }
        const addrId = addRes.body.address._id;

        // 3. Get Addresses
        console.log("\n3. Fetching Addresses...");
        const getRes = await makeRequest('/api/addresses', 'GET', null, cookie);
        if (getRes.statusCode === 200 && getRes.body.addresses.length > 0) {
            console.log(`✅ Fetched ${getRes.body.addresses.length} addresses.`);
        } else {
            console.error("❌ Fetch Failed:", getRes.body);
        }

        // 4. Update Address
        console.log("\n4. Updating Address...");
        const updateRes = await makeRequest(`/api/addresses/${addrId}`, 'PUT', {
            fullName: "Updated Name",
            city: "New City"
        }, cookie);

        if (updateRes.statusCode === 200 && updateRes.body.address.fullName === "Updated Name") {
            console.log("✅ Address Updated.");
        } else {
            console.error("❌ Update Failed:", updateRes.body);
        }

        // 5. Delete Address
        console.log("\n5. Deleting Address...");
        const deleteRes = await makeRequest(`/api/addresses/${addrId}`, 'DELETE', null, cookie);
        if (deleteRes.statusCode === 200) {
            console.log("✅ Address Deleted.");
        } else {
            console.error("❌ Delete Failed:", deleteRes.body);
        }

    } catch (err) {
        console.error("Verification Error:", err);
    }
})();
