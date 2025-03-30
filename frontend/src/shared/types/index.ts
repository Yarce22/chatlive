export interface Message {
  id: string;
  from: string;
  to?: string;
  message: string;
  time: string;
  read: boolean;
  isGroupMessage?: boolean;
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ConnectedUser {
  username: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}
