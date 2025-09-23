import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col } from 'react-bootstrap';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const role = params.get('role'); // 'student' or 'teacher'

  const [isLogin, setIsLogin] = useState(true); // toggle between login and register
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    course: '',
    department: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // You can replace this with real API calls
    console.log('Form submitted:', formData);

    // Redirect after login/register
    if (role === 'student') {
      navigate('/student');
    } else if (role === 'teacher') {
      navigate('/teacher');
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="p-4 shadow-sm">
            <h2 className="text-center mb-4">
              {isLogin ? 'Login' : 'Register'} as {role?.toUpperCase()}
            </h2>

            <Form onSubmit={handleSubmit}>
              {!isLogin && role === 'student' && (
                <Form.Group className="mb-3">
                  <Form.Label>Course</Form.Label>
                  <Form.Select
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your course</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Tech">B.Tech</option>
                  </Form.Select>
                </Form.Group>
              )}

              {!isLogin && role === 'teacher' && (
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter your department"
                    required
                  />
                </Form.Group>
              )}

              {!isLogin && (
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100 mb-3">
                {isLogin ? 'Login' : 'Register'}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Auth;
