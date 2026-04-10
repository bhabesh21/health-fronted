import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

function isValidEmail(value) {
  const v = String(value || "").trim();
  return /\S+@\S+\.\S+/.test(v);
}

export default function Signup() {
  const navigate = useNavigate();

  const API_BASE_URL = useMemo(
    () =>
      (
        import.meta.env.VITE_API_BASEURL ||
        import.meta.env.api_baseurl ||
        "http://localhost:5000/api"
      ).replace(/\/+$/, ""),
    []
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};

    if (!String(form.name || "").trim()) next.name = "Name is required";

    if (!form.email || !isValidEmail(form.email)) {
      next.email = "Enter a valid email";
    }

    if (!form.password) {
      next.password = "Password is required";
    } else if (String(form.password).length < 6) {
      next.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      next.confirmPassword = "Confirm your password";
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
            const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword
      });

      const email = res?.data?.data?.email || form.email;
      if (!email) {
        setServerError("Signup failed. Please try again.");
        return;
      }

      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Signup failed";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{
        background:
          "radial-gradient(1200px circle at 85% 10%, #ffeef2 0%, #f7f8fa 35%, #ffffff 100%)"
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-6">
            <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div className="fw-semibold fs-4">Create account</div>
                  <div className="text-muted">Sign up to access the admin console</div>
                </div>

                {serverError ? (
                  <Alert variant="danger" className="py-2">
                    {serverError}
                  </Alert>
                ) : null}

                <Form onSubmit={handleSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-12">
                      <Form.Group controlId="signupName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.name)}
                          placeholder="Admin"
                          autoComplete="name"
                          disabled={isSubmitting}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>

                    <div className="col-12">
                      <Form.Group controlId="signupEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.email)}
                          placeholder="admin@example.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.email}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>

                    <div className="col-12 col-md-6">
                      <Form.Group controlId="signupPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.password)}
                          placeholder="Min 6 characters"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>

                    <div className="col-12 col-md-6">
                      <Form.Group controlId="signupConfirmPassword">
                        <Form.Label>Confirm password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.confirmPassword)}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>
                  </div>

                  <div className="d-grid mt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner animation="border" size="sm" /> Creating...
                        </span>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-muted small mt-3">
                  Already have an account? <Link to="/login">Sign in</Link>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

