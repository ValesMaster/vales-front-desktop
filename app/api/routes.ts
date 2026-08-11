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
    baseURL: 'http://127.0.0.1:2552',
    timeout: 10000,
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
export async function verifytotp(code: string, token: string) {
    try {
        const response = await api.post('api/totp/verify', { token,code },
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
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
            const cleanRoles = Array.isArray(roles)
                ? roles
                    .map((role) => String(role).trim())
                    .filter((role) => role !== '' && role !== 'undefined' && role !== 'null' && !Number.isNaN(Number(role)))
                : [String(roles).trim()];

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

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}
export async function obtenerEmpleado(id: number) {
    try {
        const response = await api.get(`/api/gerentes/obtener/empleados/${id}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return error.response.data;
        }
        throw error;
    }
}

export default api;