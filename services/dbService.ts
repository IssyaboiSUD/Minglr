
import { 
  collection, 
  getDocs, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  limit,
  arrayUnion,
  arrayRemove,
  where,
  writeBatch,
  deleteDoc,
  documentId
} from 'firebase/firestore';
import { Activity, Post, Message, UserProfile, GroupPlan, ChatGroup, Notification, Comment } from '../types';
import { INITIAL_ACTIVITIES } from '../mockData';
import { firestore } from './firebaseConfig';

class FirebaseDB {
  private currentUser: UserProfile | null = null;

  constructor() {
    this.seedActivitiesIfNeeded();
  }

  setCurrentUser(user: UserProfile | null) {
    this.currentUser = user;
  }

  private getCurrentUserId(): string {
    return this.currentUser?.id || "";
  }

  private async seedActivitiesIfNeeded() {
    try {
      const activitiesCol = collection(firestore, 'activities');
      const snapshot = await getDocs(query(activitiesCol, limit(1)));
      if (snapshot.empty) {
        for (const activity of INITIAL_ACTIVITIES) {
          await setDoc(doc(firestore, 'activities', activity.id), activity);
        }
      }
    } catch (e: any) {}
  }

  async getActivities(): Promise<Activity[]> {
    try {
      const activitiesCol = collection(firestore, 'activities');
      const snapshot = await getDocs(activitiesCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
    } catch (e: any) {
      return INITIAL_ACTIVITIES;
    }
  }

  // --- NEW CLEAN FRIENDS SYSTEM ---

  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    const userId = this.getCurrentUserId();
    if (!searchTerm || searchTerm.length < 2) return [];
    
    try {
      const usersCol = collection(firestore, 'users');
      // Simple prefix search
      const q = query(usersCol, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.id !== userId);
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  async sendFriendRequest(targetUserId: string) {
    const userId = this.getCurrentUserId();
    if (!userId || !targetUserId || userId === targetUserId) return;

    try {
      // 1. Mark as sent in sender's profile
      await updateDoc(doc(firestore, 'users', userId), {
        sentRequests: arrayUnion(targetUserId)
      });

      // 2. Create notification for the receiver
      await addDoc(collection(firestore, 'notifications'), {
        userId: targetUserId,
        userName: this.currentUser?.name || 'Someone',
        type: 'friend_request',
        relatedId: userId, // The person who SENT the request
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error("Error sending request:", error);
    }
  }

  async acceptFriendRequest(notificationId: string, requesterId: string) {
    const userId = this.getCurrentUserId();
    if (!userId || !requesterId) return;

    try {
      const batch = writeBatch(firestore);
      const myRef = doc(firestore, 'users', userId);
      const requesterRef = doc(firestore, 'users', requesterId);
      const notifRef = doc(firestore, 'notifications', notificationId);

      // Add to both friends lists
      batch.update(myRef, { friends: arrayUnion(requesterId) });
      batch.update(requesterRef, { 
        friends: arrayUnion(userId),
        sentRequests: arrayRemove(userId) // Clean up their sent request list
      });

      // Mark notification as read
      batch.update(notifRef, { read: true });

      await batch.commit();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  }

  async ignoreFriendRequest(notificationId: string) {
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error("Error ignoring request:", error);
    }
  }

  async removeFriend(friendId: string) {
    const userId = this.getCurrentUserId();
    if (!userId || !friendId) return;

    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'users', userId), { friends: arrayRemove(friendId) });
      batch.update(doc(firestore, 'users', friendId), { friends: arrayRemove(userId) });
      await batch.commit();
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  }

  async getFriendsList(): Promise<UserProfile[]> {
    const user = this.currentUser;
    if (!user || !user.friends || user.friends.length === 0) return [];

    try {
      const usersCol = collection(firestore, 'users');
      // Firestore 'in' query limit is 30
      const q = query(usersCol, where(documentId(), 'in', user.friends.slice(0, 30)));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      console.error("Error fetching friends:", error);
      return [];
    }
  }

  // --- CHAT & MESSAGING ---

  async createGroup(name: string, memberIds: string[]) {
    const userId = this.getCurrentUserId();
    if (!userId) return null;
    const res = await addDoc(collection(firestore, 'groups'), {
      name,
      members: [...memberIds, userId],
      createdAt: serverTimestamp()
    });
    return res.id;
  }

  async leaveGroup(groupId: string) {
    const userId = this.getCurrentUserId();
    if (!userId || !groupId) return;
    await updateDoc(doc(firestore, 'groups', groupId), {
      members: arrayRemove(userId)
    });
  }

  subscribeToGroups(callback: (groups: ChatGroup[]) => void) {
    const userId = this.getCurrentUserId();
    if (!userId) return () => {};
    const q = query(collection(firestore, 'groups'), where('members', 'array-contains', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: (doc.data() as any).createdAt?.toDate() || new Date()
      } as ChatGroup)));
    });
  }

  subscribeToMessages(callback: (messages: Message[]) => void, groupId?: string) {
    const targetGroupId = groupId || 'global';
    const q = query(collection(firestore, 'messages'), where('groupId', '==', targetGroupId));
    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: (doc.data() as any).timestamp?.toDate() || new Date()
      } as Message));
      callback(msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
    });
  }

  subscribeToAllPolls(callback: (messages: Message[]) => void) {
    const q = query(collection(firestore, 'messages'), where('poll', '!=', null));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: (doc.data() as any).timestamp?.toDate() || new Date()
      } as Message)));
    });
  }

  async addMessage(msg: Partial<Message>) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    await addDoc(collection(firestore, 'messages'), {
      userId,
      userName: this.currentUser?.name || 'User',
      text: msg.text || '',
      timestamp: serverTimestamp(),
      activityId: msg.activityId || null,
      groupId: msg.groupId || 'global',
      poll: msg.poll || null
    });
  }

  async voteOnPoll(messageId: string, optionIndex: number) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    const ref = doc(firestore, 'messages', messageId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const poll = (snap.data() as any).poll;
      const newOptions = [...poll.options];
      newOptions.forEach((o: any) => o.votes = o.votes.filter((id: string) => id !== userId));
      newOptions[optionIndex].votes.push(userId);
      await updateDoc(ref, { 'poll.options': newOptions });
    }
  }

  // --- NOTIFICATIONS ---

  subscribeToNotifications(callback: (notifications: Notification[]) => void, userId: string) {
    if (!userId) return () => {};
    const q = query(collection(firestore, 'notifications'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const sorted = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: (doc.data() as any).timestamp?.toDate() || new Date()
      } as Notification)).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      callback(sorted);
    });
  }

  async markNotificationAsRead(id: string) {
    await updateDoc(doc(firestore, 'notifications', id), { read: true });
  }

  async markAllNotificationsAsRead(userId: string) {
    const q = query(collection(firestore, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(firestore);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }

  // --- POSTS ---

  subscribeToPosts(callback: (posts: Post[]) => void) {
    const q = query(collection(firestore, 'posts'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: (doc.data() as any).timestamp?.toDate() || new Date(),
        comments: ((doc.data() as any).comments || []).map((c: any) => ({
          ...c,
          timestamp: c.timestamp?.toDate() || new Date()
        }))
      } as Post)));
    });
  }

  async addPost(post: Omit<Post, 'id'>) {
    await addDoc(collection(firestore, 'posts'), {
      ...post,
      timestamp: serverTimestamp()
    });
  }

  async toggleLikePost(postId: string) {
    const userId = this.getCurrentUserId();
    const ref = doc(firestore, 'posts', postId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const likedBy = data.likedBy || [];
      const isLiked = likedBy.includes(userId);
      await updateDoc(ref, {
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
        likes: isLiked ? Math.max(0, data.likes - 1) : (data.likes || 0) + 1
      });
    }
  }

  async addComment(postId: string, text: string) {
    const userId = this.getCurrentUserId();
    await updateDoc(doc(firestore, 'posts', postId), {
      comments: arrayUnion({
        id: Math.random().toString(36).substr(2, 9),
        userId,
        userName: this.currentUser?.name || 'User',
        userAvatar: this.currentUser?.avatar || '',
        text,
        timestamp: new Date()
      })
    });
  }

  // --- USER ---

  getUser() {
    return this.currentUser;
  }

  async updateUserProfile(updates: Partial<UserProfile>) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    await updateDoc(doc(firestore, 'users', userId), updates);
  }

  async addToWishlist(activityId: string) {
    const userId = this.getCurrentUserId();
    await updateDoc(doc(firestore, 'users', userId), { wishlist: arrayUnion(activityId) });
  }

  async removeFromWishlist(activityId: string) {
    const userId = this.getCurrentUserId();
    await updateDoc(doc(firestore, 'users', userId), { wishlist: arrayRemove(activityId) });
  }
}

export const db = new FirebaseDB();
