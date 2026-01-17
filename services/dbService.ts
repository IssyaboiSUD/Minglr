
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
  writeBatch
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
    if (!this.currentUser) throw new Error('User not authenticated');
    return this.currentUser.id;
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
    } catch (e: any) {}
  }

  private normalizeLocation(loc: any): string {
    if (typeof loc === 'string') return loc;
    if (loc && typeof loc === 'object') {
      if (loc.lat !== undefined && loc.lng !== undefined) return `${Number(loc.lat).toFixed(2)}, ${Number(loc.lng).toFixed(2)}`;
    }
    return 'Munich, Germany';
  }

  async getActivities(): Promise<Activity[]> {
    try {
      const activitiesCol = collection(firestore, 'activities');
      const snapshot = await getDocs(activitiesCol);
      const activities = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        const imageUrl = data.photoUrl || data.imageUrl || 'https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop';
        const category = data.category || data.type || 'Culture';

        return {
          ...data,
          id: doc.id,
          imageUrl,
          category,
          location: this.normalizeLocation(data.location)
        } as Activity;
      });
      return activities.length === 0 ? INITIAL_ACTIVITIES : activities;
    } catch (e: any) {
      return INITIAL_ACTIVITIES;
    }
  }

  async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    const userId = this.currentUser?.id;
    try {
      const usersCol = collection(firestore, 'users');
      const q = query(usersCol, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) } as UserProfile))
        .filter(u => u.id !== userId && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (users.length === 0 && searchTerm.length > 0) {
        const mockUsers: UserProfile[] = [
          { id: 'u2', name: 'Sophie H.', avatar: 'https://i.pravatar.cc/150?u=sophie', preferences: ['Culture'], wishlist: [], friends: [] },
          { id: 'u3', name: 'Max W.', avatar: 'https://i.pravatar.cc/150?u=max', preferences: ['Sports'], wishlist: [], friends: [] },
        ];
        return mockUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) && u.id !== userId);
      }
      return users;
    } catch (error) {
      return [];
    }
  }

  async addFriend(friendId: string) {
    const userId = this.getCurrentUserId();
    if (!this.currentUser) return;
    await updateDoc(doc(firestore, 'users', userId), { friends: arrayUnion(friendId) });
    
    await addDoc(collection(firestore, 'notifications'), {
      userId: friendId,
      userName: this.currentUser.name,
      type: 'friend_request',
      timestamp: serverTimestamp(),
      read: false
    });
  }

  async removeFriend(friendId: string) {
    const userId = this.getCurrentUserId();
    if (!this.currentUser) return;
    await updateDoc(doc(firestore, 'users', userId), { friends: arrayRemove(friendId) });
  }

  async getFriendsList(): Promise<UserProfile[]> {
    if (!this.currentUser || this.currentUser.friends.length === 0) return [];
    try {
        const usersCol = collection(firestore, 'users');
        const snapshot = await getDocs(usersCol);
        const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as UserProfile));
        return allUsers.filter(u => this.currentUser!.friends.includes(u.id));
    } catch (error) {
        return [];
    }
  }

  async createGroup(name: string, memberIds: string[]) {
    const userId = this.getCurrentUserId();
    const groupCol = collection(firestore, 'groups');
    const res = await addDoc(groupCol, {
      name,
      members: [...memberIds, userId],
      createdAt: serverTimestamp()
    });
    return res.id;
  }

  subscribeToGroups(callback: (groups: ChatGroup[]) => void) {
    if (!this.currentUser) return () => {};
    const userId = this.currentUser.id;
    const q = query(collection(firestore, 'groups'), where('members', 'array-contains', userId));
    return onSnapshot(q, (snapshot: any) => {
      callback(snapshot.docs.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as ChatGroup)));
    });
  }

  subscribeToMessages(callback: (messages: Message[]) => void, groupId?: string) {
    const targetGroupId = groupId || 'global';
    const q = query(collection(firestore, 'messages'), where('groupId', '==', targetGroupId));
    return onSnapshot(q, (snapshot: any) => {
      const messages = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as Message));
      const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      callback(sortedMessages);
    });
  }

  // Scanner for across all group polls to find where user voted YES
  subscribeToAllPolls(callback: (messages: Message[]) => void) {
    const q = query(collection(firestore, 'messages'), where('poll', '!=', null));
    return onSnapshot(q, (snapshot: any) => {
      const messages = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as Message));
      callback(messages);
    });
  }

  subscribeToNotifications(callback: (notifications: Notification[]) => void, userId: string) {
    const q = query(collection(firestore, 'notifications'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot: any) => {
      const notifications = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as Notification));
      const sorted = notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      callback(sorted);
    });
  }

  async markNotificationAsRead(id: string) {
    await updateDoc(doc(firestore, 'notifications', id), { read: true });
  }

  async markAllNotificationsAsRead(userId: string) {
    const q = query(collection(firestore, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }

  subscribeToPosts(callback: (posts: Post[]) => void) {
    const q = query(collection(firestore, 'posts'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot: any) => {
      const posts = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          likedBy: data.likedBy || [],
          comments: (data.comments || []).map((c: any) => ({
            ...c,
            timestamp: c.timestamp?.toDate() || new Date()
          })),
          timestamp: data.timestamp?.toDate() || new Date()
        } as Post;
      });
      callback(posts);
    });
  }

  async toggleLikePost(postId: string) {
    if (!this.currentUser) return;
    const userId = this.currentUser.id;
    const postRef = doc(firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const post = postSnap.data() as Post;
      const likedBy = post.likedBy || [];
      const isLiked = likedBy.includes(userId);
      
      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(userId),
          likes: Math.max(0, (post.likes || 0) - 1)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(userId),
          likes: (post.likes || 0) + 1
        });
        
        // Notify owner
        if (post.userId !== userId) {
          await addDoc(collection(firestore, 'notifications'), {
            userId: post.userId,
            userName: this.currentUser.name,
            type: 'like',
            relatedId: postId,
            timestamp: serverTimestamp(),
            read: false
          });
        }
      }
    }
  }

  async addComment(postId: string, text: string) {
    if (!this.currentUser) return;
    const userId = this.currentUser.id;
    const postRef = doc(firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      text,
      timestamp: new Date()
    };
    
    await updateDoc(postRef, {
      comments: arrayUnion(newComment)
    });
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      if (postData.userId !== userId) {
        await addDoc(collection(firestore, 'notifications'), {
          userId: postData.userId,
          userName: this.currentUser.name,
          type: 'comment',
          text,
          relatedId: postId,
          timestamp: serverTimestamp(),
          read: false
        });
      }
    }
  }

  subscribeToPlans(callback: (plans: GroupPlan[]) => void) {
    const q = query(collection(firestore, 'plans'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot: any) => {
      const plans = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date?.toDate() || new Date()
      } as GroupPlan));
      callback(plans);
    });
  }

  getUser() {
    return this.currentUser;
  }

  async updateUserProfile(updates: Partial<UserProfile>) {
    if (!this.currentUser) return;
    const userId = this.getCurrentUserId();
    this.currentUser = { ...this.currentUser, ...updates };
    try {
      await updateDoc(doc(firestore, 'users', userId), updates);
    } catch (e) {}
  }

  async addToWishlist(activityId: string) {
    if (!this.currentUser) return;
    const userId = this.getCurrentUserId();
    if (!this.currentUser.wishlist.includes(activityId)) {
      await updateDoc(doc(firestore, 'users', userId), { wishlist: arrayUnion(activityId) });
    }
  }

  async removeFromWishlist(activityId: string) {
    if (!this.currentUser) return;
    const userId = this.getCurrentUserId();
    await updateDoc(doc(firestore, 'users', userId), { wishlist: arrayRemove(activityId) });
  }

  async addMessage(msg: Partial<Message>) {
    if (!this.currentUser) return;
    const userId = this.getCurrentUserId();
    const targetGroupId = msg.groupId || 'global';
    
    await addDoc(collection(firestore, 'messages'), {
      userId: userId,
      userName: this.currentUser.name,
      text: msg.text || '',
      timestamp: serverTimestamp(),
      activityId: msg.activityId || null,
      groupId: targetGroupId,
      poll: msg.poll || null
    });

    if (targetGroupId !== 'global') {
      const groupRef = doc(firestore, 'groups', targetGroupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        const members = groupData.members || [];
        for (const memberId of members) {
          if (memberId !== userId) {
            await addDoc(collection(firestore, 'notifications'), {
              userId: memberId,
              userName: this.currentUser.name,
              type: 'message',
              text: msg.text,
              relatedId: targetGroupId,
              timestamp: serverTimestamp(),
              read: false
            });
          }
        }
      }
    }
  }

  async voteOnPoll(messageId: string, optionIndex: number) {
    if (!this.currentUser) return;
    const userId = this.currentUser.id;
    const msgRef = doc(firestore, 'messages', messageId);
    const msgSnap = await getDoc(msgRef);
    
    if (msgSnap.exists()) {
      const msgData = msgSnap.data() as Message;
      if (msgData.poll) {
        const newOptions = [...msgData.poll.options];
        
        // Remove user's previous votes from any option
        newOptions.forEach(opt => {
          opt.votes = opt.votes.filter(id => id !== userId);
        });
        
        // Add vote to selected option
        newOptions[optionIndex].votes.push(userId);
        
        await updateDoc(msgRef, {
          'poll.options': newOptions
        });
      }
    }
  }

  async addPlan(plan: Omit<GroupPlan, 'id'>) {
    await addDoc(collection(firestore, 'plans'), {
      ...plan,
      date: serverTimestamp()
    });
  }

  async addPost(post: Omit<Post, 'id'>) {
    await addDoc(collection(firestore, 'posts'), {
      ...post,
      timestamp: serverTimestamp()
    });
  }
}

export const db = new FirebaseDB();
