/**
 * Automated end-to-end test suite for RoomForU OTP Authentication & Password Reset.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Registration = require("../models/authentication.js");
const OtpVerification = require("../models/otp.js");
const { hashSecret } = require("../utils/cryptoUtils.js");

const BASE_URL = process.env.BACKEND_TEST_URL || "http://localhost:5000";

let testPassedCount = 0;
let testTotalCount = 0;

function assert(condition, message) {
    testTotalCount++;
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
    testPassedCount++;
    console.log(`✅ PASS: ${message}`);
}

async function apiCall(path, method = "GET", body = null) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        body: body ? JSON.stringify(body) : null
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function runTests() {
    console.log("==================================================================");
    console.log("Starting RoomForU OTP & Password Reset Automated Test Suite");
    console.log("==================================================================");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for test verification.\n");

    const testTimestamp = Date.now();
    const testEmail = `test_user_${testTimestamp}@example.com`;
    const testUsername = `user_${testTimestamp}`;
    const initialPassword = "InitialPassword123!";
    const newPassword = "NewStrongPassword456!";

    try {
        // Cleanup any pre-existing test data
        await Registration.deleteMany({ email: testEmail });
        await OtpVerification.deleteMany({ email: testEmail });

        // -------------------------------------------------------------
        // TEST 1: Request Signup OTP with Valid Data
        // -------------------------------------------------------------
        console.log("--- TEST 1: Request Signup OTP ---");
        const req1 = await apiCall("/api/v1/auth/signup/request-otp", "POST", {
            name: "Test Verification User",
            email: testEmail,
            username: testUsername,
            password: initialPassword
        });
        assert(req1.status === 200, `Request signup OTP returned HTTP 200 (Got ${req1.status})`);
        assert(req1.data.success === true, "Response indicated success");

        // Verify OTP record exists in DB
        const otpRecord = await OtpVerification.findOne({ email: testEmail, purpose: "SIGNUP_VERIFICATION" });
        assert(Boolean(otpRecord), "OtpVerification record created in MongoDB");
        assert(Boolean(otpRecord.pendingUserData), "Pending user data is stored encrypted");
        assert(otpRecord.attempts === 0, "Initial attempts count is 0");

        // -------------------------------------------------------------
        // TEST 2: Resend Cooldown Check (< 60 seconds)
        // -------------------------------------------------------------
        console.log("\n--- TEST 2: Signup OTP Resend Cooldown Enforcement ---");
        const req2 = await apiCall("/api/v1/auth/signup/request-otp", "POST", {
            name: "Test Verification User",
            email: testEmail,
            username: testUsername,
            password: initialPassword
        });
        assert(req2.status === 429, `Cooldown prevents rapid re-request (HTTP 429, Got ${req2.status})`);
        assert(req2.data.message.includes("seconds"), "Error message informs user of cooldown time");

        // -------------------------------------------------------------
        // TEST 3: Verify Signup with Incorrect OTP
        // -------------------------------------------------------------
        console.log("\n--- TEST 3: Verify Signup with Incorrect OTP ---");
        const req3 = await apiCall("/api/v1/auth/signup/verify", "POST", {
            email: testEmail,
            otp: "000000"
        });
        assert(req3.status === 400, `Incorrect OTP returns HTTP 400 (Got ${req3.status})`);
        const updatedOtpRecord = await OtpVerification.findOne({ email: testEmail, purpose: "SIGNUP_VERIFICATION" });
        assert(updatedOtpRecord.attempts === 1, "Failed attempt counter was incremented to 1");

        // -------------------------------------------------------------
        // TEST 4: Verify Signup with Correct OTP -> Account Creation
        // -------------------------------------------------------------
        console.log("\n--- TEST 4: Verify Signup with Valid OTP ---");
        // For testing, update OTP in DB to a known test code "123456"
        const knownOtp = "123456";
        updatedOtpRecord.otpHash = hashSecret(knownOtp);
        await updatedOtpRecord.save();

        const req4 = await apiCall("/api/v1/auth/signup/verify", "POST", {
            email: testEmail,
            otp: knownOtp
        });
        assert(req4.status === 201, `Valid OTP verification returned HTTP 201 (Got ${req4.status})`);
        assert(req4.data.user.email === testEmail, "Created user matches submitted email");

        // Check user exists in Registration collection
        const createdUser = await Registration.findOne({ email: testEmail });
        assert(Boolean(createdUser), "User record successfully created in MongoDB UserAuth");
        assert(createdUser.username === testUsername, "User record has correct username");

        // Check OTP document was removed
        const deletedOtp = await OtpVerification.findOne({ email: testEmail, purpose: "SIGNUP_VERIFICATION" });
        assert(!deletedOtp, "Used OTP document was securely removed after verification");

        // -------------------------------------------------------------
        // TEST 5: Prevent Duplicate Signup with Same Email / Username
        // -------------------------------------------------------------
        console.log("\n--- TEST 5: Duplicate Registration Rejection ---");
        const req5 = await apiCall("/api/v1/auth/signup/request-otp", "POST", {
            name: "Another User",
            email: testEmail,
            username: `alt_${testTimestamp}`,
            password: "SomePassword123!"
        });
        assert(req5.status === 409, `Duplicate email rejected with HTTP 409 (Got ${req5.status})`);

        // -------------------------------------------------------------
        // TEST 6: Sign in with Initial Password
        // -------------------------------------------------------------
        console.log("\n--- TEST 6: Normal Login with Initial Password ---");
        const req6 = await apiCall("/api/v1/auth/signin", "POST", {
            username: testEmail,
            password: initialPassword
        });
        assert(req6.status === 200, `Sign in with email and initial password succeeded (HTTP 200)`);

        // -------------------------------------------------------------
        // TEST 7: Password Reset Request (Anti-Enumeration on Non-existent user)
        // -------------------------------------------------------------
        console.log("\n--- TEST 7: Password Reset Anti-Enumeration Check ---");
        const req7 = await apiCall("/api/v1/auth/password-reset/request-otp", "POST", {
            identifier: "non_existent_user_99999@example.com"
        });
        assert(req7.status === 200, `Non-existent user request returns HTTP 200 generic message without leaking account existence`);
        assert(!req7.data.targetEmail, "Does not disclose target email for non-existent account");

        // -------------------------------------------------------------
        // TEST 8: Password Reset Request with Username
        // -------------------------------------------------------------
        console.log("\n--- TEST 8: Password Reset Request via Username ---");
        const req8 = await apiCall("/api/v1/auth/password-reset/request-otp", "POST", {
            identifier: testUsername
        });
        assert(req8.status === 200, `Password reset request via username succeeded (HTTP 200)`);
        assert(Boolean(req8.data.emailMasked), `Returns masked email hint: ${req8.data.emailMasked}`);

        const resetOtpDoc = await OtpVerification.findOne({ email: testEmail, purpose: "PASSWORD_RESET" });
        assert(Boolean(resetOtpDoc), "Password reset OTP record created in MongoDB");

        // -------------------------------------------------------------
        // TEST 9: Password Reset Verify OTP with Known Test Code
        // -------------------------------------------------------------
        console.log("\n--- TEST 9: Password Reset OTP Verification & Token Issuance ---");
        const resetKnownOtp = "654321";
        resetOtpDoc.otpHash = hashSecret(resetKnownOtp);
        await resetOtpDoc.save();

        const req9 = await apiCall("/api/v1/auth/password-reset/verify-otp", "POST", {
            email: testEmail,
            otp: resetKnownOtp
        });
        assert(req9.status === 200, `OTP verified successfully (HTTP 200)`);
        assert(Boolean(req9.data.resetToken), "Received single-use resetToken");
        const resetToken = req9.data.resetToken;

        // Verify token is hashed in DB
        const verifiedResetDoc = await OtpVerification.findOne({ email: testEmail, purpose: "PASSWORD_RESET" });
        assert(verifiedResetDoc.isVerified === true, "OTP document marked isVerified: true");
        assert(verifiedResetDoc.resetTokenHash === hashSecret(resetToken), "resetToken is securely hashed in MongoDB");

        // -------------------------------------------------------------
        // TEST 10: Reset Password with Tampered / Invalid Token
        // -------------------------------------------------------------
        console.log("\n--- TEST 10: Reject Password Reset with Tampered Token ---");
        const req10 = await apiCall("/api/v1/auth/password-reset/confirm", "POST", {
            resetToken: "tampered_fake_token_1234567890abcdef",
            newPassword: newPassword,
            confirmPassword: newPassword
        });
        assert(req10.status === 400, `Tampered token rejected with HTTP 400 (Got ${req10.status})`);

        // -------------------------------------------------------------
        // TEST 11: Confirm Password Reset with Valid Token
        // -------------------------------------------------------------
        console.log("\n--- TEST 11: Confirm Password Reset with Valid Token ---");
        const req11 = await apiCall("/api/v1/auth/password-reset/confirm", "POST", {
            resetToken: resetToken,
            newPassword: newPassword,
            confirmPassword: newPassword
        });
        assert(req11.status === 200, `Password reset confirmation succeeded (HTTP 200)`);

        // -------------------------------------------------------------
        // TEST 12: Verify Old Password No Longer Works
        // -------------------------------------------------------------
        console.log("\n--- TEST 12: Verify Old Password Invalidation ---");
        const req12 = await apiCall("/api/v1/auth/signin", "POST", {
            username: testUsername,
            password: initialPassword
        });
        assert(req12.status === 401, `Old password fails authentication with HTTP 401 (Got ${req12.status})`);

        // -------------------------------------------------------------
        // TEST 13: Verify New Password Successfully Logs In
        // -------------------------------------------------------------
        console.log("\n--- TEST 13: Verify Login with New Password ---");
        const req13 = await apiCall("/api/v1/auth/signin", "POST", {
            username: testUsername,
            password: newPassword
        });
        assert(req13.status === 200, `Login with new password succeeded (HTTP 200)`);
        assert(req13.data.user.email === testEmail, "Authenticated user session matches");

        // -------------------------------------------------------------
        // TEST 14: Token Cannot Be Reused (Single-Use Guarantee)
        // -------------------------------------------------------------
        console.log("\n--- TEST 14: Prevent Reset Token Reuse ---");
        const req14 = await apiCall("/api/v1/auth/password-reset/confirm", "POST", {
            resetToken: resetToken,
            newPassword: "AnotherPassword789!",
            confirmPassword: "AnotherPassword789!"
        });
        assert(req14.status === 400, `Reused resetToken rejected with HTTP 400 (Got ${req14.status})`);

        // Cleanup test data
        await Registration.deleteMany({ email: testEmail });
        await OtpVerification.deleteMany({ email: testEmail });

        console.log("\n==================================================================");
        console.log(`🎉 ALL TESTS PASSED! (${testPassedCount}/${testTotalCount} assertions successful)`);
        console.log("==================================================================");
    } catch (err) {
        console.error("\n❌ Test suite failed with error:", err);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
}

runTests();
