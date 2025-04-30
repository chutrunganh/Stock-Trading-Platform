import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; 2025, Stock Market Simulator</p>
        <nav className="footer-nav">
          <a href="#">Terms of Use</a>
          <span>|</span>
          <a href="#">Privacy Policy</a>
          <span>|</span>
          <a href="#">Help Center</a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;