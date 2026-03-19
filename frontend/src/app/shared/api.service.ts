import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResult, ChatReply, PlannerItem, TaskItem } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getTasks(): Observable<ApiResult<TaskItem[]>> {
    return this.http.get<ApiResult<TaskItem[]>>(`${this.baseUrl}/tasks`);
  }

  createTask(payload: { title: string; description?: string; dueDateUtc?: string; estimatedMinutes: number }): Observable<ApiResult<TaskItem>> {
    return this.http.post<ApiResult<TaskItem>>(`${this.baseUrl}/tasks`, payload);
  }

  updateTask(
    id: string,
    payload: {
      title: string;
      description?: string;
      category: string;
      dueDateUtc?: string;
      estimatedMinutes: number;
      isCompleted: boolean;
    }): Observable<ApiResult<TaskItem>> {
    return this.http.put<ApiResult<TaskItem>>(`${this.baseUrl}/tasks/${id}`, payload);
  }

  deleteTask(id: string): Observable<ApiResult<boolean>> {
    return this.http.delete<ApiResult<boolean>>(`${this.baseUrl}/tasks/${id}`);
  }

  generatePlan(): Observable<ApiResult<PlannerItem[]>> {
    return this.http.post<ApiResult<PlannerItem[]>>(`${this.baseUrl}/planner/generate`, {});
  }

  sendChat(message: string): Observable<ApiResult<ChatReply>> {
    return this.http.post<ApiResult<ChatReply>>(`${this.baseUrl}/chat`, { message });
  }
}
