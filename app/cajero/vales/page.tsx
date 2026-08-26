"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerVales } from "../../api/routes";

type ValeListItem = {
    id: number;
    cantidadPrestada: string | number;
    cantidadPagada: string | number;
    estado: string;
    plazos: number;
    tipoVale: string;
    cliente?: {
        persona?: {
            nombre?: string;
            apellidoPaterno?: string;
            apellidoMaterno?: string;
        } | null;
    } | null;
    distribuidora?: {
        categoria?: string;
        usuario?: { username?: string } | null;
    } | null;
};

const ESTADOS = ['', 'ACTIVO', 'LIQUIDADO'];

export default function CajeroValesPage() {
    const router = useRouter();
    const [vales, setVales] = useState<ValeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [estado, setEstado] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.replace('/login');
            return;
        }

        let cancelled = false;

        const fetchVales = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await obtenerVales({ page, limit: 10, estado: estado || undefined, search: search || undefined }, token);

                if (cancelled) return;

                if (response?.message && !response?.data) {
                    setError(response.message);
                    setVales([]);
                    return;
                }

                setVales(Array.isArray(response?.data) ? response.data : []);
                setTotalPages(response?.pagination?.totalPages ?? 1);
            } catch (err) {
                console.error('Error cargando vales:', err);
                if (!cancelled) {
                    setError('No se pudieron cargar los vales.');
                    setVales([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchVales();

        return () => {
            cancelled = true;
        };
    }, [router, page, estado, search]);

    const formatMoney = (value: string | number) => {
        const numeric = Number(value);
        return Number.isFinite(numeric)
            ? numeric.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
            : String(value);
    };

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">Caja</p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Vales de mi sucursal</h1>
                    </div>

                    <a
                        href="/cajero"
                        className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-sm font-semibold text-[#e4dfff] transition hover:border-[#EAA5A7]"
                    >
                        ← Volver al panel
                    </a>
                </header>

                <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)] md:flex-row md:items-center">
                    <input
                        type="text"
                        placeholder="Buscar por cliente o distribuidora..."
                        value={search}
                        onChange={(event) => {
                            setPage(1);
                            setSearch(event.target.value);
                        }}
                        className="block w-full rounded border border-[#4f434b] bg-[#34324b] px-4 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb] focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7] md:max-w-sm"
                    />

                    <select
                        value={estado}
                        onChange={(event) => {
                            setPage(1);
                            setEstado(event.target.value);
                        }}
                        className="rounded border border-[#4f434b] bg-[#34324b] px-4 py-2 text-[#e4dfff] focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7]"
                    >
                        {ESTADOS.map((value) => (
                            <option key={value || 'todos'} value={value}>
                                {value === '' ? 'Todos los estados' : value}
                            </option>
                        ))}
                    </select>
                </section>

                {error ? (
                    <p className="mb-4 rounded-xl border border-[#ffb4ab]/40 bg-[#2f253d] p-4 text-sm text-[#ffb4ab]">{error}</p>
                ) : null}

                <section className="overflow-hidden rounded-2xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#2d253d] text-[#d3c2cb]">
                            <tr>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Distribuidora</th>
                                <th className="px-4 py-3">Prestado</th>
                                <th className="px-4 py-3">Pagado</th>
                                <th className="px-4 py-3">Plazos</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-[#d3c2cb]">Cargando...</td>
                                </tr>
                            ) : vales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-[#d3c2cb]">No hay vales para mostrar.</td>
                                </tr>
                            ) : (
                                vales.map((vale) => {
                                    const persona = vale.cliente?.persona;
                                    const nombreCliente = persona
                                        ? [persona.nombre, persona.apellidoPaterno, persona.apellidoMaterno].filter(Boolean).join(' ')
                                        : 'N/D';

                                    return (
                                        <tr key={vale.id} className="border-t border-[#4f434b] hover:bg-[#2f253d]/60">
                                            <td className="px-4 py-3">{nombreCliente}</td>
                                            <td className="px-4 py-3">{vale.distribuidora?.usuario?.username ?? 'N/D'}</td>
                                            <td className="px-4 py-3">{formatMoney(vale.cantidadPrestada)}</td>
                                            <td className="px-4 py-3">{formatMoney(vale.cantidadPagada)}</td>
                                            <td className="px-4 py-3">{vale.plazos}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full border border-[#4f434b] bg-[#2d253d] px-3 py-1 text-xs font-semibold text-[#EAA5A7]">
                                                    {vale.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <a
                                                    href={`/cajero/vales/${vale.id}`}
                                                    className="text-[#EAA5A7] hover:underline"
                                                >
                                                    Ver detalle →
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </section>

                <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 text-sm text-[#e4dfff] transition hover:border-[#EAA5A7] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        ← Anterior
                    </button>
                    <span className="text-sm text-[#d3c2cb]">Página {page} de {totalPages}</span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 text-sm text-[#e4dfff] transition hover:border-[#EAA5A7] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Siguiente →
                    </button>
                </div>
            </div>
        </main>
    );
}
