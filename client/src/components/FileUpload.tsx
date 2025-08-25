import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileImage, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  acceptedTypes = ['image/*', '.pdf', '.txt', '.docx'],
  maxFileSize = 10,
  maxFiles = 5,
  className = '',
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name}: 파일 크기가 ${maxFileSize}MB를 초과합니다.`);
        continue;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      });

      if (!isValidType) {
        errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
        continue;
      }

      validFiles.push(file);
    }

    // Check total file count
    if (selectedFiles.length + validFiles.length > maxFiles) {
      errors.push(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      return { valid: [], errors };
    }

    return { valid: validFiles, errors };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const { valid, errors } = validateFiles(e.dataTransfer.files);
      
      if (errors.length > 0) {
        setUploadError(errors.join(', '));
        return;
      }

      const newFiles = [...selectedFiles, ...valid];
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);
      setUploadError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const { valid, errors } = validateFiles(e.target.files);
      
      if (errors.length > 0) {
        setUploadError(errors.join(', '));
        return;
      }

      const newFiles = [...selectedFiles, ...valid];
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);
      setUploadError(null);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* Upload Area */}
      <Card
        className={`relative cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-primary bg-primary/5 border-2 border-dashed'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary border-2 border-dashed'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        data-testid="file-upload-area"
      >
        <CardContent className="p-8 text-center">
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary' : 'text-gray-400'}`} />
          <h3 className="text-lg font-semibold mb-2">
            파일을 여기에 드래그하거나 클릭하여 선택하세요
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            지원 형식: {acceptedTypes.join(', ')}
          </p>
          <p className="text-xs text-gray-500">
            최대 {maxFileSize}MB, {maxFiles}개 파일까지
          </p>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />

      {/* Error Message */}
      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-300">{uploadError}</span>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">선택된 파일 ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              data-testid={`selected-file-${index}`}
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <div>
                  <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
                data-testid={`remove-file-${index}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}