import { create } from 'zustand';
import axios from 'axios';
import type { Node, Edge } from '@xyflow/react';

// ==========================================
// 1. INTERFACES
// ==========================================
interface User {
  id: string;
  email: string;
}

export interface HistoryItem {
  id: string;
  originalPrompt: string;
  targetLanguage: string;
  nodesJson: Node[];
  edgesJson: Edge[];
  terraformCode: string;
  readmeLocalized: string;
  createdAt: string;
}

interface AppState {
  // --- Architecture State ---
  nodes: Node[];
  edges: Edge[];
  terraformCode: string;
  localizedDocs: string;
  isGenerating: boolean;
  error: string | null;
  
  // --- Auth State ---
  user: User | null;
  token: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  guestGenerations: number;
  
  // --- History State ---
  history: HistoryItem[];
  isHistoryOpen: boolean;
  
  // --- Actions ---
  generateArchitecture: (prompt: string, targetLanguage: string) => Promise<void>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  
  fetchHistory: () => Promise<void>;
  loadFromHistory: (item: HistoryItem) => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ==========================================
// 2. LOCAL STORAGE INITIALIZATION
// ==========================================
const savedToken = localStorage.getItem('infralingo_token');
const savedUser = localStorage.getItem('infralingo_user');
const savedGuestGenerations = localStorage.getItem('infralingo_guest_count');

// ==========================================
// 3. ZUSTAND STORE
// ==========================================
export const useAppStore = create<AppState>((set, get) => ({
  
  // --- INITIAL STATE ---
  nodes: [],
  edges: [],
  terraformCode: '// Your Terraform code will appear here...',
  localizedDocs: '# Architecture Documentation\n\nGenerated docs will appear here.',
  isGenerating: false,
  error: null,

  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticating: false,
  authError: null,
  guestGenerations: savedGuestGenerations ? parseInt(savedGuestGenerations) : 3,

  history: [],
  isHistoryOpen: false,

  // --- ARCHITECTURE ACTIONS ---
  generateArchitecture: async (prompt: string, targetLanguage: string) => {
    const { token, guestGenerations, user } = get();

    if (!user && guestGenerations <= 0) {
      set({ error: "Free generations exhausted. Please sign in to continue." });
      return;
    }

    set({ isGenerating: true, error: null });
    
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post('http://localhost:5000/api/generate', 
        { prompt, targetLanguage },
        { headers }
      );

      const { nodes, edges, code, docs } = response.data;

      // CLEANUP: Fix escaped newlines and quotes from the AI JSON hallucination
      const formattedCode = code.replace(/\\n/g, '\n').replace(/\\"/g, '"');

      if (!user) {
        const newCount = guestGenerations - 1;
        localStorage.setItem('infralingo_guest_count', newCount.toString());
        set({ guestGenerations: newCount });
      }

      set({ 
        nodes: nodes, 
        edges: edges, 
        terraformCode: formattedCode, // Use the beautifully formatted code!
        localizedDocs: docs,
        isGenerating: false 
      });

      // If logged in, refresh history to show the newly generated architecture
      if (user) {
        get().fetchHistory();
      }

    } catch (error) {
      console.error("API Error:", error);
      if (axios.isAxiosError(error)) {
        set({ error: error.response?.data?.error || "Failed to generate architecture.", isGenerating: false });
      } else if (error instanceof Error) {
        set({ error: error.message, isGenerating: false });
      } else {
        set({ error: "An unexpected error occurred.", isGenerating: false });
      }
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // --- HISTORY ACTIONS ---
  setIsHistoryOpen: (isOpen) => set({ isHistoryOpen: isOpen }),

  fetchHistory: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await axios.get('http://localhost:5000/api/generate/architectures', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ history: response.data });
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  },

  loadFromHistory: (item) => {
    set({
      nodes: item.nodesJson,
      edges: item.edgesJson,
      terraformCode: item.terraformCode,
      localizedDocs: item.readmeLocalized,
      isHistoryOpen: false 
    });
  },

  // --- AUTH ACTIONS ---
  login: async (email, password) => {
    set({ isAuthenticating: true, authError: null });
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('infralingo_token', token);
      localStorage.setItem('infralingo_user', JSON.stringify(user));
      
      set({ token, user, isAuthenticating: false });
      
      // Automatically fetch user's saved projects upon login
      get().fetchHistory();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({ authError: error.response?.data?.error || "Login failed.", isAuthenticating: false });
      }
    }
  },

  register: async (email, password) => {
    set({ isAuthenticating: true, authError: null });
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('infralingo_token', token);
      localStorage.setItem('infralingo_user', JSON.stringify(user));
      
      set({ token, user, isAuthenticating: false });

      // Automatically fetch user's saved projects upon registration
      get().fetchHistory();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({ authError: error.response?.data?.error || "Registration failed.", isAuthenticating: false });
      }
    }
  },

  logout: () => {
    localStorage.removeItem('infralingo_token');
    localStorage.removeItem('infralingo_user');
    set({ token: null, user: null, history: [] }); // Clear history on logout
  }
}));