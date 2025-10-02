import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, RotateCcw, Camera } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface FacialAnalysisResult {
  imageUrl: string;
  analysis: string;
  confidence: number;
  detectedSymptoms: string[];
  mappedSymptoms: string[];
  usedLocalAnalysis?: boolean;
}

interface FacialAnalysisResultDisplayProps {
  result: FacialAnalysisResult;
  onAnalyzeAgain: () => void;
  onProcessFurtherWithSymptoms: (symptoms: string[]) => void;
}

export default function FacialAnalysisResultDisplay({
  result,
  onAnalyzeAgain,
  onProcessFurtherWithSymptoms
}: FacialAnalysisResultDisplayProps) {
  // Check if result is valid
  if (!result || !result.imageUrl) {
    return (
      <Card className="bg-white shadow-lg border-2 border-red-100">
        <CardContent className="pt-6 pb-8">
          <div className="text-center">
            <div className="rounded-full bg-red-100 p-3 w-fit mx-auto mb-4">
              <Camera className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-red-700">Analysis Error</h3>
            <p className="text-gray-600 mb-4">
              There was a problem with the facial analysis. Please try again.
            </p>
            <Button onClick={onAnalyzeAgain} variant="outline" 
              className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get safe values with defaults
  const analysis = result.analysis || "No analysis available";
  const imageUrl = result.imageUrl;
  const confidence = typeof result.confidence === 'number' ? result.confidence : 0;
  const detectedSymptoms = result.detectedSymptoms || [];
  const mappedSymptoms = result.mappedSymptoms || [];
  const usedLocalAnalysis = result.usedLocalAnalysis || false;
  
  const confidencePercent = Math.round(confidence * 100);
  
  const confidenceColor = 
    confidencePercent < 30 ? "text-red-600" :
    confidencePercent < 70 ? "text-yellow-600" :
    "text-green-600";
  
  const confidenceProgressColor = 
    confidencePercent < 30 ? "bg-red-600" :
    confidencePercent < 70 ? "bg-yellow-600" :
    "bg-green-600";
  
  // Format a symptom name for display (replace underscores with spaces and capitalize)
  const formatSymptomName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Check if we have mapped symptoms to use with the symptom analyzer
  const hasMappedSymptoms = result && result.mappedSymptoms && result.mappedSymptoms.length > 0;
  
  return (
    <Card className="bg-white shadow-lg border-2 border-primary-100">
      <CardContent className="pt-6 pb-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Side */}
            <div className="flex-shrink-0 md:w-1/3">
              <div className="rounded-lg overflow-hidden border border-primary-200 shadow-md">
                <img
                  src={imageUrl}
                  alt="Analyzed facial image"
                  className="w-full h-auto"
                />
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm mr-2 text-gray-700">Analysis confidence:</span>
                <span className={`font-semibold ${confidenceColor}`}>
                  {confidencePercent}%
                </span>
              </div>
              <Progress 
                value={confidencePercent} 
                className={`h-2 mt-1 bg-gray-100 ${confidenceProgressColor}`}
              />
            </div>
            
            {/* Analysis Side */}
            <div className="flex-grow md:w-2/3">
              <h3 className="text-xl font-semibold mb-3 text-primary-700">Facial Analysis Results</h3>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 text-sm">
                  {analysis}
                </p>
              </div>
              
              {detectedSymptoms.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2 text-gray-700">Detected Symptoms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {detectedSymptoms.map((symptom, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="secondary" 
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1"
                            >
                              {symptom}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Detected from facial analysis</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}
              
              {hasMappedSymptoms && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2 text-gray-700">Mapped to System Symptoms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {mappedSymptoms.map((symptom, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              className="bg-primary-500 hover:bg-primary-600 text-white py-1"
                            >
                              {formatSymptomName(symptom)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mapped to our symptom database</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-3 justify-between mt-4">
            <Button
              variant="outline"
              onClick={onAnalyzeAgain}
              className="border-primary-200 hover:bg-primary-50 text-primary-600"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Analyze Another Photo
            </Button>
            
            {hasMappedSymptoms && (
              <Button
                onClick={() => onProcessFurtherWithSymptoms(mappedSymptoms)}
                className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white"
                size="lg"
              >
                Continue with These Symptoms
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="text-gray-500 text-xs text-center px-4 mt-2">
            {usedLocalAnalysis && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-2 text-amber-800">
                Note: This analysis was performed using our basic local analysis tool.
                For more accurate results, try again later when our advanced AI analysis service is available.
              </div>
            )}
            Note: Facial analysis provides an initial assessment based on visible symptoms only.
            For a comprehensive analysis, please consult with a qualified Ayurvedic practitioner.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}