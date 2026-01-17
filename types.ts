
export interface Activity {
  id: string;
  name: string;
  description: string;
  category: 'Culture' | 'Nature' | 'Food' | 'Nightlife' | 'Sports';
  imageUrl: string;
  location: string;
  rating: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  preferences: string[];
  wishlist: string[]; // activity IDs
  friends: string[]; // user IDs
  sentRequests: string[]; // user IDs to whom a request was sent
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  activityId?: string; // Shared activity
  groupId?: string; // If undefined, it's a global/public message
  poll?: {
    question: string;
    options: { text: string; votes: string[] }[]; // user IDs
  };
}

export interface Notification {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'comment' | 'message' | 'friend_request' | 'event';
  text?: string;
  timestamp: Date;
  read: boolean;
  relatedId?: string; // ID of the post, message, or group
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
}

export interface ChatGroup {
  id: string;
  name: string;
  members: string[]; // user IDs
  lastMessage?: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  activityId: string;
  caption: string;
  likes: number;
  likedBy: string[]; // User IDs who liked
  comments: Comment[];
  timestamp: Date;
}

export interface GroupPlan {
  id: string;
  activityId: string;
  date: Date;
  status: 'planning' | 'confirmed';
}
