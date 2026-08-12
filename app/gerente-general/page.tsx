"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { consultarempleados } from "./../api/routes";

export default function GerenteGeneralPage() {
    const router = useRouter();
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.replace('/login');
            return;
        }

        const fetchEmpleados = async () => {
            try {
                const response = await consultarempleados(
                    { roles: []},
                    token,
                );
                const empleadosData = Array.isArray(response?.data) ? response.data : [];
                setEmpleados(empleadosData);
            } catch (error) {
                console.error('Error cargando empleados:', error);
                setEmpleados([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEmpleados();
    }, [router]);

    const stats = [
        { label: 'Solicitudes', value: '1,284', trend: '+12.4%' },
        { label: 'Usuarios', value: loading ? '...' : String(empleados.length), trend: '+8.1%' },
        { label: 'Vales activos', value: '$48.6K', trend: '+5.3%' },

    ];


    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Administración
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Panel General</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#844A79] text-sm font-bold text-white">
                                GG
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#e4dfff]">Gerente General</p>
                                <p className="text-xs text-[#d3c2cb]">Última sesión: hoy</p>
                            </div>
                        </div>

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
                                <span className="rounded-full bg-[#4c3355] px-2 py-1 text-xs font-semibold text-[#EAA5A7]">
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="">
                    <aside className="space-y-6">
                        <div className="rounded-2xl border border-[#4f434b] bg-[#413250] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                            <h3 className="mb-4 text-xl font-semibold text-[#f5efff]">Acciones rápidas</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Aprobar vales', href: '#' },
                                    { label: 'Gestionar usuarios', href: '/gerente-general/gestion' },
                                    { label: 'Reportes', href: '#' },
                                    { label: 'Configuración', href: '#' },
                                ].map((action) => (
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