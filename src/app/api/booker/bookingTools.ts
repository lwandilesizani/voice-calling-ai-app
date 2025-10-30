import { DynamicTool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import { sendBookingConfirmationEmails, sendNewBookingNotifications } from '@/lib/email/booking-notifications';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

// Create Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get business ID for a user
const getBusinessIdForUser = async (userId: string) => {
  const { data: businessProfiles, error } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    throw new Error(`Failed to get business profile: ${error.message}`);
  }
  
  if (!businessProfiles) {
    throw new Error('No business profile found for this user');
  }
  
  return businessProfiles.id;
};

// Create booking tools
export const createBookingTools = (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required to create tools');
  }

  // Create booking tool
  const createBookingTool = new DynamicTool({
    name: "create_booking",
    description: "Create a new booking for a service. Requires customer details, booking time, and can include notes with additional information or special requests.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        const bookingData = JSON.parse(input);
        
        // Validate required fields
        const requiredFields = ['service_id', 'customer_name', 'customer_email', 'customer_phone', 'booking_date', 'booking_time'];
        for (const field of requiredFields) {
          if (!bookingData[field]) {
            return `Error: Missing required field '${field}'`;
          }
        }
        
        // Create the booking
        const { data: booking, error } = await supabase
          .from('bookings')
          .insert({
            business_id: businessId,
            service_id: bookingData.service_id,
            customer_name: bookingData.customer_name,
            customer_email: bookingData.customer_email,
            customer_phone: bookingData.customer_phone,
            booking_date: bookingData.booking_date,
            booking_time: bookingData.booking_time,
            notes: bookingData.notes || null,
            status: bookingData.status || 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_confirmed: false
          })
          .select()
          .single();
        
        if (error) {
          return `Error creating booking: ${error.message}`;
        }
        
        // Send new booking notification emails
        try {
          await sendNewBookingNotifications(booking.id);
        } catch (emailError) {
          console.error("Error sending notification emails:", emailError);
          // Continue even if email fails
        }
        
        return `Booking created successfully with ID: ${booking.id}`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Get bookings tool
  const getBookingsTool = new DynamicTool({
    name: "get_bookings",
    description: "Retrieve bookings. Can filter by date range, status, or search by customer name/email. Results include all booking details including notes.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        let filters: {
          status?: string;
          start_date?: string;
          end_date?: string;
          customer_search?: string;
        } = {};
        
        if (input && input.trim() !== '') {
          try {
            filters = JSON.parse(input);
          } catch (parseError) {
            return `Error parsing input: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`;
          }
        }
        
        // Start building the query
        let query = supabase
          .from('bookings')
          .select(`
            id,
            service_id,
            customer_name,
            customer_email,
            customer_phone,
            booking_date,
            booking_time,
            notes,
            status,
            created_at,
            services!inner (
              id,
              name,
              price,
              duration,
              category
            )
          `)
          .eq('business_id', businessId);
        
        // Apply filters if provided
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.start_date) {
          query = query.gte('booking_date', filters.start_date);
        }
        
        if (filters.end_date) {
          query = query.lte('booking_date', filters.end_date);
        }
        
        if (filters.customer_search) {
          query = query.or(`customer_name.ilike.%${filters.customer_search}%,customer_email.ilike.%${filters.customer_search}%`);
        }
        
        // Execute the query
        const { data: bookings, error: queryError } = await query;
        
        if (queryError) {
          return `Error retrieving bookings: ${queryError.message}`;
        }
        
        if (!bookings || bookings.length === 0) {
          return "No bookings found matching the criteria.";
        }
        
        // Transform the data to include service information properly
        const transformedBookings = bookings.map((booking: any) => ({
          ...booking,
          service: booking.services
        }));
        
        return JSON.stringify(transformedBookings, null, 2);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Get single booking tool
  const getBookingTool = new DynamicTool({
    name: "get_booking",
    description: "Retrieve a single booking by ID. Returns complete booking information including customer details, service information, and any notes or special requests.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input to get the booking ID
        const bookingId = input.trim();
        
        if (!bookingId) {
          return "Error: Booking ID is required";
        }
        
        // Get the booking
        const { data: booking, error } = await supabase
          .from('bookings')
          .select(`
            id,
            service_id,
            customer_name,
            customer_email,
            customer_phone,
            booking_date,
            booking_time,
            notes,
            status,
            created_at,
            services!inner (
              id,
              name,
              price,
              duration,
              category
            )
          `)
          .eq('id', bookingId)
          .eq('business_id', businessId)
          .single();
        
        if (error) {
          return `Error retrieving booking: ${error.message}`;
        }
        
        if (!booking) {
          return "No booking found with that ID or you don't have permission to access it.";
        }
        
        // Transform the data to include service information properly
        const transformedBooking = {
          ...booking,
          service: booking.services
        };
        
        return JSON.stringify(transformedBooking, null, 2);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Update booking tool
  const updateBookingTool = new DynamicTool({
    name: "update_booking",
    description: "Update an existing booking. Provide booking ID and fields to update (such as date, time, status, or notes for special requests).",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        const updateData = JSON.parse(input);
        
        if (!updateData.id) {
          return "Error: Booking ID is required";
        }
        
        // Check if the booking exists and belongs to this business
        const { data: existingBooking, error: checkError } = await supabase
          .from('bookings')
          .select('id')
          .eq('id', updateData.id)
          .eq('business_id', businessId)
          .single();
        
        if (checkError || !existingBooking) {
          return "Error: Booking not found or you don't have permission to update it";
        }
        
        // Prepare update data (remove id from the update payload)
        const { id, ...dataToUpdate } = updateData;
        
        // Add updated_at timestamp
        dataToUpdate.updated_at = new Date().toISOString();
        
        // Update the booking
        const { data: booking, error } = await supabase
          .from('bookings')
          .update({
            ...dataToUpdate,
            email_confirmed: false // Reset email confirmation status when booking is updated
          })
          .eq('id', id)
          .eq('business_id', businessId)
          .select()
          .single();
        
        if (error) {
          return `Error updating booking: ${error.message}`;
        }
        
        // Send email notification if status changed to confirmed or cancelled
        if (updateData.status === 'confirmed' || updateData.status === 'cancelled') {
          try {
            await sendBookingConfirmationEmails(id);
          } catch (emailError: any) {
            console.error("Error sending email:", emailError);
            // Continue even if email fails
          }
        }
        
        return `Booking updated successfully: ${JSON.stringify(booking, null, 2)}`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Delete booking tool
  const deleteBookingTool = new DynamicTool({
    name: "delete_booking",
    description: "Delete a booking by ID.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input to get the booking ID
        const bookingId = input.trim();
        
        if (!bookingId) {
          return "Error: Booking ID is required";
        }
        
        // Check if the booking exists and belongs to this business
        const { data: existingBooking, error: checkError } = await supabase
          .from('bookings')
          .select('id, customer_email, customer_name')
          .eq('id', bookingId)
          .eq('business_id', businessId)
          .single();
        
        if (checkError || !existingBooking) {
          return "Error: Booking not found or you don't have permission to delete it";
        }
        
        // Delete the booking
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId)
          .eq('business_id', businessId);
        
        if (error) {
          return `Error deleting booking: ${error.message}`;
        }
        
        // Send cancellation email
        try {
          const { data: business } = await supabase
            .from('business_profiles')
            .select('business_name, email')
            .eq('id', businessId)
            .single();
          
          // Send email to customer
          if (existingBooking?.customer_email) {
            await resend.emails.send({
              from: `${business?.business_name || 'Booking System'} <onboarding@resend.dev>`,
              to: [existingBooking.customer_email],
              subject: `Booking Cancelled - ${business?.business_name || 'Your Service Provider'}`,
              html: `
                <h1>Booking Cancelled</h1>
                <p>Dear ${existingBooking?.customer_name || 'Customer'},</p>
                <p>Your booking with ${business?.business_name || 'your service provider'} has been cancelled.</p>
                <p>If you would like to reschedule, please make a new booking.</p>
                <p>If you have any questions, please contact us at ${business?.email || 'our support team'}.</p>
              `
            });
          }
        } catch (emailError: any) {
          console.error("Error sending email:", emailError);
          // Continue even if email fails
        }
        
        return "Booking deleted successfully";
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Get services tool
  const getServicesTool = new DynamicTool({
    name: "get_services",
    description: "Retrieve services offered by the business.",
    func: async () => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Get the services
        const { data: services, error } = await supabase
          .from('services')
          .select('*')
          .eq('business_id', businessId);
        
        if (error) {
          return `Error retrieving services: ${error.message}`;
        }
        
        if (!services || services.length === 0) {
          return "No services found for this business.";
        }
        
        return JSON.stringify(services, null, 2);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Return the tools array
  return [
    createBookingTool,
    getBookingsTool,
    getBookingTool,
    updateBookingTool,
    deleteBookingTool,
    getServicesTool
  ];
};