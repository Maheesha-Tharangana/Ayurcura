import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SymptomUploadProps {
  onImageUpload: (file: File | null) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

export default function SymptomUpload({
  onImageUpload,
  description,
  onDescriptionChange,
  onAnalyze,
  isAnalyzing,
  disabled = false
}: SymptomUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        onImageUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        onImageUpload(file);
      }
    }
  };

  const isValidFileType = (file: File) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('File size should be less than 10MB');
      return false;
    }
    return true;
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <Label htmlFor="file-upload" className="block text-sm font-medium text-neutral-700">Upload Image</Label>
        <div 
          className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
            dragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={disabled ? undefined : handleDrop}
          onClick={disabled ? undefined : handleButtonClick}
        >
          <div className="space-y-1 text-center">
            <i className="ri-upload-cloud-line text-3xl text-neutral-400"></i>
            <div className="flex text-sm text-neutral-600 justify-center">
              <Label 
                htmlFor="file-upload" 
                className={`relative font-medium text-primary-500 hover:text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>Upload a file</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  accept="image/*" 
                  className="sr-only" 
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={disabled}
                />
              </Label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-neutral-500">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <Label htmlFor="description" className="block text-sm font-medium text-neutral-700">Description (Optional)</Label>
        <Textarea 
          id="description" 
          rows={3} 
          className="mt-1"
          placeholder="Describe your symptoms or concerns..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      
      <div>
        <Button 
          type="button" 
          className="w-full" 
          onClick={onAnalyze}
          disabled={isAnalyzing || disabled}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </Button>
        
        {disabled && (
          <p className="mt-2 text-sm text-red-500 text-center">
            Please log in to use the symptom analysis feature
          </p>
        )}
      </div>
    </div>
  );
}
