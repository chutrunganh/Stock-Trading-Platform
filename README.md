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
      <td rowspan="4">1. Password Authentication</td>
      <td>🟢 Enforce password policy</td>
      <td>
        Verified at both frontend and backend this policy:
        <ul>
            <li> Password length: 6–72 characters.
            <li> At least 1 uppercase letter, 1 number, and 1 special character (<code>@$!%*?&</code>)
            <li> Must not contain 3 or more consecutive characters from the username.
        </ul>
        <i>This password policy is a simplified version from
        <a href="https://www.vndirect.com.vn/tin_vndirect/thong-bao-thay-doi-mat-khau-giao-dich-dinh-ky/" target="_blank">VNDIRECT Securities JSC</a>.</i>
      </td>
    </tr>
    <tr>
      <td>🟢 Secure password storage</td>
      <td>Use <code>bcrypt</code> for salting + slow hashing when storing passwords.</td>
    </tr>
    <tr>
      <td>🟢 Prevention of password guessing</td>
      <td>Use CAPTCHA provided by <code>Cloudflare Turnstile</code> service to block spam/automated logins. Validate on both frontend and backend.</td>
    </tr>
    <tr>
      <td>🟢 Password recovery</td>
      <td>
        Send OTPs to the user's email with expiration. For demo, we use <code>Ethereal</code> email. OTPs are 8 characters (mixed lower, upper case and numbers), expiry in 1 minute (testing only), generated with <code>otp-generator</code> dependency.
      </td>
    </tr>
    <tr>
      <td rowspan="3">2. Session Authentication & Management</td>
      <td>🟢 Secure mechanisms for using access tokens: prevention of tampering and guessing, expiration control</td>
      <td>
    Use <code>JWT</code> with short-lived Access Tokens (expiry in1 minute for testing) and longer-lived Refresh Tokens (expiry in 7 days).  
    Tokens include a timestamp in the payload before signing to ensure uniqueness on every login.  
    Return tokens to the client via cookies with the following security attributes:  
    <ul>
      <li><code>Secure</code> (enabled in production only)</li>
      <li><code>HttpOnly</code></li>
      <li><code>SameSite='Strict'</code></li>
    </ul>
    On logout or browser close, clear all cookies on the client and revoke the Refresh Token on the server.
  </td>
    </tr>
    <tr>
      <td>🟢 CSRF defense</td>
      <td>
      <ul>
        <li> Only allow requests from the frontend origin using:
        <pre><code>app.use(cors({
  origin: process.env.FE_URL}));</code></pre>
        We do not provide public API. 
        <li> Cookies with <code>SameSite='Strict'</code> property.
        </ul>
      </td>
    </tr>
    <tr>
      <td>🟢 Session hijacking defense</td>
      <td>Using cookies as mentioned above</td>
    </tr>
    <tr>
  <td>3. Authorization</td>
  <td>🟢 Implement suitable access control: MAC, DAC, RBAC</td>
  <td>
    Implemented <strong>Role-Based Access Control (RBAC)</strong> using middleware to restrict access to specific routes based on user roles.  
    The application currently supports two roles: <code>user</code> and <code>admin</code>.  
    <ul>
      <li>Public guests: Can access <em>Home</em> and <em>Tutorial</em> pages.</li>
      <li>Logged-in users: Can additionally access <em>Trade</em> and <em>Portfolio</em> pages.</li>
      <li>Admins: Can additionally access <em>Admin</em> page.</li>
    </ul>
  </td>
</tr>
    <tr>
      <td rowspan="4">4. Input Validation & Output Sanitization</td>
      <td>[ ] Input validation and sanitization</td>
      <td>Middleware handles input checks before requests reach services. Suggest adding CSP headers for output filtering and XSS mitigation.</td>
    </tr>
    <tr>
      <td>🟢 Protection against injection attacks</td>
      <td>
        <ul>
          <li>Use parameterized queries with placeholders like <code>$1</code> for SQL to prevent injections.
          <li> Config <code>CSP (Content Security Policy)</code> with <code>helmet</code> dependency to limit resource that browser can load.
        </ul>
      </td>
    </tr>
    <tr>
      <td>[-] Prevention of path traversal</td>
      <td>Implement access control to avoid IDOR (e.g., user A accessing user B's resources).</td>
    </tr>
    <tr>
      <td>🟡 File upload restriction</td>
      <td>No file upload functionality in current app version.</td>
    </tr>
    <tr>
      <td rowspan="3">5. Sensitive Information Leakage</td>
      <td>[ ] Minimization of sensitive information leakage about servers, software, and applications</td>
      <td></td>
    </tr>
    <tr>
      <td>🟢  Minimization of sensitive information leakage in response</td>
      <td>Turn off <code>X-Powered-By</code> in HTTP response header through using <code>helmet</code> dependency. This header is set by default in Express and some other frameworks to indicate the frameworks that the server is using</td>
    </tr>
    <tr> 
    <td>🟢 Mitigate Clickjacking</td>
    <td>Set <code>X-Frame-Options: DENY</code> in HTTP response header through using <code>helmet</code> dependency to prevent website to be embeded into other sites using iframe tag </td>
    </tr>
    <tr>
      <td rowspan="3">6. Compliance with Standards</td>
      <td>🟢 HTTPS implementation</td>
      <td>Use <code>Cloudflare Tunnels</code> to public web service and get free SSL</td>
    </tr>
    <tr>
      <td>[-] Mitigation of DoS attacks</td>
      <td>Requests pass through Cloudflare proxy. Still need rate-limiting and monitoring.</td>
    </tr>
    <tr>
      <td>🟢 Secure storage and management of sensitive values</td>
      <td>Use Environment Variables file (<code>.env</code>)</td>
    </tr>
    <tr>
      <td rowspan="2">7. Security Testing</td>
      <td>[-] Code review with automated tools</td>
      <td>Planned use of Qodana from Jetbrains</td>
    </tr>
    <tr>
      <td>[-] Penetration testing with tools</td>
      <td>To be done using ZAP Proxy, RAF DAS, Nikto.</td>
    </tr>
    <tr>
      <td rowspan="4">8. Bonus</td>
      <td>🟢 Multi-factor authentication</td>
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
      <td>🟢 Single Sign-On (SSO)</td>
      <td>Implemented Google OAuth 2.0 using <code>passport</code> dependency</td>
    </tr>
  </tbody>
</table>


Status: 🟡	🔴