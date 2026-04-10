import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function VerifyOtp() {
  const navigate = useNavigate();
  const query = useQuery();

  const API_BASE_URL = useMemo(
    () =>
      (
        import.meta.env.VITE_API_BASEURL ||
        import.meta.env.api_baseurl ||
        "http://localhost:5000/api"
      ).replace(/\/+$/, ""),
    []
  );

  const [email, setEmail] = useState(query.get("email") || "");
  const [otp, setOtp] = useState("");

  const [serverError, setServerError] = useState("");
  const [serverInfo, setServerInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const qEmail = query.get("email") || "";
    if (qEmail && qEmail !== email) setEmail(qEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value || "").trim());

  const validate = () => {
    if (!isValidEmail(email)) return "Enter a valid email";
    if (!otp || String(otp).trim().length !== 6) return "Enter 6-digit OTP";
    if (!/^\d{6}$/.test(String(otp).trim())) return "OTP must be 6 digits";
    return "";
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setServerError("");
    setServerInfo("");

    const err = validate();
    if (err) {
      setServerError(err);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email,
        otp: String(otp).trim()
      });
      navigate("/login", {
        replace: true,
        state: { otpVerified: true, email }
      });
    } catch (ex) {
      const msg =
        ex?.response?.data?.message ||
        ex?.response?.data?.error ||
        ex?.message ||
        "OTP verification failed";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setServerError("");
    setServerInfo("");

    if (!isValidEmail(email)) {
      setServerError("Enter a valid email");
      return;
    }

    setIsResending(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/resend-otp`, { email });
      const delivery = res?.data?.data?.delivery?.delivery || res?.data?.data?.delivery;
      setServerInfo(
        delivery === "email"
          ? "OTP resent to your email."
          : "OTP resent (check server console in dev)."
      );
    } catch (ex) {
      const msg =
        ex?.response?.data?.message ||
        ex?.response?.data?.error ||
        ex?.message ||
        "Failed to resend OTP";
      setServerError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{
        background:
          "radial-gradient(1200px circle at 50% 10%, #eefcf7 0%, #f7f8fa 35%, #ffffff 100%)"
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-6">
            <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div className="fw-semibold fs-4">Verify OTP</div>
                  <div className="text-muted">
                    We sent a 6-digit code to your registered email.
                  </div>
                </div>

                {serverError ? (
                  <Alert variant="danger" className="py-2">
                    {serverError}
                  </Alert>
                ) : null}

                {serverInfo ? (
                  <Alert variant="success" className="py-2">
                    {serverInfo}
                  </Alert>
                ) : null}

                <Form onSubmit={handleVerify}>
                  <Form.Group className="mb-3" controlId="otpEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="email"
                      disabled={isSubmitting || isResending}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="otpCode">
                    <Form.Label>OTP</Form.Label>
                    <Form.Control
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D+/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      disabled={isSubmitting}
                      required
                    />
                    <div className="text-muted small mt-2">
                      Didn&apos;t receive it?{" "}
                      <Button
                        variant="link"
                        className="p-0 align-baseline"
                        type="button"
                        onClick={handleResend}
                        disabled={isResending || isSubmitting}
                      >
                        {isResending ? "Resending..." : "Resend OTP"}
                      </Button>
                    </div>
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
                          <Spinner animation="border" size="sm" /> Verifying...
                        </span>
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-muted small mt-3">
                  Back to <Link to="/login">Login</Link>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
