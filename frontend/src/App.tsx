import React, { useState, useEffect } from 'react';
import ResumeUpload from './components/ResumeUpload';
import FeedbackViewer from './components/FeedbackViewer';
import AuthForm from './components/AuthForm';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, setToken } = useAuth();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token);
    }
    setIsLoading(false);
  }, [setToken]);

  function handleAuth(token: string) {
    setToken(token);
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isAuthenticated && (
          <div className="flex justify-center items-start pt-8">
            <div className="animate-slide-up">
              <AuthForm onAuth={handleAuth} />
            </div>
          </div>
        )}
        
        {isAuthenticated && (
          <>
            {/* Header */}
            <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">UtopiaHire</span>
            <span className="block text-indigo-600 text-2xl sm:text-3xl mt-2">
              AI-Powered Resume Enhancement
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl">
            Transform your resume with advanced AI analysis and get tailored improvements for your dream job.
          </p>
        </div>

        {/* Main Content */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full max-w-7xl">
              <svg className="absolute transform -translate-x-1/2 -translate-y-1/2 left-full" width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
                <defs>
                  <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
              </svg>
              <svg className="absolute transform -translate-x-1/2 -translate-y-1/2" width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
                <defs>
                  <pattern id="85737c0e-0916-41d7-917f-596dc7edfa28" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="4" height="4" className="text-gray-200" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa28)" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="relative">
            <div className={`
              grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-6 
              transition-all duration-500 ease-in-out
              ${isAuthenticated ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-4'}
            `}>
              <div className="md:col-span-1">
                <div className="animate-float">
                  {!isAuthenticated ? (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-102 hover:shadow-2xl">
                      <div className="px-6 py-8">
                        <AuthForm onAuth={handleAuth} />
                      </div>
                    </div>
                  ) : (
                    <ResumeUpload onUploaded={id => setResumeId(id)} />
                  )}
                </div>
              </div>

              <div className="md:col-span-1">
                <div className={`
                  bg-white rounded-2xl shadow-xl overflow-hidden
                  transition-all duration-500 transform
                  ${resumeId ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-75'}
                `}>
                  {resumeId ? (
                    <FeedbackViewer resumeId={resumeId} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                      <div className="animate-float">
                        <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        No Resume Selected
                      </h3>
                      <p className="text-gray-500">
                        Upload your resume to see AI-powered feedback and improvements
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Powered by advanced AI technology to help you land your dream job
          </p>
        </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
