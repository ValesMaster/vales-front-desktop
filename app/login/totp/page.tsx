"use client"
import { setupTOTP,verifytotp } from "../../api/routes";
import { SubmitEvent, useEffect, useState } from "react";



export default function Totp() {
    const [base64, setBase64] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState<string>('');
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const fetchTOTP = async () => {
            try {
                const response = await setupTOTP(token);
                console.log("TOTP setup successful:", response);
                const value = response.qr
                setBase64(value);
            } catch (error) {
                console.error('Error fetching TOTP:', error);
            }
        };

        fetchTOTP();
    }, []);
    
    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const response = await verifytotp(totpCode, localStorage.getItem('token') || '');
            localStorage.setItem("token", response.accessToken);
        }
        catch (error) {
            console.error('Error verifying TOTP:', error);
        }
        finally {
            window.location.href = "/gerente-general";
        }


    }
  
    return (

        <main className="flex min-h-screen items-center justify-center bg-[#1f1d35] p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_12px_rgba(0,0,0,0.5)]">
                <div className="border-b border-[#34324b] px-10 pb-4 pt-10 text-center">
                    <h1 className="mb-2 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[#e4dfff]">
                        ValesMaster
                    </h1>
                    {base64 ? (
                        <img src={base64} className="mx-auto mb-4 w-32 h-32" />
                    ) : (
                        <p className="text-[16px] leading-6 text-[#d3c2cb]">Cargando código QR...</p>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                    <p className="text-[16px] leading-6 text-[#d3c2cb]">Escanea el código QR con tu aplicación de autenticación</p>
                    <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="Ingresa tu código de autenticación" className="bg-[#2a2537] text-[#d3c2cb] placeholder:text-[#6a5c70] border border-[#4f434b] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </form>
                </div>
            </div>
        </main>
    )
}