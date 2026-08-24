"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { consultarempleados, verifytoken } from "./../api/routes";

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

const normalizeRoleId = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const parsed = normalizeRoleId(item);
            if (parsed !== null) return parsed;
        }
    }

    if (value && typeof value === 'object') {
        const candidate = (value as Record<string, unknown>)?.id
            ?? (value as Record<string, unknown>)?.rolId
            ?? (value as Record<string, unknown>)?.roleId
            ?? (value as Record<string, unknown>)?.rol_id
            ?? (value as Record<string, unknown>)?.role_id
            ?? (value as Record<string, unknown>)?.rol
            ?? (value as Record<string, unknown>)?.role;

        return normalizeRoleId(candidate);
    }

    return null;
};

const getRoleIdFromPayload = (payload: unknown): number | null => {
    const directRoleId = normalizeRoleId(
        typeof payload === 'object' && payload !== null
            ? (payload as Record<string, unknown>).rolId
                ?? (payload as Record<string, unknown>).roleId
                ?? (payload as Record<string, unknown>).rol_id
                ?? (payload as Record<string, unknown>).role_id
                ?? (payload as Record<string, unknown>).rol
                ?? (payload as Record<string, unknown>).role
                ?? (payload as Record<string, unknown>).roles
            : null,
    );

    if (directRoleId !== null || typeof payload !== 'object' || payload === null) {
        return directRoleId;
    }

    const record = payload as Record<string, unknown>;
    for (const key of ['user', 'usuario', 'data', 'profile', 'perfil']) {
        const nestedRoleId = getRoleIdFromPayload(record[key]);
        if (nestedRoleId !== null) return nestedRoleId;
    }

    return null;
};

const getRoleNameFromPayload = (payload: unknown): string | null => {
    if (typeof payload !== 'object' || payload === null) return null;

    const record = payload as Record<string, unknown>;
    const role = record.rol ?? record.role;

    if (typeof role === 'string') {
        return role.trim().toLocaleLowerCase('es-MX');
    }

    if (typeof role === 'object' && role !== null) {
        const roleRecord = role as Record<string, unknown>;
        const roleName = roleRecord.nombre ?? roleRecord.name ?? roleRecord.descripcion;
        if (typeof roleName === 'string') {
            return roleName.trim().toLocaleLowerCase('es-MX');
        }
    }

    for (const key of ['user', 'usuario', 'data', 'profile', 'perfil']) {
        const nestedRoleName = getRoleNameFromPayload(record[key]);
        if (nestedRoleName !== null) return nestedRoleName;
    }

    return null;
};

export default function GerenteGeneralPage() {
    const router = useRouter();
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRoleId, setUserRoleId] = useState<number | null>(null);
    const [userRoleName, setUserRoleName] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.replace('/login');
            return;
        }

        const fetchEmpleados = async () => {
            try {
                const response = await consultarempleados(
                    { roles: [] },
                    token,
                );

                const empleadosData = Array.isArray(response)
                    ? response
                    : Array.isArray((response as any)?.data)
                        ? (response as any).data
                        : [];

                setEmpleados(empleadosData);
            } catch (error) {
                console.error('Error cargando empleados:', error);
                setEmpleados([]);
            } finally {
                setLoading(false);
            }
        };

        const payload = getTokenPayload();
        const roleIdFromToken = getRoleIdFromPayload(payload);
        const roleNameFromToken = getRoleNameFromPayload(payload);
        setUserRoleId(roleIdFromToken);
        setUserRoleName(roleNameFromToken);

        const fetchUserRole = async () => {
            try {
                const validation = await verifytoken(token);
                const roleIdFromApi = getRoleIdFromPayload(validation);
                const roleNameFromApi = getRoleNameFromPayload(validation);

                // La API es la fuente de verdad; si no incluye el rol, se conserva
                // el valor del JWT para no ocultar el botón innecesariamente.
                if (roleIdFromApi !== null) {
                    setUserRoleId(roleIdFromApi);
                }

                if (roleNameFromApi !== null) {
                    setUserRoleName(roleNameFromApi);
                }
            } catch (error) {
                console.error('Error validando el rol del usuario:', error);
            }
        };

        fetchUserRole();
        fetchEmpleados();
    }, [router]);

    // La API actual entrega `rol: "administrador"`; ese valor corresponde al rol 7.
    const isAdmin = userRoleId === 7 || userRoleName === 'administrador';
    const isBranchManager = userRoleId === 3 || userRoleId === 7 || userRoleName === 'gerente de sucursal' || userRoleName === 'administrador';
    const isRoleResolved = userRoleId !== null || userRoleName !== null;
    const actions = [
        { label: 'Gestionar usuarios', href: '/gerente-general/gestion' },
        { label: 'Conciliación de pagos', href: '/gerente-general/conciliaciones' },
        ...(isRoleResolved && !isBranchManager ? [{ label: 'Gestionar sucursales', href: '/gerente-general/sucursales' }] : []),
        ...(isAdmin ? [{ label: 'Ver auditorías', href: '/gerente-general/auditorias' }] : []),
 
    ];

    const stats = [
        /* { label: 'Solicitudes', value: '1,284', trend: '+12.4%' },*/
        { label: 'Usuarios', value: loading ? '...' : String(empleados.length) },
        /*
        { label: 'Vales activos', value: '$48.6K', trend: '+5.3%' },*/

    ];


    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Administración
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Panel</h1>
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

                <section className="">
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
