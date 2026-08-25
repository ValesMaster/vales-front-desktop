"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { aprobarSolicitud, obtenerSolicitudes } from "../../api/routes";

type Solicitud = {
    id: number | string;
    folioPresolicitud?: string;
    nombreSolicitante?: string;
    gerenteId?: number | string | null;
    nombreGerente?: string;
    estado?: string;
    createdAt?: string;
};

type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
};

const EMPTY_PAGINATION: Pagination = {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 15,
};

export default function SolicitudesPage() {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadSolicitudes = async (nextPage = 1, nextStatus = status) => {
        const token = localStorage.getItem("token") || "";
        if (!token) {
            window.location.href = "/login";
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await obtenerSolicitudes(
                { page: nextPage, limit: 15, ...(nextStatus ? { estado: nextStatus } : {}) },
                token,
            );

            if (!Array.isArray(response?.data)) {
                setSolicitudes([]);
                setPagination(EMPTY_PAGINATION);
                setError(response?.message || "No se pudieron obtener las solicitudes.");
                return;
            }

            const meta = response.pagination ?? EMPTY_PAGINATION;
            setSolicitudes(response.data);
            setPagination({
                totalItems: Number(meta.totalItems ?? 0),
                totalPages: Number(meta.totalPages ?? 0),
                currentPage: Number(meta.currentPage ?? nextPage),
                limit: Number(meta.limit ?? 15),
            });
        } catch (requestError) {
            console.error("Error cargando solicitudes:", requestError);
            setSolicitudes([]);
            setPagination(EMPTY_PAGINATION);
            setError("No se pudieron obtener las solicitudes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSolicitudes();
    }, []);

    const closeApprovalModal = () => {
        setSelectedSolicitud(null);
        setUsername("");
        setPassword("");
    };

    const handleApprove = async () => {
        if (!selectedSolicitud) return;
        if (!username.trim() || !password) {
            setError("Ingresa el username y la contraseña de la nueva distribuidora.");
            return;
        }

        const token = localStorage.getItem("token") || "";
        setIsSubmitting(true);
        setError("");

        try {
            const response = await aprobarSolicitud(selectedSolicitud.id, {
                estado: "APROBADA",
                user_name: username.trim(),
                user_password: password,
            }, token);

            if (!response?.data) {
                setError(response?.message || "No se pudo aprobar la solicitud.");
                return;
            }

            setSuccess(response.message || "Solicitud aprobada correctamente.");
            closeApprovalModal();
            await loadSolicitudes(pagination.currentPage);
        } catch (requestError) {
            console.error("Error aprobando solicitud:", requestError);
            setError("No se pudo aprobar la solicitud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (solicitud: Solicitud) => {
        if (!window.confirm(`¿Rechazar la solicitud ${solicitud.folioPresolicitud || solicitud.id}?`)) return;

        const token = localStorage.getItem("token") || "";
        setIsSubmitting(true);
        setError("");

        try {
            const response = await aprobarSolicitud(solicitud.id, { estado: "RECHAZADA" }, token);
            if (!response?.data) {
                setError(response?.message || "No se pudo rechazar la solicitud.");
                return;
            }

            setSuccess(response.message || "Solicitud rechazada correctamente.");
            await loadSolicitudes(pagination.currentPage);
        } catch (requestError) {
            console.error("Error rechazando solicitud:", requestError);
            setError("No se pudo rechazar la solicitud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">Solicitudes</p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Aprobación de distribuidoras</h1>
                    </div>
                    <Link href="/gerente-general" className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-sm font-semibold transition hover:border-[#EAA5A7]">Volver al panel</Link>
                </header>

                <section className="mb-6 rounded-2xl border border-[#4f434b] bg-[#413250] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-56">
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">Estado</label>
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]">
                                <option value="">Todos</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="APROBADA">Aprobada</option>
                                <option value="RECHAZADA">Rechazada</option>
                            </select>
                        </div>
                        <button type="button" onClick={() => void loadSolicitudes(1)} className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">Aplicar filtro</button>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#4f434b] bg-[#413250] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold text-[#f5efff]">Solicitudes registradas</h2>
                        <span className="rounded-full bg-[#4c3355] px-3 py-1 text-sm">{pagination.totalItems} registros</span>
                    </div>
                    {error ? <p className="mb-4 rounded-xl border border-[#EAA5A7] bg-[#5a3d3d] p-3 text-sm text-[#f6c1c1]">{error}</p> : null}
                    {success ? <p className="mb-4 rounded-xl border border-[#4b7960] bg-[#274a3a] p-3 text-sm text-[#a9f0c4]">{success}</p> : null}

                    {loading ? <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4 text-[#d3c2cb]">Cargando solicitudes...</div> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2 text-left">
                                <thead><tr className="text-xs uppercase tracking-wider text-[#d3c2cb]"><th className="px-3 py-2">Folio</th><th className="px-3 py-2">Solicitante</th><th className="px-3 py-2">Gerente</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Acciones</th></tr></thead>
                                <tbody>{solicitudes.map((solicitud) => {
                                    const pending = solicitud.estado === "PENDIENTE";
                                    return <tr key={String(solicitud.id)} className="rounded-xl bg-[#2d253d]"><td className="rounded-l-xl px-3 py-3">{solicitud.folioPresolicitud || `#${solicitud.id}`}</td><td className="px-3 py-3">{solicitud.nombreSolicitante || "-"}</td><td className="px-3 py-3">{solicitud.nombreGerente || "No asignado"}</td><td className="px-3 py-3">{solicitud.createdAt ? new Date(solicitud.createdAt).toLocaleDateString("es-MX") : "-"}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${pending ? "bg-[#755d2c] text-[#ffe39c]" : solicitud.estado === "APROBADA" ? "bg-[#274a3a] text-[#a9f0c4]" : "bg-[#5a3d3d] text-[#f6c1c1]"}`}>{solicitud.estado || "-"}</span></td><td className="rounded-r-xl px-3 py-3">{pending ? <div className="flex gap-2"><button type="button" disabled={isSubmitting} onClick={() => { setSelectedSolicitud(solicitud); setError(""); }} className="rounded-lg bg-[#4b7960] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Aprobar</button><button type="button" disabled={isSubmitting} onClick={() => void handleReject(solicitud)} className="rounded-lg bg-[#844A79] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Rechazar</button></div> : "-"}</td></tr>;
                                })}</tbody>
                            </table>
                        </div>
                    )}

                    {pagination.totalPages > 1 ? <div className="mt-6 flex items-center justify-between"><button type="button" disabled={pagination.currentPage <= 1} onClick={() => void loadSolicitudes(pagination.currentPage - 1)} className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-3 py-2 text-sm disabled:opacity-50">Anterior</button><span className="text-sm text-[#d3c2cb]">Página {pagination.currentPage} de {pagination.totalPages}</span><button type="button" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => void loadSolicitudes(pagination.currentPage + 1)} className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-3 py-2 text-sm disabled:opacity-50">Siguiente</button></div> : null}
                </section>
            </div>

            {selectedSolicitud ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-2xl border border-[#4f434b] bg-[#2d253d] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.35)]"><h3 className="text-xl font-semibold text-[#f5efff]">Aprobar solicitud</h3><p className="mt-2 text-sm text-[#d3c2cb]">Crea las credenciales para la nueva distribuidora.</p><div className="mt-5 space-y-4"><div><label className="mb-2 block text-sm text-[#d3c2cb]">Username</label><input value={username} onChange={(event) => setUsername(event.target.value)} maxLength={50} className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]" /></div><div><label className="mb-2 block text-sm text-[#d3c2cb]">Contraseña</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]" /></div></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeApprovalModal} disabled={isSubmitting} className="rounded-xl border border-[#4f434b] bg-[#34324b] px-4 py-2 text-sm">Cancelar</button><button type="button" onClick={() => void handleApprove()} disabled={isSubmitting} className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Guardando..." : "Confirmar aprobación"}</button></div></div></div> : null}
        </main>
    );
}
