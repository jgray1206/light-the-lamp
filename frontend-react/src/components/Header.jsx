import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import Navbar from "react-bootstrap/Navbar";
import { MdMenu } from "react-icons/md";
import { useAuth } from "../lib/auth";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    const { token, isAdmin } = useAuth();

    return (
        <Navbar className="app-navbar" data-bs-theme="dark" sticky="top">
            <Container>
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
                    <img src="/pwa-64x64.png" width="36" height="36" alt="" className="brand-logo" />
                    <span className="brand-name">Light the Lamp</span>
                </Navbar.Brand>
                <div className="d-flex align-items-center gap-1">
                    <ThemeToggle />
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="link" className="icon-btn no-caret" aria-label="Menu">
                            <MdMenu size={26} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {token ? (
                                <>
                                    <Dropdown.Item as={Link} to="/notifications">Notifications</Dropdown.Item>
                                    {isAdmin && <Dropdown.Item as={Link} to="/announcers">Announcers</Dropdown.Item>}
                                </>
                            ) : (
                                <Dropdown.Item as={Link} to="/login">Log in</Dropdown.Item>
                            )}
                            <Dropdown.Item as={Link} to="/about">How to play</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item href="mailto:grayio.lightthelamp@gmail.com">Found a bug?</Dropdown.Item>
                            <Dropdown.Item href="https://ko-fi.com/I2I8OUVUZ" target="_blank" rel="noopener">
                                Support on Ko-fi
                            </Dropdown.Item>
                            {token && (
                                <>
                                    <Dropdown.Divider />
                                    <Dropdown.Item as={Link} to="/logout">Log out</Dropdown.Item>
                                </>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </Container>
        </Navbar>
    );
}
