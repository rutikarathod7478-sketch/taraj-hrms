export interface AppNotification {
  id: number;
  user_id?: number | null;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
  candidate_id?: number | null;
  candidate_name?: string | null;
  candidate_code?: string | null;
  department_name?: string | null;
  position_title?: string | null;
}
