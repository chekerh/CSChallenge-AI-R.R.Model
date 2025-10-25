const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    if (!response.ok) {
      return { 
        error: data.error || `Error: ${response.status}`, 
        status: response.status 
      };
    }
    return { data, status: response.status };
  } catch (err) {
    return { 
      error: 'Network error occurred', 
      status: response.status 
    };
  }
}

export async function signup(email: string, password: string, name: string): Promise<ApiResponse<{ token: string }>> {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    return await res.json();
  } catch (err) {
    return { error: 'Network error' };
  }
}

export async function login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (err) {
    return { error: 'Network error' };
  }
}

export async function uploadResume(token: string, file: File): Promise<ApiResponse<{ resumeId: string; versionId: string }>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/resumes/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Upload failed' };
    }
    return { data };
  } catch (err) {
    return { error: 'Upload failed' };
  }
}

export async function processResume(token: string, resumeId: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_URL}/resumes/versions/${resumeId}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    if (!res.ok) {
      console.error('Processing error:', data);
      return { error: data.error || 'Processing failed' };
    }
    return { data };
  } catch (err) {
    console.error('Processing error:', err);
    return { error: 'Network error during processing' };
  }
}

export async function getFeedback(token: string, resumeId: string): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${API_URL}/resumes/${resumeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (err) {
    return { error: 'Failed to fetch feedback' };
  }
}

