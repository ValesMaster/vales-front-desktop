export const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
export const verificationCodeRegex = /^\d{7}$/;
export const phoneRegex = /^\d{10}$/;
export const nameRegex = /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]{3,}$/;
export const streetNameRegex = /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]{3,}$/;
export const cityRegex = /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]{3,}$/;
export const stateRegex = /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]{3,}$/;

export const streetNumberRegex = /^\d{1,}$/;
export const postalCodeRegex = /^\d{5}$/;

export const fechaNacimientoRegex = /^\d{4}-\d{2}-\d{2}$/; // yyyy-mm-dd
export const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i;
export const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
export const ineRegex = /^[A-Z0-9]{6,20}$/i;
export const generoRegex = /^[A-Za-zñÑ]{1,20}$/i;
export const comprobanteDomicilioRegex = /.+/;
export const usernameRegex = /^[a-zA-Z0-9._-]{3,}$/;
export const referenciaRegex = /.+/;

