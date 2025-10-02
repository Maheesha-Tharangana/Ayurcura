import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { Loader2, Upload, Camera } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export interface FacialAnalysisResult {
  imageUrl: string;
  analysis: string;
  confidence: number;
  detectedSymptoms: string[];
  mappedSymptoms: string[];
}

interface FacialAnalysisFormProps {
  onAnalysisComplete: (result: FacialAnalysisResult) => void;
  disabled?: boolean;
}

export default function FacialAnalysisForm({
  onAnalysisComplete,
  disabled = false
}: FacialAnalysisFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Trigger the file input when the user clicks the upload button
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Clear any previous errors
    setError(null);
    
    const file = event.target.files?.[0] || null;
    
    if (!file) {
      console.log('No file selected');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    
    console.log('File selected:', file.name, 'type:', file.type, 'size:', file.size);
    
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      console.error('Invalid file type:', file.type);
      setError("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size);
      setError("Image size should be less than 10MB");
      return;
    }
    
    // Store the selected file
    setSelectedFile(file);
    console.log('Selected file set, name:', file.name);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      console.log('Preview URL created, length:', dataUrl.length);
      setPreviewUrl(dataUrl);
    };
    reader.onerror = (error) => {
      console.error('Error creating preview:', error);
      setError("Failed to read the image file");
    };
    console.log('Reading file as data URL...');
    reader.readAsDataURL(file);
  };
  
  // Submit the image for analysis
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting image upload, file:', selectedFile.name, 'size:', selectedFile.size, 'type:', selectedFile.type);
      
      // Create a new FormData instance
      const formData = new FormData();
      
      // Log file details for debugging
      console.log('File details before append:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        lastModified: selectedFile.lastModified
      });
      
      // Explicitly append the file with 'image' key - server expects this key
      formData.append('image', selectedFile);
      
      // Verify the file was added to FormData
      console.log('FormData contains image:', formData.has('image'));
      
      // Log the file name if available
      const file = formData.get('image') as File;
      if (file) {
        console.log('Image file name:', file.name, 'Size:', file.size);
      }
      
      console.log('Sending fetch request...');
      
      // Send the request with formData
      const response = await fetch('/api/facial-analysis', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for authentication
      });
      
      console.log('Received response, status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response text:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText || 'Unknown server error' };
        }
        
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Success response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error('Invalid response from server');
      }
      
      console.log('Analysis complete, result:', JSON.stringify(result));
      
      // Check if the result contains an error
      if (result.error) {
        console.error('Server returned error:', result.error);
        throw new Error(result.error);
      }
      
      // Make sure result has all required properties
      if (!result.analysis) {
        console.error('Missing analysis in result:', result);
        throw new Error('Server response is missing analysis data');
      }
      
      onAnalysisComplete({
        ...result,
        detectedSymptoms: result.detectedSymptoms || [],
        mappedSymptoms: result.mappedSymptoms || [],
        confidence: result.confidence || 0,
        imageUrl: previewUrl || '' // Use local preview as the image URL
      });
    } catch (err) {
      console.error('Error analyzing facial image:', err);
      
      // Try to extract meaningful error message
      let errorMessage = 'An unknown error occurred';
      try {
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object') {
          errorMessage = JSON.stringify(err);
        }
        console.error('Error parsing error message:', err);
      } catch (e) {
        console.error('Error parsing error object:', e);
      }
      
      // Check for quota exceeded errors
      if (errorMessage.toLowerCase().includes('quota') || 
          errorMessage.toLowerCase().includes('exceeded') ||
          errorMessage.toLowerCase().includes('insufficient')) {
        setError('The facial analysis service is currently unavailable due to API quota limitations. Please try again later or contact support for assistance.');
      } else if (errorMessage.toLowerCase().includes('api key')) {
        setError('The facial analysis service is not properly configured. Please contact support for assistance.');
      } else {
        setError(errorMessage || 'Failed to analyze image. Please try again with a clearer image.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset the form
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Card className="bg-white shadow-lg border-2 border-primary-100">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 text-primary-700">Facial Symptom Analysis</h3>
            <p className="text-gray-600 text-sm mb-6">
              Upload a clear photo of your face to detect potential Ayurvedic symptoms
            </p>
          </div>
          
          {/* Image upload area */}
          <div 
            className={`border-3 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${previewUrl ? 'border-primary-500 bg-primary-50' : 'border-primary-300 hover:border-primary-500 bg-primary-50/50 hover:bg-primary-50'}
              ${disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
            onClick={handleUploadClick}
          >
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Face preview" 
                  className="mx-auto max-h-64 rounded-md shadow-md"
                />
                <Button 
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 bg-primary-600 text-white hover:bg-primary-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="py-8">
                <Camera className="h-16 w-16 mb-4 mx-auto text-primary-500" />
                <p className="text-primary-700 font-medium text-lg">Click to upload a face photo</p>
                <p className="text-primary-600/80 text-sm mt-2">JPEG, PNG or WebP up to 10MB</p>
              </div>
            )}
            
            <Input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={disabled || isLoading}
            />
          </div>
          
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || isLoading || disabled}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white py-6 text-lg font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Analyze Facial Symptoms
                </>
              )}
            </Button>
            
            <div className="text-gray-500 text-xs text-center px-4 mt-2">
              Your image will be securely processed and analyzed for Ayurvedic symptoms.
              We do not store your images for longer than necessary for analysis.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}