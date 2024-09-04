import Container from 'react-bootstrap/Container';

export default function Footer(props) {
    return (
        <>
            <footer className="footer fixed-bottom navbar-dark navbar-bg">
                <Container>
                    <a style={{ color: 'white' }} href="mailto:grayio.lightthelamp@gmail.com">Found a bug?</a>
                    <a
                        id="kofi-anchor" href='https://ko-fi.com/I2I8OUVUZ' target='_blank'><img height='32' id="kofi-img"
                            src='https://storage.ko-fi.com/cdn/kofi2.png?v=3'
                            border='0'
                            alt="Increase your NHL team's karma" /></a>
                </Container>
            </footer >
        </>
    );
}