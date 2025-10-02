import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from '@/lib/api-client';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, X } from "lucide-react";
import { Badge } from '@/components/ui/badge';

interface Symptom {
  name: string;
  weight: number;
}

interface SymptomSelectorProps {
  onAnalyze: (symptoms: string[], description: string) => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

export default function SymptomSelector({
  onAnalyze,
  isAnalyzing,
  disabled = false
}: SymptomSelectorProps) {
  const [allSymptoms, setAllSymptoms] = useState<Symptom[]>([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState<Symptom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all available symptoms from the API
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/symptoms');
        if (response.ok) {
          const symptoms = await response.json() || [];
          console.log('Fetched symptoms:', symptoms);
          // Ensure we have valid symptom objects with name and weight
          const validSymptoms = symptoms.filter((s: any) => 
            s && typeof s === 'object' && s.name && (typeof s.weight === 'number' || typeof s.weight === 'string')
          );
          
          // Deduplicate symptoms by name to prevent duplicate keys
          const uniqueSymptoms: Symptom[] = [];
          const seenNames = new Set<string>();
          
          validSymptoms.forEach((symptom: Symptom) => {
            if (!seenNames.has(symptom.name)) {
              seenNames.add(symptom.name);
              uniqueSymptoms.push(symptom);
            } else {
              console.log(`Duplicate symptom detected and removed: ${symptom.name}`);
            }
          });
          
          setAllSymptoms(uniqueSymptoms);
          setFilteredSymptoms(uniqueSymptoms);
        } else {
          throw new Error('Failed to fetch symptoms');
        }
      } catch (error) {
        console.error('Failed to fetch symptoms:', error);
        toast({
          title: 'Error',
          description: 'Failed to load symptoms. Please try again later.',
          variant: 'destructive',
        });
        // Set empty arrays to prevent undefined errors
        setAllSymptoms([]);
        setFilteredSymptoms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymptoms();
  }, [toast]);

  // Filter symptoms based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSymptoms(allSymptoms);
      return;
    }

    const filtered = allSymptoms.filter(symptom => 
      symptom.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSymptoms(filtered);
  }, [searchTerm, allSymptoms]);

  // Add a symptom to the selected list
  const addSymptom = (symptom: Symptom) => {
    if (!selectedSymptoms.find(s => s.name === symptom.name)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // Remove a symptom from the selected list
  const removeSymptom = (symptomName: string) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s.name !== symptomName));
  };

  // Handle the analysis
  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0 && !description.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please select symptoms or provide a description.',
        variant: 'destructive',
      });
      return;
    }

    onAnalyze(
      selectedSymptoms.map(s => s.name),
      description
    );
  };

  // Format symptom name for display (replace underscores with spaces and capitalize)
  const formatSymptomName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Describe Your Symptoms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="description">Describe your symptoms and concerns</Label>
          <Textarea
            id="description"
            placeholder="Example: I have been experiencing headache, fever, and joint pain for the last two days..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="search-symptoms">Or select from available symptoms</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              id="search-symptoms"
              placeholder="Search symptoms..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled || isLoading}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-2 max-h-48 overflow-y-auto">
              {filteredSymptoms.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {filteredSymptoms.map((symptom) => (
                    <Button
                      key={symptom.name}
                      type="button"
                      variant="outline"
                      className="justify-start text-left text-sm"
                      onClick={() => addSymptom(symptom)}
                      disabled={disabled || selectedSymptoms.some(s => s.name === symptom.name)}
                    >
                      {formatSymptomName(symptom.name)}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 py-2">No symptoms match your search.</p>
              )}
            </div>
          )}
        </div>

        {selectedSymptoms.length > 0 && (
          <div>
            <Label>Selected Symptoms</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSymptoms.map((symptom) => (
                <Badge key={symptom.name} variant="secondary" className="flex items-center gap-1">
                  {formatSymptomName(symptom.name)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeSymptom(symptom.name)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleAnalyze}
          disabled={isAnalyzing || disabled || (selectedSymptoms.length === 0 && !description.trim())}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Symptoms"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}