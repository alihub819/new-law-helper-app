import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileChange: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFileChange,
  accept = "*",
  multiple = false,
  disabled = false,
  className,
  ...props
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={!disabled ? handleClick : undefined}
      {...props}
    >
      <div className="flex flex-col items-center">
        <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
        <h4 className="text-lg font-medium text-foreground mb-2">Upload Legal Document</h4>
        <p className="text-muted-foreground mb-4">Drag and drop your file here, or click to browse</p>
        <p className="text-sm text-muted-foreground mb-4">Supports PDF, DOC, DOCX files up to 50MB</p>
        <Button 
          type="button"
          disabled={disabled}
          data-testid="button-choose-file"
        >
          {disabled ? "Processing..." : "Choose File"}
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}
