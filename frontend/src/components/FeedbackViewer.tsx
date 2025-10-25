import React, { useEffect, useState } from 'react';
import { getFeedback, processResume } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Feedback {
  _id: string;
  score: number;
  suggestions: Array<{ category: string; details: string[] }>;
  improvements: Array<{ category: string; details: string[] }>;
  createdAt: string;
}

interface Version {
  _id: string;
  content: string;
  feedback?: Feedback;
  createdAt: string;
}

export default function FeedbackViewer({ resumeId }: { resumeId: string }) {
  const { token } = useAuth();
  const [version, setVersion] = useState<Version | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResume() {
      if (!resumeId || !token) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const result = await getFeedback(token, resumeId);
        if (result.error) throw new Error(result.error);
        setVersion(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume');
        console.error('Load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResume();
  }, [resumeId, token]);



  async function handleProcess() {
    if (!resumeId || !token || !version) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await processResume(token, resumeId);
      if (result.error) throw new Error(result.error);
      
      // Refresh the feedback after processing
      const feedbackResult = await getFeedback(token, resumeId);
      if (feedbackResult.error) throw new Error(feedbackResult.error);
      setVersion(feedbackResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process resume');
      console.error('Process error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-indigo-600 font-medium">Analyzing resume...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {version && (
        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Resume Content</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Last updated {new Date(version.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <pre className="mt-1 text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">
                {version.content}
              </pre>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleProcess}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Process with AI
            </button>
          </div>

          {version.feedback && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">AI Feedback</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Overall Score: {version.feedback.score}/100
                </p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {version.feedback.suggestions.map((suggestion, index) => (
                    <div key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                      <dt className="text-sm font-medium text-gray-500">{suggestion.category}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul className="list-disc pl-5 space-y-1">
                          {suggestion.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>
      )}

      {!version && !isLoading && !error && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No resume selected</h3>
          <p className="mt-1 text-sm text-gray-500">Upload a resume to see AI feedback and suggestions.</p>
        </div>
      )}
    </div>
  );
}
