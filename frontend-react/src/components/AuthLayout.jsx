import { Link } from "react-router-dom";
import { MdHelpOutline } from "react-icons/md";

// Centered card used by the logged-out pages (login, register, password reset)
export default function AuthLayout({ children }) {
    return (
        <main className="auth-page">
            <div className="panel auth-card">
                <Link to="/about" className="auth-help" aria-label="How to play">
                    <MdHelpOutline size={26} />
                </Link>
                <img className="auth-logo" src="/logo.png" alt="Light the Lamp" />
                {children}
            </div>
        </main>
    );
}
