import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User } from '@shared/schema';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '@shared/schema';
import { 
  Shield, Users, Building2, Settings, Plus, Edit, Trash2, 
  LogOut, UserPlus, Key, BarChart3, Activity, Calendar,
  Search, Filter, MoreVertical, AlertTriangle, Eye, MapPin,
  Home, DollarSign, ImageIcon, Languages
} from 'lucide-react';
import { CustomerAnalytics } from '@/components/CustomerAnalytics';

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'agent', 'admin']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  waveBalance: z.number().min(0, 'Wave balance must be 0 or greater').default(0),
  expiresAt: z.string().optional(),
  isVerified: z.boolean().default(false),
  allowedLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).default(['en']).optional(),
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
  waveBalance: z.number().min(0, 'Wave balance must be 0 or greater').default(0),
  expiresAt: z.string().optional(),
  isVerified: z.boolean().default(false),
  allowedLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

// Helper functions for expiration
const calculateDaysUntilExpiration = (expiresAt: string | Date | null): number | null => {
  if (!expiresAt) return null;
  const now = new Date();
  const expiration = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const diffInMs = expiration.getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

const getExpirationStatus = (daysUntilExpiration: number | null): { status: string; color: string; bgColor: string } => {
  if (daysUntilExpiration === null) {
    return { status: 'No Expiration', color: 'text-green-600', bgColor: 'bg-green-100' };
  }
  
  if (daysUntilExpiration < 0) {
    return { status: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100' };
  }
  
  if (daysUntilExpiration <= 3) {
    return { status: `${daysUntilExpiration} days left`, color: 'text-red-600', bgColor: 'bg-red-100' };
  }
  
  if (daysUntilExpiration <= 7) {
    return { status: `${daysUntilExpiration} days left`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  }
  
  return { status: `${daysUntilExpiration} days left`, color: 'text-green-600', bgColor: 'bg-green-100' };
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);

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
      navigate('/admin/login?unauthorized=true');
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
      waveBalance: 10,
      expiresAt: '',
      isVerified: false,
      allowedLanguages: ['en'],
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
      waveBalance: 0,
      expiresAt: '',
      isVerified: false,
      allowedLanguages: ['en'],
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
        editForm.setValue('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset avatar when dialog closes
  const resetAvatarUpload = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    form.setValue('avatar', '');
    editForm.setValue('avatar', '');
  };

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
  });

  // Fetch users with passwords for admins
  const { data: usersWithPasswords = [], isLoading: usersWithPasswordsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/users/with-passwords'],
    enabled: (user?.role === 'admin' || user?.role === 'super_admin') && showPasswords,
    retry: false,
  });

  // Fetch customer properties when a customer is selected
  const { data: customerProperties = [], isLoading: customerPropertiesLoading } = useQuery<any[]>({
    queryKey: ['/api/users', selectedCustomer?.id, 'properties'],
    enabled: !!selectedCustomer?.id,
    retry: false,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserForm) => {
      // Prepare data for backend - keep expiresAt as string or remove if empty
      const transformedData: any = { ...userData };
      
      // Handle expiresAt field properly
      if (userData.expiresAt && userData.expiresAt.trim() !== '') {
        // Ensure it's a valid date string in ISO format
        const dateObj = new Date(userData.expiresAt);
        if (!isNaN(dateObj.getTime())) {
          transformedData.expiresAt = userData.expiresAt; // Keep as string for backend processing
        } else {
          delete transformedData.expiresAt; // Invalid date, remove it
        }
      } else {
        delete transformedData.expiresAt; // Empty or null, remove it
      }
      
      const response = await apiRequest('POST', '/api/admin/users', transformedData);
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
      // Prepare data for backend - keep expiresAt as string or remove if empty
      const transformedData: any = { ...userData };
      
      // Handle expiresAt field properly
      if (userData.expiresAt && userData.expiresAt.trim() !== '') {
        // Ensure it's a valid date string in ISO format
        const dateObj = new Date(userData.expiresAt);
        if (!isNaN(dateObj.getTime())) {
          transformedData.expiresAt = userData.expiresAt; // Keep as string for backend processing
        } else {
          delete transformedData.expiresAt; // Invalid date, remove it
        }
      } else {
        delete transformedData.expiresAt; // Empty or null, remove it
      }
      
      const response = await apiRequest('PUT', `/api/admin/users/${id}`, transformedData);
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
    
    // Get the current password if available
    const userWithPassword = usersWithPasswords.find(u => u.id === user.id);
    const currentPassword = userWithPassword?.password || '';
    
    // Format expiresAt date for datetime-local input
    let formattedExpiresAt = '';
    if (user.expiresAt) {
      const date = new Date(user.expiresAt);
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      formattedExpiresAt = date.toISOString().slice(0, 16);
    }
    
    editForm.reset({
      username: user.username,
      email: user.email,
      password: currentPassword, // Show current password if available
      role: user.role as 'user' | 'agent' | 'admin',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      waveBalance: user.waveBalance || 0,
      expiresAt: formattedExpiresAt,
      isVerified: user.isVerified || false,
      allowedLanguages: user.allowedLanguages || ['en'],
    });
    setAvatarPreview(user.avatar || '');
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  const handleViewCustomerDetails = (customer: User) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const showPagination = filteredUsers.length > itemsPerPage;

  // Statistics
  const stats = {
    totalUsers: users.length,
    agents: users.filter(u => u.role === 'agent').length,
    customers: users.filter(u => u.role === 'user').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-800 dark:to-orange-900 shadow-lg border-b border-orange-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-xs sm:text-sm text-orange-100 hidden sm:block">Estate Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src={user.avatar || ''} />
                  <AvatarFallback className="bg-white text-orange-600 font-medium">
                    {user.firstName?.[0]}{user.lastName?.[0] || user.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  <p className="text-xs text-orange-100">Super Administrator</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-orange-600 transition-all duration-200"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-100">Total Users</CardTitle>
              <div className="p-1 sm:p-2 bg-white/20 rounded-lg">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-orange-100 mt-1 hidden sm:block">Active accounts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-100">Agents</CardTitle>
              <div className="p-1 sm:p-2 bg-white/20 rounded-lg">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.agents}</div>
              <p className="text-xs text-orange-100 mt-1 hidden sm:block">Real estate professionals</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-300 to-orange-400 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-100">Customers</CardTitle>
              <div className="p-1 sm:p-2 bg-white/20 rounded-lg">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.customers}</div>
              <p className="text-xs text-orange-100 mt-1 hidden sm:block">Property seekers</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-100">Admins</CardTitle>
              <div className="p-1 sm:p-2 bg-white/20 rounded-lg">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.admins}</div>
              <p className="text-xs text-orange-100 mt-1 hidden sm:block">System administrators</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="border-b border-orange-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <CardTitle className="text-lg sm:text-xl text-orange-800 dark:text-orange-200 font-bold">User Management</CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-300 mt-1">
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
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                    data-testid="button-create-user"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <FormField
                        control={form.control}
                        name="waveBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-500" />
                              Wave Balance
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                data-testid="input-wave-balance"
                                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-gray-500">
                              Number of waves this user can assign to their properties (0 = unlimited for admin)
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expiresAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              Account Expiration Date
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="datetime-local" 
                                data-testid="input-expires-at"
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-gray-500">
                              Leave empty for no expiration. User account will be automatically disabled after this date.
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isVerified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-orange-200 p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-verified"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="flex items-center gap-2 text-orange-600 font-medium">
                                <Shield className="h-4 w-4" />
                                Verified Customer
                              </FormLabel>
                              <p className="text-sm text-gray-500">
                                Grant this customer the orange verified badge. Verified customers are trusted and receive priority support.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {/* Language Permissions - Super Admin Only */}
                      {user?.role === 'super_admin' && (
                        <FormField
                          control={form.control}
                          name="allowedLanguages"
                          render={({ field }) => (
                            <FormItem className="rounded-md border border-blue-200 p-4">
                              <FormLabel className="flex items-center gap-2 text-blue-600 font-medium">
                                <Languages className="h-4 w-4" />
                                Language Permissions
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <p className="text-sm text-gray-500">
                                    Select which languages this customer can use to create content
                                  </p>
                                  <div className="flex flex-wrap gap-4">
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                      <div key={lang} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={field.value?.includes(lang) || false}
                                          onCheckedChange={(checked) => {
                                            const currentLanguages = field.value || ['en'];
                                            if (checked) {
                                              field.onChange([...currentLanguages, lang]);
                                            } else {
                                              // Prevent removing all languages - at least English must remain
                                              const newLanguages = currentLanguages.filter(l => l !== lang);
                                              if (newLanguages.length === 0) {
                                                field.onChange(['en']);
                                              } else {
                                                field.onChange(newLanguages);
                                              }
                                            }
                                          }}
                                          data-testid={`checkbox-language-${lang}`}
                                        />
                                        <label 
                                          className="text-sm font-medium cursor-pointer"
                                          onClick={() => {
                                            const currentLanguages = field.value || ['en'];
                                            const isChecked = currentLanguages.includes(lang);
                                            if (!isChecked) {
                                              field.onChange([...currentLanguages, lang]);
                                            } else {
                                              const newLanguages = currentLanguages.filter(l => l !== lang);
                                              if (newLanguages.length === 0) {
                                                field.onChange(['en']);
                                              } else {
                                                field.onChange(newLanguages);
                                              }
                                            }
                                          }}
                                        >
                                          {LANGUAGE_NAMES[lang]}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
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
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[90vh] overflow-y-auto">
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
                      <FormField
                        control={editForm.control}
                        name="waveBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-500" />
                              Wave Balance
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                data-testid="edit-input-wave-balance"
                                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-gray-500">
                              Number of waves this user can assign to their properties (0 = unlimited for admin)
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="expiresAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              Account Expiration Date
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="datetime-local" 
                                data-testid="edit-input-expires-at"
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-gray-500">
                              Leave empty for no expiration. User account will be automatically disabled after this date.
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="isVerified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-orange-200 p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="edit-checkbox-verified"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="flex items-center gap-2 text-orange-600 font-medium">
                                <Shield className="h-4 w-4" />
                                Verified Customer
                              </FormLabel>
                              <p className="text-sm text-gray-500">
                                Grant this customer the orange verified badge. Verified customers are trusted and receive priority support.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {/* Language Permissions - Super Admin Only */}
                      {user?.role === 'super_admin' && (
                        <FormField
                          control={editForm.control}
                          name="allowedLanguages"
                          render={({ field }) => (
                            <FormItem className="rounded-md border border-blue-200 p-4">
                              <FormLabel className="flex items-center gap-2 text-blue-600 font-medium">
                                <Languages className="h-4 w-4" />
                                Language Permissions
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <p className="text-sm text-gray-500">
                                    Select which languages this customer can use to create content
                                  </p>
                                  <div className="flex flex-wrap gap-4">
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                      <div key={lang} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={field.value?.includes(lang) || false}
                                          onCheckedChange={(checked) => {
                                            const currentLanguages = field.value || ['en'];
                                            if (checked) {
                                              field.onChange([...currentLanguages, lang]);
                                            } else {
                                              // Prevent removing all languages - at least English must remain
                                              const newLanguages = currentLanguages.filter(l => l !== lang);
                                              if (newLanguages.length === 0) {
                                                field.onChange(['en']);
                                              } else {
                                                field.onChange(newLanguages);
                                              }
                                            }
                                          }}
                                          data-testid={`edit-checkbox-language-${lang}`}
                                        />
                                        <label 
                                          className="text-sm font-medium cursor-pointer"
                                          onClick={() => {
                                            const currentLanguages = field.value || ['en'];
                                            const isChecked = currentLanguages.includes(lang);
                                            if (!isChecked) {
                                              field.onChange([...currentLanguages, lang]);
                                            } else {
                                              const newLanguages = currentLanguages.filter(l => l !== lang);
                                              if (newLanguages.length === 0) {
                                                field.onChange(['en']);
                                              } else {
                                                field.onChange(newLanguages);
                                              }
                                            }
                                          }}
                                        >
                                          {LANGUAGE_NAMES[lang]}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
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
            <div className="space-y-3 sm:space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-orange-200 focus:border-orange-500 focus:ring-orange-500" data-testid="select-role-filter">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">Customers</SelectItem>
                      <SelectItem value="agent">Agents</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <Button
                      variant={showPasswords ? "default" : "outline"}
                      onClick={() => setShowPasswords(!showPasswords)}
                      className={`flex items-center gap-2 w-full sm:w-auto transition-all duration-200 ${
                        showPasswords 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'border-orange-300 text-orange-600 hover:bg-orange-50'
                      }`}
                      data-testid="button-toggle-passwords"
                    >
                      <Key className="h-4 w-4" />
                      <span className="text-sm">{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="border border-orange-200 rounded-lg overflow-hidden">
              {usersLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading users...</p>
                </div>
              ) : paginatedUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-orange-100 to-orange-50 dark:from-gray-800 dark:to-gray-800">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider hidden sm:table-cell">
                          Role
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider hidden md:table-cell">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider hidden lg:table-cell">
                          Expiration
                        </th>
                        {(user?.role === 'admin' || user?.role === 'super_admin') && showPasswords && (
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider hidden lg:table-cell">
                            Password
                          </th>
                        )}
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider hidden lg:table-cell">
                          Created
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedUsers.map((u) => (
                        <tr key={u.id} data-testid={`user-row-${u.id}`} className="hover:bg-orange-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-orange-200">
                                <AvatarImage src={u.avatar || ''} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 font-medium">
                                  {u.firstName?.[0]}{u.lastName?.[0] || u.username[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 truncate">{u.email}</div>
                                <div className="sm:hidden mt-1 flex items-center space-x-2">
                                  <Badge 
                                    variant={u.role === 'admin' ? 'destructive' : u.role === 'agent' ? 'default' : 'secondary'}
                                    className="text-xs"
                                    data-testid={`badge-role-${u.id}`}
                                  >
                                    {u.role === 'agent' ? 'Agent' : u.role === 'admin' ? 'Admin' : 'Customer'}
                                  </Badge>
                                  <Badge 
                                    variant={u.isVerified ? 'default' : 'secondary'}
                                    className={`text-xs md:hidden ${
                                      u.isVerified 
                                        ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    }`}
                                    data-testid={`badge-status-${u.id}`}
                                  >
                                    {u.isVerified ? 'Verified' : 'Unverified'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <Badge 
                              variant={u.role === 'admin' ? 'destructive' : u.role === 'agent' ? 'default' : 'secondary'}
                              className="bg-gradient-to-r text-xs font-medium"
                              data-testid={`badge-role-${u.id}`}
                            >
                              {u.role === 'agent' ? 'Real Estate Agent' : 
                               u.role === 'admin' ? 'Administrator' : 'Customer'}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <Badge 
                              variant={u.isVerified ? 'default' : 'secondary'}
                              className={`text-xs font-medium ${
                                u.isVerified 
                                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300' 
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                              data-testid={`badge-status-${u.id}`}
                            >
                              {u.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            {(() => {
                              const daysUntilExpiration = calculateDaysUntilExpiration(u.expiresAt);
                              const { status, color, bgColor } = getExpirationStatus(daysUntilExpiration);
                              return (
                                <Badge 
                                  className={`text-xs font-medium ${color} ${bgColor} border-0`}
                                  data-testid={`badge-expiration-${u.id}`}
                                >
                                  {status}
                                </Badge>
                              );
                            })()}
                          </td>
                          {(user?.role === 'admin' || user?.role === 'super_admin') && showPasswords && (
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                              <code className="bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs border border-orange-200">
                                {usersWithPasswords.find(up => up.id === u.id)?.password || '••••••••'}
                              </code>
                            </td>
                          )}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                            <div className="text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex gap-1 sm:gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewCustomerDetails(u)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 p-1 sm:p-2"
                                data-testid={`button-view-${u.id}`}
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(u)}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 p-1 sm:p-2"
                                  data-testid={`button-edit-${u.id}`}
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                              {u.id !== user.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 p-1 sm:p-2"
                                  data-testid={`button-delete-${u.id}`}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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

            {/* Pagination */}
            {showPagination && (
              <div className="mt-6 px-4 py-3 bg-white dark:bg-gray-800 border-t border-orange-200 dark:border-gray-700 rounded-b-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`w-8 h-8 p-0 ${
                              currentPage === pageNumber
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'text-orange-600 border-orange-200 hover:bg-orange-50'
                            }`}
                            data-testid={`button-page-${pageNumber}`}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details Modal */}
        <Dialog open={isCustomerDetailsOpen} onOpenChange={setIsCustomerDetailsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 ring-2 ring-orange-200">
                  <AvatarImage src={selectedCustomer?.avatar || ''} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 font-medium text-lg">
                    {selectedCustomer?.firstName?.[0]}{selectedCustomer?.lastName?.[0] || selectedCustomer?.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedCustomer?.firstName && selectedCustomer?.lastName 
                      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` 
                      : selectedCustomer?.username}
                  </h2>
                  <p className="text-gray-600">{selectedCustomer?.email}</p>
                </div>
              </DialogTitle>
              <DialogDescription>
                Complete customer profile and property portfolio
              </DialogDescription>
            </DialogHeader>

            {selectedCustomer && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Customer Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Basic Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Customer Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Username:</span>
                          <span className="font-medium">{selectedCustomer.username}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Role:</span>
                          <Badge variant={selectedCustomer.role === 'admin' ? 'destructive' : 'secondary'}>
                            {selectedCustomer.role === 'agent' ? 'Agent' : selectedCustomer.role === 'admin' ? 'Admin' : 'Customer'}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <Badge 
                            variant={selectedCustomer.isVerified ? 'default' : 'secondary'}
                            className={`${
                              selectedCustomer.isVerified 
                                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300' 
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {selectedCustomer.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        {selectedCustomer.phone && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{selectedCustomer.phone}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Portfolio Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Properties:</span>
                          <span className="font-bold text-lg text-orange-600">{customerProperties.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">For Sale:</span>
                          <span className="font-medium">{customerProperties.filter(p => p.listingType === 'sale').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">For Rent:</span>
                          <span className="font-medium">{customerProperties.filter(p => p.listingType === 'rent').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-medium text-green-600">
                            ${customerProperties.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Account Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Account Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Joined:</span>
                          <span className="font-medium">
                            {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Expiration:</span>
                          <span className="font-medium">
                            {(() => {
                              const daysUntilExpiration = calculateDaysUntilExpiration(selectedCustomer.expiresAt);
                              const { status, color } = getExpirationStatus(daysUntilExpiration);
                              return <span className={color}>{status}</span>;
                            })()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="properties" className="space-y-6 mt-6">
                  {/* Properties Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Building2 className="h-5 w-5 mr-2" />
                          Properties Portfolio ({customerProperties.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customerPropertiesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                          <span className="ml-3">Loading properties...</span>
                        </div>
                      ) : customerProperties.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No properties found for this customer</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {customerProperties.map((property) => (
                            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                              <div className="relative">
                                {property.images && property.images.length > 0 ? (
                                  <img
                                    src={property.images[0]}
                                    alt={property.title}
                                    className="w-full h-32 object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                <Badge 
                                  className={`absolute top-2 right-2 ${
                                    property.listingType === 'sale' 
                                      ? 'bg-red-500 hover:bg-red-600' 
                                      : 'bg-green-500 hover:bg-green-600'
                                  }`}
                                >
                                  {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                                </Badge>
                              </div>
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-sm mb-2 line-clamp-1">{property.title}</h3>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span className="line-clamp-1">{property.location}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Home className="h-3 w-3 mr-1" />
                                    <span>{property.type}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      <span className="font-bold text-green-600">
                                        ${property.price?.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {property.bedrooms}bd • {property.bathrooms}ba
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                  <CustomerAnalytics 
                    customerId={selectedCustomer.id} 
                    customerName={selectedCustomer.firstName && selectedCustomer.lastName 
                      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` 
                      : selectedCustomer.username}
                  />
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}