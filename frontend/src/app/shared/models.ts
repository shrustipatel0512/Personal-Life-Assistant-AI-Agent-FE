export interface ApiResult<T> {
  succeeded?: boolean;
  message?: string;
  data?: T;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  isCompleted: boolean;
  dueDateUtc?: string;
  estimatedMinutes: number;
}

export interface PlannerItem {
  title: string;
  startUtc: string;
  endUtc: string;
  recommendation: string;
}

export interface ChatReply {
  response: string;
  intent: string;
  suggestedActions: string[];
}
