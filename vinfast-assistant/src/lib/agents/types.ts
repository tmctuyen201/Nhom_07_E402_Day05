export type AgentRole = 'orchestrator' | 'retrieval' | 'vision' | 'safety';
export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'done' | 'error';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentType?: AgentRole;
  sources?: Array<{
    pageNumber: number;
    chapter: string;
    section: string;
    excerpt: string;
  }>;
  confidence?: number;
  carModel?: string;
  isError?: boolean;
  isSafetyWarning?: boolean;
  imageData?: string;
}

export interface AgentContext {
  query: string;
  carModel: string;
  imageData?: string;
  conversationHistory: AgentMessage[];
}

export interface AgentResponse {
  text: string;
  agent: AgentRole;
  sources?: AgentMessage['sources'];
  confidence: number;
  isSafetyWarning?: boolean;
  shouldReject?: boolean;
  rejectionReason?: string;
  suggestedFollowUp?: string;
  category?: string;
}
