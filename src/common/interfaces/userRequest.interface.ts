import { DecodedIdToken } from 'firebase-admin/auth';

export interface UserRequest extends Request {
  user: DecodedIdToken;
}