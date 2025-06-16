import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Property, PropertyPermissions, User } from '../types';

export type PermissionLevel = 'admin' | 'editor' | 'viewer';

export class PermissionService {
  static async inviteUserToProperty(
    propertyId: string, 
    userEmail: string, 
    permission: PermissionLevel,
    invitedBy: string
  ): Promise<void> {
    // Create invitation document
    const invitationId = `${propertyId}_${userEmail}_${Date.now()}`;
    const invitation = {
      id: invitationId,
      propertyId,
      userEmail,
      permission,
      invitedBy,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    await setDoc(doc(db, 'invitations', invitationId), invitation);
    
    // TODO: Send email invitation (would need email service)
    console.log(`Invitation sent to ${userEmail} for property ${propertyId} with ${permission} permissions`);
  }

  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
    
    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data();
    
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Add user to property permissions
    await this.addUserToProperty(invitation.propertyId, userId, invitation.permission);
    
    // Mark invitation as accepted
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      acceptedBy: userId
    });
  }

  static async addUserToProperty(
    propertyId: string, 
    userId: string, 
    permission: PermissionLevel
  ): Promise<void> {
    const propertyRef = doc(db, 'properties', propertyId);
    const propertyDoc = await getDoc(propertyRef);
    
    if (!propertyDoc.exists()) {
      throw new Error('Property not found');
    }

    const property = propertyDoc.data() as Property;
    const permissions = property.permissions || { admins: [], editors: [], viewers: [] };

    // Remove user from other permission levels first
    const updates: any = {};
    if (permissions.admins?.includes(userId)) {
      updates['permissions.admins'] = arrayRemove(userId);
    }
    if (permissions.editors?.includes(userId)) {
      updates['permissions.editors'] = arrayRemove(userId);
    }
    if (permissions.viewers?.includes(userId)) {
      updates['permissions.viewers'] = arrayRemove(userId);
    }

    // Add to new permission level
    updates[`permissions.${permission}s`] = arrayUnion(userId);

    await updateDoc(propertyRef, updates);
  }

  static async removeUserFromProperty(propertyId: string, userId: string): Promise<void> {
    const propertyRef = doc(db, 'properties', propertyId);
    
    await updateDoc(propertyRef, {
      'permissions.admins': arrayRemove(userId),
      'permissions.editors': arrayRemove(userId),
      'permissions.viewers': arrayRemove(userId)
    });
  }

  static getUserPermissionLevel(property: Property, userId: string): PermissionLevel | null {
    if (!property.permissions) return null;
    
    if (property.permissions.admins?.includes(userId)) return 'admin';
    if (property.permissions.editors?.includes(userId)) return 'editor';
    if (property.permissions.viewers?.includes(userId)) return 'viewer';
    
    return null;
  }

  static canUserPerformAction(
    property: Property, 
    userId: string, 
    action: 'read' | 'write' | 'delete' | 'manage'
  ): boolean {
    const permission = this.getUserPermissionLevel(property, userId);
    
    if (!permission) return false;

    switch (action) {
      case 'read':
        return ['admin', 'editor', 'viewer'].includes(permission);
      case 'write':
        return ['admin', 'editor'].includes(permission);
      case 'delete':
        return permission === 'admin';
      case 'manage':
        return permission === 'admin';
      default:
        return false;
    }
  }

  static async getPropertyUsers(propertyId: string): Promise<{ user: User; permission: PermissionLevel }[]> {
    const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
    
    if (!propertyDoc.exists()) {
      return [];
    }

    const property = propertyDoc.data() as Property;
    const permissions = property.permissions || { admins: [], editors: [], viewers: [] };
    
    const users: { user: User; permission: PermissionLevel }[] = [];
    
    // Get all user IDs
    const allUserIds = [
      ...(permissions.admins || []),
      ...(permissions.editors || []),
      ...(permissions.viewers || [])
    ];

    // Fetch user details
    for (const userId of allUserIds) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const user = userDoc.data() as User;
        const permission = this.getUserPermissionLevel(property, userId)!;
        users.push({ user, permission });
      }
    }

    return users;
  }
}