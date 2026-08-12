"use client"

import { useEffect, useState } from "react";
import { consultarempleados } from "../../api/routes";
import Link from "next/link";


export default function GestionUsuariosPage() {
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmpleados = async () => {
            try {
                const response = await consultarempleados(
                    { roles: [] },
                    localStorage.getItem('token') || ''
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
    }, []);

    const getUserLabel = (empleado: any) => {
        const nombre = empleado?.persona?.nombre || empleado?.nombre || empleado?.username || 'Empleado';
        const apellido = empleado?.persona?.apellidoPaterno || empleado?.apellidoPaterno || '';
        return `${nombre} ${apellido}`.trim();
    };

    const getRolLabel = (empleado: any) => {
        return empleado?.rol?.nombre || empleado?.rolId || 'Sin rol';
    };

    const getEstadoLabel = (empleado: any) => {
        return empleado?.activo === false ? 'Inactivo' : 'Activo';
    };

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-[#4f434b] bg-[#413250] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Administración
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Gestión de usuarios</h1>
                    </div>

                    <a
                        href="/gerente-general"
                        className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 text-sm font-medium text-[#e4dfff] transition hover:border-[#EAA5A7]"
>
                        Volver
                    </a>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-6 text-[#d3c2cb]">
                        Cargando empleados...
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {empleados.length === 0 ? (
                            <div className="col-span-full rounded-2xl border border-[#4f434b] bg-[#2f253d] p-6 text-[#d3c2cb]">
                                No hay empleados para mostrar.
                            </div>
                        ) : (
                            empleados.map((empleado, index) => {
                                const nombreCompleto = getUserLabel(empleado);
                                const rol = getRolLabel(empleado);
                                const estado = getEstadoLabel(empleado);

                                const empleadoId = empleado?.id ?? index + 1;

                                return (
                                    <Link href={`/gerente-general/gestion/${empleadoId}`} key={empleadoId} className="block">
                                        <div
                                            className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5 transition hover:border-[#EAA5A7]"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#844A79] font-bold text-white">
                                                    {nombreCompleto
                                                        .split(' ')
                                                        .map((part) => part[0])
                                                        .slice(0, 2)
                                                        .join('')
                                                        .toUpperCase()}
                                                </div>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${estado === 'Activo'
                                                        ? 'bg-[#2d4f43] text-[#a9f0c9]'
                                                        : 'bg-[#3d3b5e] text-[#cfd4ff]'
                                                    }`}
                                                >
                                                    {estado}
                                                </span>
                                            </div>

                                            <h2 className="text-lg font-semibold text-[#f5efff]">{nombreCompleto}</h2>
                                            <p className="mt-1 text-sm text-[#d3c2cb]">Rol: {rol}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
