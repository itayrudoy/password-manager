import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { RequireAuth } from "./auth/RequireAuth";
import { SignupPage } from "./auth/SignupPage";
import { VaultKeyProvider } from "./keychain/VaultKeyContext";
import { VaultPage } from "./vault/VaultPage";

export function App() {
  return (
    <AuthProvider>
      <VaultKeyProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <VaultPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </VaultKeyProvider>
    </AuthProvider>
  );
}
