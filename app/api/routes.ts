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
    baseURL: 'http://143.198.152.9:2552',
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

export default api;