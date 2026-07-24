export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  systemInstruction: string;
  description: string;
  color: string; // Tailwind color class suffix, e.g., 'blue', 'purple', 'emerald'
  icon: string; // Lucide icon name
}

export type WorkflowType = 'sequential' | 'parallel' | 'review' | 'routing';

export interface WorkflowLink {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  type: WorkflowType;
  agents: Agent[];
  links: WorkflowLink[];
  inputTask: string;
}

export interface SimulationLog {
  id: string;
  agentId?: string;
  agentName?: string;
  timestamp: string;
  type: 'thought' | 'output' | 'system' | 'error';
  message: string;
  content?: string;
}

export interface SimulationResult {
  success: boolean;
  logs: SimulationLog[];
  finalArtifact: string;
  durationMs: number;
}
