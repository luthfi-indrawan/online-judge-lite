import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/api";
import { Alert, Button, Input } from "../components/UI";
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password);
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(from || "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-decoration">
        <div className="login-grid" />
        <div className="login-glow login-glow-a" />
        <div className="login-glow login-glow-b" />
        <div className="login-brand">
          <div className="brand-mark">
            <Code2 size={24} />
          </div>
          <strong>
            OJ<span>Lite</span>
          </strong>
        </div>
        <div className="login-hero">
          <div className="hero-kicker">
            <span className="hero-kicker-line" /> ONLINE JUDGE PLATFORM
          </div>
          <h1>
            Think clearly.
            <br />
            <span>Code confidently.</span>
          </h1>
          <p>
            Tempat latihan, eksperimen, dan mengasah kemampuan algoritma. Satu
            submission lebih dekat ke solusi.
          </p>
          <div className="hero-points">
            <div>
              <CheckCircle2 size={17} /> Automated code evaluation
            </div>
            <div>
              <CheckCircle2 size={17} /> Real-time contest scoreboard
            </div>
            <div>
              <CheckCircle2 size={17} /> C and C++ workspace
            </div>
          </div>
        </div>
        <div className="login-decoration-foot">
          <span>BUILT FOR LEARNING</span>
          <span>OJ LITE / 01</span>
        </div>
      </div>
      <div className="login-form-side">
        <form className="login-form" onSubmit={submit}>
          <div className="mobile-login-brand">
            <div className="brand-mark">
              <Code2 size={22} />
            </div>
            <strong>
              OJ<span>Lite</span>
            </strong>
          </div>
          <div className="login-heading">
            <div className="eyebrow">WELCOME BACK</div>
            <h2>Masuk ke akunmu</h2>
            <p>Gunakan kredensial yang diberikan oleh Admin.</p>
          </div>
          {error && <Alert>{error}</Alert>}
          <label className="field">
            <span className="field-label">Username</span>
            <span className="input-with-icon">
              <UserRound size={17} />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoComplete="username"
                required
                autoFocus
              />
            </span>
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <span className="input-with-icon">
              <LockKeyhole size={17} />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          <Button
            type="submit"
            className="login-submit"
            size="lg"
            disabled={busy}
          >
            {busy ? (
              "Memproses..."
            ) : (
              <>
                Masuk ke dashboard <ArrowRight size={17} />
              </>
            )}
          </Button>
          <div className="login-note">
            <LockKeyhole size={15} />
            <span>
              Akses hanya untuk akun terdaftar. Hubungi Admin untuk bantuan
              akun.
            </span>
          </div>
          <div className="login-bottom">
            © {new Date().getFullYear()} OJ Lite <span>·</span> Academic coding
            environment
          </div>
        </form>
      </div>
    </div>
  );
}
