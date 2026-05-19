"use client";

import { useRouter } from "next/navigation";
import { AuthModal } from "../AuthModal";

export default function SignUpPage() {
    const router = useRouter();

    return (
        <main className="min-h-dvh bg-slate-50">
            <AuthModal
                isOpen
                initialView="signup"
                onClose={() => router.push("/role/welcompage")}
            />
        </main>
    );
}
