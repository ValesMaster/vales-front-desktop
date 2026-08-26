"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerVales, verifytoken } from "../api/routes";

const getTokenPayload = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const base64Payload = token.split('.')[1];
        if (!base64Payload) return null;

        const normalized = base64Payload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(base64Payload.length / 4) * 4, '=');
        const decoded = atob(normalized);
        return JSON.parse(decoded);
    } catch {
        return null;
    }
};

const getRoleName = (payload: unknown): string | null => {
    if (typeof payload !== 'object' || payload === null) return null;
    const rol = (payload as Record<string, unknown>).rol;
    return typeof rol === 'string' ? rol.trim().toLowerCase() : null;
};

const getUsername = (payload: unknown): string | null => {
    if (typeof payload !== 'object' || payload === null) return null;
    const username = (payload as Record<string, unknown>).username ?? (payload as Record<string, unknown>).email;
    return typeof username === 'string' ? username : null;
};

export default function CajeroPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState<string | null>(null);
    const [valesActivos, setValesActivos] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.replace('/login');
            return;
        }

        const payload = getTokenPayload();
        setUsername(getUsername(payload));

        const fetchRole = async () => {
            try {
                const validation = await verifytoken(token);
                const rol = getRoleName(validation) ?? getRoleName(payload);
                if (rol && rol !== 'cajero') {
                    router.replace('/gerente-general');
                }
            } catch (error) {
                console.error('Error validando el rol del usuario:', error);
            }
        };

        const fetchStats = async () => {
            try {
                const response = await obtenerVales({ page: 1, limit: 1, estado: 'ACTIVO' });
                setValesActivos(response?.pagination?.totalItems ?? 0);
            } catch (error) {
                console.error('Error cargando vales activos:', error);
                setValesActivos(0);
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
        fetchStats();
    }, [router]);

    const actions = [
        { label: 'Registrar pagos de vales', href: '/cajero/vales' },
    ];

    const stats = [
        { label: 'Vales activos en mi sucursal', value: loading ? '...' : String(valesActivos ?? 0) },
    ];

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Caja
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">
                            {username ? `Bienvenido, ${username}` : 'Panel de caja'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('token');
                                window.location.href = '/login';
                            }}
                            className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </header>

                <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5 shadow-[0px_3px_10px_rgba(0,0,0,0.18)]"
                        >
                            <p className="text-sm text-[#d3c2cb]">{stat.label}</p>
                            <div className="mt-4 flex items-end justify-between">
                                <h2 className="text-3xl font-bold text-[#f5efff]">{stat.value}</h2>
                            </div>
                        </div>
                    ))}
                </section>

                <section>
                    <aside className="space-y-6">
                        <div className="rounded-2xl border border-[#4f434b] bg-[#413250] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                            <h3 className="mb-4 text-xl font-semibold text-[#f5efff]">Acciones rápidas</h3>
                            <div className="space-y-3">
                                {actions.map((action) => (
                                    <a
                                        key={action.label}
                                        href={action.href}
                                        className="flex w-full items-center justify-between rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-left text-[#e4dfff] transition hover:border-[#EAA5A7] hover:text-[#f9eef6]"
                                    >
                                        <span>{action.label}</span>
                                        <span className="text-[#EAA5A7]">→</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}
