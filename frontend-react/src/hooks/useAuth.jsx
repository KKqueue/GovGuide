import { createContext, useContext, useState, useCallback } from "react";
import { verifyCredentials, registerUser } from "../api/services";

function obfuscate(str) {
  return btoa(str.split("").reverse().join(""));
}
function deobfuscate(str) {
  try { return atob(str).split("").reverse().join(""); } catch { return null; }
}

const defaultAuth = { user: null, authHeader: null, signIn: async () => {}, signUp: async () => {}, signOut: () => {} };
const AuthContext = createContext(defaultAuth);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return localStorage.getItem("govguide-user"); } catch { return null; }
  });
  const [authHeader, setAuthHeader] = useState(() => {
    try {
      const stored = localStorage.getItem("govguide-auth");
      if (!stored) return null;
      return stored.startsWith("Basic ") ? stored : deobfuscate(stored);
    } catch { return null; }
  });

  const signIn = useCallback(async (username, password) => {
    const header = await verifyCredentials(username, password);
    if (!header) throw new Error("Invalid username or password.");
    const normalised = username.toLowerCase();
    setUser(normalised);
    setAuthHeader(header);
    try { localStorage.setItem("govguide-user", normalised); localStorage.setItem("govguide-auth", obfuscate(header)); } catch {}
    return header;
  }, []);

  const signUp = useCallback(async (username, password) => {
    await registerUser(username, password);
    const header = await verifyCredentials(username, password);
    if (!header) throw new Error("Registration succeeded but sign-in failed. Please try signing in.");
    const normalised = username.toLowerCase();
    setUser(normalised);
    setAuthHeader(header);
    try { localStorage.setItem("govguide-user", normalised); localStorage.setItem("govguide-auth", obfuscate(header)); } catch {}
    return header;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setAuthHeader(null);
    try { localStorage.removeItem("govguide-user"); localStorage.removeItem("govguide-auth"); } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, authHeader, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
