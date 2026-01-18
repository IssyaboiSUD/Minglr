
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
          const activityData = {
            ...activity,
            photoUrl: activity.imageUrl,
            imageUrl: activity.imageUrl
          };
          await setDoc(doc(firestore, 'activities', activity.id), activityData);
        }
      }
    } catch (e: any) {
      console.error("Seeding error:", e);
    }
  }

  async getActivities(): Promise<Activity[]> {
    try {
      const activitiesCol = collection(firestore, 'activities');
      const snapshot = await getDocs(activitiesCol);
      
      if (snapshot.empty) return INITIAL_ACTIVITIES;

      return snapshot.docs.map(doc => {
        const data = doc.data() as any;
        const imageUrl = data.imageUrl || data.photoUrl || INITIAL_ACTIVITIES.find(a => a.id === doc.id)?.imageUrl || '';
        let category = data.category || data.type;
        if (!category) {
          const mock = INITIAL_ACTIVITIES.find(a => a.id === doc.id);
          category = mock ? mock.category : 'Culture';
        }

        return {
          ...data,
          id: doc.id,
          imageUrl,
          category: category
        } as Activity;
      });
    } catch (e: any) {
      console.error("Fetch activities error:", e);
      return INITIAL_ACTIVITIES;
    }
  }

  // --- USER DATA ---

  async getUserById(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    try {
      const userDoc = doc(firestore, 'users', userId);
      const snap = await getDoc(userDoc);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as UserProfile;
      }
    } catch (error) {
      console.error("Error fetching user by ID:", error);
    }
    return null;
  }

  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    const userId = this.getCurrentUserId();
    if (!searchTerm || searchTerm.length < 2) return [];
    
    try {
      const usersCol = collection(firestore, 'users');
      const q = query(usersCol, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          following: [],
          followers: [],
          ...(doc.data() as any) 
        } as UserProfile))
        .filter(u => u.id !== userId);
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  async getRecommendedUsers(): Promise<UserProfile[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const usersCol = collection(firestore, 'users');
      const q = query(usersCol, limit(30));
      const snapshot = await getDocs(q);
      
      return snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          following: [],
          followers: [],
          ...(doc.data() as any) 
        } as UserProfile))
        .filter(u => u.id !== userId && !this.currentUser?.following?.includes(u.id))
        .slice(0, 5);
    } catch (error) {
      console.error("Error fetching recommended users:", error);
      return [];
    }
  }

  async followUser(targetUserId: string) {
    const userId = this.getCurrentUserId();
    if (!userId || !targetUserId || userId === targetUserId) return;

    try {
      const batch = writeBatch(firestore);
      const myRef = doc(firestore, 'users', userId);
      const targetRef = doc(firestore, 'users', targetUserId);

      batch.update(myRef, { following: arrayUnion(targetUserId) });
      batch.update(targetRef, { followers: arrayUnion(userId) });

      await addDoc(collection(firestore, 'notifications'), {
        userId: targetUserId,
        userName: this.currentUser?.name || 'Someone',
        type: 'follow',
        relatedId: userId,
        timestamp: serverTimestamp(),
        read: false
      });

      await batch.commit();
    } catch (error) {
      console.error("Error following user:", error);
    }
  }

  async unfollowUser(targetUserId: string) {
    const userId = this.getCurrentUserId();
    if (!userId || !targetUserId) return;

    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'users', userId), { following: arrayRemove(targetUserId) });
      batch.update(doc(firestore, 'users', targetUserId), { followers: arrayRemove(userId) });
      await batch.commit();
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  }

  async getFollowingList(): Promise<UserProfile[]> {
    const user = this.currentUser;
    if (!user || !user.following || user.following.length === 0) return [];

    try {
      const usersCol = collection(firestore, 'users');
      const q = query(usersCol, where(documentId(), 'in', user.following.slice(0, 30)));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        following: [],
        followers: [],
        ...(doc.data() as any) 
      } as UserProfile));
    } catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  }

  async getFollowersList(): Promise<UserProfile[]> {
    const user = this.currentUser;
    if (!user || !user.followers || user.followers.length === 0) return [];

    try {
      const usersCol = collection(firestore, 'users');
      const q = query(usersCol, where(documentId(), 'in', user.followers.slice(0, 30)));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        following: [],
        followers: [],
        ...(doc.data() as any) 
      } as UserProfile));
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  }

  // --- MESSAGING ---

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

  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      // Simplified query to avoid composite index requirement
      const q = query(collection(firestore, 'posts'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      // Sort in-memory instead of Firestore level
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: (doc.data() as any).timestamp?.toDate() || new Date()
      } as Post)).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error("Error fetching user posts:", error);
      return [];
    }
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

  // --- SYSTEM ---

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
    if (!userId) return;
    await updateDoc(doc(firestore, 'users', userId), { wishlist: arrayUnion(activityId) });
  }

  async removeFromWishlist(activityId: string) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    await updateDoc(doc(firestore, 'users', userId), { wishlist: arrayRemove(activityId) });
  }
}

export const db = new FirebaseDB();
