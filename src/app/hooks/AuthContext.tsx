"use client"; // Ensure it's a client component

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; // Ensure Firebase auth is set up
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            router.push("/"); // ✅ Redirect to index after logout
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
