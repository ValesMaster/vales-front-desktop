"use client"

import { useEffect, useState } from "react";
import { consultarempleados, crearEmpleado, desactivarEmpleado, modificarEmpleado, obtenerEmpleado, obtenerSucursales, obtenerRoles } from "../../api/routes";
import Link from "next/link";

const DEFAULT_ROLE_OPTIONS = [
    { id: 3, nombre: 'Gerente de sucursal' },
    { id: 4, nombre: 'Gerente general' },
    { id: 5, nombre: 'Empleado' },
];

const getTokenPayload = () => {
    const token = localStorage.getItem('token');

    if (!token) return null;

    try {
        const base64Payload = token.split('.')[1];
        if (!base64Payload) return null;

        const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
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
            ?? (value as Record<string, unknown>)?.role_id;

        return normalizeRoleId(candidate);
    }

    return null;
};

const getLoggedInUserId = () => {
    const payload = getTokenPayload();
    if (!payload) return null;

    const userId = Number(payload?.id ?? payload?.userId ?? payload?.sub);
    return Number.isFinite(userId) ? userId : null;
};

export default function GestionUsuariosPage() {
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [roleOptions, setRoleOptions] = useState<Array<{ id: number; nombre: string }>>(DEFAULT_ROLE_OPTIONS);
    const [userRoleId, setUserRoleId] = useState<number | null>(null);
    const [userSucursalId, setUserSucursalId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState({
        nombre: "",
        apellido_paterno: "",
        apellido_materno: "",
        fecha_nacimiento: "",
        telefono: "",
        genero: "M",
        estado: "",
        municipio: "",
        codigo_postal: "",
        colonia: "",
        calle: "",
        numero_exterior: "",
        numero_interior: "",
        referencia: "",
        rol_id: "5",
        username: "",
        email: "",
        password: "",
        sucursal_id: "1",
    });
    const [editForm, setEditForm] = useState({
        nombre: "",
        apellido_paterno: "",
        apellido_materno: "",
        fecha_nacimiento: "",
        telefono: "",
        genero: "M",
        estado: "",
        municipio: "",
        codigo_postal: "",
        colonia: "",
        calle: "",
        numero_exterior: "",
        numero_interior: "",
        referencia: "",
        sucursal_id: "1",
    });

    const fetchRoles = async () => {
        try {
            const response = await obtenerRoles(localStorage.getItem('token') || '');
            console.log('ROLES API response:', response);
            const rolesData = Array.isArray(response) ? response : DEFAULT_ROLE_OPTIONS;
            const filteredRoles = rolesData
                .filter((rol: any) => Number(rol?.id) !== 6)
                .map((rol: any) => ({
                    id: Number(rol?.id),
                    nombre: rol?.nombre || rol?.name || 'Rol',
                }))
                .filter((rol) => Number.isFinite(rol.id));

            setRoleOptions(filteredRoles.length > 0 ? filteredRoles : DEFAULT_ROLE_OPTIONS);
        } catch (error) {
            console.error('Error cargando roles:', error);
            setRoleOptions(DEFAULT_ROLE_OPTIONS);
        }
    };

    const isSucursalDeleted = (sucursal: any) => {
        const deletedAt = sucursal?.deleted_at ?? sucursal?.deletedAt ?? sucursal?.deletedAtDate ?? null;
        const normalizedDeletedAt = typeof deletedAt === 'string' ? deletedAt.trim().toLowerCase() : deletedAt;
        const hasDeletedValue =
            normalizedDeletedAt !== null &&
            normalizedDeletedAt !== undefined &&
            normalizedDeletedAt !== '' &&
            normalizedDeletedAt !== 'null' &&
            normalizedDeletedAt !== 'undefined';

        return hasDeletedValue || Boolean(sucursal?.isDeleted);
    };

    const fetchSucursales = async () => {
        try {
            const response = await obtenerSucursales(localStorage.getItem('token') || '');
            const sucursalesData = Array.isArray(response) ? response : [];
            const filteredSucursalData = sucursalesData.filter((sucursal: any) => !isSucursalDeleted(sucursal) && Number(sucursal?.id) > 0);

            setSucursales(filteredSucursalData);

            const payload = getTokenPayload();
            const roleId = normalizeRoleId(payload?.rolId ?? payload?.rol_id ?? payload?.roleId ?? payload?.role_id ?? payload?.rol ?? payload?.role ?? payload?.roles) ?? null;
            const currentSucursalId = Number(payload?.sucursalId ?? payload?.sucursal_id ?? payload?.sucursal?.id ?? payload?.branchId ?? payload?.branch_id ?? 0);

            setUserRoleId(Number.isFinite(roleId) ? roleId : null);
            setUserSucursalId(Number.isFinite(currentSucursalId) ? currentSucursalId : null);

            if (Number.isFinite(roleId) && roleId === 3) {
                const allowedSucursalId = Number.isFinite(currentSucursalId) ? currentSucursalId : Number(filteredSucursalData[0]?.id ?? 0);
                if (Number.isFinite(allowedSucursalId) && allowedSucursalId > 0) {
                    setForm((prev) => ({ ...prev, sucursal_id: String(allowedSucursalId), rol_id: String(prev.rol_id || 5) }));
                }
            }

            if (filteredSucursalData.length > 0 && !(Number.isFinite(roleId) && roleId === 3)) {
                setForm((prev) => ({ ...prev, sucursal_id: prev.sucursal_id || String(filteredSucursalData[0].id) }));
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error);
            setSucursales([]);
        }
    };

    const fetchEmpleados = async () => {
        try {
            const payload = getTokenPayload();
            const currentRoleId = normalizeRoleId(payload?.rolId ?? payload?.rol_id ?? payload?.roleId ?? payload?.role_id ?? payload?.rol ?? payload?.role ?? payload?.roles) ?? 0;
            const currentSucursalId = Number(payload?.sucursalId ?? payload?.sucursal_id ?? payload?.sucursal?.id ?? payload?.branchId ?? payload?.branch_id ?? 0);

            const response = await consultarempleados(
                {
                    roles: [],
                    sucursalId: Number.isFinite(currentRoleId) && currentRoleId === 3 && Number.isFinite(currentSucursalId) ? currentSucursalId : undefined,
                },
                localStorage.getItem('token') || ''
            );

            const empleadosData = Array.isArray(response) ? response : [];
            const loggedInUserId = getLoggedInUserId();

            const filteredEmpleados = loggedInUserId === null
                ? empleadosData
                : empleadosData.filter((empleado: any) => Number(empleado?.id) !== loggedInUserId);

            setEmpleados(filteredEmpleados);
        } catch (error) {
            console.error('Error cargando empleados:', error);
            setEmpleados([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
        fetchEmpleados();
        fetchSucursales();
    }, []);

    const handleInputChange = (field: string, value: string) => {
        let nextValue = value;

        switch (field) {
            case 'telefono':
                nextValue = value.replace(/\D/g, '').slice(0, 10);
                break;
            case 'codigo_postal':
                nextValue = value.replace(/\D/g, '').slice(0, 5);
                break;
            case 'numero_exterior':
            case 'numero_interior':
                nextValue = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
                break;
            case 'nombre':
            case 'apellido_paterno':
            case 'apellido_materno':
            case 'estado':
            case 'municipio':
            case 'colonia':
            case 'calle':
            case 'referencia':
                nextValue = value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÜüÑñ\s]/g, '').slice(0, 80);
                break;
            case 'username':
                nextValue = value.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 30);
                break;
            case 'email':
                nextValue = value.slice(0, 100);
                break;
            case 'password':
                nextValue = value.slice(0, 72);
                break;
            default:
                break;
        }

        setForm((prev) => ({ ...prev, [field]: nextValue }));
    };

    const validateEmployeeForm = () => {
        if (!form.nombre.trim() || !form.apellido_paterno.trim() || !form.fecha_nacimiento || !form.telefono.trim() || !form.username.trim() || !form.email.trim() || !form.password.trim()) {
            return 'Completa los campos obligatorios.';
        }

        if (!/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/.test(form.nombre.trim())) {
            return 'El nombre solo puede contener letras y espacios.';
        }

        if (!/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/.test(form.apellido_paterno.trim())) {
            return 'El apellido paterno solo puede contener letras y espacios.';
        }

        if (form.apellido_materno.trim() && !/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/.test(form.apellido_materno.trim())) {
            return 'El apellido materno solo puede contener letras y espacios.';
        }

        if (!/^\d{7,15}$/.test(form.telefono.replace(/\D/g, ''))) {
            return 'El teléfono debe contener solo números y tener entre 7 y 15 dígitos.';
        }

        if (!/^[a-zA-Z0-9_.]{3,30}$/.test(form.username.trim())) {
            return 'El username solo puede tener letras, números, puntos y guiones bajos.';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            return 'Ingresa un correo válido.';
        }

        if (form.password.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres.';
        }

        if (form.codigo_postal.trim() && form.codigo_postal.replace(/\D/g, '').length < 4) {
            return 'El código postal debe tener al menos 4 dígitos.';
        }

        const selectedSucursalId = Number(form.sucursal_id);

        if (userRoleId === 3) {
            const allowedSucursalId = userSucursalId ?? Number(form.sucursal_id);
            if (!Number.isFinite(allowedSucursalId) || allowedSucursalId <= 0) {
                return 'No se pudo identificar la sucursal del gerente.';
            }

            if (selectedSucursalId !== allowedSucursalId) {
                return `Este gerente solo puede crear empleados para la sucursal ${allowedSucursalId}.`;
            }
        }

        return '';
    };

    const normalizeDateToIso = (value?: string) => {
        if (!value || typeof value !== 'string') return '';

        const cleanValue = value.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
            return cleanValue;
        }

        const parsed = new Date(`${cleanValue}T00:00:00.000Z`);
        if (Number.isNaN(parsed.getTime())) {
            return cleanValue;
        }

        return parsed.toISOString();
    };

    const openEditModal = async (empleado: any) => {
        const token = localStorage.getItem('token') || '';

        try {
            const detalle = await obtenerEmpleado(empleado?.id, token);
            const usuario = detalle?.usuario ?? detalle ?? {};
            const persona = detalle?.persona ?? usuario?.persona ?? {};
            const direccion = persona?.direccion ?? {};
            const sucursalId = detalle?.empleados?.[0]?.sucursalId ?? empleado?.empleados?.[0]?.sucursalId ?? detalle?.sucursalId ?? empleado?.sucursal?.id ?? userSucursalId ?? Number(form.sucursal_id || 1);

            setEditingEmployeeId(Number(empleado?.id));
            setEditForm({
                nombre: persona?.nombre ?? '',
                apellido_paterno: persona?.apellidoPaterno ?? '',
                apellido_materno: persona?.apellidoMaterno ?? '',
                fecha_nacimiento: persona?.fechaNacimiento ? new Date(persona.fechaNacimiento).toISOString().split('T')[0] : '',
                telefono: String(persona?.telefono ?? ''),
                genero: persona?.genero ?? 'M',
                estado: direccion?.estado ?? '',
                municipio: direccion?.municipio ?? '',
                codigo_postal: String(direccion?.codigoPostal ?? ''),
                colonia: direccion?.colonia ?? '',
                calle: direccion?.calle ?? '',
                numero_exterior: String(direccion?.numeroExterior ?? ''),
                numero_interior: String(direccion?.numeroInterior ?? ''),
                referencia: direccion?.referencia ?? '',
                sucursal_id: String(sucursalId),
            });
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error cargando empleado para edición:', error);
            setError('No se pudo cargar la información del empleado.');
        }
    };

    const handleEditInputChange = (field: string, value: string) => {
        let nextValue = value;

        switch (field) {
            case 'telefono':
                nextValue = value.replace(/\D/g, '').slice(0, 15);
                break;
            case 'codigo_postal':
                nextValue = value.replace(/\D/g, '').slice(0, 5);
                break;
            case 'numero_exterior':
            case 'numero_interior':
                nextValue = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
                break;
            case 'nombre':
            case 'apellido_paterno':
            case 'apellido_materno':
            case 'estado':
            case 'municipio':
            case 'colonia':
            case 'calle':
            case 'referencia':
                nextValue = value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÜüÑñ\s]/g, '').slice(0, 80);
                break;
            default:
                break;
        }

        setEditForm((prev) => ({ ...prev, [field]: nextValue }));
    };

    const validateEditEmployeeForm = () => {
        if (!editForm.nombre.trim() || !editForm.apellido_paterno.trim() || !editForm.fecha_nacimiento || !editForm.telefono.trim()) {
            return 'Completa los campos obligatorios del empleado.';
        }

        if (!/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/.test(editForm.nombre.trim())) {
            return 'El nombre solo puede contener letras y espacios.';
        }

        if (!/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/.test(editForm.apellido_paterno.trim())) {
            return 'El apellido paterno solo puede contener letras y espacios.';
        }

        if (editForm.apellido_materno.trim() && !/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/.test(editForm.apellido_materno.trim())) {
            return 'El apellido materno solo puede contener letras y espacios.';
        }

        if (!/^\d{7,15}$/.test(editForm.telefono.replace(/\D/g, ''))) {
            return 'El teléfono debe contener solo números y tener entre 7 y 15 dígitos.';
        }

        const selectedSucursalId = Number(editForm.sucursal_id);

        if (userRoleId === 3) {
            const allowedSucursalId = userSucursalId ?? selectedSucursalId;
            if (!Number.isFinite(allowedSucursalId) || allowedSucursalId <= 0) {
                return 'No se pudo identificar la sucursal del gerente.';
            }

            if (selectedSucursalId !== allowedSucursalId) {
                return `Este gerente solo puede editar empleados de la sucursal ${allowedSucursalId}.`;
            }
        }

        return '';
    };

    const handleCreateEmployee = async () => {
        setError("");
        setSuccess("");

        const validationError = validateEmployeeForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token') || '';
            const payload = {
                nombre: form.nombre.trim(),
                apellido_paterno: form.apellido_paterno.trim(),
                apellido_materno: form.apellido_materno.trim(),
                fecha_nacimiento: normalizeDateToIso(form.fecha_nacimiento),
                telefono: String(form.telefono).replace(/\D/g, ''),
                genero: form.genero,
                estado: form.estado.trim(),
                municipio: form.municipio.trim(),
                codigo_postal: String(form.codigo_postal).replace(/\D/g, ''),
                colonia: form.colonia.trim(),
                calle: form.calle.trim(),
                numero_exterior: String(form.numero_exterior).trim(),
                numero_interior: String(form.numero_interior).trim(),
                referencia: form.referencia.trim(),
                rol_id: Number(form.rol_id),
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password,
                sucursal_id: userRoleId === 3 ? (userSucursalId ?? Number(form.sucursal_id)) : Number(form.sucursal_id),
            };

            const result = await crearEmpleado(payload, token);

            if (result?.success === false || result?.message?.toLowerCase().includes('error') || result?.status === 400 || result?.status === 500) {
                setError(result?.message || 'No se pudo crear el empleado.');
                return;
            }

            const nextSucursalId = userRoleId === 3 && userSucursalId ? String(userSucursalId) : (sucursales[0]?.id ? String(sucursales[0].id) : '1');
            const nextRoleId = roleOptions.find((rol) => Number(rol.id) !== 6)?.id ?? 5;

            setSuccess('Empleado creado correctamente.');
            setForm({
                nombre: "",
                apellido_paterno: "",
                apellido_materno: "",
                fecha_nacimiento: "",
                telefono: "",
                genero: "M",
                estado: "",
                municipio: "",
                codigo_postal: "",
                colonia: "",
                calle: "",
                numero_exterior: "",
                numero_interior: "",
                referencia: "",
                rol_id: String(nextRoleId),
                username: "",
                email: "",
                password: "",
                sucursal_id: nextSucursalId,
            });
            setIsModalOpen(false);
            await fetchEmpleados();
        } catch (error: any) {
            setError(error?.message || 'No se pudo crear el empleado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateEmployee = async () => {
        if (!editingEmployeeId) return;

        const validationError = validateEditEmployeeForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsEditSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token') || '';
            const payload = {
                nombre: editForm.nombre.trim(),
                apellido_paterno: editForm.apellido_paterno.trim(),
                apellido_materno: editForm.apellido_materno.trim(),
                fecha_nacimiento: normalizeDateToIso(editForm.fecha_nacimiento),
                telefono: String(editForm.telefono).replace(/\D/g, ''),
                genero: editForm.genero,
                estado: editForm.estado.trim(),
                municipio: editForm.municipio.trim(),
                codigo_postal: String(editForm.codigo_postal).replace(/\D/g, ''),
                colonia: editForm.colonia.trim(),
                calle: editForm.calle.trim(),
                numero_exterior: String(editForm.numero_exterior).trim(),
                numero_interior: String(editForm.numero_interior).trim(),
                referencia: editForm.referencia.trim(),
                sucursal_id: Number(editForm.sucursal_id),
            };

            const result = await modificarEmpleado(editingEmployeeId, payload, token);

            if (result?.success === false || result?.message?.toLowerCase().includes('error') || result?.status === 400 || result?.status === 500) {
                setError(result?.message || 'No se pudo actualizar el empleado.');
                return;
            }

            setSuccess('Empleado actualizado correctamente.');
            setIsEditModalOpen(false);
            await fetchEmpleados();
        } catch (error: any) {
            setError(error?.message || 'No se pudo actualizar el empleado.');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const handleDeactivateEmployee = async (empleadoId: number) => {
        const confirmed = window.confirm('¿Deseas desactivar este empleado?');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token') || '';
            const result = await desactivarEmpleado(empleadoId, token);

            if (result?.success === false || result?.message?.toLowerCase().includes('error') || result?.status === 400 || result?.status === 500) {
                setError(result?.message || 'No se pudo desactivar el empleado.');
                return;
            }

            setSuccess('Empleado desactivado correctamente.');
            await fetchEmpleados();
        } catch (error: any) {
            setError(error?.message || 'No se pudo desactivar el empleado.');
        }
    };

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

    const selectedSucursalName = sucursales.find((sucursal) => Number(sucursal?.id) === Number(form.sucursal_id))?.nombre || 'Sucursal';
    const isGeneralManager = userRoleId === 4;
    const selectableRoles = roleOptions.filter((rol) => Number(rol.id) !== 6);
    const visibleSucursales = (userRoleId === 3
        ? sucursales.filter((sucursal) => Number(sucursal?.id) === Number(userSucursalId ?? form.sucursal_id))
        : sucursales
    ).filter((sucursal) => !isSucursalDeleted(sucursal) && Number(sucursal?.id) > 0);

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-5xl rounded-2xl border border-[#4f434b] bg-[#413250] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
<div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Administración
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Gestión de usuarios</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-xl bg-[#844A79] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            + Agregar empleado
                        </button>

                        <a
                            href="/gerente-general"
                            className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 text-sm font-medium text-[#e4dfff] transition hover:border-[#EAA5A7]"
                        >
                            Volver
                        </a>
                    </div>
                </div>

                {success ? (
                    <div className="mb-4 rounded-xl border border-[#2d4f43] bg-[#1e3a32] px-4 py-3 text-sm text-[#a9f0c9]">
                        {success}
                    </div>
                ) : null}

                {error ? (
                    <div className="mb-4 rounded-xl border border-[#7a3d42] bg-[#3d2c35] px-4 py-3 text-sm text-[#ffb4ab]">
                        {error}
                    </div>
                ) : null}

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
                                    <div key={empleadoId} className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5 transition hover:border-[#EAA5A7]">
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

                                        <Link href={`/gerente-general/gestion/${empleadoId}`} className="block">
                                            <h2 className="text-lg font-semibold text-[#f5efff]">{nombreCompleto}</h2>
                                            <p className="mt-1 text-sm text-[#d3c2cb]">Rol: {rol}</p>
                                        </Link>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openEditModal(empleado);
                                                }}
                                                className="flex-1 rounded-xl bg-[#4a627a] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeactivateEmployee(Number(empleadoId));
                                                }}
                                                className="flex-1 rounded-xl bg-[#7a3d42] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                                            >
                                                Desactivar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#4f434b] bg-[#2d253d] p-6 shadow-[0px_8px_30px_rgba(0,0,0,0.4)]">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[#f5efff]">Agregar empleado</h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-xl text-[#d3c2cb] hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <input value={form.nombre} onChange={(e) => handleInputChange('nombre', e.target.value)} placeholder="Nombre" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.apellido_paterno} onChange={(e) => handleInputChange('apellido_paterno', e.target.value)} placeholder="Apellido paterno" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.apellido_materno} onChange={(e) => handleInputChange('apellido_materno', e.target.value)} placeholder="Apellido materno" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input type="date" value={form.fecha_nacimiento} onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)} className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff]" />
                            <input value={form.telefono} onChange={(e) => handleInputChange('telefono', e.target.value)} placeholder="Teléfono" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <select value={form.genero} onChange={(e) => handleInputChange('genero', e.target.value)} className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff]">
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="O">Otro</option>
                            </select>
                            <input value={form.estado} onChange={(e) => handleInputChange('estado', e.target.value)} placeholder="Estado" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.municipio} onChange={(e) => handleInputChange('municipio', e.target.value)} placeholder="Municipio" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.codigo_postal} onChange={(e) => handleInputChange('codigo_postal', e.target.value)} placeholder="Código postal" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.colonia} onChange={(e) => handleInputChange('colonia', e.target.value)} placeholder="Colonia" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.calle} onChange={(e) => handleInputChange('calle', e.target.value)} placeholder="Calle" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.numero_exterior} onChange={(e) => handleInputChange('numero_exterior', e.target.value)} placeholder="No. exterior" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.numero_interior} onChange={(e) => handleInputChange('numero_interior', e.target.value)} placeholder="No. interior" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.referencia} onChange={(e) => handleInputChange('referencia', e.target.value)} placeholder="Referencia" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb] md:col-span-2" />
                            <input value={form.username} onChange={(e) => handleInputChange('username', e.target.value)} placeholder="Username" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={form.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="Correo" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input type="password" value={form.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Contraseña" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb] md:col-span-2" />
                            <select
                                value={String(form.rol_id || selectableRoles[0]?.id || 5)}
                                onChange={(e) => handleInputChange('rol_id', e.target.value)}
                                className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff]"
                            >
                                {selectableRoles.length === 0 ? (
                                    <option value="5">Empleado</option>
                                ) : (
                                    selectableRoles.map((rol) => (
                                        <option key={rol.id} value={String(rol.id)}>
                                            {rol.nombre}
                                        </option>
                                    ))
                                )}
                            </select>

                            <select
                                value={String(form.sucursal_id || userSucursalId || visibleSucursales[0]?.id || '')}
                                onChange={(e) => handleInputChange('sucursal_id', e.target.value)}
                                disabled={userRoleId === 3}
                                className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] disabled:cursor-not-allowed disabled:opacity-80"
                            >
                                {visibleSucursales.length === 0 ? (
                                    <option value="">Sin sucursales disponibles</option>
                                ) : (
                                    visibleSucursales.map((sucursal) => (
                                        <option key={sucursal.id} value={String(sucursal.id)}>
                                            {sucursal.nombre}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 font-medium text-[#e4dfff]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateEmployee}
                                disabled={isSubmitting}
                                className="rounded-xl bg-[#844A79] px-4 py-2 font-semibold text-white disabled:opacity-70"
                            >
                                {isSubmitting ? 'Guardando...' : 'Guardar empleado'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {isEditModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#4f434b] bg-[#2d253d] p-6 shadow-[0px_8px_30px_rgba(0,0,0,0.4)]">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[#f5efff]">Editar empleado</h2>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-xl text-[#d3c2cb] hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <input value={editForm.nombre} onChange={(e) => handleEditInputChange('nombre', e.target.value)} placeholder="Nombre" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.apellido_paterno} onChange={(e) => handleEditInputChange('apellido_paterno', e.target.value)} placeholder="Apellido paterno" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.apellido_materno} onChange={(e) => handleEditInputChange('apellido_materno', e.target.value)} placeholder="Apellido materno" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input type="date" value={editForm.fecha_nacimiento} onChange={(e) => handleEditInputChange('fecha_nacimiento', e.target.value)} className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff]" />
                            <input value={editForm.telefono} onChange={(e) => handleEditInputChange('telefono', e.target.value)} placeholder="Teléfono" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <select value={editForm.genero} onChange={(e) => handleEditInputChange('genero', e.target.value)} className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff]">
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="O">Otro</option>
                            </select>
                            <input value={editForm.estado} onChange={(e) => handleEditInputChange('estado', e.target.value)} placeholder="Estado" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.municipio} onChange={(e) => handleEditInputChange('municipio', e.target.value)} placeholder="Municipio" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.codigo_postal} onChange={(e) => handleEditInputChange('codigo_postal', e.target.value)} placeholder="Código postal" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.colonia} onChange={(e) => handleEditInputChange('colonia', e.target.value)} placeholder="Colonia" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.calle} onChange={(e) => handleEditInputChange('calle', e.target.value)} placeholder="Calle" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.numero_exterior} onChange={(e) => handleEditInputChange('numero_exterior', e.target.value)} placeholder="No. exterior" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.numero_interior} onChange={(e) => handleEditInputChange('numero_interior', e.target.value)} placeholder="No. interior" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb]" />
                            <input value={editForm.referencia} onChange={(e) => handleEditInputChange('referencia', e.target.value)} placeholder="Referencia" className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] placeholder:text-[#d3c2cb] md:col-span-2" />
                            <select
                                value={String(editForm.sucursal_id || userSucursalId || visibleSucursales[0]?.id || '')}
                                onChange={(e) => handleEditInputChange('sucursal_id', e.target.value)}
                                disabled={userRoleId === 3}
                                className="rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#e4dfff] disabled:cursor-not-allowed disabled:opacity-80 md:col-span-2"
                            >
                                {visibleSucursales.length === 0 ? (
                                    <option value="">Sin sucursales disponibles</option>
                                ) : (
                                    visibleSucursales.map((sucursal) => (
                                        <option key={sucursal.id} value={String(sucursal.id)}>
                                            {sucursal.nombre}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-2 font-medium text-[#e4dfff]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateEmployee}
                                disabled={isEditSubmitting}
                                className="rounded-xl bg-[#4a627a] px-4 py-2 font-semibold text-white disabled:opacity-70"
                            >
                                {isEditSubmitting ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
