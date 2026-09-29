import { apiClient } from '@/api/client';
import { Endpoints } from '@/api/endpoints';
import { AppError, type ApiResponse } from '@/types/api';
import type { AuthSession } from '@/types/auth';

import { INVALID_CODE_MESSAGE } from '../constants';
import type {
  ClaimAndSignUpPayload,
  ClaimInvitationResult,
  InspectInvitationResult,
  InvitationContext,
  InvitationPreview,
} from '../types';
import { toInvitationError } from '../utils';

function rethrowInvitationError(context: InvitationContext) {
  return (error: unknown): never => {
    throw toInvitationError(error, context);
  };
}

export const linkInvitationApi = {
  /** Xem thong tin toi thieu cua ma truoc khi dung (§6.3). */
  async inspect(token: string, context: InvitationContext = 'SIGN_UP'): Promise<InvitationPreview> {
    const { data } = await apiClient
      .post<ApiResponse<InspectInvitationResult>>(Endpoints.linkInvitations.inspect, { token })
      .catch(rethrowInvitationError(context));

    const result = data.data;
    if (!result.valid) throw new AppError(INVALID_CODE_MESSAGE);
    return result;
  },

  /** Tao tai khoan phu huynh, lien ket con va mo phien dang nhap trong mot buoc (§6.4). */
  async claimAndSignUp(payload: ClaimAndSignUpPayload): Promise<AuthSession> {
    const { data } = await apiClient
      .post<ApiResponse<AuthSession>>(Endpoints.linkInvitations.claimAndSignUp, payload)
      .catch(rethrowInvitationError('SIGN_UP'));

    return data.data;
  },

  /** Phu huynh dang dang nhap dung ma de lien ket them con vao tai khoan (§6.5). */
  async claim(token: string): Promise<ClaimInvitationResult> {
    const { data } = await apiClient
      .post<ApiResponse<ClaimInvitationResult>>(Endpoints.linkInvitations.claim, { token })
      .catch(rethrowInvitationError('ADD_CHILD'));

    return data.data;
  },
};
