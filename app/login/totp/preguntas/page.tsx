"use client";

import { useEffect, useState } from "react";
import api, { getSecurityQuestions } from "../../../api/routes";

type SecurityQuestion = {
    id: number;
    question: string;
};

export default function PreguntaAutenticacionPage() {
    const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState("");
    const [respuesta, setRespuesta] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const cargarPreguntas = async () => {
            const mfaToken = localStorage.getItem("token") || "";

            if (!mfaToken) {
                setError("No se encontró el token de autenticación.");
                return;
            }

            setIsLoading(true);

            try {
                const result = await getSecurityQuestions(mfaToken);

                if (result?.message || result?.error || result?.status === 401) {
                    setError(result?.message || result?.error || "Token inválido o expirado.");
                    return;
                }

                const list = Array.isArray(result?.questions) ? result.questions : [];
                if (!list.length) {
                    setError("No hay preguntas de seguridad disponibles.");
                    return;
                }

                setQuestions(list);
                setSelectedQuestionId(String(list[0].id));
            } catch {
                setError("No se pudieron cargar las preguntas de seguridad.");
            } finally {
                setIsLoading(false);
            }
        };

        cargarPreguntas();
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        const mfaToken = localStorage.getItem("token") || "";

        if (!mfaToken) {
            setError("No se encontró el token de autenticación.");
            return;
        }

        if (!respuesta.trim()) {
            setError("Debes ingresar la respuesta de seguridad.");
            return;
        }

        const selectedQuestion = questions.find((item) => String(item.id) === selectedQuestionId);
        if (!selectedQuestion) {
            setError("Selecciona una pregunta válida.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post("api/security/verify", {
                mfaToken,
                answers: [respuesta.trim()],
            });

            const data = response?.data;

            if (response?.status === 400 || response?.status === 401 || data?.message || data?.error) {
                setError(data?.message || data?.error || "Respuesta incorrecta.");
                return;
            }

            if (data?.accessToken) {
                localStorage.setItem("token", data.accessToken);
            }

            alert("Respuesta de seguridad válida.");
            window.location.href = "/gerente-general";
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.response?.data?.error || "Respuesta incorrecta.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#1f1d35] p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#4f434b] bg-[#413250] shadow-[0px_4px_20px_rgba(0,0,0,0.35)]">
                <div className="border-b border-[#34324b] px-8 pb-5 pt-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EAA5A7]">
                        Tercer factor
                    </p>
                    <h1 className="mt-2 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[#e4dfff]">
                        Pregunta de seguridad
                    </h1>
                    <p className="mt-2 text-[16px] leading-6 text-[#d3c2cb]">
                        Responde la pregunta seleccionada para continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                    <div>
                        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-[#e4dfff]">
                            Pregunta
                        </label>
                        <select
                            value={selectedQuestionId}
                            onChange={(e) => setSelectedQuestionId(e.target.value)}
                            disabled={isLoading || questions.length === 0}
                            className="block w-full rounded border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-[16px] text-[#e4dfff] outline-none ring-0 transition focus:border-[#EAA5A7] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {questions.map((item) => (
                                <option key={item.id} value={String(item.id)} className="bg-[#2d253d] text-[#e4dfff]">
                                    {item.question}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-[#e4dfff]">
                            Respuesta
                        </label>
                        <input
                            type="text"
                            value={respuesta}
                            onChange={(e) => setRespuesta(e.target.value)}
                            placeholder="Escribe tu respuesta"
                            className="block w-full rounded border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-[16px] text-[#e4dfff] placeholder:text-[#d3c2cb] outline-none transition focus:border-[#EAA5A7] focus:ring-2 focus:ring-[#EAA5A7]"
                        />
                    </div>

                    {error ? (
                        <p className="text-sm text-[#ffb4ab]">{error}</p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isLoading || isSubmitting || questions.length === 0}
                        className="flex w-full items-center justify-center rounded bg-[#844a79] px-4 py-3 text-[18px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0px_2px_4px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? "Procesando..." : isLoading ? "Cargando preguntas..." : "Continuar"}
                    </button>
                </form>
            </div>
        </main>
    );
}
