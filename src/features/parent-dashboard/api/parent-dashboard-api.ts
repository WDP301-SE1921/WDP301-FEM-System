import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api';

import type {
  LinkedStudent,
  ScheduleRange,
  ScheduleSession,
  StudentDashboard,
  UnreadNotificationCount,
} from '../types';

export const parentDashboardApi = {
  /** Cac con da lien ket voi tai khoan phu huynh dang dang nhap. */
  async getStudents(): Promise<LinkedStudent[]> {
    const { data } = await apiClient.get<ApiResponse<LinkedStudent[]>>(Endpoints.parent.students);
    return data.data;
  },

  /** Tong quan hom nay cua mot con: buoi hoc, diem danh, diem, viec can chu y, thong bao. */
  async getStudentDashboard(studentId: string): Promise<StudentDashboard> {
    const { data } = await apiClient.get<ApiResponse<StudentDashboard>>(
      Endpoints.parent.studentDashboard(studentId),
    );
    return data.data;
  },

  /** Cac buoi hoc cua mot con trong khoang ngay, gom ca buoi hoc bu va buoi doi lich. */
  async getStudentSchedule(studentId: string, range: ScheduleRange): Promise<ScheduleSession[]> {
    const { data } = await apiClient.get<ApiResponse<ScheduleSession[]>>(
      Endpoints.parent.studentSchedule(studentId),
      { params: range },
    );
    return data.data;
  },

  /** So thong bao phu huynh chua doc, de hien cham do tren nut chuong. */
  async getUnreadNotificationCount(): Promise<UnreadNotificationCount> {
    const { data } = await apiClient.get<ApiResponse<UnreadNotificationCount>>(
      Endpoints.parent.unreadNotificationCount,
    );
    return data.data;
  },
};
