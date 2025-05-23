// Test UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const testCases = [
    // Valid UUIDs
    { value: "dbf86696-4e05-4416-87cb-fb9bfece948c", expected: true },
    { value: "0367bd2f-aaa0-4d2a-8424-72876abefa41", expected: true },
    
    // Invalid UUIDs  
    { value: "123e4567-e89b-12d3-a456-426614174000-invalid", expected: false },
    { value: "invalid-uuid-format", expected: false },
    { value: "'; DROP TABLE portfolios; --", expected: false },
    { value: "<script>alert('xss')</script>", expected: false },
    { value: "../../../etc/passwd", expected: false },
    { value: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", expected: false },
    { value: "", expected: false },
    { value: "12345678-1234-5678-9abc-123456789abc", expected: true }, // This should be valid format but non-existent
];

console.log("UUID Regex Validation Test:");
console.log("==========================");

testCases.forEach((test, index) => {
    const result = uuidRegex.test(test.value);
    const status = result === test.expected ? "✅ PASS" : "❌ FAIL";
    console.log(`Test ${index + 1}: ${status}`);
    console.log(`  Value: "${test.value}"`);
    console.log(`  Expected: ${test.expected}, Got: ${result}`);
    console.log();
}); 