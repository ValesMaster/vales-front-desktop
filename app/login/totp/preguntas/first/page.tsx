"use client";

import { useState } from "react";
import { questionsFirst } from "../../../../api/routes";

const preguntas = [
    "¿Cuál es el nombre de tu primera mascota?",
    "¿En qué ciudad naciste?",
    "¿Cuál fue tu película favorita de niño?",
    "¿Cuál es el nombre de tu madre soltera?",
    "¿En qué escuela estudiaste la secundaria?",
];

export default function PreguntaAutenticacionPage() {
    const [pregunta, setPregunta] = useState(preguntas[0]);
    const [respuesta, setRespuesta] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!respuesta.trim()) {
            setError("Debes ingresar la respuesta de seguridad.");
            return;
        }

        setIsSubmitting(true);

        try {
            const mfaToken = localStorage.getItem("token") || "";

            if (!mfaToken) {
                setError("No se encontró el token de autenticación.");
                return;
            }

            const response = await questionsFirst({
                mfaToken,
                securityQuestions: [
                    {
                        question: pregunta,
                        answer: respuesta.trim(),
                    },
                ],
            });
            console.log(response,"respuesta q el puto de oz me da");

            if (response?.status === 400 || response?.message || response?.error) {
                setError(response?.message || response?.error || "No se pudo guardar la pregunta de seguridad.");
                return;
            }
            localStorage.setItem("token", response.accessToken);


            alert("Pregunta de seguridad guardada correctamente.");
            window.location.href = "/gerente-general";
        } catch {
            setError("No se pudo guardar la pregunta de seguridad.");
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
                        Elige una pregunta y define tu respuesta para reforzar tu autenticación.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                    <div>
                        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-[#e4dfff]">
                            Pregunta
                        </label>
                        <select
                            value={pregunta}
                            onChange={(e) => setPregunta(e.target.value)}
                            className="block w-full rounded border border-[#4f434b] bg-[#2d253d] px-4 py-3 text-[16px] text-[#e4dfff] outline-none ring-0 transition focus:border-[#EAA5A7]"
                        >
                            {preguntas.map((item) => (
                                <option key={item} value={item} className="bg-[#2d253d] text-[#e4dfff]">
                                    {item}
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
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center rounded bg-[#844a79] px-4 py-3 text-[18px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0px_2px_4px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? "Guardando..." : "Guardar pregunta"}
                    </button>
                </form>
            </div>
        </main>
    );
}
