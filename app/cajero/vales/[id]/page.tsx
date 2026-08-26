"use client"

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { obtenerDetalleVale, registrarPago, registrarPagoDistribuidora } from "../../../api/routes";

type Pago = {
    id: number;
    quincena: number;
    estado: string;
    fechaCorte: string;
    fechaPago: string | null;
    cantidadAPagar: string | number;
    cantidadPagada: string | number;
    multaGenerada: string | number | null;
    estadoMulta: string | null;
    tipoComportamiento: string | null;
};

type PagoDistribuidora = {
    id: number;
    plazo: number;
    referencia: string;
    fechaCorte: string;
    fechaPago: string | null;
    cantidadAPagar: string | number;
    cantidadPagada: string | number;
    metodoPago: string;
};

type ValeDesglose = {
    capitalPrestado: number;
    montoSeguro: number;
    montoComisionAgregada: number;
    montoInteres: number;
    montoTotalVale: number;
    cantidadPorPagoCliente: number;
    gananciaDistribuidoraTotal: number;
    gananciaDistribuidoraPorPago: number;
    montoARegresarEmpresaPorPago: number;
};

type ValeDetalle = {
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
        usuario?: { username?: string; email?: string } | null;
    } | null;
    pagos: Pago[];
    credito?: {
        id: number;
        pagosDistribuidor: PagoDistribuidora[];
    } | null;
    desglose?: ValeDesglose | null;
};

const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO'];

type Desglose = {
    cantidadPropia: number;
    atrasoAnteriorIncluido: boolean;
    multaCobrada: number;
    totalCobrado: number;
    puntosGanados: number;
    comisionPerdidaDistribuidora: number;
};

