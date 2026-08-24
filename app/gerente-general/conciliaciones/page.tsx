"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    obtenerConciliacionPagos,
    obtenerConciliacionPagosDistribuidora,
} from "../../api/routes";

type ConciliationType = "cliente" | "distribuidora";

type ConciliationRecord = {
    id?: number | string;
    _id?: number | string;
    estado?: string;
    fechaCorte?: string;
    diasAtraso?: number;
    monto?: number | string;
    importe?: number | string;
    cantidad?: number | string;
    vale?: Record<string, unknown>;
    credito?: Record<string, unknown>;
    [key: string]: unknown;
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

const getRecordValue = (record: ConciliationRecord, ...keys: string[]) => {
    for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
};

const getDistributorUsername = (record: ConciliationRecord) => {
    const relation = (record.vale ?? record.credito) as Record<string, unknown> | undefined;
    const distributor = relation?.distribuidora as Record<string, unknown> | undefined;
    const user = distributor?.usuario as Record<string, unknown> | undefined;
    return String(user?.username ?? distributor?.username ?? "-");
};

const getClientName = (record: ConciliationRecord) => {
    const vale = record.vale as Record<string, unknown> | undefined;
    const client = vale?.cliente as Record<string, unknown> | undefined;
    const person = client?.persona as Record<string, unknown> | undefined;
    const name = [person?.nombres ?? person?.nombre, person?.apellidoPaterno, person?.apellidoMaterno]
        .filter(Boolean)
        .join(" ");

    return name || String(client?.username ?? "-");
};

const formatMoney = (value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount)
        ? amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
        : "-";
};

export default function ConciliacionesPage() {
    const [type, setType] = useState<ConciliationType>("cliente");
    const [distribuidoraId, setDistribuidoraId] = useState("");
    const [records, setRecords] = useState<ConciliationRecord[]>([]);
    const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRecords = async (
        nextType = type,
        nextPage = 1,
        nextDistribuidoraId = distribuidoraId,
    ) => {
        const token = localStorage.getItem("token") || "";
        if (!token) {
            window.location.href = "/login";
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = {
                page: nextPage,
                limit: 15,
                ...(nextDistribuidoraId ? { distribuidora_id: nextDistribuidoraId } : {}),
            };
            const response = nextType === "cliente"
                ? await obtenerConciliacionPagos(params, token)
                : await obtenerConciliacionPagosDistribuidora(params, token);

            if (!Array.isArray(response?.data)) {
                setRecords([]);
                setPagination(EMPTY_PAGINATION);
                setError(response?.message || "No se pudo obtener la conciliación.");
                return;
            }

            const meta = response.pagination ?? EMPTY_PAGINATION;
            setRecords(response.data);
            setPagination({
                totalItems: Number(meta.totalItems ?? 0),
                totalPages: Number(meta.totalPages ?? 0),
                currentPage: Number(meta.currentPage ?? nextPage),
                limit: Number(meta.limit ?? 15),
            });
        } catch (requestError) {
            console.error("Error cargando conciliaciones:", requestError);
            setRecords([]);
            setPagination(EMPTY_PAGINATION);
            setError("No se pudo obtener la conciliación.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRecords();
    }, []);

    const isClientToDistributor = type === "cliente";
    const title = isClientToDistributor
        ? "Cliente → Distribuidora"
        : "Distribuidora → ValesMaster";

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">Conciliación</p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Pagos pendientes</h1>
                    </div>
                    <Link href="/gerente-general" className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-sm font-semibold transition hover:border-[#EAA5A7]">
                        Volver al panel
                    </Link>
                </header>

                <section className="mb-6 rounded-2xl border border-[#4f434b] bg-[#413250] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">Tipo de conciliación</label>
                            <select
                                value={type}
                                onChange={(event) => {
                                    const nextType = event.target.value as ConciliationType;
                                    setType(nextType);
                                    void loadRecords(nextType, 1);
                                }}
                                className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                            >
                                <option value="cliente">Cliente → Distribuidora</option>
                                <option value="distribuidora">Distribuidora → ValesMaster</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-[#d3c2cb]">ID de distribuidora</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={distribuidoraId}
                                onChange={(event) => setDistribuidoraId(event.target.value.replace(/\D/g, ""))}
                                placeholder="Todas las distribuidoras"
                                className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadRecords(type, 1)}
                            className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            Consultar
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#4f434b] bg-[#413250] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-[#f5efff]">{title}</h2>
                            <p className="mt-1 text-sm text-[#d3c2cb]">Pagos vencidos pendientes de conciliar.</p>
                        </div>
                        <span className="rounded-full bg-[#4c3355] px-3 py-1 text-sm text-[#f5efff]">{pagination.totalItems} registros</span>
                    </div>

                    {error ? <p className="mb-4 rounded-xl border border-[#EAA5A7] bg-[#5a3d3d] p-3 text-sm text-[#f6c1c1]">{error}</p> : null}

                    {loading ? (
                        <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4 text-[#d3c2cb]">Cargando conciliaciones...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2 text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider text-[#d3c2cb]">
                                        <th className="px-3 py-2">Pago</th>
                                        {isClientToDistributor ? <th className="px-3 py-2">Cliente</th> : null}
                                        <th className="px-3 py-2">Distribuidora</th>
                                        <th className="px-3 py-2">Monto</th>
                                        <th className="px-3 py-2">Fecha de corte</th>
                                        <th className="px-3 py-2">Atraso</th>
                                        <th className="px-3 py-2">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record, index) => {
                                        const amount = getRecordValue(record, "monto", "importe", "cantidad", "total");
                                        return (
                                            <tr key={String(record.id ?? record._id ?? index)} className="rounded-xl bg-[#2d253d] text-[#e4dfff]">
                                                <td className="rounded-l-xl px-3 py-3">#{record.id ?? record._id ?? "-"}</td>
                                                {isClientToDistributor ? <td className="px-3 py-3">{getClientName(record)}</td> : null}
                                                <td className="px-3 py-3">{getDistributorUsername(record)}</td>
                                                <td className="px-3 py-3">{formatMoney(amount)}</td>
                                                <td className="px-3 py-3">{record.fechaCorte ? new Date(record.fechaCorte).toLocaleDateString("es-MX") : "-"}</td>
                                                <td className="px-3 py-3">{Number(record.diasAtraso ?? 0)} días</td>
                                                <td className="rounded-r-xl px-3 py-3"><span className="rounded-full bg-[#5a3d3d] px-2 py-1 text-xs font-semibold text-[#f6c1c1]">{String(record.estado ?? "PENDIENTE")}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pagination.totalPages > 1 ? (
                        <div className="mt-6 flex items-center justify-between gap-3">
                            <button type="button" disabled={pagination.currentPage <= 1} onClick={() => void loadRecords(type, pagination.currentPage - 1)} className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
                            <span className="text-sm text-[#d3c2cb]">Página {pagination.currentPage} de {pagination.totalPages}</span>
                            <button type="button" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => void loadRecords(type, pagination.currentPage + 1)} className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">Siguiente</button>
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}
