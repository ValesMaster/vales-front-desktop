"use client"
import { enableTotp, setupTOTP, verifytotp,verifyQuestions} from "../../api/routes";
import { SubmitEvent, useEffect, useState } from "react";



export default function Totp() {
    const [totpCode, setTotpCode] = useState<string>('');
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const fetchTOTP = async () => {
            try {
                const response = await setupTOTP(token);
                const value = response.qr
            } catch (error) {
                console.error('Error fetching TOTP:', error);
            }
        };

        fetchTOTP();
    }, []);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        const mfaToken = localStorage.getItem('token') || '';
        const response = await verifytotp({
            mfaToken,
            code: totpCode,
        });

        if (response?.status === 400 || response?.data?.message || response?.data?.error) {
            alert("Codigo incorrecto");
            setTotpCode("");
            return;
        }

        const hasSecurityQuestion = await verifyQuestions({
            mfaToken,
            code: totpCode,
        });

        if (response?.mfaToken) {
            localStorage.setItem("token", response.mfaToken);
        }

        if (hasSecurityQuestion) {
            window.location.href = "/login/totp/preguntas";
            return;
        }

        window.location.href = "/login/totp/preguntas/first";
    }

    return (

        <main className="flex min-h-screen items-center justify-center bg-[#1f1d35] p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_12px_rgba(0,0,0,0.5)]">
                <div className="border-b border-[#34324b] px-10 pb-4 pt-10 text-center">
                    <h1 className="mb-2 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[#e4dfff]">
                        ValesMaster
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <p className="text-[16px] leading-6 text-[#d3c2cb]">Escribe el codigo de autenticacion de tu app</p>
                        <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="Ingresa tu código de autenticación" className="bg-[#2a2537] text-[#d3c2cb] placeholder:text-[#6a5c70] border border-[#4f434b] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </form>
                </div>
            </div>
        </main>
    )
}