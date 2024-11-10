import { useRouteError } from "react-router-dom";
import Header from '../components/Header'
import Footer from '../components/Footer'
import Container from 'react-bootstrap/Container';
import '../App.css'
import { Card } from 'react-bootstrap';

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);
  return (
    <>
      <Header />
      <Container className="p-3">
        <Card className="shadow">
          <Card.Body>
            <div id="error-page">
              <h1>Oops!</h1>
              <p>Sorry, an unexpected error has occurred. Please try again later.</p>
            </div>
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </>
  );
}