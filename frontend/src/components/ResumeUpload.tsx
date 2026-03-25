import { useState, useCallback } from 'react';
import { uploadResume, processResumeVersion } from '../lib/api';
import { formatAiServiceUnavailableMessage } from '../lib/formatAiServiceError';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, RefreshCw } from 'lucide-react';

type Props = { onUploaded?: (resumeId: string) => void };

type StatusTone = 'neutral' | 'success' | 'warn';

export default function ResumeUpload({ onUploaded }: Props) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');
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
    if (
      droppedFile &&
      (droppedFile.type === 'application/pdf' ||
        droppedFile.type === 'application/msword' ||
        droppedFile.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        droppedFile.type === 'text/plain')
    ) {
      setFile(droppedFile);
    } else {
      setStatusTone('warn');
      setStatus('Formats acceptés : PDF, DOCX ou TXT.');
    }
  }, []);

  async function handleUpload() {
    if (!token) {
      setStatusTone('warn');
      setStatus('Connectez-vous d’abord.');
      return;
    }

    if (!file && !text.trim()) {
      setStatusTone('warn');
      setStatus('Choisissez un fichier ou collez le texte de votre CV.');
      return;
    }

    setIsLoading(true);
    setStatusTone('neutral');
    setStatus('Préparation du fichier…');

    try {
      const fileToUpload =
        file || new File([text], 'resume.txt', { type: 'text/plain' });
      setStatus('Envoi en cours…');

      const uploadResult = await uploadResume(token, fileToUpload);
      if ('error' in uploadResult) {
        throw new Error(
          formatAiServiceUnavailableMessage(
            uploadResult.error,
            uploadResult.status
          )
        );
      }

      const { resumeId, versionId } = uploadResult;
      onUploaded?.(resumeId);

      setStatus('Analyse IA en cours…');

      let retryCount = 0;
      const maxRetries = 3;
      let processResult:
        | { ok?: boolean; newVersionId?: string }
        | { error: string }
        | undefined;

      while (retryCount < maxRetries) {
        processResult = await processResumeVersion(token, versionId);
        if (!('error' in processResult)) break;

        retryCount++;
        if (retryCount < maxRetries) {
          setStatus(`Nouvel essai d’analyse (${retryCount + 1}/${maxRetries})…`);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (processResult && 'error' in processResult) {
        setStatusTone('warn');
        const friendly = formatAiServiceUnavailableMessage(
          processResult.error,
          processResult.status
        );
        const retry =
          ' Utilisez « Traiter avec l’IA » à droite pour réessayer.';
        setStatus(
          friendly === processResult.error
            ? `CV enregistré. L’étape IA a échoué : ${friendly}.${retry}`
            : `CV enregistré. ${friendly}${retry}`
        );
        return;
      }

      setStatusTone('success');
      setStatus('CV enregistré et analyse IA terminée.');
    } catch (err) {
      console.error('Upload/process error:', err);
      setStatusTone('warn');
      setStatus(
        err instanceof Error ? err.message : 'Échec de l’envoi ou du traitement.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  const statusBoxClass =
    statusTone === 'success'
      ? 'bg-green-50 text-green-800 border border-green-100'
      : statusTone === 'warn'
        ? 'bg-amber-50 text-amber-900 border border-amber-100'
        : 'bg-gray-50 text-gray-700 border border-gray-200';

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg transition-all duration-300">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Importer votre CV
        </h3>
        <p className="text-gray-600">
          Déposez un fichier ou collez le texte pour l’analyse IA
        </p>
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
            ${
              isDragging
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
                  Choisir un fichier
                </span>
              </label>
              <p className="mt-2 text-gray-500">
                {file ? file.name : 'ou glissez-déposez votre CV ici'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOCX ou TXT — max. 10 Mo
              </p>
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
          <span className="px-2 bg-white text-gray-500">Ou</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Coller le texte du CV :
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
            placeholder="Collez ici le contenu texte de votre CV…"
          />
          {text ? (
            <FileText className="absolute right-3 top-3 h-5 w-5 text-indigo-500" />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={handleUpload}
          disabled={isLoading || (!file && !text.trim())}
          className={`
            inline-flex items-center px-6 py-3 border border-transparent
            text-base font-medium rounded-md shadow-sm text-white
            transition-all duration-300 w-full justify-center
            ${
              isLoading
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
              Traitement…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Envoyer & analyser avec l’IA
            </>
          )}
        </button>
      </div>

      {status && !isLoading ? (
        <div className={`mt-3 p-4 rounded-md ${statusBoxClass}`}>
          <p className="text-sm font-medium">{status}</p>
        </div>
      ) : null}
    </div>
  );
}
