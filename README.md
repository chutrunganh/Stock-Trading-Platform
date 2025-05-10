> [!IMPORTANT]
> This repository is sting under development and not reflecting the final project yet.

# Security checklist

<table border="1">
  <tr>
    <th>Criteria</th>
    <th>Requirements</th>
    <th>Solution</th>
  </tr>
  <tr>
    <td>Password Authentication</td>
    <td> [x] Enforcing password policy</td>
   <td>
      Length 6-72 characters with at least 1 capital, 1 number and 1 special character (@$!%*?&).<br>
      Must not contain any part of the username (3 or more consecutive characters).<br>
      Password must be verified at both frontend and backend.<br>
      <i>This password policy is a simplified version of the one enforced by 
      <a href="https://www.vndirect.com.vn/tin_vndirect/thong-bao-thay-doi-mat-khau-giao-dich-dinh-ky/" target="_blank">
        VNDIRECT Securities Joint Stock Company</i>
      </a>.
    </td>
  </tr>
  <tr>
    <td></td>
    <td> [x] Secure password storage</td>
    <td> Using <code>bcrypt</code> for slow hashing + salting password when storing to database</td>
  </tr>
  <tr>
    <td></td>
    <td> [x] Prevention of password guessing</td>
    <td> Using <code>Cloudflare Turnstile</code> service to prevent automated/spam attacks (verify at both backend and frontend)</td>
  </tr>
  <tr>
    <td></td>
    <td> [ ] Password recovery</td>
    <td> Sends OTPs to user email account with expiration time (Using <code>Ethereal</code> email service insteal of sending real email for demo puspose only). How to prevent bruce force OTP, calculate this????</td>
  </tr>
  <tr>
    <td>Session Authentication and Management</td>
    <td>[ ] Secure mechanisms for using access tokens: prevention of tampering and guessing, expiration control, etc</td>
    <td>Using <code>JWT</code> with timestamp (To prevent generate the same token when login two times). Need mechanism to end session, like when close session when close brower. Return JWT in Cookie with <code>Secure</code> and <code>HTTP ONly</code>, <code>sameSite: 'strict'</code> propertities enable</td>
  </tr>
  <tr>
    <td></td>
    <td>[x] CSRF Defense</td>
    <td> Same site orgin with set <code>app.use(cors({
  origin: process.env.FE_URL
}));</code> in the code to only allow requests from the frontend application. We do not provide public API.</td>
  </tr>
  <tr>
    <td></td>
    <td>- Session hijacking defense</td>
    <td></td>
  </tr>
  <tr>
    <td>Authorization</td>
    <td>- Implement suitable access control: MAC, DAC, RBAC</td>
    <td>RBAC (User, Admin)</td>
  </tr>
  <tr>
    <td>Input Validation and Output Sanitization</td>
    <td> [ ] Input validation and sanitization</td>
    <td>Handle all input fields to prevent payload attacks: with inputs fields will be check my middlewares before request can reach the service. Need defend in depth?, Filter output also with XSS since we may miss some input -> Use CSP header</td>
  </tr>
  <tr>
    <td></td>
    <td>[x] Protection against Injection attacks</td>
    <td>With SQL injectiosn, all query that receive parameter directly from the frontend use placeholder <code>$</code> when pass to SQL Query</td>
  </tr>
  <tr>
    <td></td>
    <td>- Prevention of path traversal, directory indexing</td>
    <td>Prevent access by ID (Idoor), A login using A accpount but can access to B index resources</td>
  </tr>
  <tr>
    <td></td>
    <td>[-] Upload file restriction</td>
    <td>Our app does not have file upload functionality</td>
  </tr>
  <tr>
    <td></td>
    <td>- etc</td>
    <td></td>
  </tr>
  <tr>
    <td>Prevention of sensitive information leakage</td>
    <td>- Minimization of sensitive information leakage about servers, software, and applications</td>
    <td>Classify data (e.g., confidential, internal, public)</td>
  </tr>
  <tr>
    <td></td>
    <td>- Minimization of sensitive information leakage in response</td>
    <td>Apply least privilege access control (users only see what they need)</td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td>Implement RBAC (Role-Based Access Control) for granular control</td>
  </tr>
  <tr>
    <td>Compliance with Other Security Standards</td>
    <td>[x] HTTPS implementation</td>
    <td>Cloudflare Tunnels to public web to internet and get free SSL</td>
  </tr>
  <tr>
    <td></td>
    <td>- Mitigation of DoS attacks</td>
    <td>Using Cloudfalre Tunnels that make reqest go through Cloudflare proxy -> Incase not brucefore the server respource, but with our Cloudflare paid bandwidth, still need a active control the number of request</td>
  </tr>
  <tr>
    <td></td>
    <td>- Secure storage and management of sensitive values</td>
    <td></td>
  </tr>
  <tr>
    <td>Security Testing</td>
    <td>Source code review, using automated tools like SonarQube, RAF-Scanner</td>
    <td>to be continued</td>
  </tr>
  <tr>
    <td></td>
    <td>- Basic penetration testing, using automated tools like ZAP Proxy, RAF DAS, Nikto</td>
    <td></td>
  </tr>
  <tr>
    <td>Bonus</td>
    <td>- Implementation of multi-factor authentication</td>
    <td>- Sends OTP to email</td>
  </tr>
  <tr>
    <td></td>
    <td>- Advanced session hijacking prevention: detection of access from unfamiliar devices, browsers, or IPs, prevention of cookie reuse</td>
    <td>- Track user's IP</td>
  </tr>
  <tr>
    <td></td>
    <td>- Advanced HTTP Flood prevention mechanisms</td>
    <td>- CDN in Cloudflare</td>
  </tr>
  <tr>
    <td></td>
    <td>[x] Single Sign-On (SSO)</td>
    <td>Using Google OAuth 2.0 service</td>
  </tr>
</table>

# Features

