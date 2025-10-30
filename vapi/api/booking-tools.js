const { createClient } = require('@supabase/supabase-js');
const z = require('zod');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Schema definitions using Zod
const BookBusinessServiceSchema = z.object({
  service_id: z.string().uuid(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(1),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional()
});

// Function to get the current business ID from the authenticated user
async function getCurrentBusinessId(req) {
  // First, check if we have a business ID in the request context
  // This would be set by the Vapi integration when handling phone calls
  if (req.context && req.context.businessId) {
    console.log('Using business ID from context:', req.context.businessId);
    return req.context.businessId;
  }
  
  // If there's an authorization header, we could extract a token and verify it
  // This is used when accessing through the UI
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // This is a simplified example - in a real app, you would verify the token
    // and extract the user ID, then look up their business profile
    
    // For now, we'll just log that we're using the auth header
    console.log('Using authorization header for business identification');
    
    try {
      // Extract token from Bearer format
      const token = authHeader.replace('Bearer ', '');
      
      // Verify the token and get the user ID
      // This is a placeholder - in a real app, you would use a JWT library
      // to verify the token and extract the user ID
      
      // For demo purposes, we'll query the first business in the database
      const { data, error } = await supabase
        .from('business_profiles')
        .select('id')
        .limit(1)
        .single();
        
      if (error) {
        throw new Error(`Failed to get business: ${error.message}`);
      }
      
      return data.id;
    } catch (error) {
      console.error('Error authenticating with token:', error);
      throw new Error('Authentication failed');
    }
  }
  
  // If we don't have a business ID in the context or an auth header,
  // we can't identify the business
  throw new Error('No business identification provided');
}

// Handler for book_business_service
async function bookBusinessService(req, res) {
  try {
    // Validate the request body
    const validatedData = BookBusinessServiceSchema.parse(req.body);
    
    // Get the current business ID
    const businessId = await getCurrentBusinessId(req);
    
    // Verify that the service belongs to the business
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration')
      .eq('id', validatedData.service_id)
      .eq('business_id', businessId)
      .single();
      
    if (serviceError || !serviceData) {
      return res.status(404).json({ 
        error: 'Service not found or does not belong to this business' 
      });
    }
    
    // Create the booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        business_id: businessId,
        service_id: validatedData.service_id,
        customer_name: validatedData.customer_name,
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        booking_date: validatedData.booking_date,
        booking_time: validatedData.booking_time,
        notes: validatedData.notes || null,
        status: 'confirmed', // Default status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (bookingError) {
      return res.status(500).json({ 
        error: `Failed to create booking: ${bookingError.message}` 
      });
    }
    
    // Return the booking data with service information
    return res.status(200).json({
      booking: {
        ...bookingData,
        service_name: serviceData.name,
        service_duration: serviceData.duration
      },
      message: `Booking confirmed for ${validatedData.customer_name} on ${validatedData.booking_date} at ${validatedData.booking_time}`
    });
    
  } catch (error) {
    console.error('Error in bookBusinessService:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
}

// Handler for list_business_services
async function listBusinessServices(req, res) {
  try {
    // Get the current business ID
    const businessId = await getCurrentBusinessId(req);
    
    // Get all services for the business
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('name');
      
    if (error) {
      return res.status(500).json({ 
        error: `Failed to fetch services: ${error.message}` 
      });
    }
    
    return res.status(200).json({ services });
    
  } catch (error) {
    console.error('Error in listBusinessServices:', error);
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
}

// Handler for get_business_info
async function getBusinessInfo(req, res) {
  try {
    // Get the current business ID
    const businessId = await getCurrentBusinessId(req);
    
    // Get the business profile with more comprehensive information
    const { data: business, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', businessId)
      .single();
      
    if (error) {
      return res.status(500).json({ 
        error: `Failed to fetch business info: ${error.message}` 
      });
    }
    
    // Get business operating hours (if available)
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .eq('business_id', businessId);
      
    // Get a sample of service availability to determine business hours
    let businessHours = [];
    if (services && services.length > 0) {
      const { data: availability, error: availabilityError } = await supabase
        .from('service_availability')
        .select('day_of_week, start_time, end_time')
        .eq('service_id', services[0].id)
        .order('day_of_week');
        
      if (!availabilityError && availability) {
        businessHours = availability;
      }
    }
    
    // Return the enhanced business information
    return res.status(200).json({ 
      business: {
        ...business,
        services_count: services ? services.length : 0,
        business_hours: businessHours
      } 
    });
    
  } catch (error) {
    console.error('Error in getBusinessInfo:', error);
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
}

module.exports = {
  bookBusinessService,
  listBusinessServices,
  getBusinessInfo,
  // Export schemas for use in other files
  schemas: {
    BookBusinessServiceSchema
  }
}; 