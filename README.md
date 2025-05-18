> [!IMPORTANT]
> This repository is still under development and does not yet reflect the final project.

<div style="text-align: center;">
  <img src="docs/images/banner.png" alt="Banner" style="max-width: 70%; height: auto;">
</div>

<!-- PROJECT LOGO -->

<br />

<div align="center">

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=30&pause=1000&color=36D253&center=true&vCenter=true&width=435&lines=Soict+Stock+Trading)](https://git.io/typing-svg)

</div>

<div>

  <p align="center">
    <b>A stock trading simulator built for beginners. Learn to trade without the risk</b>
    <br />
    <a href=""><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#-usage-and-demo">Usage</a>
    ·
    <a href="">Report Bug</a>
    ·
    <a href="">Request Feature</a>
  </p>
</div>



<a id="readme-top"></a>

# 📝Overview 

Title: Soict Stock Trading Platform

Brief introduction

## 🛠️ Technology Stack

The project is built with the following technologies:

- **Backend:** 

<div>
  <img src="docs/images/NodeJS-Light.svg" alt="NodeJS" width="60" height="60">
  <img src="docs/images/express.png" alt="Express" width="60" height="60">
  <img src="docs/images/Yarn-Light.svg" alt="React" width="60" height="60">
  <img src="docs/images/PostgreSQL-Light.svg" alt="Postgres" width="60" height="60">
</div>

- **Frontend:**

<div>
  <img src="docs/images/React-Light.svg" alt="React" width="60" height="60">
  <img src="docs/images/Vite-Light.svg" alt="Vite" width="60" height="60">
  <img src="docs/images/mui.png" alt="Material UI" width="60" height="60">
</div>

- **Deployment:**

<div>
  <img src="docs/images/Docker.svg" alt="Docker" width="60" height="60">
  <img src="docs/images/Nginx.png" alt="Nginx" width="60" height="60">
  <img src="docs/images/Cloudflare-Light.svg" alt="Cloudflare" width="60" height="60">
</div>


# 📖 Usage and Demo

# 🚀 Installation & Setup

# 🏗️ Project Structure

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
        Refer to <a href="app\backend\src\utils\passwordUtil.js"><code>passwordUtils.js</code></a>  for implementations. <br>
        <i>This password policy is a simplified version from
        <a href="https://www.vndirect.com.vn/tin_vndirect/thong-bao-thay-doi-mat-khau-giao-dich-dinh-ky/" target="_blank">VNDIRECT Securities JSC</a>.</i>
      </td>
    </tr>
    <tr>
      <td>🟢 Secure password storage</td>
      <td>Use <code>bcrypt</code> for salting + slow hashing when storing passwords. Refer to <a href="app\backend\src\services\security\userAuthService.js"><code>userAuthService.js</code></a>  for implementations.
      </td>
    </tr>
    <tr>
      <td>🟢 Prevention of password guessing</td>
      <td>Use CAPTCHA provided by <code>Cloudflare Turnstile</code> service to block spam/automated logins. Validate on both frontend and backend.  Refer to <a href="app\backend\src\services\security\turnstileService.js"><code>turnstileService.js</code></a>  for implementations.</td>
    </tr>
    <tr>
      <td>🟢 Password recovery</td>
      <td>
        Send OTPs to the user's email with expiration. For demo, we use <code>Ethereal</code> email. OTPs are 8 characters (mixed lower, upper case and numbers), expiry in 1 minute (testing only), generated with <code>otp-generator</code> dependency. Refer to <a href="app\backend\src\services\security\otpService.js"><code>otpService.js</code></a>, <a href="app\backend\src\services\security\userAuthService.js"><code>userAuthService.js</code></a>, <a href="app\frontend\src\context\AuthContext.jsx"><code>AuthContext.jsx</code></a>  for implementations.
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
    On logout or browser close, clear all cookies on the client and revoke the Refresh Token on the server. Refer to <a href="app\backend\src\utils\jwtUtil.js"><code>jwtUtil.js</code></a>, <a href="app\backend\src\utils\setCookieUtil.js"><code>setCookieUtil.js</code></a>, <a href="app\backend\src\middlewares\authenticationMiddleware.js"><code>authenticationMiddleware.js</code></a>,  <a href="app\frontend\src\context\AuthContext.jsx"><code>AuthContext.jsx</code></a>   for implementations.
  </td>
    </tr>
    <tr>
      <td>🟢 CSRF defense</td>
      <td>
      <ul>
        <li> Only allow requests from the frontend origin using: (in the <a href="app\backend\src\index.js"><code>index.js</code></a> )
        <pre><code>app.use(cors({
  origin: process.env.FE_URL}));</code></pre>
        We do not provide public API. 
        <li> Cookies with <code>SameSite='Strict'</code> property.
        </ul>
      </td>
    </tr>
    <tr>
      <td>🟢 Session hijacking defense</td>
      <td>Using tokens with cookies as mentioned above</td>
    </tr>
    <tr>
  <td>3. Authorization</td>
  <td>🟢 Implement suitable access control: MAC, DAC, RBAC</td>
  <td>
    Implemented <strong>Role-Based Access Control (RBAC)</strong> with permission matrix: <pre><code>
    const ROLE_PERMISSIONS = {
      [ROLE_HIERARCHY.ADMIN]: {
        canAccessAdminDashboard: true,
        canControlTradingSession: true
      },
      [ROLE_HIERARCHY.USER]: {
        canAccessAdminDashboard: false,
        canControlTradingSession: false
      }
    };
    </code></pre> 
    The application currently supports two roles: <code>user</code> and <code>admin</code>.  
    <ul>
      <li>Public guests: Can access <em>Home</em> and <em>Tutorial</em> pages.</li>
      <li>Logged-in users: Can additionally access <em>Trade</em> and <em>Portfolio</em> pages.</li>
      <li>Admins: Can additionally access <em>Admin</em> page.</li>
    </ul>
     Refer to <a href="app\backend\src\middlewares\roleBasedAccessControlMiddleware.js"><code>roleBasedAccessControlMiddleware.js</code></a>  for implementations.
  </td>
  </tr>
    <tr>
      <td rowspan="4">4. Input Validation & Output Sanitization</td>
      <td>🟢 Input validation and sanitization</td>
      <td>
      User input is validated and sanitized using middleware located in 
      <a href="app\backend\src\middlewares\userValidationMiddleware.js"><code>userValidationMiddleware.js</code></a> 
      (used for login, registration, and password reset forms), 
      <a href="app\backend\src\middlewares\orderMiddleware.js"><code>orderMiddleware.js</code></a>, 
      and 
      <a href="app\backend\src\middlewares\tradingSessionMiddleware.js"><code>tradingSessionMiddleware.js</code></a> 
      (used for enforcing order constraints).
      <br><br>
      Response data is filtered using 
      <a href="app\backend\src\middlewares\responseSanitizationMiddleware.js"><code>responseSanitizationMiddleware.js</code></a> 
      and 
      <a href="app\backend\src\middlewares\errorHandlerMiddleware.js"><code>errorHandlerMiddleware.js</code></a>.
      <br><br>
      We use the <code>joi</code> and <code>xss</code> libraries for input and output sanitization. 
      In addition, a Content Security Policy (CSP) is configured to restrict the types of resources the browser can load.
  </td>
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
      <td>Disable <code>X-Powered-By</code> in HTTP response header through using <code>helmet</code> dependency. This header is set by default in Express and some other frameworks to reveals which framework the server is using, which can aid attackers during reconnaissance</td>
    </tr>
    <tr> 
    <td>🟢 Mitigate Clickjacking</td>
    <td>Set <code>X-Frame-Options: DENY</code> in HTTP response header through using <code>helmet</code> dependency to prevent website to be embeded into other sites using <code>iframe</code> tag </td>
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


*Status:🟢: Done  |  🟡: Partially done or no need	 |  🔴: Not implement yet*

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
# 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

For the success of this project, I want a special thanks to:

- **Project supervisor**: MSc. Bùi Trọng Tùng, Dr. Đỗ Bá Lâm
- **Team members**:

  | Name | Student ID |
  |:--|:--|
  | Chu Trung Anh (team leader)| 20225564 |
  | Bùi Duy Anh | 20225563 |
  | Phạm Mạnh Tiến| 20225555 |


<!-- LICENSE -->
# 📜 License

[![License: Apache-2.0](https://img.shields.io/badge/License-%20Apache%202.0-red)](https://www.apache.org/licenses/LICENSE-2.0)


Distributed under the Apache-2.0 License License. See `LICENSE` for more information.



<!-- CONTACT -->
# 📧 Contact

This project is maintained by: Chu Trung Anh - [Email](mailto:chutrunganh04@gmail.com).

Feel free to contact me if you have any question or suggestion.

<p align="right">(<a href="#readme-top">back to top</a>)</p>