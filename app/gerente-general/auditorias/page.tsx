"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { obtenerAuditLogs } from "../../api/routes";

type AuditLog = {
    _id?: string;
    id?: string | number;
    module?: string;
    action?: string;
    status?: string;
    username?: string;
    userId?: number | string;
    ipAddress?: string;
    createdAt?: string;
    details?: {
        username?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

const EMPTY_PAGINATION = {
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 15,
};

const EMPTY_FILTERS = {
    module: "",
    action: "",
    status: "",
    startDate: "",
    endDate: "",
};

const getDistinctValues = (logs: AuditLog[], field: "module" | "action" | "status") =>
    [...new Set(
        logs
            .map((log) => String(log[field] ?? "").trim())
            .filter(Boolean),
    )].sort((a, b) => a.localeCompare(b, "es-MX"));

const formatAuditValue = (value: string) => value.replace(/_/g, " ");

export default function AuditoriasPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [pagination, setPagination] = useState(EMPTY_PAGINATION);

    const fetchLogs = async (
        nextPage = page,
        currentToken?: string,
        activeFilters = filters,
        nextLimit = limit,
    ) => {
        try {
            setLoading(true);

            const safeToken = currentToken || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");

            const response = await obtenerAuditLogs(
                {
                    page: nextPage,
                    limit: nextLimit,
                    module: activeFilters.module,
                    action: activeFilters.action,
                    status: activeFilters.status,
                    startDate: activeFilters.startDate,
                    endDate: activeFilters.endDate,
                },
                safeToken
            );

            const items = Array.isArray(response?.data) ? response.data : [];
            const meta = response?.pagination || EMPTY_PAGINATION;

            setLogs(items);
            setPagination({
                totalItems: Number(meta.totalItems ?? 0),
                totalPages: Number(meta.totalPages ?? 0),
                currentPage: Number(meta.currentPage ?? nextPage),
                limit: Number(meta.limit ?? nextLimit),
            });
        } catch (error) {
            console.error("Error cargando auditorías:", error);
            setLogs([]);
            setPagination(EMPTY_PAGINATION);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const savedToken = localStorage.getItem("token");
        if (!savedToken) {
            window.location.href = "/login";
            return;
        }

        fetchLogs(1, savedToken);
    }, []);

    const handleFilterChange = (field: keyof typeof EMPTY_FILTERS, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
            ...(field === "module" ? { action: "" } : {}),
        }));
    };

    const applyFilters = () => {
        setPage(1);
        fetchLogs(1, typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setPage(1);
        fetchLogs(1, typeof window !== "undefined" ? localStorage.getItem("token") || "" : "", EMPTY_FILTERS);
    };

    const onPageChange = (newPage: number) => {
        const safePage = Math.max(1, newPage);
        setPage(safePage);
        fetchLogs(safePage, typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
    };

    const modules = useMemo(() => getDistinctValues(logs, "module"), [logs]);
    const actions = useMemo(
        () => getDistinctValues(
            filters.module ? logs.filter((log) => log.module === filters.module) : logs,
            "action",
        ),
        [filters.module, logs],
    );
    const statuses = useMemo(() => getDistinctValues(logs, "status"), [logs]);
    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Auditoría
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Logs de auditoría</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/gerente-general"
                            className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-sm font-semibold text-[#e4dfff] transition hover:border-[#EAA5A7]"
                        >
                            Volver al panel
                        </Link>
                    </div>
                </header>

                <section className="mb-6 rounded-2xl border border-[#4f434b] bg-[#413250] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <h2 className="mb-4 text-lg font-semibold text-[#f5efff]">Filtros</h2>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">Módulo</label>
                            <select
                                value={filters.module}
                                onChange={(e) => handleFilterChange("module", e.target.value)}
                                className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                            >
                                <option value="">Todos los módulos</option>
                                {modules.map((module) => (
                                    <option key={module} value={module}>{formatAuditValue(module)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">Acción</label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange("action", e.target.value)}
                                className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                            >
                                <option value="">Todas las acciones</option>
                                {actions.map((action) => (
                                    <option key={action} value={action}>{formatAuditValue(action)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">Estado</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                            >
                                <option value="">Todos los estados</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>{formatAuditValue(status)}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">Desde</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">Hasta</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                                className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                            />
                        </div>

                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            Aplicar filtros
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 text-sm font-medium text-[#e4dfff]"
                        >
                            Limpiar
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#4f434b] bg-[#413250] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold text-[#f5efff]">Resultados</h3>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-[#d3c2cb]">Por página</label>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    const nextLimit = Number(e.target.value);
                                    setLimit(nextLimit);
                                    setPage(1);
                                    fetchLogs(1, undefined, filters, nextLimit);
                                }}
                                className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-2 py-2 text-sm text-[#f5efff]"
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4 text-[#d3c2cb]">
                            Cargando auditorías...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4 text-[#d3c2cb]">
                            No se encontraron registros.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2 text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider text-[#d3c2cb]">
                                        <th className="px-3 py-2">Módulo</th>
                                        <th className="px-3 py-2">Acción</th>
                                        <th className="px-3 py-2">Estado</th>
                                        <th className="px-3 py-2">Username</th>
                                        <th className="px-3 py-2">IP</th>
                                        <th className="px-3 py-2">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <tr key={String(log._id ?? log.id ?? index)} className="rounded-xl bg-[#2d253d] text-[#e4dfff]">
                                            <td className="rounded-l-xl px-3 py-3">{log.module || "-"}</td>
                                            <td className="px-3 py-3">{log.action || "-"}</td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                        String(log.status || "").toUpperCase() === "SUCCESS"
                                                            ? "bg-[#274a3a] text-[#a9f0c4]"
                                                            : "bg-[#5a3d3d] text-[#f6c1c1]"
                                                    }`}
                                                >
                                                    {log.status || "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">{log.details?.username || log.username || "-"}</td>
                                            <td className="px-3 py-3">{log.ipAddress || "-"}</td>
                                            <td className="rounded-r-xl px-3 py-3">
                                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => onPageChange(page - 1)}
                                className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-3 py-2 text-sm text-[#e4dfff] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            <span className="text-sm text-[#d3c2cb]">
                                Página {pagination.currentPage} de {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={page >= pagination.totalPages}
                                onClick={() => onPageChange(page + 1)}
                                className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-3 py-2 text-sm text-[#e4dfff] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
