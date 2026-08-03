export interface LoginItem {
  id: string;
  title: string;
  url: string | null;
  username: string | null;
  password: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginItemInput {
  title: string;
  url?: string | null;
  username?: string | null;
  password: string;
  notes?: string | null;
}
