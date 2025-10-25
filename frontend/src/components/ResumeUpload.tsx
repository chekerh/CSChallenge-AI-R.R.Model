import React, { useState, useCallback } from 'react';
import { uploadResume, processResume } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, RefreshCw } from 'lucide-react';

type Props = { onUploaded?: (resumeId: string) => void };

export default function ResumeUpload({ onUploaded }: Props) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || 
        droppedFile.type === 'application/msword' || 
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        droppedFile.type === 'text/plain')) {
      setFile(droppedFile);
    } else {
      setStatus('Please upload a PDF, DOCX, or TXT file');
    }
  }, []);

  async function handleUpload() {
    if (!token) {
      setStatus('Please log in first');
      return;
    }
    
    if (!file && !text.trim()) {
      setStatus('Please select a file or paste resume text');
      return;
    }

    setIsLoading(true);
    setStatus('Preparing your resume...');

    try {
      // Create a File object from text if no file is provided
      const fileToUpload = file || new File([text], 'resume.txt', { type: 'text/plain' });
      setStatus('Uploading resume...');
      
      const uploadResult = await uploadResume(token, fileToUpload);
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }
      
      if (!uploadResult.data?.resumeId) {
        throw new Error('Invalid server response');
      }

      setStatus('Analyzing your resume...');
      
      // Start processing with retries
      let retryCount = 0;
      const maxRetries = 3;
      let processResult;
      
      while (retryCount < maxRetries) {
        processResult = await processResume(token, uploadResult.data.resumeId);
        if (!processResult.error) break;
        
        retryCount++;
        if (retryCount < maxRetries) {
          setStatus(`Processing attempt ${retryCount + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between retries
        }
      }

      if (processResult?.error) {
        throw new Error(processResult.error);
      }

      setStatus('Resume processed successfully!');
      onUploaded?.(uploadResult.data.resumeId);
    } catch (err) {
      console.error('Upload/process error:', err);
      setStatus(err instanceof Error ? err.message : 'Failed to process resume');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg transition-all duration-300">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h3>
        <p className="text-gray-600">Let our AI analyze and improve your resume</p>
      </div>
      
      <div className="relative">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            transition-all duration-300 ease-in-out
            border-2 border-dashed rounded-xl p-8
            flex flex-col items-center justify-center
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50 scale-102'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }
          `}
        >
          <div className="space-y-4 text-center">
            <div className="relative">
              {isLoading ? (
                <RefreshCw className="h-12 w-12 text-indigo-500 animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
              )}
            </div>
            
            <div className="text-sm">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={isLoading}
                />
                <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300">
                  Choose a file
                </span>
              </label>
              <p className="mt-2 text-gray-500">
                {file ? file.name : 'or drag and drop your resume here'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT up to 10MB</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
              <p className="mt-2 text-sm text-gray-600">{status}</p>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Paste your resume text directly:
        </label>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            disabled={isLoading}
            className={`
              block w-full rounded-md border-gray-300 shadow-sm
              focus:border-indigo-500 focus:ring-indigo-500
              transition-all duration-300
              ${isLoading ? 'bg-gray-50' : 'bg-white'}
              ${text ? 'border-indigo-200' : ''}
            `}
            placeholder="Paste your resume content here..."
          />
          {text && (
            <FileText className="absolute right-3 top-3 h-5 w-5 text-indigo-500" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleUpload}
          disabled={isLoading || (!file && !text.trim())}
          className={`
            inline-flex items-center px-6 py-3 border border-transparent
            text-base font-medium rounded-md shadow-sm text-white
            transition-all duration-300 w-full justify-center
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : !file && !text.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }
          `}
        >
          {isLoading ? (
            <>
              <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Upload & Process
            </>
          )}
        </button>
      </div>

      {status && !isLoading && (
        <div className={`
          mt-3 p-4 rounded-md ${
            status.includes('error') || status.includes('failed')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }
        `}>
          <p className="text-sm font-medium">{status}</p>
        </div>
      )}
    </div>
  );
}
