import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, File, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// Define the structure of the result data
type AnalysisResult = {
  fileId: string;
  status: 'processed' | 'error';
  fileType?: 'CSV' | 'JSONL';
  columns?: string[];
  rowCount?: number;
  lineCount?: number;
  error?: string;
};

// Define the different states our application can be in
type Status = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the API URL from the environment variables
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const resetState = () => {
    setFile(null);
    setStatus('idle');
    setUploadProgress(0);
    setResult(null);
    setError(null);
  };
  
  // This function is called when a file is dropped or selected
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      resetState();
      setFile(acceptedFiles[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      // 1. Get a pre-signed URL from our backend
      const presignResponse = await axios.post(`${API_URL}/upload`, {
        fileName: file.name,
        // --- NEW: Send the file's content type to the backend ---
        contentType: file.type,
      });
      const { uploadURL, fileId } = presignResponse.data;

      // 2. Upload the file directly to S3 using the pre-signed URL
      await axios.put(uploadURL, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      setStatus('processing');
      // 3. Start polling for the result
      pollForResult(fileId);

    } catch (err) {
      console.error(err);
      setError('Upload failed. Please check the console for details.');
      setStatus('error');
    }
  };
  
  const pollForResult = (fileId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const resultResponse = await axios.get(`${API_URL}/result/${fileId}`);
        
        // 202 means the server accepted the request, but processing is not complete
        if (resultResponse.status === 202) {
            console.log("Still processing...");
            return; // Continue polling
        }
        
        // 200 means processing is complete
        if (resultResponse.status === 200) {
          clearInterval(intervalId); // Stop polling
          if (resultResponse.data.status === 'error') {
            setStatus('error');
            setError(resultResponse.data.error || 'An unknown processing error occurred.');
            setResult(resultResponse.data);
          } else {
            setStatus('success');
            setResult(resultResponse.data);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(intervalId); // Stop polling on error
        setError('Failed to fetch processing result.');
        setStatus('error');
      }
    }, 5000); // Poll every 5 seconds
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    multiple: false,
  });

  return (
    <div className="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Serverless Data Pipeline</h1>
          <p className="text-lg text-slate-400">Upload a CSV or JSON file to get a quick analysis.</p>
        </header>
        
        <main className="bg-slate-800 rounded-lg shadow-xl p-8">
          {status === 'idle' && (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-sky-400 bg-slate-700' : 'border-slate-600 hover:border-sky-500'}`}>
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-12 w-12 text-slate-500 mb-4" />
              {file ? (
                <div>
                  <p className="font-semibold text-sky-400">{file.name}</p>
                  <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <p>Drag & drop a file here, or click to select a file</p>
              )}
            </div>
          )}

          {file && status !== 'idle' && (
             <div className="flex items-center bg-slate-700 p-4 rounded-lg">
                <File className="h-8 w-8 text-sky-400 mr-4 flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
             </div>
          )}

          {status === 'idle' && file && (
            <button onClick={handleUpload} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg mt-6 transition-colors">
              Start Analysis
            </button>
          )}

          {(status === 'uploading' || status === 'processing') && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-lg capitalize">{status}...</p>
                {status === 'uploading' && <span className="text-slate-400">{uploadProgress}%</span>}
                {status === 'processing' && <Loader2 className="animate-spin h-6 w-6 text-slate-400" />}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${status === 'uploading' ? uploadProgress : 100}%`, transition: 'width 0.3s' }}></div>
              </div>
            </div>
          )}

          {status === 'success' && result && (
            <div className="mt-6 p-6 bg-green-900/50 border border-green-500 rounded-lg">
                <div className="flex items-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mr-3" />
                    <h2 className="text-2xl font-bold">Analysis Complete</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-lg">
                    <p className="text-slate-400">File Type:</p><p className="font-mono">{result.fileType}</p>
                    {result.rowCount !== undefined && <><p className="text-slate-400">Row Count:</p><p className="font-mono">{result.rowCount}</p></>}
                    {result.lineCount !== undefined && <><p className="text-slate-400">Line Count:</p><p className="font-mono">{result.lineCount}</p></>}
                    <p className="text-slate-400">Columns:</p><p className="font-mono text-sm col-span-2 bg-slate-800 p-2 rounded">{result.columns?.join(', ') || 'N/A'}</p>
                </div>
            </div>
          )}
          
          {(status === 'error' || (status === 'success' && result?.status === 'error')) && (
            <div className="mt-6 p-6 bg-red-900/50 border border-red-500 rounded-lg">
                <div className="flex items-center mb-4">
                    <XCircle className="h-8 w-8 text-red-400 mr-3" />
                    <h2 className="text-2xl font-bold">An Error Occurred</h2>
                </div>
                <p className="font-mono bg-slate-800 p-3 rounded">{error || result?.error}</p>
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <button onClick={resetState} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg mt-6 transition-colors">
              Analyze Another File
            </button>
          )}

        </main>
      </div>
    </div>
  );
}