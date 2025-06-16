import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { Input } from '../Common/Input';
import { Card } from '../Common/Card';
import { Users, UserPlus, Mail, Shield, Eye, Edit, Trash2 } from 'lucide-react';
import { Property, User } from '../../types';
import { PermissionService, PermissionLevel } from '../../services/permissionService';
import { useAuth } from '../../hooks/useAuth';

interface UserManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onPropertyUpdate: (property: Property) => void;
}

export function UserManagementPanel({ isOpen, onClose, property, onPropertyUpdate }: UserManagementPanelProps) {
  const [users, setUsers] = useState<{ user: User; permission: PermissionLevel }[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, property.id]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const propertyUsers = await PermissionService.getPropertyUsers(property.id);
      setUsers(propertyUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (email: string, permission: PermissionLevel) => {
    if (!currentUser) return;

    try {
      await PermissionService.inviteUserToProperty(property.id, email, permission, currentUser.id);
      setShowInviteForm(false);
      // In a real app, you'd show a success message
      alert(`Invito inviato a ${email} con permessi di ${getPermissionLabel(permission)}`);
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Errore durante l\'invio dell\'invito');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo utente?')) return;

    try {
      await PermissionService.removeUserFromProperty(property.id, userId);
      await loadUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Errore durante la rimozione dell\'utente');
    }
  };

  const handleChangePermission = async (userId: string, newPermission: PermissionLevel) => {
    try {
      await PermissionService.addUserToProperty(property.id, userId, newPermission);
      await loadUsers();
    } catch (error) {
      console.error('Error changing permission:', error);
      alert('Errore durante la modifica dei permessi');
    }
  };

  const getPermissionLabel = (permission: PermissionLevel) => {
    switch (permission) {
      case 'admin': return 'Amministratore';
      case 'editor': return 'Collaboratore';
      case 'viewer': return 'Ospite';
    }
  };

  const getPermissionIcon = (permission: PermissionLevel) => {
    switch (permission) {
      case 'admin': return Shield;
      case 'editor': return Edit;
      case 'viewer': return Eye;
    }
  };

  const getPermissionColor = (permission: PermissionLevel) => {
    switch (permission) {
      case 'admin': return 'text-red-600 bg-red-50';
      case 'editor': return 'text-blue-600 bg-blue-50';
      case 'viewer': return 'text-gray-600 bg-gray-50';
    }
  };

  const canManageUsers = currentUser && PermissionService.canUserPerformAction(property, currentUser.id, 'manage');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestione Utenti"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Utenti con accesso a {property.name}
            </h3>
          </div>
          {canManageUsers && (
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setShowInviteForm(true)}
            >
              Invita Utente
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Caricamento utenti...</p>
          </div>
        ) : users.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun utente</h3>
              <p className="text-gray-600 mb-4">Invita altri utenti per collaborare su questa proprietà</p>
              {canManageUsers && (
                <Button
                  variant="primary"
                  icon={UserPlus}
                  onClick={() => setShowInviteForm(true)}
                >
                  Invita Primo Utente
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map(({ user, permission }) => {
              const PermissionIcon = getPermissionIcon(permission);
              return (
                <Card key={user.id} padding={false}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(permission)}`}>
                        <PermissionIcon className="h-3 w-3" />
                        <span>{getPermissionLabel(permission)}</span>
                      </div>
                      
                      {canManageUsers && user.id !== currentUser?.id && (
                        <div className="flex items-center space-x-1">
                          <select
                            value={permission}
                            onChange={(e) => handleChangePermission(user.id, e.target.value as PermissionLevel)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="viewer">Ospite</option>
                            <option value="editor">Collaboratore</option>
                            <option value="admin">Amministratore</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Invite User Form */}
        {showInviteForm && (
          <InviteUserForm
            onInvite={handleInviteUser}
            onCancel={() => setShowInviteForm(false)}
          />
        )}
      </div>
    </Modal>
  );
}

interface InviteUserFormProps {
  onInvite: (email: string, permission: PermissionLevel) => void;
  onCancel: () => void;
}

function InviteUserForm({ onInvite, onCancel }: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email.trim(), permission);
      setEmail('');
      setPermission('viewer');
    }
  };

  return (
    <Card className="border-primary-200 bg-primary-50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="h-5 w-5 text-primary-600" />
          <h4 className="font-semibold text-primary-900">Invita Nuovo Utente</h4>
        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="utente@email.com"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Livello di Permessi
          </label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as PermissionLevel)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="viewer">Ospite (Solo lettura)</option>
            <option value="editor">Collaboratore (Può inserire dati)</option>
            <option value="admin">Amministratore (Controllo completo)</option>
          </select>
          <p className="text-xs text-gray-600 mt-1">
            {permission === 'viewer' && 'Può solo visualizzare i dati'}
            {permission === 'editor' && 'Può inserire letture e bollette'}
            {permission === 'admin' && 'Può fare tutto, incluso gestire utenti'}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit">
            Invia Invito
          </Button>
        </div>
      </form>
    </Card>
  );
}