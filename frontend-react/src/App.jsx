import React from 'react';
import { Outlet } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Container from 'react-bootstrap/Container';
import './App.css'
import { Card } from 'react-bootstrap';

export default function App() {
  return (
    <div>
      <Header />
      <Container className="p-3">
        <Card className="shadow">
          <Card.Body>
            <Outlet />
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </div>
  );
}