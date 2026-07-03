import "styles/globals.css";
import { Interview } from "./components/Interview";
import { Result } from "./components/Result";
import { Auth } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Instantly route the base URL to the Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview/:interviewId" element={<Interview />} />
        <Route path="/result/:interviewId" element={<Result />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      <Toaster position="bottom-left" theme="dark" />
    </BrowserRouter>
  );
}
export default App;