export default function CajeroValeDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = usePromise(params);
    const router = useRouter();
    const [vale, setVale] = useState<ValeDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [registrando, setRegistrando] = useState<number | null>(null);
    const [confirmacion, setConfirmacion] = useState<Desglose | null>(null);
    const [registrandoDistribuidora, setRegistrandoDistribuidora] = useState<number | null>(null);
    const [metodoPago, setMetodoPago] = useState<string>(METODOS_PAGO[0]);
    const [capitalLiberado, setCapitalLiberado] = useState<number | null>(null);

    const cargarVale = async (token: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await obtenerDetalleVale(id, token);

            if (!response?.data) {
                setError(response?.message || 'No se pudo cargar el vale.');
                setVale(null);
                return;
            }

            setVale(response.data);
        } catch (err) {
            console.error('Error cargando el vale:', err);
            setError('No se pudo cargar el vale.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.replace('/login');
            return;
        }

        cargarVale(token);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, id]);

    const formatMoney = (value: string | number | null | undefined) => {
        const numeric = Number(value ?? 0);
        return Number.isFinite(numeric)
            ? numeric.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
            : String(value);
    };

    const formatFecha = (value: string | null | undefined) => {
        if (!value) return '—';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('es-MX');
    };

    const handleRegistrarPago = async (pagoId: number) => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.replace('/login');
            return;
        }

        setRegistrando(pagoId);
        setError('');
        setConfirmacion(null);

        try {
            const response = await registrarPago(pagoId, token);

            if (!response?.data) {
                setError(response?.message || 'No se pudo registrar el pago.');
                return;
            }

            setConfirmacion(response.data.desglose);
            await cargarVale(token);
        } catch (err) {
            console.error('Error registrando el pago:', err);
            setError('No se pudo registrar el pago.');
        } finally {
            setRegistrando(null);
        }
    };

    const handleRegistrarPagoDistribuidora = async (pagoDistribuidoraId: number) => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.replace('/login');
            return;
        }

        setRegistrandoDistribuidora(pagoDistribuidoraId);
        setError('');
        setCapitalLiberado(null);

        try {
            const response = await registrarPagoDistribuidora(pagoDistribuidoraId, metodoPago, token);

            if (!response?.data) {
                setError(response?.message || 'No se pudo registrar el pago a la empresa.');
                return;
            }

            setCapitalLiberado(Number(response.data.capitalLiberado ?? 0));
            await cargarVale(token);
        } catch (err) {
            console.error('Error registrando el pago a la empresa:', err);
            setError('No se pudo registrar el pago a la empresa.');
        } finally {
            setRegistrandoDistribuidora(null);
        }
    };

    const persona = vale?.cliente?.persona;
    const nombreCliente = persona
        ? [persona.nombre, persona.apellidoPaterno, persona.apellidoMaterno].filter(Boolean).join(' ')
        : 'N/D';

    const pagosOrdenados = [...(vale?.pagos ?? [])].sort((a, b) => a.quincena - b.quincena);
    const siguientePagoPendiente = pagosOrdenados.find((pago) => pago.estado === 'PENDIENTE');

    const pagosDistribuidoraOrdenados = [...(vale?.credito?.pagosDistribuidor ?? [])].sort((a, b) => a.plazo - b.plazo);
    const siguientePagoDistribuidoraPendiente = pagosDistribuidoraOrdenados.find((pago) => !pago.fechaPago);

    return (
        <main className="min-h-screen bg-[#1f1d35] p-6 text-[#e4dfff] md:p-8">
            <div className="mx-auto max-w-5xl">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#4f434b] bg-[#413250]/90 p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">Caja</p>
                        <h1 className="mt-2 text-3xl font-bold text-[#f5efff]">Vale #{id}</h1>
                    </div>

                    <a
                        href="/cajero/vales"
                        className="rounded-xl border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-sm font-semibold text-[#e4dfff] transition hover:border-[#EAA5A7]"
                    >
                        ← Volver a vales
                    </a>
                </header>

                {error ? (
                    <p className="mb-4 rounded-xl border border-[#ffb4ab]/40 bg-[#2f253d] p-4 text-sm text-[#ffb4ab]">{error}</p>
                ) : null}

                {confirmacion ? (
                    <div className="mb-6 rounded-2xl border border-[#EAA5A7] bg-[#2f253d] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                        <h3 className="mb-3 text-lg font-semibold text-[#f5efff]">Pago registrado con éxito</h3>
                        <dl className="grid gap-2 text-sm text-[#d3c2cb] md:grid-cols-2">
                            <div><dt className="text-[#EAA5A7]">Cantidad propia</dt><dd>{formatMoney(confirmacion.cantidadPropia)}</dd></div>
                            <div><dt className="text-[#EAA5A7]">Incluye atraso anterior</dt><dd>{confirmacion.atrasoAnteriorIncluido ? 'Sí' : 'No'}</dd></div>
                            <div><dt className="text-[#EAA5A7]">Multa cobrada</dt><dd>{formatMoney(confirmacion.multaCobrada)}</dd></div>
                            <div><dt className="text-[#EAA5A7]">Total cobrado</dt><dd className="font-semibold text-[#f5efff]">{formatMoney(confirmacion.totalCobrado)}</dd></div>
                            <div><dt className="text-[#EAA5A7]">Puntos ganados</dt><dd>{confirmacion.puntosGanados}</dd></div>
                            <div><dt className="text-[#EAA5A7]">Comisión perdida por la distribuidora</dt><dd>{formatMoney(confirmacion.comisionPerdidaDistribuidora)}</dd></div>
                        </dl>
                    </div>
                ) : null}

                {capitalLiberado !== null ? (
                    <div className="mb-6 rounded-2xl border border-[#EAA5A7] bg-[#2f253d] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                        <h3 className="mb-2 text-lg font-semibold text-[#f5efff]">Pago a la empresa registrado con éxito</h3>
                        <p className="text-sm text-[#d3c2cb]">
                            Capital liberado del crédito de la distribuidora: <span className="font-semibold text-[#f5efff]">{formatMoney(capitalLiberado)}</span>
                        </p>
                    </div>
                ) : null}

                {loading ? (
                    <p className="text-[#d3c2cb]">Cargando...</p>
                ) : vale ? (
                    <>
                        <section className="mb-6 grid gap-4 rounded-2xl border border-[#4f434b] bg-[#413250] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)] md:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Cliente</p>
                                <p className="text-lg text-[#f5efff]">{nombreCliente}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Distribuidora</p>
                                <p className="text-lg text-[#f5efff]">{vale.distribuidora?.usuario?.username ?? 'N/D'}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Prestado (capital)</p>
                                <p className="text-lg text-[#f5efff]">{formatMoney(vale.cantidadPrestada)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Pagado hasta ahora</p>
                                <p className="text-lg text-[#f5efff]">{formatMoney(vale.cantidadPagada)}</p>
                            </div>
                            {vale.desglose ? (
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Pendiente por cobrar</p>
                                    <p className="text-lg text-[#f5efff]">
                                        {formatMoney(Math.max(0, vale.desglose.montoTotalVale - Number(vale.cantidadPagada)))}
                                    </p>
                                </div>
                            ) : null}
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Plazos</p>
                                <p className="text-lg text-[#f5efff]">{vale.plazos}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Estado</p>
                                <span className="inline-block rounded-full border border-[#4f434b] bg-[#2d253d] px-3 py-1 text-xs font-semibold text-[#EAA5A7]">
                                    {vale.estado}
                                </span>
                            </div>
                        </section>

                        {vale.desglose ? (
                            <section className="mb-6 rounded-2xl border border-[#4f434b] bg-[#413250] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                                <h3 className="mb-4 text-lg font-semibold text-[#f5efff]">Desglose del vale</h3>

                                <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4">
                                        <p className="text-xs uppercase tracking-wider text-[#d3c2cb]">Capital prestado</p>
                                        <p className="mt-1 text-lg font-semibold text-[#f5efff]">{formatMoney(vale.desglose.capitalPrestado)}</p>
                                    </div>
                                    <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4">
                                        <p className="text-xs uppercase tracking-wider text-[#d3c2cb]">Seguro</p>
                                        <p className="mt-1 text-lg font-semibold text-[#f5efff]">{formatMoney(vale.desglose.montoSeguro)}</p>
                                    </div>
                                    <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4">
                                        <p className="text-xs uppercase tracking-wider text-[#d3c2cb]">Comisión agregada (10%)</p>
                                        <p className="mt-1 text-lg font-semibold text-[#f5efff]">{formatMoney(vale.desglose.montoComisionAgregada)}</p>
                                    </div>
                                    <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4">
                                        <p className="text-xs uppercase tracking-wider text-[#d3c2cb]">Interés total (5% × quincenas)</p>
                                        <p className="mt-1 text-lg font-semibold text-[#f5efff]">{formatMoney(vale.desglose.montoInteres)}</p>
                                    </div>
                                </div>

                                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-[#EAA5A7]/60 bg-[#2f253d] p-4">
                                        <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Total del vale</p>
                                        <p className="mt-1 text-xl font-bold text-[#f5efff]">{formatMoney(vale.desglose.montoTotalVale)}</p>
                                    </div>
                                    <div className="rounded-xl border border-[#EAA5A7]/60 bg-[#2f253d] p-4">
                                        <p className="text-xs uppercase tracking-wider text-[#EAA5A7]">Pago del cliente por quincena</p>
                                        <p className="mt-1 text-xl font-bold text-[#f5efff]">{formatMoney(vale.desglose.cantidadPorPagoCliente)}</p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#4f434b] bg-[#2d253d] p-4">
                                    <p className="mb-2 text-xs uppercase tracking-wider text-[#d3c2cb]">De cada pago del cliente</p>
                                    <p className="text-sm text-[#e4dfff]">
                                        {formatMoney(vale.desglose.cantidadPorPagoCliente)} − {formatMoney(vale.desglose.gananciaDistribuidoraPorPago)} (ganancia de la distribuidora) = <span className="font-semibold text-[#f5efff]">{formatMoney(vale.desglose.montoARegresarEmpresaPorPago)}</span> que la distribuidora regresa a la empresa
                                    </p>
                                    <p className="mt-2 text-xs text-[#d3c2cb]">
                                        Ganancia total de la distribuidora en este vale: {formatMoney(vale.desglose.gananciaDistribuidoraTotal)}
                                    </p>
                                </div>
                            </section>
                        ) : null}

                        <section className="overflow-hidden rounded-2xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                            <div className="border-b border-[#4f434b] px-6 py-4">
                                <h3 className="text-lg font-semibold text-[#f5efff]">Calendario de pagos (cliente → distribuidora)</h3>
                                {vale.desglose ? (
                                    <p className="mt-1 text-xs text-[#d3c2cb]">
                                        Cada cuota incluye capital + seguro + comisión + interés, ya prorrateados entre {vale.plazos} quincenas.
                                        Si el pago anterior sigue vencido, al cobrar este se sumará también esa cuota más una multa de $300.
                                    </p>
                                ) : null}
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#2d253d] text-[#d3c2cb]">
                                    <tr>
                                        <th className="px-4 py-3">Quincena</th>
                                        <th className="px-4 py-3">Fecha corte</th>
                                        <th className="px-4 py-3">A pagar</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagosOrdenados.map((pago) => (
                                        <tr key={pago.id} className="border-t border-[#4f434b]">
                                            <td className="px-4 py-3">{pago.quincena}</td>
                                            <td className="px-4 py-3">{formatFecha(pago.fechaCorte)}</td>
                                            <td className="px-4 py-3">{formatMoney(pago.cantidadAPagar)}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full border border-[#4f434b] bg-[#2d253d] px-3 py-1 text-xs font-semibold text-[#EAA5A7]">
                                                    {pago.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {pago.estado === 'PENDIENTE' && pago.id === siguientePagoPendiente?.id ? (
                                                    <button
                                                        type="button"
                                                        disabled={registrando === pago.id}
                                                        onClick={() => handleRegistrarPago(pago.id)}
                                                        className="rounded-xl bg-[#844a79] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {registrando === pago.id ? 'Registrando...' : `Cobrar ${formatMoney(pago.cantidadAPagar)}`}
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        <section className="mt-6 overflow-hidden rounded-2xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_20px_rgba(0,0,0,0.25)]">
                            <div className="flex flex-col gap-3 border-b border-[#4f434b] px-6 py-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-[#f5efff]">Pagos de la distribuidora a la empresa</h3>
                                    {vale.desglose ? (
                                        <p className="mt-1 text-xs text-[#d3c2cb]">
                                            Ya viene descontada la ganancia de la distribuidora ({formatMoney(vale.desglose.gananciaDistribuidoraPorPago)} por quincena).
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs uppercase tracking-wider text-[#d3c2cb]" htmlFor="metodo_pago">
                                        Método de pago
                                    </label>
                                    <select
                                        id="metodo_pago"
                                        value={metodoPago}
                                        onChange={(event) => setMetodoPago(event.target.value)}
                                        className="rounded border border-[#4f434b] bg-[#34324b] px-3 py-2 text-sm text-[#e4dfff] focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7]"
                                    >
                                        {METODOS_PAGO.map((valor) => (
                                            <option key={valor} value={valor}>{valor}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {pagosDistribuidoraOrdenados.length === 0 ? (
                                <p className="px-6 py-6 text-center text-sm text-[#d3c2cb]">
                                    Este vale todavía no tiene un crédito asociado con pagos a la empresa.
                                </p>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#2d253d] text-[#d3c2cb]">
                                        <tr>
                                            <th className="px-4 py-3">Plazo</th>
                                            <th className="px-4 py-3">Fecha corte</th>
                                            <th className="px-4 py-3">A pagar</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagosDistribuidoraOrdenados.map((pago) => (
                                            <tr key={pago.id} className="border-t border-[#4f434b]">
                                                <td className="px-4 py-3">{pago.plazo}</td>
                                                <td className="px-4 py-3">{formatFecha(pago.fechaCorte)}</td>
                                                <td className="px-4 py-3">{formatMoney(pago.cantidadAPagar)}</td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-full border border-[#4f434b] bg-[#2d253d] px-3 py-1 text-xs font-semibold text-[#EAA5A7]">
                                                        {pago.fechaPago ? 'PAGADO' : 'PENDIENTE'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {!pago.fechaPago && pago.id === siguientePagoDistribuidoraPendiente?.id ? (
                                                        <button
                                                            type="button"
                                                            disabled={registrandoDistribuidora === pago.id}
                                                            onClick={() => handleRegistrarPagoDistribuidora(pago.id)}
                                                            className="rounded-xl bg-[#844a79] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {registrandoDistribuidora === pago.id ? 'Registrando...' : `Cobrar ${formatMoney(pago.cantidadAPagar)}`}
                                                        </button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    </>
                ) : (
                    <p className="text-[#d3c2cb]">Vale no encontrado.</p>
                )}
            </div>
        </main>
    );
}
