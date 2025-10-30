'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from '@/lib/date-utils';
import { Loader2, Calendar, Clock, User, Mail, Phone, FileText } from 'lucide-react';
import Link from 'next/link';
import VapiAssistant from '@/components/vapi/VapiAssistant';
import { sendBookingConfirmationAction } from '@/lib/actions/booking-actions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Define booking type based on the database schema
type Booking = {
  id: string;
  business_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  email_confirmed: boolean;
  service?: {
    name: string;
    price: number;
    duration: number;
    category: string | null;
  };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessAssistantId, setBusinessAssistantId] = useState<string | null>(null);

  // Fetch the user's business profile and bookings
  useEffect(() => {
    async function fetchUserBusinessAndBookings() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Unable to get current user');
        }
        
        // Get the user's business profile
        const { data: businessProfiles, error: businessError } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (businessError || !businessProfiles) {
          throw new Error('Unable to get business profile');
        }
        
        setBusinessId(businessProfiles.id);
        
        // First try to get the assistant ID from the assistant_configs table
        const { data: assistantConfig, error: assistantError } = await supabase
          .from('assistant_configs')
          .select('assistant_id')
          .eq('business_id', businessProfiles.id)
          .eq('is_active', true)
          .single();
        
        if (!assistantError && assistantConfig && assistantConfig.assistant_id) {
          console.log('Found business assistant ID from assistant_configs:', assistantConfig.assistant_id);
          setBusinessAssistantId(assistantConfig.assistant_id);
        } else {
          console.log('No active assistant found in assistant_configs, checking assistants table');
          
          // If not found in assistant_configs, try the assistants table
          const { data: assistants, error: assistantsError } = await supabase
            .from('assistants')
            .select('vapi_assistant_id')
            .eq('business_profile_id', businessProfiles.id)
            .is('is_template', false)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (!assistantsError && assistants && assistants.length > 0 && assistants[0].vapi_assistant_id) {
            console.log('Found business assistant ID from assistants table:', assistants[0].vapi_assistant_id);
            setBusinessAssistantId(assistants[0].vapi_assistant_id);
          } else {
            console.log('No assistant found for this business in either table');
          }
        }
        
        // Fetch bookings for this business
        await fetchBookings(businessProfiles.id, statusFilter);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserBusinessAndBookings();
  }, []);

  // Fetch bookings based on status filter
  async function fetchBookings(businessId: string, status: string) {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services!inner (
            id,
            name,
            price,
            duration,
            category
          )
        `)
        .eq('business_id', businessId);
      
      // Filter by status if not 'all'
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      
      // Order by booking date and time (most recent first)
      query = query.order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Log the raw data returned from Supabase
      console.log('Raw data from Supabase:', JSON.stringify(data, null, 2));
      
      // Transform the data to match our Booking type
      const transformedData = data.map((booking: any) => {
        // Log the service data for debugging
        console.log('Service data for booking', booking.id, ':', JSON.stringify(booking.services, null, 2));
        console.log('Service data type:', typeof booking.services);
        console.log('Is services an array?', Array.isArray(booking.services));
        
        // With !inner join, services is returned as an object, not an array
        const transformedBooking = {
          ...booking,
          service: booking.services
        };
        
        // Log the transformed booking
        console.log('Transformed booking:', JSON.stringify(transformedBooking, null, 2));
        
        return transformedBooking;
      });
      
      setBookings(transformedData || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Handle status filter change
  const handleStatusChange = async (status: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    setStatusFilter(status);
    if (businessId) {
      await fetchBookings(businessId, status);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      setLoading(true);
      
      // Update booking status in the database
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) {
        console.error('Error updating booking status:', error);
        throw error;
      }
      
      // Send confirmation email for confirmed or cancelled bookings
      if (newStatus === 'confirmed' || newStatus === 'cancelled') {
        try {
          await sendBookingConfirmationAction(bookingId);
          
          // Update email_confirmed status in the UI without refetching
          setBookings(prevBookings => 
            prevBookings.map(booking => 
              booking.id === bookingId 
                ? { ...booking, status: newStatus, email_confirmed: true } 
                : booking
            )
          );
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Continue even if email fails
        }
      } else {
        // Just update the status in the UI without refetching
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: newStatus } 
              : booking
          )
        );
      }
      
      // Refresh bookings after update
      if (businessId) {
        await fetchBookings(businessId, statusFilter);
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Resend confirmation email
  const resendConfirmationEmail = async (bookingId: string) => {
    try {
      setLoading(true);
      
      // Send confirmation email using server action
      const result = await sendBookingConfirmationAction(bookingId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send confirmation email');
      }
      
      // Refresh bookings after update
      if (businessId) {
        await fetchBookings(businessId, statusFilter);
      }
    } catch (err) {
      console.error('Error resending confirmation email:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    try {
      // Handle time format like "14:30:00"
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <TooltipProvider>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Bookings</h1>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/bookings/new">
              <Button>New Booking</Button>
            </Link>
          </div>
        </div>

        {/* Add Vapi Assistant */}
        <div className="mb-6">
          <VapiAssistant 
            title="Booking Assistant"
            description="Need help with your bookings? Talk to our AI assistant."
            assistantId={businessAssistantId || undefined}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading bookings...</span>
          </div>
        ) : error ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="bg-red-50 text-red-700 p-4 rounded-md">
                {error}
              </div>
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                <p className="text-gray-500 mb-4">
                  {statusFilter === 'all' 
                    ? "You don't have any bookings yet." 
                    : `You don't have any ${statusFilter} bookings.`}
                </p>
                <Link href="/bookings/new">
                  <Button>Create a Booking</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>
                  Showing {bookings.length} {statusFilter !== 'all' ? statusFilter : ''} bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      // Log the booking data being used for rendering
                      console.log('Rendering booking:', booking.id, 'Service:', booking.service);
                      
                      return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">{booking.customer_name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" /> {booking.customer_email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" /> {booking.customer_phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {booking.service?.name || 'Unknown Service'}
                          </div>
                          {booking.service && (
                            <div className="text-sm text-gray-500">
                              {booking.service.duration} min · ${booking.service.price}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                            {formatDate(booking.booking_date)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(booking.booking_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                          {booking.email_confirmed ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Email Sent
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Email Pending
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => resendConfirmationEmail(booking.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Resend confirmation email</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/bookings/${booking.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                            {booking.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                            )}
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 