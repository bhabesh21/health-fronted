import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import { AUTH_KEY } from "../components/RequireAuth.jsx";

function isValidEmail(value) {
  const v = String(value || "").trim();
  return /\S+@\S+\.\S+/.test(v);
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const infoMsg =
    location.state?.otpVerified ? "OTP verified. Please login." : "";
  const API_BASE_URL = useMemo(
    () =>
      (
        import.meta.env.VITE_API_BASEURL ||
        import.meta.env.api_baseurl ||
        "http://localhost:5000/api"
      ).replace(/\/+$/, ""),
    []
  );

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY)) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    const next = {};

    if (!form.email || !isValidEmail(form.email)) {
      next.email = "Enter a valid email";
    }

    if (!form.password) {
      next.password = "Password is required";
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
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: form.email,
        password: form.password
      });

      const token = res?.data?.data?.token;
      if (!token) {
        setServerError("Login failed. Please try again.");
        return;
      }

      localStorage.setItem(AUTH_KEY, token);
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";
            if (err?.response?.status === 403 && form.email) {
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`, {
          replace: true
        });
        return;
      }
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
          "radial-gradient(1200px circle at 15% 10%, #e8f1ff 0%, #f7f8fa 35%, #ffffff 100%)"
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div className="fw-semibold fs-4">HealthSync</div>
                  <div className="text-muted">Sign in to continue</div>
                </div>

                {serverError ? (
                  <Alert variant="danger" className="py-2">
                    {serverError}
                  </Alert>
                ) : null}

                {infoMsg ? (
                  <Alert variant="success" className="py-2">
                    {infoMsg}
                  </Alert>
                ) : null}

                <Form onSubmit={handleSubmit} noValidate>
                  <Form.Group className="mb-3" controlId="loginEmail">
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

                  <Form.Group className="mb-3" controlId="loginPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      isInvalid={Boolean(errors.password)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-grid">
                    <Button
                      variant="primary"
                      size="lg"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner animation="border" size="sm" /> Signing in...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-muted small mt-3">
                  Don&apos;t have an account? <Link to="/signup">Create one</Link>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


