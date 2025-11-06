import { useState, useEffect } from "react";
import { UserInterface } from "./components/UserInterface";
import { PharmacyLogin } from "./components/PharmacyLogin";
import { PharmacyDashboard } from "./components/PharmacyDashboard";
import { Toaster } from "./components/ui/sonner";
import { Moon, Sun } from "lucide-react";
import { Button } from "./components/ui/button";

export default function App() {
  const [view, setView] = useState<"user" | "pharmacy-login" | "pharmacy-dashboard">("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // 🟢 On page load, auto-login if pharmacy_id exists
  useEffect(() => {
    const storedPharmacyId = localStorage.getItem("pharmacy_id");
    if (storedPharmacyId) {
      setIsLoggedIn(true);
      setView("pharmacy-dashboard");
    }
  }, []);

  // 🟢 When login succeeds
  const handlePharmacyLogin = () => {
    setIsLoggedIn(true);
    setView("pharmacy-dashboard");
  };

  // 🔴 When logout clicked
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("pharmacy_id"); // clear saved session
    setView("pharmacy-login");
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {/* View Switcher & Theme Toggle */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Button
            variant={view === "user" ? "default" : "outline"}
            onClick={() => setView("user")}
            className={
              view === "user"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
            }
          >
            User App
          </Button>
          <Button
            variant={view !== "user" ? "default" : "outline"}
            onClick={() => setView(isLoggedIn ? "pharmacy-dashboard" : "pharmacy-login")}
            className={
              view !== "user"
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950"
            }
          >
            Pharmacy
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-emerald-200 dark:border-gray-700 shadow-lg"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-600" />
            )}
          </Button>
        </div>

        {/* Render view */}
        {view === "user" && <UserInterface />}
        {view === "pharmacy-login" && <PharmacyLogin onLogin={handlePharmacyLogin} />}
        {view === "pharmacy-dashboard" && <PharmacyDashboard onLogout={handleLogout} />}

        <Toaster />
      </div>
    </div>
  );
}
