import { SearchX, RefreshCw } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export function NoResults() {
  return (
    <Card className="border-emerald-200 dark:border-gray-700 shadow-lg">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mb-6">
          <SearchX className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <h3 className="text-2xl text-gray-900 dark:text-gray-100 mb-2">
          No Results Found
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
          We couldn't find any pharmacies with the medicine you're looking for. 
          Try searching for a different medicine or check back later.
        </p>
        
        <Button
          variant="outline"
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
