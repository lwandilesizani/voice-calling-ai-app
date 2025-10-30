import React, { useState } from 'react';
import { VapiProvider } from '../components/VapiProvider';
import VapiConversation from '../components/VapiConversation';
import '../styles/vapi.css';
import '../styles/booking.css';

interface BookingFormData {
  name: string;
  email: string;
  date: string;
  time: string;
  service: string;
}

const BookingPage: React.FC = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    email: '',
    date: '',
    time: '',
    service: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    alert('Booking submitted successfully!');
  };

  return (
    <VapiProvider>
      <div className="booking-page">
        <div className="booking-container">
          <h1 className="booking-title">Book Your Appointment</h1>
          
          <div className="booking-content">
            <div className="booking-form-container">
              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="service">Service</label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a service</option>
                    <option value="haircut">Haircut</option>
                    <option value="coloring">Hair Coloring</option>
                    <option value="styling">Hair Styling</option>
                    <option value="treatment">Hair Treatment</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <button type="submit" className="booking-submit-btn">
                  Book Appointment
                </button>
              </form>
            </div>
            
            <div className="booking-assistant">
              <div className="assistant-container">
                <h2 className="assistant-title">Need Help?</h2>
                <p className="assistant-description">
                  Talk to our AI assistant to get help with booking your appointment.
                </p>
                
                <VapiConversation 
                  assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}
                  assistantOverrides={{
                    variableValues: {
                      name: formData.name || 'there',
                    },
                  }}
                  showTranscript={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </VapiProvider>
  );
};

export default BookingPage; 