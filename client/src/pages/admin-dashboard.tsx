import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from '@shared/schema';
import { 
  Shield, Users, Building2, Settings, Plus, Edit, Trash2, 
  LogOut, UserPlus, Key, BarChart3, Activity, Calendar,
  Search, Filter, MoreVertical, AlertTriangle
} from 'lucide-react';

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'agent', 'admin']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

const editUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['user', 'agent', 'admin']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Redirect if not admin or super admin
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, navigate, toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'user',
      firstName: '',
      lastName: '',
      phone: '',
      avatar: '',
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'user',
      firstName: '',
      lastName: '',
      phone: '',
      avatar: '',
    },
  });

  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          variant: 'destructive',
        });
        event.target.value = ''; // Clear the input
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        event.target.value = ''; // Clear the input
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        form.setValue('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset avatar when dialog closes
  const resetAvatarUpload = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    form.setValue('avatar', '');
  };

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
  });

  // Fetch users with passwords for super admin
  const { data: usersWithPasswords = [], isLoading: usersWithPasswordsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/users/with-passwords'],
    enabled: user?.role === 'super_admin' && showPasswords,
    retry: false,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserForm) => {
      const response = await apiRequest('POST', '/api/admin/users', userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateUserOpen(false);
      form.reset();
      resetAvatarUpload();
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: EditUserForm }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${id}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsEditUserOpen(false);
      setEditingUser(null);
      editForm.reset();
      resetAvatarUpload();
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Logout failed',
        variant: 'destructive',
      });
    }
  };

  const onCreateUser = async (data: CreateUserForm) => {
    await createUserMutation.mutateAsync(data);
  };

  const onEditUser = async (data: EditUserForm) => {
    if (editingUser) {
      await editUserMutation.mutateAsync({ id: editingUser.id, userData: data });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      username: user.username,
      email: user.email,
      password: '', // Don't pre-fill password for security
      role: user.role as 'user' | 'agent' | 'admin',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
    });
    setAvatarPreview(user.avatar || '');
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Statistics
  const stats = {
    totalUsers: users.length,
    agents: users.filter(u => u.role === 'agent').length,
    customers: users.filter(u => u.role === 'user').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={user.avatar || ''} />
                <AvatarFallback>
                  {user.firstName?.[0]}{user.lastName?.[0] || user.username[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super Administrator</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Real Estate Agents</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.agents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage real estate agencies, agents, and customers
                </CardDescription>
              </div>
              <Dialog open={isCreateUserOpen} onOpenChange={(open) => {
                setIsCreateUserOpen(open);
                if (!open) {
                  resetAvatarUpload();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-user">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateUser)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Avatar Upload Field */}
                      <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Photo</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={avatarPreview} />
                                    <AvatarFallback>
                                      <UserPlus className="h-8 w-8 text-gray-400" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleAvatarChange}
                                      className="cursor-pointer"
                                      data-testid="input-avatar"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                      Upload a profile photo (optional, max 5MB)
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" data-testid="input-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">Customer</SelectItem>
                                <SelectItem value="agent">Real Estate Agent</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-firstname" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-lastname" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsCreateUserOpen(false);
                            resetAvatarUpload();
                          }}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createUserMutation.isPending}
                          data-testid="button-submit"
                        >
                          {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Edit User Dialog */}
              <Dialog open={isEditUserOpen} onOpenChange={(open) => {
                setIsEditUserOpen(open);
                if (!open) {
                  setEditingUser(null);
                  resetAvatarUpload();
                }
              }}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user information
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditUser)} className="space-y-4">
                      <FormField
                        control={editForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="edit-input-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="edit-input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Avatar Upload Field */}
                      <FormField
                        control={editForm.control}
                        name="avatar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Photo</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={avatarPreview} />
                                    <AvatarFallback>
                                      <UserPlus className="h-8 w-8 text-gray-400" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleAvatarChange}
                                      className="cursor-pointer"
                                      data-testid="edit-input-avatar"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                      Upload a profile photo (optional, max 5MB)
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password (Leave blank to keep current)</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" data-testid="edit-input-password" placeholder="Enter new password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="edit-select-role">
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="user">Customer</SelectItem>
                                <SelectItem value="agent">Real Estate Agent</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="edit-input-firstname" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="edit-input-lastname" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={editForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="edit-input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditUserOpen(false);
                            setEditingUser(null);
                            resetAvatarUpload();
                          }}
                          data-testid="edit-button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={editUserMutation.isPending}
                          data-testid="edit-button-submit"
                        >
                          {editUserMutation.isPending ? 'Updating...' : 'Update User'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Customers</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              {user?.role === 'super_admin' && (
                <Button
                  variant={showPasswords ? "default" : "outline"}
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-2"
                  data-testid="button-toggle-passwords"
                >
                  <Key className="h-4 w-4" />
                  {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
                </Button>
              )}
            </div>

            {/* Users Table */}
            <div className="border rounded-lg">
              {usersLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {user?.role === 'super_admin' && showPasswords && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Password
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} data-testid={`user-row-${u.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={u.avatar || ''} />
                                <AvatarFallback>
                                  {u.firstName?.[0]}{u.lastName?.[0] || u.username[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}
                                </div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={u.role === 'admin' ? 'destructive' : u.role === 'agent' ? 'default' : 'secondary'}
                              data-testid={`badge-role-${u.id}`}
                            >
                              {u.role === 'agent' ? 'Real Estate Agent' : 
                               u.role === 'admin' ? 'Administrator' : 'Customer'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={u.isVerified ? 'default' : 'secondary'}
                              data-testid={`badge-status-${u.id}`}
                            >
                              {u.isVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </td>
                          {user?.role === 'super_admin' && showPasswords && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                {usersWithPasswords.find(up => up.id === u.id)?.password || '••••••••'}
                              </code>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex gap-2 justify-end">
                              {user?.role === 'super_admin' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(u)}
                                  className="text-blue-600 hover:text-blue-700"
                                  data-testid={`button-edit-${u.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {u.id !== user.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-delete-${u.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}