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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from '@/lib/date-utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm, Controller } from '@/lib/form-utils';
import { zodResolver } from '@/lib/form-utils';
import * as z from 'zod';
import Link from 'next/link';
import VapiAssistant from '@/components/vapi/VapiAssistant';
import { sendNewBookingNotificationAction } from '@/lib/actions/booking-actions';

// Define the form schema with Zod
const formSchema = z.object({
  service_id: z.string({
    required_error: "Please select a service",
  }),
  customer_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  customer_email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  customer_phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  booking_date: z.date({
    required_error: "Please select a date for the booking.",
  }),
  booking_time: z.string({
    required_error: "Please select a time for the booking.",
  }),
  notes: z.string().optional(),
});

// Define service type
type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string | null;
};

// Define field type for form components
interface FieldProps {
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  name: string;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      notes: ""
    }
  });

  // Fetch the user's business profile and services
  useEffect(() => {
    async function fetchUserBusinessAndServices() {
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
        
        // Get services for this business
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('business_id', businessProfiles.id);
        
        if (servicesError) {
          throw servicesError;
        }
        
        // Transform the data to match our Service type
        const transformedServices = servicesData.map((service: any) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          category: service.category
        }));
        
        setServices(transformedServices || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserBusinessAndServices();
  }, []);

  // Generate available time slots when date or service changes
  useEffect(() => {
    if (selectedDate && selectedServiceId) {
      generateAvailableTimeSlots(selectedDate, selectedServiceId);
    }
  }, [selectedDate, selectedServiceId]);

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      form.setValue('booking_date', date);
    }
  };

  // Handle service change
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    form.setValue('service_id', serviceId);
  };

  // Generate available time slots based on date and service
  const generateAvailableTimeSlots = async (date: Date, serviceId: string) => {
    try {
      // In a real application, you would check service availability and existing bookings
      // For now, we'll generate time slots from 9 AM to 5 PM with 30-minute intervals
      const times: string[] = [];
      const startHour = 9;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        times.push(`${hour}:00`);
        times.push(`${hour}:30`);
      }
      
      setAvailableTimes(times);
    } catch (err) {
      console.error('Error generating time slots:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Handle form submission
  const onSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      
      if (!businessId) {
        throw new Error('Business ID is required');
      }
      
      const formattedDate = format(values.booking_date, 'yyyy-MM-dd');
      
      // Create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          business_id: businessId,
          service_id: values.service_id,
          customer_name: values.customer_name,
          customer_email: values.customer_email,
          customer_phone: values.customer_phone,
          booking_date: formattedDate,
          booking_time: values.booking_time,
          notes: values.notes || null,
          status: 'pending',
          email_confirmed: false
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Send new booking notification emails
      if (data && data.length > 0) {
        try {
          await sendNewBookingNotificationAction(data[0].id);
        } catch (emailError) {
          console.error('Error sending notification emails:', emailError);
          // Continue even if email sending fails
        }
      }
      
      // Redirect to the bookings page
      router.push('/bookings');
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">New Booking</h1>
        <Link href="/bookings">
          <Button variant="outline">Back to Bookings</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>
                Fill in the details for the new booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="service_id"
                    render={({ field }: { field: FieldProps }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select 
                          disabled={loading || services.length === 0}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleServiceChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - ${service.price} ({service.duration} min)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the service you want to book
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="booking_date"
                      render={({ field }: { field: FieldProps }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={handleDateChange}
                                disabled={(date) => 
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Select the date for your booking
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="booking_time"
                      render={({ field }: { field: FieldProps }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={!selectedDate || !selectedServiceId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTimes.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select an available time slot
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }: { field: FieldProps }) => (
                        <FormItem>
                          <FormLabel>Customer Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_email"
                      render={({ field }: { field: FieldProps }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }: { field: FieldProps }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }: { field: FieldProps }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special requests or additional information" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Booking'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <VapiAssistant 
            title="Booking Assistant"
            description="Need help creating a new booking? Talk to our AI assistant."
            assistantOverrides={{
              variableValues: {
                context: "creating a new booking",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 