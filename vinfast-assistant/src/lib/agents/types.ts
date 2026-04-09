export type AgentRole = 'orchestrator' | 'retrieval' | 'vision' | 'safety' | 'tool';
export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'done' | 'error';

// ── Tool call result embedded in a message ───────────────────
export interface ChargingStation {
  name: string;
  address: string;
  rating?: number;
  reviews?: number;
  open_now?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  maps_url: string;
  thumbnail?: string;
}

export interface ToolCallResult {
  tool: 'find_charging_stations' | 'battery_range' | 'maintenance_schedule' | 'search_nearby_places' | 'get_directions';
  status: 'requesting_location' | 'searching' | 'geocoding' | 'done' | 'error';
  stationType?: 'charging' | 'service';
  stations?: ChargingStation[];
  // search_nearby_places
  places?: ChargingStation[];
  keyword?: string;
  // get_directions
  destination?: string;
  display_name?: string;
  maps_url?: string;
  directions_found?: boolean;
  error?: string;
  userLocation?: { lat: number; lng: number };
  source?: string;
  // battery_range fields
  battery_level?: number;
  range_km?: number;
  car_model?: string;
  driving_mode?: string;
  advice?: string;
  urgency?: string;
  spec?: { capacity_kwh: number; max_range_km: number };
  // maintenance_schedule fields
  current_km?: number;
  summary?: string;
  items?: MaintenanceItem[];
  overdue_count?: number;
  due_soon_count?: number;
}

export interface MaintenanceItem {
  id: string;
  name: string;
  interval_km: number;
  next_due_km: number;
  km_remaining: number;
  status: 'overdue' | 'due_soon' | 'upcoming' | 'ok';
}

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
    source?: string;
  }>;
  confidence?: number;
  carModel?: string;
  isError?: boolean;
  isSafetyWarning?: boolean;
  imageData?: string;
  // Tool call result — renders special UI inline
  toolCall?: ToolCallResult;
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
