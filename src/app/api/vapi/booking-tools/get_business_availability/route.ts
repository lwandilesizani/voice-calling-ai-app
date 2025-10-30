import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { extractBusinessContext } from '../middleware';
import { z } from 'zod';

// Schema for availability arguments
const AvailabilitySchema = z.object({
  service_id: z.string(),
  start_date: z.string(),
  timezone: z.string(),
  end_date: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Extract business context using middleware
    let businessId = await extractBusinessContext(request);
    
    // Parse request body
    const body = await request.json();
    const availabilityArgs = AvailabilitySchema.parse(body);
    
    // Create service client
    const supabase = createServiceClient();
    
    // Get service details
    let { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', availabilityArgs.service_id)
      .single();
      
    if (serviceError) {
      console.error('Error fetching service:', serviceError);
      
      // If service not found, try to use demo service
      if (availabilityArgs.service_id.startsWith('demo-')) {
        console.log('Using demo service for availability check');
        
        // Generate demo availability data
        const startDate = new Date(availabilityArgs.start_date);
        const endDate = availabilityArgs.end_date ? new Date(availabilityArgs.end_date) : new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // Default to 7 days if no end date
        
        const availableDates = [];
        const currentDate = new Date(startDate);
        
        // Skip weekends for demo data
        while (currentDate <= endDate) {
          if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip Sunday (0) and Saturday (6)
            const dateStr = currentDate.toISOString().split('T')[0];
            const slots = [];
            
            // Morning slots (9 AM to 12 PM)
            for (let hour = 9; hour < 12; hour++) {
              slots.push({
                time: `${hour.toString().padStart(2, '0')}:00`,
                available: true
              });
            }
            
            // Afternoon slots (1 PM to 5 PM)
            for (let hour = 13; hour < 17; hour++) {
              slots.push({
                time: `${hour.toString().padStart(2, '0')}:00`,
                available: true
              });
            }
            
            availableDates.push({
              date: dateStr,
              slots
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return NextResponse.json({
          service_id: availabilityArgs.service_id,
          service_name: availabilityArgs.service_id.replace('demo-service-', 'Demo Service '),
          start_date: availabilityArgs.start_date,
          end_date: availabilityArgs.end_date || endDate.toISOString().split('T')[0],
          timezone: availabilityArgs.timezone,
          available_dates: availableDates
        });
      }
      
      // If service not found and not a demo service, try to find any service for the business
      if (businessId) {
        const { data: businessServices, error: businessServicesError } = await supabase
          .from('services')
          .select('*')
          .eq('business_id', businessId)
          .limit(1);
          
        if (!businessServicesError && businessServices && businessServices.length > 0) {
          console.log('Using first business service instead:', businessServices[0].id);
          service = businessServices[0];
        } else {
          // If still no service found, return demo data
          console.log('No services found for business, returning demo data');
          
          // Generate demo availability data
          const startDate = new Date(availabilityArgs.start_date);
          const endDate = availabilityArgs.end_date ? new Date(availabilityArgs.end_date) : new Date(startDate);
          endDate.setDate(endDate.getDate() + 7); // Default to 7 days if no end date
          
          const availableDates = [];
          const currentDate = new Date(startDate);
          
          // Skip weekends for demo data
          while (currentDate <= endDate) {
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip Sunday (0) and Saturday (6)
              const dateStr = currentDate.toISOString().split('T')[0];
              const slots = [];
              
              // Morning slots (9 AM to 12 PM)
              for (let hour = 9; hour < 12; hour++) {
                slots.push({
                  time: `${hour.toString().padStart(2, '0')}:00`,
                  available: true
                });
              }
              
              // Afternoon slots (1 PM to 5 PM)
              for (let hour = 13; hour < 17; hour++) {
                slots.push({
                  time: `${hour.toString().padStart(2, '0')}:00`,
                  available: true
                });
              }
              
              availableDates.push({
                date: dateStr,
                slots
              });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          return NextResponse.json({
            service_id: "demo-service-1",
            service_name: "Demo Service",
            start_date: availabilityArgs.start_date,
            end_date: availabilityArgs.end_date || endDate.toISOString().split('T')[0],
            timezone: availabilityArgs.timezone,
            available_dates: availableDates
          });
        }
      } else {
        return NextResponse.json({ error: `Service not found: ${availabilityArgs.service_id}` }, { status: 404 });
      }
    }
    
    console.log('Service found:', service);
    
    // If we don't have a business ID yet, use the one from the service
    if (!businessId) {
      businessId = service.business_id;
    }
    
    // Get the business profile for timezone information
    const { data: businessData, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, timezone')
      .eq('id', businessId)
      .single();
      
    if (businessError) {
      console.error('Error fetching business:', businessError);
      // Continue with the default timezone from the request
      console.log('Using timezone from request:', availabilityArgs.timezone);
    }
    
    // Use the business timezone if available, otherwise use the one from the request
    const timezone = businessData?.timezone || availabilityArgs.timezone || 'America/New_York';
    
    // Get availability from the database
    const startDate = new Date(availabilityArgs.start_date);
    const endDate = availabilityArgs.end_date ? new Date(availabilityArgs.end_date) : new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // Default to 7 days if no end date
    
    // Get service availability from the database
    const { data: serviceAvailability, error: availabilityError } = await supabase
      .from('service_availability')
      .select('*')
      .eq('service_id', service.id);
      
    if (availabilityError) {
      console.error('Error fetching service availability:', availabilityError);
      
      // If no availability data, generate default availability
      console.log('Generating default availability data');
      
      const availableDates = [];
      const currentDate = new Date(startDate);
      
      // Generate default availability for weekdays
      while (currentDate <= endDate) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Skip Sunday (0) and Saturday (6)
          const dateStr = currentDate.toISOString().split('T')[0];
          const slots = [];
          
          // Morning slots (9 AM to 12 PM)
          for (let hour = 9; hour < 12; hour++) {
            slots.push({
              time: `${hour.toString().padStart(2, '0')}:00`,
              available: true
            });
          }
          
          // Afternoon slots (1 PM to 5 PM)
          for (let hour = 13; hour < 17; hour++) {
            slots.push({
              time: `${hour.toString().padStart(2, '0')}:00`,
              available: true
            });
          }
          
          availableDates.push({
            date: dateStr,
            slots
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return NextResponse.json({
        service_id: service.id,
        service_name: service.name,
        start_date: availabilityArgs.start_date,
        end_date: availabilityArgs.end_date || endDate.toISOString().split('T')[0],
        timezone: timezone,
        available_dates: availableDates
      });
    }
    
    // Get existing bookings for this service in the date range
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('service_id', service.id)
      .gte('booking_date', availabilityArgs.start_date)
      .lte('booking_date', endDate.toISOString().split('T')[0])
      .eq('status', 'confirmed');
      
    if (bookingsError) {
      console.error('Error fetching existing bookings:', bookingsError);
      // Continue without existing bookings data
    }
    
    // Generate availability data based on service and existing bookings
    const availableDates = [];
    const currentDate = new Date(startDate);
    
    // Map day numbers to day names
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dayName = dayMap[dayOfWeek];
      
      // Find availability for this day of week
      const dayAvailability = serviceAvailability?.find(a => a.day_of_week.toLowerCase() === dayName);
      
      if (dayAvailability) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const slots = [];
        
        // Generate slots based on service duration
        const serviceDuration = service.duration || 60; // Default to 60 minutes
        const startHour = parseInt(dayAvailability.start_time.split(':')[0]);
        const startMinute = parseInt(dayAvailability.start_time.split(':')[1]);
        const endHour = parseInt(dayAvailability.end_time.split(':')[0]);
        const endMinute = parseInt(dayAvailability.end_time.split(':')[1]);
        
        // Calculate total minutes for start and end
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        
        // Calculate break between appointments
        const breakBetween = dayAvailability.break_between || 0;
        
        // Generate slots
        for (let minutes = startTotalMinutes; minutes + serviceDuration <= endTotalMinutes; minutes += serviceDuration + breakBetween) {
          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Check if this slot conflicts with existing bookings
          const bookingForSlot = existingBookings?.find(booking => {
            if (booking.booking_date !== dateStr) return false;
            
            const bookingHour = parseInt(booking.booking_time.split(':')[0]);
            const bookingMinute = parseInt(booking.booking_time.split(':')[1]);
            const bookingTotalMinutes = bookingHour * 60 + bookingMinute;
            
            // Check if the slot overlaps with the booking
            return (
              (minutes >= bookingTotalMinutes && minutes < bookingTotalMinutes + service.duration) ||
              (bookingTotalMinutes >= minutes && bookingTotalMinutes < minutes + serviceDuration)
            );
          });
          
          slots.push({
            time: timeStr,
            available: !bookingForSlot
          });
        }
        
        if (slots.length > 0) {
          availableDates.push({
            date: dateStr,
            slots
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('Generated availability for service:', availableDates.length, 'dates');
    
    return NextResponse.json({
      service_id: service.id,
      service_name: service.name,
      start_date: availabilityArgs.start_date,
      end_date: availabilityArgs.end_date || endDate.toISOString().split('T')[0],
      timezone: timezone,
      available_dates: availableDates
    });
    
  } catch (error) {
    console.error('Error in get_business_availability:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid availability request data', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 