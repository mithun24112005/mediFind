import { useState } from "react";
import MapView from "./MapView";
import {
  Search,
  TrendingUp,
  Pill,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { LoadingSpinner } from "./LoadingSpinner";
import { NoResults } from "./NoResults";

export function UserInterface() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // 🧠 Main search logic
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a medicine name");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setShowResults(false);

    try {
      if (!navigator.geolocation) {
        alert("Geolocation not supported on this browser");
        setIsSearching(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;

          console.log("📍 User location:", latitude, longitude);

          const res = await fetch("http://localhost:3000/api/search_medicine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              medicine_name: searchQuery,
              latitude,
              longitude,
            }),
          });

          if (!res.ok) {
            console.error("❌ Backend returned error:", res.status);
            const errText = await res.text();
            console.error("Response:", errText);
            alert("Search failed. Please check backend connection.");
            setIsSearching(false);
            return;
          }

          const data = await res.json();
          console.log("✅ Backend response:", data);

          if (data && Array.isArray(data.pharmacies) && data.pharmacies.length > 0) {
            const formatted = data.pharmacies.map((p) => ({
              ...p,
              inStock: p.stock > 0,
              address: `${p.city}, ${p.state}`,
            }));

            setPharmacies(formatted);
            setUserLocation({ lat: latitude, lng: longitude });
            setShowResults(true);
          } else {
            alert("No nearby pharmacies found!");
            setPharmacies([]);
            setShowResults(false);
          }

          setIsSearching(false);
          setHasSearched(true);
        },
        (err) => {
          console.error("❌ Location access denied:", err);
          alert("Unable to detect your location. Please allow location access.");
          setIsSearching(false);
        },
        { enableHighAccuracy: true }
      );
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      alert("Unexpected error. Please try again.");
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-emerald-100 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              MediFind
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="mb-8 border-emerald-200 shadow-lg bg-white/80">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter medicine name (e.g., Paracetamol 500mg)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 border-emerald-200 focus:border-emerald-500"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loader */}
        {isSearching && <LoadingSpinner />}

        {/* Results Section */}
        {showResults && hasSearched && !isSearching && (
          <>
            {/* Google Map */}
            {userLocation && pharmacies.length > 0 && (
              <MapView userLocation={userLocation} pharmacies={pharmacies} />
            )}

            {/* Pharmacy Cards */}
            <div className="mt-6">
              <h3 className="text-emerald-700 flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5" />
                Available Pharmacies
              </h3>
              <div className="space-y-3">
                {pharmacies.map((pharmacy, i) => (
                  <Card
                    key={i}
                    className="border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-lg">{pharmacy.name}</h4>
                        <p className="text-sm text-gray-600">{pharmacy.address}</p>
                        <p className="text-sm text-gray-500">
                          {pharmacy.distance_km} km away
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl text-emerald-600 font-semibold">
                          ₹{pharmacy.price}
                        </div>
                        {pharmacy.inStock ? (
                          <Badge className="bg-emerald-100 text-emerald-700 mt-1">
                            In Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 mt-1">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* No Results */}
        {!showResults && hasSearched && !isSearching && <NoResults />}
      </div>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-emerald-100 mt-16 py-6 text-center text-gray-600">
        Powered by <span className="text-emerald-600 font-semibold">Impact-X</span> ⚡
      </footer>
    </div>
  );
}
