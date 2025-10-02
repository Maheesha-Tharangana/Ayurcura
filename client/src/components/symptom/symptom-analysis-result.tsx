import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoIcon, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SymptomWeight {
  name: string;
  weight: number;
}

interface AnalysisResult {
  disease: string;
  confidence: number;
  description?: string; // Make description optional
  precautions?: string[]; // Make precautions optional
  relatedSymptoms?: SymptomWeight[]; // Make relatedSymptoms optional
}

interface SymptomAnalysisResultProps {
  result: AnalysisResult;
  extractedSymptoms: string[];
  onReset: () => void;
}

export default function SymptomAnalysisResult({
  result,
  extractedSymptoms = [],
  onReset
}: SymptomAnalysisResultProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Safety check - if result is empty or missing properties, set defaults
  if (!result || !result.disease) {
    console.error("Missing result object or disease in SymptomAnalysisResult", result);
    // Return a simple error message instead of crashing
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analysis Error</h3>
            <p className="text-neutral-600 mb-4">
              There was a problem processing your symptom analysis. Please try again.
            </p>
            <Button variant="outline" onClick={onReset}>
              Start New Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Ensure all needed properties exist, default to empty values if missing
  const disease = result.disease || 'Unknown';
  const description = result.description || 'No description available.';
  const confidence = typeof result.confidence === 'number' ? result.confidence : 0;
  const relatedSymptoms = result.relatedSymptoms || [];
  const precautions = result.precautions || [];

  // Format symptom name for display (replace underscores with spaces and capitalize)
  const formatSymptomName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence)}%`;
  };

  // Get confidence level class (low, medium, high)
  const getConfidenceClass = (confidence: number) => {
    if (confidence < 60) return 'text-red-500';
    if (confidence < 80) return 'text-amber-500';
    return 'text-green-500';
  };

  // Get confidence icon based on level
  const getConfidenceIcon = (confidence: number) => {
    if (confidence < 60) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (confidence < 80) return <InfoIcon className="h-5 w-5 text-amber-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="precautions">Precautions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="rounded-lg bg-neutral-100 p-4">
              <h3 className="text-lg font-medium">Potential Condition</h3>
              <p className="text-2xl font-bold mt-1">{disease}</p>
              
              <div className="flex items-center gap-2 mt-3">
                <span>Confidence:</span>
                <span className={`font-semibold ${getConfidenceClass(confidence)}`}>
                  {getConfidenceIcon(confidence)}
                </span>
                <span className={`font-semibold ${getConfidenceClass(confidence)}`}>
                  {formatConfidence(confidence)}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Detected Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {extractedSymptoms && extractedSymptoms.length > 0 ? (
                  extractedSymptoms.map((symptom, index) => (
                    <Badge key={`${symptom}-${index}`} variant="outline">
                      {formatSymptomName(symptom)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">No symptoms detected</p>
                )}
              </div>
            </div>
            
            <Button variant="outline" onClick={onReset} className="w-full mt-4">
              Start New Analysis
            </Button>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{disease}</h3>
              <p className="text-neutral-700">{description}</p>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Common Symptoms</h3>
              <div className="grid grid-cols-2 gap-2">
                {relatedSymptoms.map(symptom => (
                  <div key={symptom.name} className="flex items-center justify-between">
                    <span>{formatSymptomName(symptom.name)}</span>
                    <Badge variant={extractedSymptoms.includes(symptom.name) ? "default" : "outline"}>
                      {extractedSymptoms.includes(symptom.name) ? "Detected" : "Not Detected"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="precautions" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Recommended Precautions</h3>
              <ul className="space-y-2">
                {precautions.map((precaution, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                      {index + 1}
                    </span>
                    <span>{precaution}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mt-4">
              <h3 className="text-amber-800 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Important Note
              </h3>
              <p className="text-amber-700 text-sm mt-1">
                This analysis is based on the symptoms you've provided and should not replace professional medical advice.
                Please consult with a healthcare professional for proper diagnosis and treatment.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}