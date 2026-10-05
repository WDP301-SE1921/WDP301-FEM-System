import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import type { ApiResponse } from '@/types/api';

import type { ChildProfile, CreatedChild, CreateChildPayload, UpdateChildPayload } from '../types';

export const childrenApi = {
  /** Ho so cac con cua phu huynh dang dang nhap, kem ngay sinh. */
  async list(): Promise<ChildProfile[]> {
    const { data } = await apiClient.get<ApiResponse<ChildProfile[]>>(Endpoints.me.students);
    return data.data;
  },

  /** Phu huynh tao ho so cho mot con de theo doi viec hoc cua con. */
  async create(payload: CreateChildPayload): Promise<CreatedChild> {
    const { data } = await apiClient.post<ApiResponse<CreatedChild>>(
      Endpoints.parent.students,
      payload,
    );
    return data.data;
  },

  /** Phu huynh sua ho ten, khoi, ngay sinh cua con. */
  async update(studentId: string, payload: UpdateChildPayload): Promise<ChildProfile> {
    const { data } = await apiClient.patch<ApiResponse<ChildProfile>>(
      Endpoints.me.student(studentId),
      payload,
    );
    return data.data;
  },
};
