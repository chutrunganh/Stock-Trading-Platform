> [!IMPORTANT]
> This repository is still under development and does not yet reflect the final project.

# 🔐 Security Checklist


<table border=2>
  <thead>
    <tr>
      <th>Criteria</th>
      <th>Requirements</th>
      <th>Solution</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4">Password Authentication</td>
      <td>[x] Enforce password policy</td>
      <td>
        - Password length: 6–72 characters.<br>
        - At least 1 uppercase letter, 1 number, and 1 special character (<code>@$!%*?&</code>).<br>
        - Must not contain 3 or more consecutive characters from the username.<br>
        - Verified at both frontend and backend.<br>
        <i>This password policy is a simplified version from
        <a href="https://www.vndirect.com.vn/tin_vndirect/thong-bao-thay-doi-mat-khau-giao-dich-dinh-ky/" target="_blank">VNDIRECT Securities JSC</a>.</i>
      </td>
    </tr>
    <tr>
      <td>[x] Secure password storage</td>
      <td>Use <code>bcrypt</code> with salting for slow hashing when storing passwords.</td>
    </tr>
    <tr>
      <td>[x] Prevention of password guessing</td>
      <td>Use <code>Cloudflare Turnstile</code> to block spam/automated logins. Validate on both frontend and backend.</td>
    </tr>
    <tr>
      <td>[x] Password recovery</td>
      <td>
        Send OTPs to the user's email with expiration. For demo, use <code>Ethereal</code> email. OTPs are 8 characters (mixed lower and upper case + numbers), generated with <code>otp-generator</code> dependency.
      </td>
    </tr>
    <tr>
      <td rowspan="3">Session Authentication & Management</td>
      <td>[x] Secure access tokens</td>
      <td>
        Use <code>JWT</code>: Access token (1 min expiry for testing), refresh token (7 days). Store in cookies with <code>Secure</code>, <code>HttpOnly</code>, and <code>SameSite='Strict'</code>. Clear cookies on logout or browser close.
      </td>
    </tr>
    <tr>
      <td>[x] CSRF defense</td>
      <td>
        Only allow requests from the frontend origin using:
        <pre><code>app.use(cors({
  origin: process.env.FE_URL}));</code></pre>
        No public API provided.
      </td>
    </tr>
    <tr>
      <td>[-] Session hijacking defense</td>
      <td>(To be implemented)</td>
    </tr>
    <tr>
      <td>Authorization</td>
      <td>[x] Implement access control: MAC, DAC, RBAC</td>
      <td>Implemented RBAC with middleware to restrict admin routes to admin users only.</td>
    </tr>
    <tr>
      <td rowspan="4">Input Validation & Output Sanitization</td>
      <td>[ ] Input validation and sanitization</td>
      <td>Middleware handles input checks before requests reach services. Suggest adding CSP headers for output filtering and XSS mitigation.</td>
    </tr>
    <tr>
      <td>[x] Protection against injection attacks</td>
      <td>Use parameterized queries with placeholders like <code>$1</code> for SQL to prevent injections.</td>
    </tr>
    <tr>
      <td>[-] Prevention of path traversal</td>
      <td>Implement access control to avoid IDOR (e.g., user A accessing user B's resources).</td>
    </tr>
    <tr>
      <td>[-] File upload restriction</td>
      <td>No file upload functionality in current app version.</td>
    </tr>
    <tr>
      <td rowspan="2">Sensitive Information Leakage</td>
      <td>[-] Minimize system info exposure</td>
      <td>Classify data into Confidential, Internal, and Public.</td>
    </tr>
    <tr>
      <td>[-] Limit sensitive info in responses</td>
      <td>Apply least privilege principle: only necessary data is returned per role.</td>
    </tr>
    <tr>
      <td rowspan="3">Compliance with Standards</td>
      <td>[x] HTTPS implementation</td>
      <td>Use Cloudflare Tunnels to expose local app with HTTPS.</td>
    </tr>
    <tr>
      <td>[-] Mitigation of DoS attacks</td>
      <td>Requests pass through Cloudflare proxy. Still need rate-limiting and monitoring.</td>
    </tr>
    <tr>
      <td>[-] Secure storage of secrets</td>
      <td>(To be implemented)</td>
    </tr>
    <tr>
      <td rowspan="2">Security Testing</td>
      <td>[-] Code review with automated tools</td>
      <td>Planned use of SonarQube and RAF-Scanner.</td>
    </tr>
    <tr>
      <td>[-] Penetration testing with tools</td>
      <td>To be done using ZAP Proxy, RAF DAS, Nikto.</td>
    </tr>
    <tr>
      <td rowspan="4">Bonus</td>
      <td>[x] Multi-factor authentication</td>
      <td>
        After enter correct username/email and password, OTP is sent to user's email. OTP must be valid and unexpired. We also have "Remember device in ...  time" implemented to skip OTP next time login. Devices are idntified by using <code>fingerprintJS</code> dependency (free version).
      </td>
    </tr>
    <tr>
      <td>[-] Advanced session hijacking prevention</td>
      <td>Track user IPs, detect unfamiliar devices/browsers.</td>
    </tr>
    <tr>
      <td>[-] Advanced HTTP flood prevention</td>
      <td>Use Cloudflare CDN to absorb excessive traffic.</td>
    </tr>
    <tr>
      <td>[x] Single Sign-On (SSO)</td>
      <td>Implemented using Google OAuth 2.0.</td>
    </tr>
  </tbody>
</table>
