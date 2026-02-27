// A simple automated testing script for EduSync API
const API_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("🚀 Starting Automated API Tests...\n");

  // Generate a unique email using the current time
  const timestamp = Date.now();
  const testUser = {
    full_name: "Automated Robot Admin",
    email: `robot_${timestamp}@edusync.com`,
    password: "securepassword123",
    role: "Admin",
  };

  try {
    // --- TEST 1: REGISTRATION ---
    console.log(`📝 1. Registering new Admin: ${testUser.email}...`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();

    if (regRes.ok) {
      console.log("   ✅ Registration successful!");
    } else {
      throw new Error(
        `Registration failed: ${regData.error || JSON.stringify(regData)}`,
      );
    }

    // --- TEST 2: LOGIN ---
    console.log(`\n🔐 2. Attempting to log in...`);
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    const loginData = await loginRes.json();

    if (loginRes.ok && loginData.token) {
      console.log("   ✅ Login successful! VIP Token received.");
    } else {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    const token = loginData.token;

    // --- TEST 3: ACCESS PROTECTED ROUTE ---
    console.log(`\n🛡️  3. Testing Dashboard Access with Token...`);
    const dashRes = await fetch(`${API_URL}/dashboard`, {
      method: "GET",
      headers: { jwt_token: token },
    });
    const dashData = await dashRes.json();

    if (dashRes.ok) {
      console.log("   ✅ Dashboard access granted!");
      console.log(
        `   Response says: "${dashData.message}" (Role: ${dashData.your_role})`,
      );
    } else {
      throw new Error(`Dashboard access denied: ${dashData.error}`);
    }

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The API is rock solid.");
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
  }
}

// Execute the tests
runTests();
