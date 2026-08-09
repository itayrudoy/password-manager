import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { useAuth } from "./AuthContext";
import "./Auth.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__brand">
        <span className="auth__glyph" aria-hidden="true">
          <Icon name="shield" size={19} />
        </span>
        <span className="auth__word">Vault</span>
      </div>

      <Card className="auth__card">
        <form className="auth__form" onSubmit={handleSubmit}>
          <h1 className="auth__title">Log in</h1>
          {error && <p className="error">{error}</p>}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={isSubmitting}
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={isSubmitting}
          />
          <Button className="auth__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>
          <p className="auth__alt">
            No account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
