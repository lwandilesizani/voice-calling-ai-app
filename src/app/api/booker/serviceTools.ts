import { DynamicTool } from "@langchain/core/tools";
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

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

// Create service tools
export const createServiceTools = (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required to create tools');
  }

  // Get services tool
  const getServicesTool = new DynamicTool({
    name: "get_services",
    description: "Retrieve all services offered by the business with their details including name, price, duration, and category.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON for optional filters
        let filters: {
          category?: string;
          search?: string;
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
          .from('services')
          .select('*')
          .eq('business_id', businessId);
        
        // Apply filters if provided
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        
        // Execute the query
        const { data: services, error: queryError } = await query;
        
        if (queryError) {
          return `Error retrieving services: ${queryError.message}`;
        }
        
        if (!services || services.length === 0) {
          return "No services found matching the criteria.";
        }
        
        return JSON.stringify(services, null, 2);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Get single service tool
  const getServiceTool = new DynamicTool({
    name: "get_service",
    description: "Retrieve a single service by ID with complete details including availability and payment methods.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input to get the service ID
        const serviceId = input.trim();
        
        if (!serviceId) {
          return "Error: Service ID is required";
        }
        
        // Get the service
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .eq('business_id', businessId)
          .single();
        
        if (serviceError) {
          return `Error retrieving service: ${serviceError.message}`;
        }
        
        if (!service) {
          return "No service found with that ID or you don't have permission to access it.";
        }
        
        // Get service availability
        const { data: availability, error: availabilityError } = await supabase
          .from('service_availability')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            break_between,
            max_concurrent,
            service_break_times (
              id,
              start_time,
              end_time
            )
          `)
          .eq('service_id', serviceId);
        
        // Get payment methods
        const { data: paymentMethods, error: paymentError } = await supabase
          .from('service_payment_methods')
          .select('*')
          .eq('service_id', serviceId);
        
        // Combine all data
        const fullServiceData = {
          ...service,
          availability: availability || [],
          payment_methods: paymentMethods || []
        };
        
        return JSON.stringify(fullServiceData, null, 2);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Create service tool
  const createServiceTool = new DynamicTool({
    name: "create_service",
    description: "Create a new service with name, price, duration, and optional category and description.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        const serviceData = JSON.parse(input);
        
        // Validate required fields
        const requiredFields = ['name', 'price', 'duration'];
        for (const field of requiredFields) {
          if (!serviceData[field]) {
            return `Error: Missing required field '${field}'`;
          }
        }
        
        // Create the service
        const { data: service, error } = await supabase
          .from('services')
          .insert({
            business_id: businessId,
            name: serviceData.name,
            price: serviceData.price,
            duration: serviceData.duration,
            description: serviceData.description || null,
            category: serviceData.category || null,
            custom_duration: serviceData.custom_duration || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          return `Error creating service: ${error.message}`;
        }
        
        return `Service created successfully with ID: ${service.id}`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Update service tool
  const updateServiceTool = new DynamicTool({
    name: "update_service",
    description: "Update an existing service. Provide service ID and fields to update (name, price, duration, description, category).",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        const updateData = JSON.parse(input);
        
        if (!updateData.id) {
          return "Error: Service ID is required";
        }
        
        // Check if the service exists and belongs to this business
        const { data: existingService, error: checkError } = await supabase
          .from('services')
          .select('id')
          .eq('id', updateData.id)
          .eq('business_id', businessId)
          .single();
        
        if (checkError || !existingService) {
          return "Error: Service not found or you don't have permission to update it";
        }
        
        // Prepare update data (remove id from the update payload)
        const { id, ...dataToUpdate } = updateData;
        
        // Add updated_at timestamp
        dataToUpdate.updated_at = new Date().toISOString();
        
        // Update the service
        const { data: service, error } = await supabase
          .from('services')
          .update(dataToUpdate)
          .eq('id', id)
          .eq('business_id', businessId)
          .select()
          .single();
        
        if (error) {
          return `Error updating service: ${error.message}`;
        }
        
        return `Service updated successfully: ${JSON.stringify(service, null, 2)}`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Delete service tool
  const deleteServiceTool = new DynamicTool({
    name: "delete_service",
    description: "Delete a service by ID. This will also delete related availability, break times, and payment methods.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input to get the service ID
        const serviceId = input.trim();
        
        if (!serviceId) {
          return "Error: Service ID is required";
        }
        
        // Check if the service exists and belongs to this business
        const { data: existingService, error: checkError } = await supabase
          .from('services')
          .select('id, name')
          .eq('id', serviceId)
          .eq('business_id', businessId)
          .single();
        
        if (checkError || !existingService) {
          return "Error: Service not found or you don't have permission to delete it";
        }
        
        // Check if there are any bookings for this service
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select('id')
          .eq('service_id', serviceId)
          .limit(1);
        
        if (bookings && bookings.length > 0) {
          return "Error: Cannot delete service because there are bookings associated with it. Cancel or reassign these bookings first.";
        }
        
        // Delete the service
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId)
          .eq('business_id', businessId);
        
        if (error) {
          return `Error deleting service: ${error.message}`;
        }
        
        return `Service '${existingService.name}' deleted successfully`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Create service availability tool
  const createServiceAvailabilityTool = new DynamicTool({
    name: "create_service_availability",
    description: "Create availability for a service on a specific day of the week with start and end times.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        const availabilityData = JSON.parse(input);
        
        // Validate required fields
        const requiredFields = ['service_id', 'day_of_week', 'start_time', 'end_time', 'break_between', 'max_concurrent'];
        for (const field of requiredFields) {
          if (!availabilityData[field]) {
            return `Error: Missing required field '${field}'`;
          }
        }
        
        // Check if the service exists and belongs to this business
        const { data: existingService, error: checkError } = await supabase
          .from('services')
          .select('id')
          .eq('id', availabilityData.service_id)
          .eq('business_id', businessId)
          .single();
        
        if (checkError || !existingService) {
          return "Error: Service not found or you don't have permission to update it";
        }
        
        // Check if availability already exists for this day
        const { data: existingAvailability, error: availabilityCheckError } = await supabase
          .from('service_availability')
          .select('id')
          .eq('service_id', availabilityData.service_id)
          .eq('day_of_week', availabilityData.day_of_week);
        
        if (existingAvailability && existingAvailability.length > 0) {
          return `Error: Availability already exists for ${availabilityData.day_of_week}. Use update_service_availability instead.`;
        }
        
        // Create the availability
        const { data: availability, error } = await supabase
          .from('service_availability')
          .insert({
            service_id: availabilityData.service_id,
            day_of_week: availabilityData.day_of_week,
            start_time: availabilityData.start_time,
            end_time: availabilityData.end_time,
            break_between: availabilityData.break_between,
            max_concurrent: availabilityData.max_concurrent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          return `Error creating service availability: ${error.message}`;
        }
        
        // If break times are provided, create them
        if (availabilityData.break_times && Array.isArray(availabilityData.break_times) && availabilityData.break_times.length > 0) {
          const breakTimesData = availabilityData.break_times.map((breakTime: any) => ({
            service_availability_id: availability.id,
            start_time: breakTime.start_time,
            end_time: breakTime.end_time,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          const { error: breakTimesError } = await supabase
            .from('service_break_times')
            .insert(breakTimesData);
          
          if (breakTimesError) {
            return `Service availability created, but error adding break times: ${breakTimesError.message}`;
          }
        }
        
        return `Service availability created successfully for ${availabilityData.day_of_week} with ID: ${availability.id}`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Update service availability tool
  const updateServiceAvailabilityTool = new DynamicTool({
    name: "update_service_availability",
    description: "Update existing availability for a service. Provide availability ID and fields to update.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        const updateData = JSON.parse(input);
        
        if (!updateData.id) {
          return "Error: Availability ID is required";
        }
        
        // Check if the availability exists and belongs to a service owned by this business
        const { data: existingAvailability, error: checkError } = await supabase
          .from('service_availability')
          .select(`
            id,
            service_id,
            services!inner (
              business_id
            )
          `)
          .eq('id', updateData.id)
          .single();
        
        if (checkError || !existingAvailability) {
          return "Error: Availability not found";
        }
        
        // Access business_id from the services object
        const serviceBusiness = existingAvailability.services as any;
        if (serviceBusiness.business_id !== businessId) {
          return "Error: You don't have permission to update this availability";
        }
        
        // Prepare update data (remove id and break_times from the update payload)
        const { id, break_times, ...dataToUpdate } = updateData;
        
        // Add updated_at timestamp
        dataToUpdate.updated_at = new Date().toISOString();
        
        // Update the availability
        const { data: availability, error } = await supabase
          .from('service_availability')
          .update(dataToUpdate)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          return `Error updating service availability: ${error.message}`;
        }
        
        // If break times are provided, update them
        if (break_times && Array.isArray(break_times)) {
          // First delete existing break times
          await supabase
            .from('service_break_times')
            .delete()
            .eq('service_availability_id', id);
          
          // Then insert new ones if any are provided
          if (break_times.length > 0) {
            const breakTimesData = break_times.map((breakTime: any) => ({
              service_availability_id: id,
              start_time: breakTime.start_time,
              end_time: breakTime.end_time,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            
            const { error: breakTimesError } = await supabase
              .from('service_break_times')
              .insert(breakTimesData);
            
            if (breakTimesError) {
              return `Service availability updated, but error updating break times: ${breakTimesError.message}`;
            }
          }
        }
        
        return `Service availability updated successfully: ${JSON.stringify(availability, null, 2)}`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Delete service availability tool
  const deleteServiceAvailabilityTool = new DynamicTool({
    name: "delete_service_availability",
    description: "Delete availability for a service by ID. This will also delete related break times.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input to get the availability ID
        const availabilityId = input.trim();
        
        if (!availabilityId) {
          return "Error: Availability ID is required";
        }
        
        // Check if the availability exists and belongs to a service owned by this business
        const { data: existingAvailability, error: checkError } = await supabase
          .from('service_availability')
          .select(`
            id,
            day_of_week,
            service_id,
            services!inner (
              business_id
            )
          `)
          .eq('id', availabilityId)
          .single();
        
        if (checkError || !existingAvailability) {
          return "Error: Availability not found";
        }
        
        // Access business_id from the services object
        const serviceBusiness = existingAvailability.services as any;
        if (serviceBusiness.business_id !== businessId) {
          return "Error: You don't have permission to delete this availability";
        }
        
        // Delete the availability (break times will be deleted by cascade)
        const { error } = await supabase
          .from('service_availability')
          .delete()
          .eq('id', availabilityId);
        
        if (error) {
          return `Error deleting service availability: ${error.message}`;
        }
        
        return `Service availability for ${existingAvailability.day_of_week} deleted successfully`;
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Get available time slots tool
  const getAvailableTimeSlotsTool = new DynamicTool({
    name: "get_available_time_slots",
    description: "Get available time slots for a service on a specific date, considering existing bookings and availability.",
    func: async (input: string) => {
      try {
        const businessId = await getBusinessIdForUser(userId);
        
        // Parse the input JSON
        const requestData = JSON.parse(input);
        
        // Validate required fields
        if (!requestData.service_id) {
          return "Error: Service ID is required";
        }
        
        if (!requestData.date) {
          return "Error: Date is required (format: YYYY-MM-DD)";
        }
        
        // Check if the service exists and belongs to this business
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('id, duration')
          .eq('id', requestData.service_id)
          .eq('business_id', businessId)
          .single();
        
        if (serviceError || !service) {
          return "Error: Service not found or you don't have permission to access it";
        }
        
        // Get the day of week for the requested date
        const date = new Date(requestData.date);
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
        
        // Get service availability for this day
        const { data: availability, error: availabilityError } = await supabase
          .from('service_availability')
          .select(`
            id,
            start_time,
            end_time,
            break_between,
            max_concurrent,
            service_break_times (
              start_time,
              end_time
            )
          `)
          .eq('service_id', requestData.service_id)
          .eq('day_of_week', dayOfWeek)
          .single();
        
        if (availabilityError || !availability) {
          return `No availability found for ${dayOfWeek}`;
        }
        
        // Get existing bookings for this service on this date
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('booking_time, status')
          .eq('service_id', requestData.service_id)
          .eq('booking_date', requestData.date)
          .in('status', ['pending', 'confirmed']);
        
        // Generate time slots
        const serviceDuration = service.duration;
        const breakBetween = availability.break_between;
        const totalSlotDuration = serviceDuration + breakBetween;
        
        // Parse start and end times
        const [startHour, startMinute] = availability.start_time.split(':').map(Number);
        const [endHour, endMinute] = availability.end_time.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        // Generate all possible time slots
        const timeSlots = [];
        for (let time = startMinutes; time + serviceDuration <= endMinutes; time += totalSlotDuration) {
          const slotHour = Math.floor(time / 60);
          const slotMinute = time % 60;
          const timeString = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
          
          // Check if this slot overlaps with any break times
          let isInBreak = false;
          for (const breakTime of availability.service_break_times || []) {
            const [breakStartHour, breakStartMinute] = breakTime.start_time.split(':').map(Number);
            const [breakEndHour, breakEndMinute] = breakTime.end_time.split(':').map(Number);
            
            const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
            const breakEndMinutes = breakEndHour * 60 + breakEndMinute;
            
            // Check if slot overlaps with break
            if (time < breakEndMinutes && time + serviceDuration > breakStartMinutes) {
              isInBreak = true;
              break;
            }
          }
          
          if (!isInBreak) {
            // Check if this slot is already booked
            let bookedCount = 0;
            for (const booking of bookings || []) {
              const [bookingHour, bookingMinute] = booking.booking_time.split(':').map(Number);
              const bookingMinutes = bookingHour * 60 + bookingMinute;
              
              // Check if booking overlaps with this slot
              if (time < bookingMinutes + serviceDuration && time + serviceDuration > bookingMinutes) {
                bookedCount++;
              }
            }
            
            // Add slot if not fully booked
            if (bookedCount < availability.max_concurrent) {
              timeSlots.push({
                time: timeString,
                available: availability.max_concurrent - bookedCount
              });
            }
          }
        }
        
        if (timeSlots.length === 0) {
          return "No available time slots found for this date";
        }
        
        return JSON.stringify(timeSlots, null, 2);
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  });
  
  // Return the tools array
  return [
    getServicesTool,
    getServiceTool,
    createServiceTool,
    updateServiceTool,
    deleteServiceTool,
    createServiceAvailabilityTool,
    updateServiceAvailabilityTool,
    deleteServiceAvailabilityTool,
    getAvailableTimeSlotsTool
  ];
}; 