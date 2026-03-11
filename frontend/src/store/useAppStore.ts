import { create } from 'zustand';
import axios from 'axios';
import type { Node, Edge } from '@xyflow/react';

interface User {
  id: string;
  email: string;
}

interface AppState {
  nodes: Node[];
  edges: Edge[];
  terraformCode: string;
  localizedDocs: string;
  isGenerating: boolean;
  error: string | null;
  
  user: User | null;
  token: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  guestGenerations: number;
  
  generateArchitecture: (prompt: string, targetLanguage: string) => Promise<void>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const savedToken = localStorage.getItem('infralingo_token');
const savedUser = localStorage.getItem('infralingo_user');
const savedGuestGenerations = localStorage.getItem('infralingo_guest_count');

export const useAppStore = create<AppState>((set, get) => ({
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

      if (!user) {
        const newCount = guestGenerations - 1;
        localStorage.setItem('infralingo_guest_count', newCount.toString());
        set({ guestGenerations: newCount });
      }

      set({ 
        nodes: nodes, 
        edges: edges, 
        terraformCode: code, 
        localizedDocs: docs,
        isGenerating: false 
      });

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

  login: async (email, password) => {
    set({ isAuthenticating: true, authError: null });
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('infralingo_token', token);
      localStorage.setItem('infralingo_user', JSON.stringify(user));
      
      set({ token, user, isAuthenticating: false });
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({ authError: error.response?.data?.error || "Registration failed.", isAuthenticating: false });
      }
    }
  },

  logout: () => {
    localStorage.removeItem('infralingo_token');
    localStorage.removeItem('infralingo_user');
    set({ token: null, user: null });
  }
}));