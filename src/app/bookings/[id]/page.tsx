'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, User, Mail, Phone, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
  service?: {
    name: string;
    price: number;
    duration: number;
    category: string | null;
  };
};

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch the user's business profile and booking details
  useEffect(() => {
    async function fetchUserBusinessAndBooking() {
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
        
        // Fetch booking details
        const { data, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            services (
              id,
              name,
              price,
              duration,
              category
            )
          `)
          .eq('id', params.id)
          .eq('business_id', businessProfiles.id)
          .single();
        
        if (bookingError) {
          throw bookingError;
        }
        
        if (!data) {
          throw new Error('Booking not found or you do not have permission to view it');
        }
        
        // Log the service data for debugging
        console.log('Service data for booking detail:', data.services);
        
        // Transform the data to match our Booking type
        const transformedData = {
          ...data,
          service: data.services && data.services.length > 0 ? data.services[0] : undefined
        };
        
        setBooking(transformedData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserBusinessAndBooking();
  }, [params.id]);

  // Handle booking status update
  const updateBookingStatus = async (newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', params.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh booking data
      setBooking(booking => booking ? { ...booking, status: newStatus } : null);
      
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setUpdating(false);
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
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    try {
      // Handle time format like "14:30:00"
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      return timeStr;
    }
  };

  // Format date and time for display
  const formatDateTime = (date: string, time: string) => {
    return `${formatDate(date)} at ${formatTime(time)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading booking details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/bookings">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
        </div>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/bookings">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
        </div>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Booking not found</h3>
              <p className="text-gray-500 mb-4">
                The booking you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/bookings">
                <Button>Go to Bookings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/bookings">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Booking Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Booking Information</CardTitle>
                  <CardDescription>
                    Details for booking #{booking.id.substring(0, 8)}
                  </CardDescription>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">Service</h3>
                    <p className="font-medium">{booking.service?.name || 'Unknown Service'}</p>
                    {booking.service && (
                      <p className="text-sm text-gray-500">
                        {booking.service.duration} minutes · ${booking.service.price}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <p>{formatDate(booking.booking_date)}</p>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <p>{formatTime(booking.booking_time)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <p>{booking.customer_name}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <p>{booking.customer_email}</p>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <p>{booking.customer_phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      Notes
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line">{booking.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Booking Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created</span>
                      <span>{new Date(booking.created_at).toLocaleString()}</span>
                    </div>
                    {booking.updated_at !== booking.created_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Updated</span>
                        <span>{new Date(booking.updated_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.status === 'pending' && (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => updateBookingStatus('confirmed')}
                >
                  Confirm Booking
                </Button>
              )}
              
              {booking.status === 'confirmed' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => updateBookingStatus('completed')}
                >
                  Mark as Completed
                </Button>
              )}
              
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <Button 
                  variant="outline" 
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => updateBookingStatus('cancelled')}
                >
                  Cancel Booking
                </Button>
              )}
              
              <Link href={`/bookings/${booking.id}/edit`} className="block w-full">
                <Button variant="outline" className="w-full">
                  Edit Booking
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => window.print()}
              >
                Print Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 