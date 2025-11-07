import { useState } from "react";
import MapView from "./MapView";
import {
  Search,
  TrendingUp,
  Pill,
  Upload,
  Loader2,
  Pill as PillIcon,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAlternates, setIsLoadingAlternates] = useState(false);
  const [alternates, setAlternates] = useState([]);

  // 🔍 Search main medicine
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a medicine name");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setShowResults(false);
    setAlternates([]);

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

          const data = await res.json();

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

          // 🧠 Automatically fetch substitutes
          handleGetAlternates(searchQuery);
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

  // 🧠 Fetch AI-based alternate medicines
  const handleGetAlternates = async (query: string) => {
    if (!query) return;
    setIsLoadingAlternates(true);

    try {
      const res = await fetch("http://localhost:3000/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicine_name: query }),
      });

      const data = await res.json();
      console.log("🤖 Gemini AI Response:", data);

      if (data.alternatives && data.alternatives.length > 0) {
        const cleaned = data.alternatives
          .map((a: string) =>
            a
              .replace(/[`"']/g, "") // remove quotes and backticks
              .replace(/json/gi, "") // remove "json"
              .replace(/\{|\}|\[|\]/g, "") // remove braces/brackets
              .trim()
          )
          .filter((a: string) => a.length > 0);
        setAlternates(cleaned);
      } else {
        setAlternates([]);
      }
    } catch (err) {
      console.error("❌ AI Suggestion Error:", err);
      setAlternates([]);
    } finally {
      setIsLoadingAlternates(false);
    }
  };

  // 📸 OCR Upload
  const handleUploadPrescription = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      setIsUploading(true);

      try {
        const res = await fetch("http://localhost:3000/api/ocr/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        const probable = data.probable_medicines?.[0];
        if (probable) {
          setSearchQuery(probable);
          alert(`🧠 Detected medicine: ${probable}`);
        } else {
          alert("No recognizable medicine found in prescription.");
        }
      } catch (err) {
        console.error("❌ OCR upload failed:", err);
        alert("Error while reading prescription.");
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-emerald-100 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              MediFind
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-8 border-emerald-200 dark:border-gray-700 shadow-lg bg-white/80 dark:bg-gray-800/80">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Enter medicine name (or upload prescription)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 border-emerald-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 focus:border-emerald-500 dark:focus:border-emerald-500"
                />
              </div>

              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                Search
              </Button>

              <Button
                onClick={handleUploadPrescription}
                disabled={isUploading}
                variant="outline"
                className="h-12 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-500 dark:hover:bg-gray-800"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 mr-2" />
                )}
                {isUploading ? "Processing..." : "Upload Prescription"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isSearching && <LoadingSpinner />}

        {showResults && hasSearched && !isSearching && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {userLocation && pharmacies.length > 0 && (
                <div className="lg:sticky lg:top-24">
                  <MapView userLocation={userLocation} pharmacies={pharmacies} />
                </div>
              )}

              {/* Available Pharmacies */}
              <div className="space-y-4">
                <h3 className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-xl font-semibold">
                  <TrendingUp className="h-5 w-5" />
                  Available Pharmacies
                </h3>
                <div className="space-y-3">
                  {pharmacies.map((pharmacy, i) => (
                    <Card key={i} className="border border-emerald-200 dark:border-gray-700 dark:bg-gray-800 shadow-sm hover:shadow-md transition">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{pharmacy.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{pharmacy.address}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{pharmacy.distance_km} km away</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-xl text-emerald-600 dark:text-emerald-400 font-semibold">₹{pharmacy.price}</div>
                          {pharmacy.inStock ? (
                            <Badge className="bg-emerald-100 text-emerald-700 mt-1">In Stock</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 mt-1">Out of Stock</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Substitute Suggestions */}
            <div className="mt-16">
              <Card className="border-emerald-200 dark:border-gray-700 dark:bg-gray-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <PillIcon className="h-5 w-5" />
                    Substitute Suggestions
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    AI-generated alternatives with similar composition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAlternates ? (
                    <div className="text-center py-6 text-gray-500">Loading alternatives...</div>
                  ) : alternates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {alternates.map((alt, i) => (
                        <Card
                          key={i}
                          className="border-emerald-200 dark:border-gray-700 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-lg transition-all"
                        >
                          <CardContent className="p-4 flex flex-col items-start justify-between h-full">
                            <Badge className="mb-3 bg-teal-100 text-teal-700 border-0">
                              Substitute
                            </Badge>
                            <h4 className="text-gray-900 dark:text-gray-100 font-semibold mb-2">{alt}</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-500 dark:hover:bg-gray-600"
                              onClick={() => {
                                setSearchQuery(alt);
                                handleSearch();
                              }}
                            >
                              Search
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                      No AI suggestions available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!showResults && hasSearched && !isSearching && <NoResults />}
      </div>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-900/80 border-t border-emerald-100 dark:border-gray-800 mt-16 py-6 text-center text-gray-600 dark:text-gray-400">
        Powered by <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Impact-X</span> ⚡
      </footer>
    </div>
  );
}
