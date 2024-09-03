import { LinkContainer } from 'react-router-bootstrap'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useAuth } from "../provider/authProvider";

export default function Header(props) {
    const { isAdmin } = useAuth();

    return (
        <>
            <style type="text/css">
                {`
    #basic-nav-dropdown, #collapsible-nav-dropdown {
      font-size: 1.25rem;
      border-radius: .3rem;
      color: white;
    }
    .navbar-nav .dropdown-menu {
      position: absolute;
    }
    `}
            </style>
            <Navbar expand="lg" className="navbar-bg">
                <Container>
                    <LinkContainer to='/'>
                        <Navbar.Brand><img src="./logo.png" width="85" height="85" alt="" /></Navbar.Brand>
                    </LinkContainer>
                    <Nav>
                        <NavDropdown align="end" title="Menu" id="basic-nav-dropdown">
                            <LinkContainer to="/">
                                <NavDropdown.Item>Picks</NavDropdown.Item>
                            </LinkContainer>

                            <LinkContainer to="/leaderboard">
                                <NavDropdown.Item>Leaderboard</NavDropdown.Item>
                            </LinkContainer>

                            {isAdmin() && <LinkContainer to="/announcers">
                                <NavDropdown.Item>Announcers</NavDropdown.Item>
                            </LinkContainer>}

                            <LinkContainer to="/friends">
                                <NavDropdown.Item>Friends</NavDropdown.Item>
                            </LinkContainer>

                            <LinkContainer to="/profile">
                                <NavDropdown.Item>Profile</NavDropdown.Item>
                            </LinkContainer>

                            <LinkContainer to="/about">
                                <NavDropdown.Item>About</NavDropdown.Item>
                            </LinkContainer>

                            <LinkContainer to="/logout">
                                <NavDropdown.Item>Logout</NavDropdown.Item>
                            </LinkContainer>
                        </NavDropdown>
                    </Nav>
                </Container>
            </Navbar>
        </>
    );
}