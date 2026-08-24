"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { obtenerDetalleEmpleado } from "../../../api/routes";

const labelRole = (role: any) => role?.nombre || role?.name || "Sin rol";

const formatDate = (value?: string | null) => {
    if (!value) return "No registrado";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

export default function EmpleadoDetallePage() {
    const params = useParams<{ empleado?: string }>();
    const empleadoId = Number(params?.empleado ?? "0");
    const [empleado, setEmpleado] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchEmpleado = async () => {
            if (!Number.isFinite(empleadoId) || empleadoId <= 0) {
                setError("Empleado no válido.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token") || "";
                const response = await obtenerDetalleEmpleado(empleadoId, token);
                const detalle = response?.data ?? response ?? null;

                if (!detalle) {
                    setError("No se encontró este empleado.");
                    setEmpleado(null);
                    return;
                }

                setEmpleado(detalle);
            } catch (err: any) {
                setError(err?.message || "No se pudo cargar la información del empleado.");
                setEmpleado(null);
            } finally {
                setLoading(false);
            }
        };

        fetchEmpleado();
    }, [empleadoId]);

    const persona = empleado?.persona ?? {};
    const direccion = persona?.direccion ?? {};
    const sucursal = empleado?.empleados?.[0]?.sucursal ?? empleado?.sucursal ?? null;
    const rol = empleado?.rol ?? null;

    const nombreCompleto = useMemo(() => {
        const nombre = [persona?.nombre, persona?.apellidoPaterno, persona?.apellidoMaterno]
            .filter(Boolean)
            .join(" ");

        return nombre || empleado?.username || "Empleado";
    }, [empleado, persona]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
                <div className="mx-auto max-w-5xl rounded-2xl border border-[#4f434b] bg-[#413250] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-6 text-[#d3c2cb]">
                        Cargando información del empleado...
                    </div>
                </div>
            </main>
        );
    }

    if (error || !empleado) {
        return (
            <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
                <div className="mx-auto max-w-3xl rounded-2xl border border-[#4f434b] bg-[#413250] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                                Empleado
                            </p>
                            <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Detalle no disponible</h1>
                        </div>
                        <Link
                            href="/gerente-general/gestion"
                            className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 text-sm font-medium text-[#e4dfff] transition hover:border-[#EAA5A7]"
                        >
                            Volver a gestión
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-[#7a3d42] bg-[#3d2c35] px-4 py-3 text-sm text-[#ffb4ab]">
                        {error || "No se pudo cargar la información del empleado."}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-[#4f434b] bg-[#413250] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Perfil del empleado
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">{nombreCompleto}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-[#2d4f43] px-3 py-1 text-xs font-semibold text-[#a9f0c9]">
                            {empleado?.activo === false ? "Inactivo" : "Activo"}
                        </span>
                        <Link
                            href="/gerente-general/gestion"
                            className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 text-sm font-medium text-[#e4dfff] transition hover:border-[#EAA5A7]"
                        >
                            Volver
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5 lg:col-span-2">
                        <h2 className="mb-4 text-xl font-bold text-[#f5efff]">Información personal</h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <InfoItem label="Nombre" value={persona?.nombre || "No registrado"} />
                            <InfoItem label="Apellido paterno" value={persona?.apellidoPaterno || "No registrado"} />
                            <InfoItem label="Apellido materno" value={persona?.apellidoMaterno || "No registrado"} />
                            <InfoItem label="Fecha de nacimiento" value={formatDate(persona?.fechaNacimiento)} />
                            <InfoItem label="Género" value={persona?.genero || "No registrado"} />
                            <InfoItem label="Teléfono" value={persona?.telefono || "No registrado"} />
                            <InfoItem label="Correo" value={empleado?.email || "No registrado"} />
                            <InfoItem label="Usuario" value={empleado?.username || "No registrado"} />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5">
                        <h2 className="mb-4 text-xl font-bold text-[#f5efff]">Acceso y sucursal</h2>

                        <div className="space-y-4">
                            <InfoItem label="Rol" value={labelRole(rol)} />
                            <InfoItem label="Sucursal" value={sucursal?.nombre || "Sin sucursal"} />
                            <InfoItem label="ID empleado" value={String(empleado?.id ?? "- ")} />
                            <InfoItem label="Estado" value={empleado?.activo === false ? "Inactivo" : "Activo"} />
                        </div>
                    </section>
                </div>

                <section className="mt-6 rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5">
                    <h2 className="mb-4 text-xl font-bold text-[#f5efff]">Dirección</h2>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <InfoItem label="Estado" value={direccion?.estado || "No registrado"} />
                        <InfoItem label="Municipio" value={direccion?.municipio || "No registrado"} />
                        <InfoItem label="Colonia" value={direccion?.colonia || "No registrado"} />
                        <InfoItem label="Código postal" value={direccion?.codigoPostal || "No registrado"} />
                        <InfoItem label="Calle" value={direccion?.calle || "No registrado"} />
                        <InfoItem label="No. exterior" value={direccion?.numeroExterior || "No registrado"} />
                        <InfoItem label="No. interior" value={direccion?.numeroInterior || "No registrado"} />
                        <InfoItem label="Referencia" value={direccion?.referencia || "No registrado"} />
                    </div>
                </section>
            </div>
        </main>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-[#4f434b] bg-[#1f1d35] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d3c2cb]">{label}</p>
            <p className="mt-2 text-sm font-medium text-[#f5efff]">{value}</p>
        </div>
    );
}