"use client";

import { logoutAction } from "./signe_out/actions";

export default function LogoutButton({ className, children }: { className?: string; children: React.ReactNode }) {
    const handleLogout = async () => {
        // Vider la session de cet onglet avant de se déconnecter
        sessionStorage.removeItem("gaston_tab_session");
        await logoutAction();
    };

    return (
        <button onClick={handleLogout} className={className}>
            {children}
        </button>
    );
}
