import Container from 'react-bootstrap/Container';
import Form from "react-bootstrap/Form";
import {useState} from "react";
import {MdOutlineDarkMode, MdOutlineLightMode} from "react-icons/md";

export default function Footer(props) {
    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = theme => localStorage.setItem('theme', theme)
    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    const [isDarkMode, setIsDarkMode] = useState(getPreferredTheme() === 'dark');
    const handleThemeToggle = () => {
        if (isDarkMode) {
            document.documentElement.setAttribute('data-bs-theme', 'light')
            setStoredTheme('light')
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'dark')
            setStoredTheme('dark')
        }
        setIsDarkMode(!isDarkMode);
    };

    return (
        <>
            <footer className="footer fixed-bottom navbar-dark navbar-bg"
                    style={{height: 'calc( 32px + env(safe-area-inset-bottom) )'}}>
                <Container className="d-flex justify-content-between align-items-center">
                    <a style={{color: 'white'}} href="mailto:grayio.lightthelamp@gmail.com">Found a bug?</a>
                    <Form.Check
                        style={{color: 'white'}}
                        className="text-center"
                        type="switch"
                        id="darkMode">
                        <Form.Check.Input checked={isDarkMode} onChange={handleThemeToggle} type="checkbox"/>
                        <Form.Check.Label>{isDarkMode ?
                            <MdOutlineDarkMode size={24} style={{verticalAlign: 'bottom'}}/>
                            : <MdOutlineLightMode size={24} style={{verticalAlign: 'bottom'}}/>}</Form.Check.Label>
                    </Form.Check>
                    <a
                        id="kofi-anchor" href='https://ko-fi.com/I2I8OUVUZ' target='_blank'><img height='32'
                                                                                                 id="kofi-img"
                                                                                                 src='https://storage.ko-fi.com/cdn/kofi2.png?v=3'
                                                                                                 border='0'
                                                                                                 alt="Increase your NHL team's karma"/></a>
                </Container>
            </footer>
        </>
    );
}