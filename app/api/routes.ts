import axios from 'axios';
export interface CreateAccountInterface {
    email: string;
    username?: string;
    password: string;
    rolId?: number;
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    fechaNacimiento?: string;
    genero?: string;
    curp?: string;
    rfc?: string;
    telefono?: string;
    ine?: string;
    estado?: string;
    municipio?: string;
    colonia?: string;
    codigoPostal?: string;
    calle?: string;
    numeroExterior?: string;
    referencia?: string;
    direccion_id?: number | null;
    comprobante_domicilio?: string;
}
const api = axios.create({
     // http://143.198.152.9:4000
    // 127.0.0.1
    baseURL: 'http://143.198.152.9:4000',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
    },
});

export async function registerUser(userData: CreateAccountInterface) {
    // POST /register
    return api.post('api/auth/register', userData);
}
export async function login(email: string, password: string) {
    try {
        const response = await api.post('api/auth/login', { email, password });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}
export async function setupTOTP(token: string) {
    try {
        const response = await api.post(
            'api/totp/setup',
            undefined,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}
export async function enableTotp(token: string, code: string) {
    try {
        const response = await api.post(
            'api/totp/enable',
            {code},
            {
                
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response;
        }
        throw error;
    }
}
export async function verifytotp({
    mfaToken,
    code,
}: {
    mfaToken: string;
    code: string;
}) {
    try {
        const response = await api.post('api/totp/verify', {
            mfaToken,
            code,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response;
        }
        throw error;
    }
}
export async function questionsFirst({
    mfaToken,
    securityQuestions,
}: {
    mfaToken: string;
    securityQuestions: Array<{
        question: string;
        answer: string;
    }>;
}) {
    try {
        const response = await api.post('api/security/setup', {
            mfaToken,
            securityQuestions,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}
export async function verifyQuestions({
    mfaToken,
    code,
}: {
    mfaToken: string;
    code: string;
}) {
    try {
        const response = await api.post('api/totp/verify', {
            mfaToken,
            code,
        });

        return Boolean(response?.data?.securityQuestionsConfigured ?? false);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Boolean(error.response?.data?.securityQuestionsConfigured ?? false);
        }
        throw error;
    }
}
export async function consultarempleados({
    roles,
    sucursalId,
    page = 1,
    limit = 10,
    search,
}: {
    roles?: string | number | Array<string | number>;
    sucursalId?: string | number;
    page?: number;
    limit?: number;
    search?: string;
} = {}, token?: string) {
    try {
        const queryParams: Record<string, string> = {};

        if (roles !== undefined && roles !== null && roles !== '') {
            const rawRoles = Array.isArray(roles) ? roles : [roles];
            const cleanRoles = rawRoles
                .flatMap((role) => String(role).split(','))
                .map((role) => role.trim())
                .filter((role) => /^\d+$/.test(role));

            if (cleanRoles.length > 0) {
                queryParams.roles = cleanRoles.join(',');
            }
        }

        const parsedSucursalId = Number(sucursalId);
        if (sucursalId !== undefined && sucursalId !== null && sucursalId !== '' && Number.isFinite(parsedSucursalId)) {
            queryParams.sucursalId = String(parsedSucursalId);
        }

        if (page !== undefined && page !== null && Number.isFinite(Number(page))) {
            queryParams.page = String(Number(page));
        }

        if (limit !== undefined && limit !== null && Number.isFinite(Number(limit))) {
            queryParams.limit = String(Number(limit));
        }

        if (search !== undefined && search !== null && search !== '') {
            queryParams.search = String(search);
        }

        const response = await api.get('/api/gerentes/consultar/empleados', {
            params: queryParams,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data?.data ?? response?.data ?? [];
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}
export async function obtenerEmpleado(id: number | string, token?: string) {
    try {
        const response = await api.get(`api/gerentes/obtener/empleado/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response?.data?.data ?? response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function obtenerEmpleadosFiltrados({
    roles,
    sucursalId,
    page = 1,
    limit = 10,
    search,
}: {
    roles?: string | number | Array<string | number>;
    sucursalId?: string | number;
    page?: number;
    limit?: number;
    search?: string;
} = {}, token?: string) {
    return consultarempleados({ roles, sucursalId, page, limit, search }, token);
}

export async function obtenerDetalleEmpleado(id: number | string, token?: string) {
    return obtenerEmpleado(id, token);
}

export async function verifytoken(token: string) {
    try {
        const response = await api.get('api/auth/validate', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function getSecurityQuestions(mfaToken: string) {
    try {
        const response = await api.post('api/security/questions', {
            mfaToken,
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function obtenerSucursales(token?: string) {
    try {
        const response = await api.get('api/gerentes/obtener/sucursales-selector', {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        
        const data = response?.data?.data ?? response?.data ?? [];

        if (!Array.isArray(data)) return data;

        return data.filter((sucursal: any) => {
            const deletedAt = sucursal?.deleted_at ?? sucursal?.deletedAt ?? sucursal?.deletedAtDate ?? null;
            const isDeleted = Boolean(deletedAt) || Boolean(sucursal?.isDeleted);
            return !isDeleted && Number(sucursal?.id) > 0;
        });
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export interface CreateSucursalPayload {
    nombre: string;
    estado: string;
    municipio: string;
    codigo_postal: string;
    colonia: string;
    calle: string;
    numero_exterior: string;
    numero_interior?: string;
    referencia?: string;
    direccionId?: number;
}

export interface UpdateSucursalPayload {
    nombre?: string;
    direccionId?: number;
    estado?: string;
    municipio?: string;
    codigo_postal?: string;
    colonia?: string;
    calle?: string;
    numero_exterior?: string;
    numero_interior?: string;
    referencia?: string;
}

export async function getSucursales(token?: string) {
    try {
        const response = await api.get('api/gerentes/obtener/sucursales-selector', {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data?.data ?? response?.data ?? [];
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function getSucursalById(id: number | string, token?: string) {
    try {
        const response = await api.get(`api/sucursales/obtener/detalle/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data?.data ?? response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function createSucursal(payload: CreateSucursalPayload, token?: string) {
    try {
        const response = await api.post('api/sucursales/crear', payload, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function updateSucursal(id: number | string, payload: UpdateSucursalPayload, token?: string) {
    try {
        const response = await api.put(`api/sucursales/${id}`, payload, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function deleteSucursal(id: number | string, token?: string) {
    try {
        const response = await api.delete(`api/sucursales/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function obtenerAuditLogs({
    page = 1,
    limit = 15,
    module,
    action,
    status,
    userId,
    username,
    sucursalId,
    startDate,
    endDate,
    search,
}: {
    page?: number | string;
    limit?: number | string;
    module?: string;
    action?: string;
    status?: string;
    userId?: number | string;
    username?: string;
    sucursalId?: number | string;
    startDate?: string;
    endDate?: string;
    search?: string;
} = {}, token?: string) {
    try {
        const params: Record<string, string> = {};

        if (page !== undefined && page !== null && page !== '') params.page = String(page);
        if (limit !== undefined && limit !== null && limit !== '') params.limit = String(limit);
        if (module) params.module = String(module);
        if (action) params.action = String(action);
        if (status) params.status = String(status);
        if (userId !== undefined && userId !== null && userId !== '') params.userId = String(userId);
        if (username) params.username = String(username);
        if (sucursalId !== undefined && sucursalId !== null && sucursalId !== '') params.sucursalId = String(sucursalId);
        if (startDate) params.startDate = String(startDate);
        if (endDate) params.endDate = String(endDate);
        if (search) params.search = String(search);

        const response = await api.get('api/audits/logs', {
            params,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data ?? {
            message: 'Sin datos',
            data: [],
            pagination: {
                totalItems: 0,
                totalPages: 0,
                currentPage: Number(page) || 1,
                limit: Number(limit) || 15,
            },
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export type ConciliacionPagosParams = {
    page?: number | string;
    limit?: number | string;
    distribuidora_id?: number | string;
};

const getConciliacion = async (
    endpoint: string,
    { page = 1, limit = 15, distribuidora_id }: ConciliacionPagosParams = {},
    token?: string,
) => {
    try {
        const params: Record<string, string> = {
            page: String(page),
            limit: String(limit),
        };

        if (distribuidora_id !== undefined && distribuidora_id !== null && distribuidora_id !== "") {
            params.distribuidora_id = String(distribuidora_id);
        }

        const response = await api.get(endpoint, {
            params,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
};

export const obtenerConciliacionPagos = (
    params: ConciliacionPagosParams = {},
    token?: string,
) => getConciliacion("api/vales/conciliaciones/pagos", params, token);

export const obtenerConciliacionPagosDistribuidora = (
    params: ConciliacionPagosParams = {},
    token?: string,
) => getConciliacion("api/vales/conciliaciones/pagos-distribuidora", params, token);

export async function obtenerRoles(token?: string) {
    try {
        const response = await api.get('api/auth/roles', {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        return response?.data?.data ?? response?.data ?? [];
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export const obtenerSucursalesSelector = obtenerSucursales;

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

export async function crearEmpleado(payload: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    fecha_nacimiento: string;
    telefono: string;
    genero: string;
    estado: string;
    municipio: string;
    codigo_postal: string;
    colonia: string;
    calle: string;
    numero_exterior: string;
    numero_interior?: string;
    referencia?: string;
    rol_id: number;
    username: string;
    email: string;
    password: string;
    sucursal_id: number;
}, token?: string) {
    try {
        const normalizedPayload = {
            ...payload,
            fecha_nacimiento: normalizeDateToIso(payload?.fecha_nacimiento),
        };

        const response = await api.post('api/gerentes/crear/empleado', normalizedPayload, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function desactivarEmpleado(id: number | string, token?: string) {
    try {
        const response = await api.patch(`api/gerentes/desactivar/empleado/${id}`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export async function modificarEmpleado(id: number | string, payload: Record<string, unknown>, token?: string) {
    try {
        const response = await api.patch(`api/gerentes/modificar/empleado/${id}`, payload, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response?.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}


export default api;
