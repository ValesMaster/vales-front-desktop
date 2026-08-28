"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    createSucursal,
    deleteSucursal,
    getSucursalById,
    getSucursales,
    updateSucursal,
} from "../../api/routes";

type Branch = {
    id: number | string;
    nombre: string;
    estado: string;
    municipio: string;
    codigo_postal: string;
    colonia: string;
    calle: string;
    numero_exterior: string;
    numero_interior: string;
    referencia: string;
    activo: boolean;
    direccion?: string;
};

const EMPTY_FORM = {
    nombre: "",
    estado: "",
    municipio: "",
    codigo_postal: "",
    colonia: "",
    calle: "",
    numero_exterior: "",
    numero_interior: "",
    referencia: "",
    activo: true,
};

const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

const sanitizeFieldValue = (field: keyof typeof EMPTY_FORM, value: string) => {
    if (field === "codigo_postal") return value.replace(/\D/g, "").slice(0, 5);
    if (field === "numero_exterior" || field === "numero_interior") return value.replace(/\D/g, "").slice(0, 10);

    if (["nombre", "estado", "municipio", "colonia"].includes(field)) {
        return value.replace(/[^a-zA-ZÀ-ÿÑñ\s.'-]/g, "");
    }

    if (field === "calle" || field === "referencia") {
        return value.replace(/[^a-zA-ZÀ-ÿÑñ0-9\s.,#°/()'-]/g, "");
    }

    return value;
};

const isActive = (branch: Partial<Branch>) => {
    const activo: unknown = branch.activo;
    if (typeof activo === "boolean") return activo;
    if (typeof activo === "string") return activo.toLowerCase() === "true" || activo.toLowerCase() === "activo";
    if (typeof activo === "number") return activo === 1;
    return true;
};

const normalizeBranch = (item: any): Branch => {
    const branch = item?.sucursal ?? item;
    const address = branch?.direccion && typeof branch.direccion === "object" ? branch.direccion : {};
    const id = branch?.id ?? branch?.sucursalId ?? branch?.sucursal_id ?? 0;
    const nombre = branch?.nombre ?? branch?.name ?? `Sucursal ${id || "nueva"}`;
    const estado = branch?.estado ?? branch?.state ?? address?.estado ?? address?.state ?? "";
    const municipio = branch?.municipio ?? branch?.city ?? address?.municipio ?? address?.city ?? "";
    const codigo_postal = branch?.codigo_postal ?? branch?.codigoPostal ?? branch?.cp ?? address?.codigo_postal ?? address?.codigoPostal ?? address?.cp ?? "";
    const colonia = branch?.colonia ?? branch?.neighborhood ?? address?.colonia ?? address?.neighborhood ?? "";
    const calle = branch?.calle ?? branch?.street ?? address?.calle ?? address?.street ?? "";
    const numero_exterior = branch?.numero_exterior ?? branch?.numeroExterior ?? address?.numero_exterior ?? address?.numeroExterior ?? "";
    const numero_interior = branch?.numero_interior ?? branch?.numeroInterior ?? address?.numero_interior ?? address?.numeroInterior ?? "";
    const referencia = branch?.referencia ?? branch?.reference ?? address?.referencia ?? address?.reference ?? "";
    const direccion = [
        calle,
        numero_exterior ? `#${numero_exterior}` : "",
        colonia,
        municipio,
        estado,
        codigo_postal ? `C.P. ${codigo_postal}` : "",
    ]
        .filter(Boolean)
        .join(", ");

    return {
        id,
        nombre: String(nombre),
        estado: String(estado),
        municipio: String(municipio),
        codigo_postal: String(codigo_postal),
        colonia: String(colonia),
        calle: String(calle),
        numero_exterior: String(numero_exterior),
        numero_interior: String(numero_interior),
        referencia: String(referencia),
        activo: isActive(branch),
        direccion,
    };
};

export default function SucursalesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranchId, setEditingBranchId] = useState<number | string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const response = await getSucursales(token);
            const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
            setBranches(list.map(normalizeBranch));
        } catch (err) {
            console.error("Error cargando sucursales:", err);
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        fetchBranches();
    }, []);

    const activeBranches = useMemo(
        () => branches.filter((branch) => isActive(branch)).length,
        [branches]
    );

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setEditingBranchId(null);
        setError("");
    };

    const handleInputChange = (field: keyof typeof EMPTY_FORM, value: string | boolean) => {
        setForm((prev) => ({
            ...prev,
            [field]: typeof value === "string" ? sanitizeFieldValue(field, value) : value,
        }));
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = async (branch: Branch) => {
        const fillForm = (branchToEdit: Branch) => setForm({
            nombre: branchToEdit.nombre,
            estado: branchToEdit.estado,
            municipio: branchToEdit.municipio,
            codigo_postal: branchToEdit.codigo_postal,
            colonia: branchToEdit.colonia,
            calle: branchToEdit.calle,
            numero_exterior: branchToEdit.numero_exterior,
            numero_interior: branchToEdit.numero_interior,
            referencia: branchToEdit.referencia,
            activo: isActive(branchToEdit),
        });

        fillForm(branch);
        setEditingBranchId(branch.id);
        setError("");
        setIsModalOpen(true);

        const token = getToken();
        if (!token) return;

        try {
            const detail = await getSucursalById(branch.id, token);
            if (detail) fillForm(normalizeBranch(detail));
        } catch (err) {
            console.error("Error cargando el detalle de la sucursal:", err);
        }
    };

    const validateForm = () => {
        if (!form.nombre.trim() || !form.estado.trim() || !form.municipio.trim() || !form.calle.trim()) {
            return "Completa al menos nombre, estado, municipio y calle.";
        }

        if (form.codigo_postal && !/^\d{5}$/.test(form.codigo_postal)) {
            return "El código postal debe tener exactamente 5 números.";
        }

        return "";
    };

    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const token = getToken();
        if (!token) {
            window.location.href = "/login";
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const payload = {
                nombre: form.nombre.trim(),
                estado: form.estado.trim(),
                municipio: form.municipio.trim(),
                codigo_postal: form.codigo_postal.trim(),
                colonia: form.colonia.trim(),
                calle: form.calle.trim(),
                numero_exterior: form.numero_exterior.trim(),
                numero_interior: form.numero_interior.trim(),
                referencia: form.referencia.trim(),
                activo: form.activo,
            };

            if (editingBranchId !== null) {
                await updateSucursal(editingBranchId, payload, token);
            } else {
                await createSucursal(payload, token);
            }

            setIsModalOpen(false);
            resetForm();
            await fetchBranches();
        } catch (err) {
            console.error("Error guardando sucursal:", err);
            setError("No se pudo guardar la sucursal. Revisa la información o intenta más tarde.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        const token = getToken();
        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            await deleteSucursal(id, token);
            await fetchBranches();
        } catch (err) {
            console.error("Error eliminando sucursal:", err);
        }
    };

    const toggleStatus = async (id: number | string) => {
        const branch = branches.find((item) => String(item.id) === String(id));
        if (!branch) return;

        const token = getToken();
        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            const payload = {
                nombre: branch.nombre,
                estado: branch.estado,
                municipio: branch.municipio,
                codigo_postal: branch.codigo_postal,
                colonia: branch.colonia,
                calle: branch.calle,
                numero_exterior: branch.numero_exterior,
                numero_interior: branch.numero_interior,
                referencia: branch.referencia,
                activo: !isActive(branch),
            };

            await updateSucursal(id, payload, token);
            await fetchBranches();
        } catch (err) {
            console.error("Error cambiando estado de sucursal:", err);
        }
    };

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                            Administración
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Sucursales</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/gerente-general"
                            className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-sm font-semibold text-[#e4dfff] transition hover:border-[#EAA5A7]"
                        >
                            Volver al panel
                        </Link>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            + Agregar sucursal
                        </button>
                    </div>
                </header>

                <section className="mb-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5">
                        <p className="text-sm text-[#d3c2cb]">Total</p>
                        <h2 className="mt-4 text-3xl font-bold text-[#f5efff]">{branches.length}</h2>
                    </div>
                    <div className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5">
                        <p className="text-sm text-[#d3c2cb]">Activas</p>
                        <h2 className="mt-4 text-3xl font-bold text-[#f5efff]">{activeBranches}</h2>
                    </div>
                    <div className="rounded-2xl border border-[#4f434b] bg-[#2f253d] p-5">
                        <p className="text-sm text-[#d3c2cb]">Inactivas</p>
                        <h2 className="mt-4 text-3xl font-bold text-[#f5efff]">{branches.length - activeBranches}</h2>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#4f434b] bg-[#413250] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-[#f5efff]">Lista de sucursales</h3>

                    </div>

                    {loading ? (
                        <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4 text-[#d3c2cb]">
                            Cargando sucursales...
                        </div>
                    ) : branches.length === 0 ? (
                        <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4 text-[#d3c2cb]">
                            No hay sucursales registradas.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {branches.map((branch) => (
                                <div
                                    key={String(branch.id)}
                                    className="flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#2d253d] p-5 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <div className="mb-2 flex items-center gap-3">
                                            <h4 className="text-xl font-semibold text-[#f5efff]">{branch.nombre}</h4>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                    isActive(branch)
                                                        ? "bg-[#274a3a] text-[#a9f0c4]"
                                                        : "bg-[#5a3d3d] text-[#f6c1c1]"
                                                }`}
                                            >
                                                {isActive(branch) ? "Activa" : "Inactiva"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#d3c2cb]">{branch.direccion || "Sin dirección registrada"}</p>
                                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#d3c2cb]">
                                            {branch.codigo_postal ? <span>📍 C.P. {branch.codigo_postal}</span> : null}
                                            {branch.municipio ? <span>🏙️ {branch.municipio}</span> : null}
                                            {branch.estado ? <span>📌 {branch.estado}</span> : null}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleStatus(branch.id)}
                                            className="rounded-xl border border-[#4f434b] bg-[#34324b] px-3 py-2 text-sm font-medium text-[#e4dfff] transition hover:border-[#EAA5A7]"
                                        >
                                            {isActive(branch) ? "Desactivar" : "Activar"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(branch)}
                                            className="rounded-xl border border-[#4f434b] bg-[#2f253d] px-3 py-2 text-sm font-medium text-[#e4dfff] transition hover:border-[#EAA5A7]"
                                        >
                                            Modificar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(branch.id)}
                                            className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-[#4f434b] bg-[#2d253d] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.35)]">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-2xl font-semibold text-[#f5efff]">
                                {editingBranchId !== null ? "Modificar sucursal" : "Agregar sucursal"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="text-xl text-[#d3c2cb] hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        {error ? (
                            <div className="mb-4 rounded-xl border border-[#EAA5A7] bg-[#5a3d3d] px-3 py-2 text-sm text-[#f6c1c1]">
                                {error}
                            </div>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm text-[#d3c2cb]">Nombre</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                                    maxLength={100}
                                    required
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-[#d3c2cb]">Estado</label>
                                <input
                                    type="text"
                                    value={form.estado}
                                    onChange={(e) => handleInputChange("estado", e.target.value)}
                                    maxLength={80}
                                    required
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-[#d3c2cb]">Municipio</label>
                                <input
                                    type="text"
                                    value={form.municipio}
                                    onChange={(e) => handleInputChange("municipio", e.target.value)}
                                    maxLength={100}
                                    required
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-[#d3c2cb]">Código postal</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.codigo_postal}
                                    onChange={(e) => handleInputChange("codigo_postal", e.target.value)}
                                    maxLength={5}
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-[#d3c2cb]">Colonia</label>
                                <input
                                    type="text"
                                    value={form.colonia}
                                    onChange={(e) => handleInputChange("colonia", e.target.value)}
                                    maxLength={100}
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-[#d3c2cb]">Calle</label>
                                <input
                                    type="text"
                                    value={form.calle}
                                    onChange={(e) => handleInputChange("calle", e.target.value)}
                                    maxLength={120}
                                    required
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-[#d3c2cb]">No. exterior</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.numero_exterior}
                                    onChange={(e) => handleInputChange("numero_exterior", e.target.value)}
                                    maxLength={10}
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-[#d3c2cb]">No. interior</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.numero_interior}
                                    onChange={(e) => handleInputChange("numero_interior", e.target.value)}
                                    maxLength={10}
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm text-[#d3c2cb]">Referencia</label>
                                <input
                                    type="text"
                                    value={form.referencia}
                                    onChange={(e) => handleInputChange("referencia", e.target.value)}
                                    maxLength={250}
                                    className="w-full rounded-xl border border-[#4f434b] bg-[#1f1d35] px-3 py-2 text-[#f5efff] outline-none focus:border-[#EAA5A7]"
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center gap-3">
                                <input
                                    id="activoSucursal"
                                    type="checkbox"
                                    checked={form.activo}
                                    onChange={(e) => handleInputChange("activo", e.target.checked)}
                                    className="h-4 w-4 rounded border-[#4f434b] bg-[#1f1d35] text-[#844A79]"
                                />
                                <label htmlFor="activoSucursal" className="text-sm text-[#d3c2cb]">
                                    Sucursal activa
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="rounded-xl border border-[#4f434b] bg-[#34324b] px-4 py-2 text-sm font-medium text-[#e4dfff]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="rounded-xl border border-[#EAA5A7] bg-[#844A79] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting
                                    ? "Guardando..."
                                    : editingBranchId !== null
                                        ? "Guardar cambios"
                                        : "Crear sucursal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
