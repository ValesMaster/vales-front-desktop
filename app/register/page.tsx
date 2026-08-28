"use client";
import { useEffect, useState } from "react";
import {
    emailRegex,
    passwordRegex,
    nameRegex,
    phoneRegex,
    fechaNacimientoRegex,
    curpRegex,
    rfcRegex,
    ineRegex,
    generoRegex,
    comprobanteDomicilioRegex,
     usernameRegex, referenciaRegex, postalCodeRegex, streetNumberRegex, streetNameRegex 
} from "../utils/regex";

export default function Register() {

    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(true);

    const [password, setPassword] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState(true);

    const [username, setUsername] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState(true);

    const [rolId, setRolId] = useState<number | null>(null);
    const [isRolIdValid, setIsRolIdValid] = useState(true);

    const [id, setId] = useState<number | null>(null);
    const [isIdValid, setIsIdValid] = useState(true);

    const [nombre, setNombre] = useState('');
    const [isNombreValid, setIsNombreValid] = useState(true);

    const [apellidoPaterno, setApellidoPaterno] = useState('');
    const [isApellidoPaternoValid, setIsApellidoPaternoValid] = useState(true);

    const [apellidoMaterno, setApellidoMaterno] = useState('');
    const [isApellidoMaternoValid, setIsApellidoMaternoValid] = useState(true);

    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [isFechaNacimientoValid, setIsFechaNacimientoValid] = useState(true);

    const [telefono, setTelefono] = useState('');
    const [isTelefonoValid, setIsTelefonoValid] = useState(true);

    const [estado, setEstado] = useState('');
    const [isEstadoValid, setIsEstadoValid] = useState(true);

    const [municipio, setMunicipio] = useState('');
    const [isMunicipioValid, setIsMunicipioValid] = useState(true);

    const [colonia, setColonia] = useState('');
    const [isColoniaValid, setIsColoniaValid] = useState(true);

    const [codigoPostal, setCodigoPostal] = useState('');
    const [isCodigoPostalValid, setIsCodigoPostalValid] = useState(true);

    const [calle, setCalle] = useState('');
    const [isCalleValid, setIsCalleValid] = useState(true);

    const [numeroExterior, setNumeroExterior] = useState('');
    const [isNumeroExteriorValid, setIsNumeroExteriorValid] = useState(true);

    const [referencia, setReferencia] = useState('');
    const [isReferenciaValid, setIsReferenciaValid] = useState(true);

    const [genero, setGenero] = useState('');
    const [isGeneroValid, setIsGeneroValid] = useState(true);

    const [curp, setCurp] = useState('');
    const [isCurpValid, setIsCurpValid] = useState(true);

    const [rfc, setRfc] = useState('');
    const [isRfcValid, setIsRfcValid] = useState(true);

    const [ine, setIne] = useState('');
    const [isIneValid, setIsIneValid] = useState(true);

    const [direccionId, setDireccionId] = useState<number | null>(null);
    const [isDireccionIdValid, setIsDireccionIdValid] = useState(true);

    const [comprobanteDomicilio, setComprobanteDomicilio] = useState('');
    const [isComprobanteDomicilioValid, setIsComprobanteDomicilioValid] = useState(true);
    const [deletedAt, setDeletedAt] = useState<string | null>(null);
    const [isDeletedAtValid, setIsDeletedAtValid] = useState(true);

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);


    /*
    para despues
    useEffect(() => {
        const verifyUserToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await verifyToken(token);
                if (response.success) {
                    window.location.href = '/';
                }
            }
        };

        verifyUserToken();


    }, []);*/
    
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, validator: RegExp, setValid: React.Dispatch<React.SetStateAction<boolean>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setter(value);
            setValid(validator.test(value));
        };

    const handleNombreChange = handleInputChange(setNombre, nameRegex, setIsNombreValid);
    const handleApellidoPaternoChange = handleInputChange(setApellidoPaterno, nameRegex, setIsApellidoPaternoValid);
    const handleApellidoMaternoChange = handleInputChange(setApellidoMaterno, nameRegex, setIsApellidoMaternoValid);
    const handleFechaNacimientoChange = handleInputChange(setFechaNacimiento, fechaNacimientoRegex, setIsFechaNacimientoValid);
    const handleTelefonoChange = handleInputChange(setTelefono, phoneRegex, setIsTelefonoValid);
    const handleGeneroChange = handleInputChange(setGenero, generoRegex, setIsGeneroValid);
    const handleCurpChange = handleInputChange(setCurp, curpRegex, setIsCurpValid);
    const handleRfcChange = handleInputChange(setRfc, rfcRegex, setIsRfcValid);
    const handleIneChange = handleInputChange(setIne, ineRegex, setIsIneValid);
    const handleComprobanteDomicilioChange = handleInputChange(setComprobanteDomicilio, comprobanteDomicilioRegex, setIsComprobanteDomicilioValid);
    const handleEmailChange = handleInputChange(setEmail, emailRegex, setIsEmailValid);
    const handlePasswordChange = handleInputChange(setPassword, passwordRegex, setIsPasswordValid);
    const handleUsernameChange = handleInputChange(setUsername, usernameRegex, setIsUsernameValid);
    const handleEstadoChange = handleInputChange(setEstado, nameRegex, setIsEstadoValid);
    const handleMunicipioChange = handleInputChange(setMunicipio, nameRegex, setIsMunicipioValid);
    const handleColoniaChange = handleInputChange(setColonia, nameRegex, setIsColoniaValid);
    const handleCodigoPostalChange = handleInputChange(setCodigoPostal, postalCodeRegex, setIsCodigoPostalValid);
    const handleCalleChange = handleInputChange(setCalle, streetNameRegex, setIsCalleValid);
    const handleNumeroExteriorChange = handleInputChange(setNumeroExterior, streetNumberRegex, setIsNumeroExteriorValid);
    const handleReferenciaChange = handleInputChange(setReferencia, referenciaRegex, setIsReferenciaValid);

    const handleDireccionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDireccionId(val ? Number(val) : null);
        setIsDireccionIdValid(/^\d+$/.test(val));
    };

    const handleRolIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRolId(val ? Number(val) : null);
        setIsRolIdValid(/^\d+$/.test(val));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // inicializar array con los estados `is...Valid` y mensajes (se usarán para comparar después)
        const initialValidations = [
            { valid: isNombreValid, message: 'Por favor, introduce el nombre.' },
            { valid: isApellidoPaternoValid, message: 'Por favor, introduce el apellido paterno.' },
            { valid: isApellidoMaternoValid, message: 'Por favor, introduce el apellido materno.' },
            { valid: isFechaNacimientoValid, message: 'Por favor, introduce la fecha de nacimiento.' },
            { valid: isTelefonoValid, message: 'Por favor, introduce el teléfono.' },
            { valid: isGeneroValid, message: 'Por favor, introduce el género.' },
            { valid: isCurpValid, message: 'Por favor, introduce la CURP.' },
            { valid: isRfcValid, message: 'Por favor, introduce el RFC.' },
            { valid: isIneValid, message: 'Por favor, introduce el INE.' },
            { valid: isDireccionIdValid, message: 'Por favor, asigna una dirección.' },
            { valid: isUsernameValid, message: 'Por favor, introduce el nombre de usuario.' },
            { valid: isRolIdValid, message: 'Por favor, selecciona un rol.' },
            { valid: isEstadoValid, message: 'Por favor, introduce el estado.' },
            { valid: isMunicipioValid, message: 'Por favor, introduce el municipio.' },
            { valid: isColoniaValid, message: 'Por favor, introduce la colonia.' },
            { valid: isCodigoPostalValid, message: 'Por favor, introduce el código postal.' },
            { valid: isCalleValid, message: 'Por favor, introduce la calle.' },
            { valid: isNumeroExteriorValid, message: 'Por favor, introduce el número exterior.' },
            { valid: isReferenciaValid, message: 'Por favor, introduce una referencia.' },
            { valid: isComprobanteDomicilioValid, message: 'Por favor, introduce el comprobante de domicilio.' },
            { valid: isEmailValid, message: 'Por favor, introduce el correo.' },
            { valid: isPasswordValid, message: 'Por favor, introduce la contraseña.' },
        ];

        // Evaluar los campos con los regex y actualizar los estados `is...Valid`
        const evaluated = [
            { valid: nameRegex.test(nombre), setter: setIsNombreValid, message: initialValidations[0].message },
            { valid: nameRegex.test(apellidoPaterno), setter: setIsApellidoPaternoValid, message: initialValidations[1].message },
            { valid: nameRegex.test(apellidoMaterno), setter: setIsApellidoMaternoValid, message: initialValidations[2].message },
            { valid: fechaNacimientoRegex.test(fechaNacimiento), setter: setIsFechaNacimientoValid, message: initialValidations[3].message },
            { valid: phoneRegex.test(telefono), setter: setIsTelefonoValid, message: initialValidations[4].message },
            { valid: generoRegex.test(genero), setter: setIsGeneroValid, message: initialValidations[5].message },
            { valid: curpRegex.test(curp), setter: setIsCurpValid, message: initialValidations[6].message },
            { valid: rfcRegex.test(rfc), setter: setIsRfcValid, message: initialValidations[7].message },
            { valid: ineRegex.test(ine), setter: setIsIneValid, message: initialValidations[8].message },
            { valid: direccionId !== null && Number.isInteger(direccionId), setter: setIsDireccionIdValid, message: initialValidations[9].message },
            { valid: usernameRegex.test(username), setter: setIsUsernameValid, message: initialValidations[10].message },
            { valid: rolId !== null && Number.isInteger(rolId), setter: setIsRolIdValid, message: initialValidations[11].message },
            { valid: nameRegex.test(estado), setter: setIsEstadoValid, message: initialValidations[12].message },
            { valid: nameRegex.test(municipio), setter: setIsMunicipioValid, message: initialValidations[13].message },
            { valid: nameRegex.test(colonia), setter: setIsColoniaValid, message: initialValidations[14].message },
            { valid: postalCodeRegex.test(codigoPostal), setter: setIsCodigoPostalValid, message: initialValidations[15].message },
            { valid: streetNameRegex.test(calle), setter: setIsCalleValid, message: initialValidations[16].message },
            { valid: streetNumberRegex.test(numeroExterior), setter: setIsNumeroExteriorValid, message: initialValidations[17].message },
            { valid: referenciaRegex.test(referencia), setter: setIsReferenciaValid, message: initialValidations[18].message },
            { valid: comprobanteDomicilioRegex.test(comprobanteDomicilio), setter: setIsComprobanteDomicilioValid, message: initialValidations[19].message },
            { valid: emailRegex.test(email), setter: setIsEmailValid, message: initialValidations[20].message },
            { valid: passwordRegex.test(password), setter: setIsPasswordValid, message: initialValidations[21].message },
        ];

        evaluated.forEach(v => v.setter(v.valid));

        for (const { valid, message } of evaluated) {
            if (!valid) {
                setAlertMessage(message);
                setIsAlertOpen(true);
                return;
            }
        }

        const userData = {
            id,
            nombres: nombre,
            username,
            rolId,
            apellidoPaterno,
            apellidoMaterno,
            fechaNacimiento,
            genero,
            curp,
            rfc,
            telefono,
            ine,
            estado,
            municipio,
            colonia,
            codigoPostal,
            calle,
            numeroExterior,
            referencia,
            direccion_id: direccionId,
            comprobante_domicilio: comprobanteDomicilio,
            deleted_at: deletedAt,
            email,
            password,
        };

        try {
            setIsLoading(true);
            const { registerUser } = await import('../api/routes');
            const responseUser = (await registerUser(userData as any)) as any;
            if (responseUser.error?.noCode == 430) {
                alert('No puedes usar ese número de teléfono');
                setIsLoading(false);
                return;
            }
            if (responseUser.success) { // && responseUser.data?.data?.user
                const user = responseUser.data.data.user;
                const resPartnerId = user.res_partner_id;

                if (!resPartnerId) {
                    console.error('El usuario no tiene un res_partner_id');
                    alert('Error al crear el usuario. Falta información.');
                    setIsLoading(false);
                    return;
                }

                const addressData = {
                    street: '', // street,
                    name: '', // name,
                    number_street: '', // number_street,
                    neighborhood: '', // neighborhood,
                    zip_code: '', // zip_code,
                    city: '', // city,
                    state: '', // state,
                    res_partner_id: resPartnerId
                };

                // Función temporal porque createAddress no existe en el código base
                const createAddress = async (data: any) => { return { success: true }; };
                const addressResponse = await createAddress(addressData);

                if (addressResponse.success) {

                    const setCookie = (name: string, value: string) => { document.cookie = `${name}=${value}; path=/`; };
                    localStorage.setItem('token', responseUser.data.data.access_token);
                    setCookie('token', responseUser.data.data.access_token);
                    setCookie('user', responseUser.data_odoo?.result?.token || '');

                    alert('Usuario creado exitosamente');
                    setIsLoading(false);
                    window.location.href = '/';
                } else {
                    console.error('Error creating address');
                    alert('Verifica los datos de la direccion');
                }
            } else {
                console.error('Error creating user', e, responseUser.error);
             
            }
        } catch (error) {
            console.error('Error al enviar el registro:', error);
            setAlertMessage('Ha ocurrido un error al enviar el formulario.');
            setIsAlertOpen(true);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#1f1d35] p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_12px_rgba(0,0,0,0.5)]">
                <div className="border-b border-[#34324b] px-10 pb-4 pt-10 text-center">
                    <h1 className="mb-2 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[#e4dfff]">
                        ValesMaster
                    </h1>
                    <p className="text-[16px] leading-6 text-[#d3c2cb]">Login</p>
                </div>

                <div className="p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-[#e4dfff]"
                                htmlFor="email"
                            >
                                Correo
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-[20px] text-[#EAA5A7]" aria-hidden="true">
                                        ✉
                                    </span>
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    className="block w-full rounded border border-[#4f434b] bg-[#34324b] py-2 pl-10 pr-3 text-[16px] leading-6 text-[#e4dfff] placeholder:text-[#d3c2cb] focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7]"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label
                                    className="block text-[12px] font-semibold uppercase tracking-wider text-[#e4dfff]"
                                    htmlFor="password"
                                >
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-[20px] text-[#EAA5A7]" aria-hidden="true">
                                        🔒
                                    </span>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    className="block w-full rounded border border-[#4f434b] bg-[#34324b] py-2 pl-10 pr-3 text-[16px] leading-6 text-[#e4dfff] placeholder:text-[#d3c2cb] focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7]"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}