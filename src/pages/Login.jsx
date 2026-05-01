import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api-handler"; // ✅ axios replace
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import { AUTH_KEY } from "../components/RequireAuth.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

function isValidEmail(value) {
  const v = String(value || "").trim();
  return /\S+@\S+\.\S+/.test(v);
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const { login } = useAuth();

 

  const [form, setForm] = useState({
    email: "admin@example.com",
    password: "admin_password",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(AUTH_KEY);
    if (existing) {
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

  // 🔥 FINAL FIXED LOGIN FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // ✅ api.js use (no need base URL here)
      const res = await api.post("/admin/auth/login", {
        email: form.email,
        password: form.password,
      });

      const token = res?.data?.data?.token;
      const user = res?.data?.data?.user;

      if (!token) {
        setServerError("Login failed. Please try again.");
        return;
      }

      // 🔐 ADMIN ROLE CHECK
      if (user?.role !== "admin") {
        setServerError("Access denied. Admin only");
        return;
      }

      // context login
      login(token, user);

      // redirect
      navigate(from, { replace: true });

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";

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
          "radial-gradient(1200px circle at 15% 10%, #e8f1ff 0%, #f7f8fa 35%, #ffffff 100%)",
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div className="fw-semibold fs-4">Admin Panel</div>
                  <div className="text-muted">Login to continue</div>
                </div>

                {serverError && (
                  <Alert variant="danger" className="py-2">
                    {serverError}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      isInvalid={Boolean(errors.email)}
                      placeholder="admin@example.com"
                      disabled={isSubmitting}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      isInvalid={Boolean(errors.password)}
                      placeholder="admin_password"
                      disabled={isSubmitting}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" /> Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </div>
                </Form>

              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
