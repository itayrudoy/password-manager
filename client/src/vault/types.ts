export interface Credential {
  id: string;
  title: string;
  url: string | null;
  username: string | null;
  password: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialInput {
  title: string;
  url?: string | null;
  username?: string | null;
  password: string;
  notes?: string | null;
}
