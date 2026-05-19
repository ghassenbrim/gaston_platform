"use client";

import { useRef, useState, useCallback, useEffect } from "react";

function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getSupportedMimeType(): string {
    // Check if MediaRecorder is available
    if (typeof MediaRecorder === "undefined") {
        return "";
    }

    const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
        "audio/wav",
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
}

function mimeToExt(mime: string): string {
    if (mime.includes("ogg"))  return "ogg";
    if (mime.includes("mp4"))  return "mp4";
    if (mime.includes("wav"))  return "wav";
    return "webm";
}

interface UseVoiceRecorderOptions {
    /** Called when recording stops and file is ready for review / sending. */
    onStop: (file: File, url: string) => void;
}

export function useVoiceRecorder({ onStop }: UseVoiceRecorderOptions) {
    const [isRecording, setIsRecording] = useState(false);
    const [seconds,     setSeconds]     = useState(0);
    const [error,       setError]       = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState<boolean>(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef        = useRef<Blob[]>([]);
    const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
    const streamRef        = useRef<MediaStream | null>(null);

    // Check support on mount
    useEffect(() => {
        const supported = typeof MediaRecorder !== "undefined" && getSupportedMimeType() !== "";
        setIsSupported(supported);
    }, []);

    const start = useCallback(async () => {
        setError(null);

        // Check if MediaRecorder is supported
        if (typeof MediaRecorder === "undefined") {
            setIsSupported(false);
            setError("L'enregistrement vocal n'est pas supporté sur ce navigateur. Essayez un navigateur plus récent.");
            return;
        }

        // Check for mobile-specific issues
        if (isMobile()) {
            // On mobile, check if we're in a secure context (HTTPS)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                setError("L'enregistrement vocal nécessite une connexion sécurisée (HTTPS) sur mobile.");
                return;
            }
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });
            streamRef.current = stream;

            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                setIsSupported(false);
                setError("Aucun format audio supporté trouvé. Essayez un navigateur plus récent.");
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            const recorder = new MediaRecorder(stream, { mimeType });
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                streamRef.current = null;

                if (chunksRef.current.length === 0) {
                    setError("Aucun audio enregistré.");
                    return;
                }
                const actualMime = mimeType || "audio/webm";
                const ext  = mimeToExt(actualMime);
                const blob = new Blob(chunksRef.current, { type: actualMime });
                const file = new File([blob], `vocal_${Date.now()}.${ext}`, { type: actualMime });
                const url  = URL.createObjectURL(blob);
                onStop(file, url);
            };

            recorder.onerror = (e) => {
                console.error("MediaRecorder error:", e);
                setError("Erreur lors de l'enregistrement audio.");
            };

            // timeslice de 250ms pour collecter les données régulièrement
            recorder.start(250);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setSeconds(0);
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } catch (err) {
            console.error("Micro error:", err);
            if (err instanceof Error) {
                if (err.name === "NotAllowedError") {
                    setError("Permission micro refusée. Autorisez l'accès au micro dans les paramètres de votre navigateur.");
                } else if (err.name === "NotFoundError") {
                    setError("Aucun micro trouvé. Vérifiez que votre appareil a un micro.");
                } else if (err.name === "NotReadableError") {
                    setError("Le micro est déjà utilisé par une autre application.");
                } else {
                    setError(`Erreur micro: ${err.message}`);
                }
            } else {
                setError("Microphone non disponible.");
            }
        }
    }, [onStop]);

    const stop = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setSeconds(0);
    }, []);

    const cancel = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        // Vider les chunks pour ne pas envoyer
        chunksRef.current = [];
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setIsRecording(false);
        setSeconds(0);
    }, []);

    const toggle = useCallback(() => {
        if (isRecording) stop();
        else start();
    }, [isRecording, start, stop]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const fmt = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    return { isRecording, seconds, error, isSupported, start, stop, cancel, toggle, clearError, fmt };
}
