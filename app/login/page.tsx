"use client";

import { FormEvent, useState } from "react";
import { login } from "../api/routes";

function getRoleFromToken(token: string): string | null {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;

    const normalized = base64Payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(base64Payload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized));
    const rol = payload?.rol;
    return typeof rol === "string" ? rol.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totptrue, setTtotptrue] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Correo y contraseña son requeridos.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(email, password);

      if (response?.status === 400 || response?.data?.message || response?.data?.error) {
        setError(response?.data?.message || response?.data?.error || "Credenciales inválidas.");
        setIsLoading(false);
        return;
      }

      if (response?.step === "COMPLETED" && response?.accessToken) {
        localStorage.setItem("token", response.accessToken);

        const role = getRoleFromToken(response.accessToken);
        window.location.href = role === "cajero" ? "/cajero" : "/gerente-general";
        return;
      }

      const token = response?.mfaToken || response?.accessToken || response?.token;

      if (!token) {
        setError("No se recibió un token válido.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", token);

      if (response?.totpConfigured === true) {
        window.location.href = "/login/totp";
        return;
      }

      window.location.href = "/login/totp/first";
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1f1d35] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_12px_rgba(0,0,0,0.5)]">
        <div className="border-b border-[#34324b] px-10 pb-4 pt-10 text-center">
          <h1 className="mb-2 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[#e4dfff]">
            ValesMaster
          </h1>
          <p className="text-[16px] leading-6 text-[#d3c2cb]">Login</p>
        </div>

        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-[#e4dfff]"
                htmlFor="email"
              >
                Correo
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-[20px] text-[#EAA5A7]" aria-hidden="true">
                    ✉
                  </span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="block w-full rounded border border-[#4f434b] bg-[#34324b] py-2 pl-10 pr-3 text-[16px] leading-6 text-[#e4dfff] placeholder:text-[#d3c2cb] focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7]"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  className="block text-[12px] font-semibold uppercase tracking-wider text-[#e4dfff]"
                  htmlFor="password"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-[20px] text-[#EAA5A7]" aria-hidden="true">
                    🔒
                  </span>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="block w-full rounded border border-[#4f434b] bg-[#34324b] py-2 pl-10 pr-3 text-[16px] leading-6 text-[#e4dfff] placeholder:text-[#d3c2cb] focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7]"
                />
              </div>
            </div>

     
          

            {error ? (
              <p className="text-sm text-[#ffb4ab]">{error}</p>
            ) : null}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded bg-[#844a79] px-4 py-3 text-[20px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0px_2px_4px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Iniciando..." : "Log In"}
                <span className="ml-2 text-[20px] text-[#EAA5A7]" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
