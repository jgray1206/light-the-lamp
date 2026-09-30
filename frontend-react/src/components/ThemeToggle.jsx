import Button from "react-bootstrap/Button";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";
import { useTheme } from "../lib/theme";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const dark = theme === "dark";
    return (
        <Button variant="link" className="icon-btn" onClick={toggleTheme}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <MdOutlineLightMode size={22} /> : <MdOutlineDarkMode size={22} />}
        </Button>
    );
}
