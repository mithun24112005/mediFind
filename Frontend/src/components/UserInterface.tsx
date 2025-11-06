import { useState } from 'react';
import { Search, Upload, MapPin, Navigation, Star, TrendingUp, Pill, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { NoResults } from './NoResults';

interface Pharmacy {
  id: number;
  name: string;
  price: number;
  distance: number;
  inStock: boolean;
  rating: number;
  address: string;
  isBestOption?: boolean;
}

interface Substitute {
  id: number;
  name: string;
  price: number;
  manufacturer: string;
}

export function UserInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock data
  const pharmacies: Pharmacy[] = [
    {
      id: 1,
      name: "HealthPlus Pharmacy",
      price: 245,
      distance: 0.8,
      inStock: true,
      rating: 4.8,
      address: "123 Main Street, Downtown",
      isBestOption: true
    },
    {
      id: 2,
      name: "MediCare Drugstore",
      price: 280,
      distance: 1.2,
      inStock: true,
      rating: 4.5,
      address: "456 Oak Avenue, Central"
    },
    {
      id: 3,
      name: "City Medical Store",
      price: 260,
      distance: 1.5,
      inStock: true,
      rating: 4.6,
      address: "789 Park Road, North Side"
    },
    {
      id: 4,
      name: "Quick Meds Pharmacy",
      price: 295,
      distance: 2.0,
      inStock: false,
      rating: 4.3,
      address: "321 Elm Street, South"
    }
  ];

  const substitutes: Substitute[] = [
    { id: 1, name: "Paracetamol 500mg", price: 45, manufacturer: "Generic Labs" },
    { id: 2, name: "Dolo 650", price: 52, manufacturer: "Micro Labs" },
    { id: 3, name: "Calpol 500", price: 48, manufacturer: "GSK" },
    { id: 4, name: "Tylenol 500mg", price: 65, manufacturer: "Johnson & Johnson" }
  ];

  const handleSearch = () => {
    setIsSearching(true);
    setHasSearched(false);
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
      setShowResults(true);
    }, 1500);
  };

  const handleUpload = () => {
    // Simulate prescription upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
  };

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-emerald-100 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                MediFind
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Find Your Medicine Instantly
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Search nearby pharmacies and get the best prices
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 border-emerald-200 dark:border-gray-700 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter medicine name (e.g., Paracetamol)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12 border-emerald-200 dark:border-gray-600 focus:border-emerald-500 dark:bg-gray-700"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
              <Button
                onClick={handleUpload}
                variant="outline"
                className="h-12 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Prescription
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isSearching && <LoadingSpinner />}

        {/* Results Section */}
        {showResults && hasSearched && !isSearching && (
          <div className="space-y-8">
            {/* Map and Pharmacy List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map View */}
              <Card className="border-emerald-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700">
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <MapPin className="h-5 w-5" />
                    Nearby Locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-96 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                    {/* Mock Map Grid */}
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className="border border-emerald-200/30 dark:border-gray-500/30" />
                      ))}
                    </div>
                    
                    {/* Mock Pharmacy Pins */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="h-8 w-8 rounded-full bg-red-500 border-4 border-white shadow-lg animate-pulse flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-white"></div>
                      </div>
                    </div>
                    
                    {/* Pharmacy markers */}
                    <div className="absolute top-1/3 left-1/3">
                      <MapPin className="h-8 w-8 text-emerald-600 drop-shadow-lg fill-emerald-400" />
                    </div>
                    <div className="absolute top-2/3 right-1/3">
                      <MapPin className="h-8 w-8 text-emerald-600 drop-shadow-lg fill-emerald-400" />
                    </div>
                    <div className="absolute bottom-1/4 left-1/2">
                      <MapPin className="h-8 w-8 text-emerald-600 drop-shadow-lg fill-emerald-400" />
                    </div>
                    
                    {/* Map overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-900/50" />
                  </div>
                </CardContent>
              </Card>

              {/* Pharmacy List */}
              <div className="space-y-4">
                <h3 className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Available Pharmacies
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {pharmacies.map((pharmacy) => (
                    <Card
                      key={pharmacy.id}
                      className={`border transition-all duration-300 hover:shadow-xl ${
                        pharmacy.isBestOption
                          ? 'border-emerald-400 dark:border-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/50 shadow-lg ring-2 ring-emerald-300 dark:ring-emerald-600'
                          : 'border-emerald-200 dark:border-gray-700'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-gray-900 dark:text-gray-100">
                                {pharmacy.name}
                              </h4>
                              {pharmacy.isBestOption && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-md">
                                  <Star className="h-3 w-3 mr-1 fill-white" />
                                  Best Option
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {pharmacy.address}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl text-emerald-600 dark:text-emerald-400">
                              ₹{pharmacy.price}
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 text-sm">
                              <Star className="h-3 w-3 fill-amber-500" />
                              {pharmacy.rating}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Navigation className="h-4 w-4" />
                              {pharmacy.distance} km
                            </span>
                            <span className="flex items-center gap-1">
                              {pharmacy.inStock ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                                  <span className="text-emerald-600">In Stock</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-red-500">Out of Stock</span>
                                </>
                              )}
                            </span>
                          </div>
                          
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={!pharmacy.inStock}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Directions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Substitute Suggestions */}
            <Card className="border-emerald-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Pill className="h-5 w-5" />
                  Substitute Suggestions
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  AI-generated alternatives with similar composition
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {substitutes.map((substitute) => (
                    <Card
                      key={substitute.id}
                      className="border-emerald-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-gray-700"
                    >
                      <CardContent className="p-4">
                        <Badge className="mb-3 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 border-0">
                          Substitute
                        </Badge>
                        <h4 className="mb-1 text-gray-900 dark:text-gray-100">
                          {substitute.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {substitute.manufacturer}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xl text-emerald-600 dark:text-emerald-400">
                            ₹{substitute.price}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400"
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No results when search query is empty and searched */}
        {!showResults && hasSearched && !isSearching && (
          <NoResults />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-emerald-100 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="flex items-center justify-center gap-2">
              Powered by <span className="text-emerald-600 dark:text-emerald-400">Impact-X</span>
              <Clock className="h-4 w-4" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
