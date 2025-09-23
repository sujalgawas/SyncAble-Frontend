import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Logo from '../assets/Logo2.png'; 

const Header = () => {
  return (
    <Navbar
      expand="lg"
      variant="dark"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(6px)' }}
      sticky="top"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center logo">
          <img src={Logo} alt="SyncAble Logo" className="logo-img me-2" />
          <span>SyncAble</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/auth?role=student">Student Portal</Nav.Link>
            <Nav.Link as={Link} to="/auth?role=teacher">Teacher Portal</Nav.Link>
            <Nav.Link href="#features">Features</Nav.Link>
            <Nav.Link href="#contact">Contact</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
