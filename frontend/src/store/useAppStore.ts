import { create } from 'zustand';
import axios from 'axios';
import type { Node, Edge } from '@xyflow/react';

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

export interface CostBreakdownItem {
  component: string;
  cost: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface AppState {
  // Architecture State
  nodes: Node[];
  edges: Edge[];
  terraformCode: string;
  localizedDocs: string;
  estimatedCost: string | null;
  costBreakdown: CostBreakdownItem[];
  quiz: QuizQuestion[];
  isGenerating: boolean;
  error: string | null;
  
  // Additional Quiz State
  isGeneratingMore: boolean;
  generateMoreQuestions: (targetLanguage: string) => Promise<void>;

  // Auth State
  user: User | null;
  token: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  guestGenerations: number;
  
  // History State
  history: HistoryItem[];
  isHistoryOpen: boolean;
  
  // Actions
  generateArchitecture: (prompt: string, targetLanguage: string, studyMode: boolean) => Promise<void>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  isTranslating: boolean;
  translateExistingDocs: (targetLanguage: string) => Promise<void>;
  
  fetchHistory: () => Promise<void>;
  loadFromHistory: (item: HistoryItem) => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const savedToken = localStorage.getItem('infralingo_token');
const savedUser = localStorage.getItem('infralingo_user');

const GUEST_DAILY_LIMIT = 3;

const getGuestGenerations = () => {
  const storedData = localStorage.getItem('infralingo_guest_data');
  const today = new Date().toDateString();

  if (storedData) {
    try {
      const { count, date } = JSON.parse(storedData);
      if (date !== today) {
        localStorage.setItem('infralingo_guest_data', JSON.stringify({ count: GUEST_DAILY_LIMIT, date: today }));
        return GUEST_DAILY_LIMIT;
      }
      return count;
    } catch {
      console.error("Corrupted local storage data, resetting guest count.");
    }
  }
  
  localStorage.setItem('infralingo_guest_data', JSON.stringify({ count: GUEST_DAILY_LIMIT, date: today }));
  return GUEST_DAILY_LIMIT;
};

export const useAppStore = create<AppState>((set, get) => ({  
  nodes: [],
  edges: [],
  terraformCode: '// Your Terraform code will appear here...',
  localizedDocs: '# Architecture Documentation\n\nGenerated docs will appear here.',
  estimatedCost: null,
  costBreakdown: [],
  quiz: [],
  isGenerating: false,
  error: null,
  isGeneratingMore: false,

  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticating: false,
  authError: null,
  
  guestGenerations: getGuestGenerations(),

  history: [],
  isHistoryOpen: false,

  generateArchitecture: async (prompt: string, targetLanguage: string, studyMode: boolean) => {
    const { token, guestGenerations, user } = get();

    if (!user && guestGenerations <= 0) {
      set({ error: "Free generations exhausted. Please sign in to continue." });
      return;
    }

    set({ isGenerating: true, error: null, quiz: [] }); 
    
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post('http://localhost:5000/api/generate', 
        { prompt, targetLanguage, studyMode },
        { headers }
      );

      const { nodes, edges, code, docs, estimatedCost, costBreakdown, quiz } = response.data;

      const formattedCode = code.replace(/\\n/g, '\n').replace(/\\"/g, '"');

      if (!user) {
        const newCount = guestGenerations - 1;
        const today = new Date().toDateString();
        localStorage.setItem('infralingo_guest_data', JSON.stringify({ count: newCount, date: today }));
        set({ guestGenerations: newCount });
      }

      set({ 
        nodes: nodes, 
        edges: edges, 
        terraformCode: formattedCode,
        localizedDocs: docs,
        estimatedCost: estimatedCost || null,
        costBreakdown: costBreakdown || [],
        quiz: quiz || [], 
        isGenerating: false 
      });

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

  generateMoreQuestions: async (targetLanguage: string) => {
    const { terraformCode, quiz, token } = get();
    if (!terraformCode || terraformCode.includes('Your Terraform code will appear here')) return;

    set({ isGeneratingMore: true, error: null });
    
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post('http://localhost:5000/api/generate/quiz', { 
        code: terraformCode, 
        targetLanguage,
        existingQuestions: quiz.map(q => q.question) 
      }, { headers });

      set({ 
        quiz: [...quiz, ...(response.data.quiz || [])], 
        isGeneratingMore: false 
      });
    } catch (error) {
      console.error("Quiz Generation Error:", error);
      set({ error: "Failed to generate more questions. Check your connection or quota.", isGeneratingMore: false });
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  isTranslating: false,

  translateExistingDocs: async (targetLanguage: string) => {
    const { localizedDocs, quiz, token, user } = get();

    if (!user) {
      set({ error: "Premium feature: Please sign in to translate on the fly." });
      return;
    }

    if (!localizedDocs || localizedDocs.includes('Generated docs will appear here')) return;

    set({ isTranslating: true, error: null });

    try {
      const response = await axios.post('http://localhost:5000/api/generate/translate', { 
        docs: localizedDocs,
        quiz: quiz,
        targetLanguage 
      }, { headers: { Authorization: `Bearer ${token}` } });

      set({ 
        localizedDocs: response.data.localizedDocs,
        quiz: response.data.quiz || [],
        isTranslating: false 
      });
    } catch (error) {
      console.error("Translation API Error:", error);
      set({ error: "Failed to translate docs. Try again.", isTranslating: false });
    }
  },

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
      estimatedCost: null, 
      costBreakdown: [],
      quiz: [], 
      isHistoryOpen: false 
    });
  },

  login: async (email, password) => {
    set({ isAuthenticating: true, authError: null });
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('infralingo_token', token);
      localStorage.setItem('infralingo_user', JSON.stringify(user));
      set({ token, user, isAuthenticating: false });
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
    set({ token: null, user: null, history: [] });
  }
}));