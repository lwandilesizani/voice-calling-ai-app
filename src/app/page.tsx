"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Phone, Bot, Calendar, Sparkles, Building, Menu, X, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Modern Navbar */}
      <header className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-background/95 backdrop-blur-md border-b shadow-md" : "bg-background/70 backdrop-blur-sm"
      )}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 md:h-20 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">We Call Smart</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-base font-medium text-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-base font-medium text-foreground hover:text-primary transition-colors">
                How It Works
              </Link>
            </nav>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" className="font-medium text-base px-6 py-5 border-2 hover:bg-accent">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button className="font-medium text-base px-6 py-5 shadow-md hover:shadow-lg">Sign up</Button>
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-md hover:bg-accent" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link 
                href="#features" 
                className="flex items-center justify-between py-3 border-b last:border-0"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="font-medium text-base">Features</span>
                <ChevronRight className="h-5 w-5 text-primary" />
              </Link>
              <Link 
                href="#how-it-works" 
                className="flex items-center justify-between py-3 border-b last:border-0"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="font-medium text-base">How It Works</span>
                <ChevronRight className="h-5 w-5 text-primary" />
              </Link>

              <div className="flex flex-col gap-3 mt-4">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full py-5 text-base font-medium border-2 hover:bg-accent">Log in</Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full py-5 text-base font-medium shadow-md hover:shadow-lg">Sign up</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with Modern Design */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                New AI-Powered Platform
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Revolutionize Your <span className="text-primary">Business Communication</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground">
                We Call Smart helps businesses automate phone calls, schedule appointments, and provide 24/7 customer service with advanced AI technology.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 group">
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>

              </div>
              

            </div>
            
            <div className="relative">
              {/* Decorative corner accents */}
              <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-xl z-20"></div>
              <div className="absolute -top-4 -right-4 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-xl z-20"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-xl z-20"></div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-xl z-20"></div>
              
              {/* Animated rotating border effects with multiple layers */}
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-primary via-primary-foreground/50 to-primary animate-spin-slow opacity-70 blur-md"></div>
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary-foreground/50 via-primary to-primary-foreground/50 animate-reverse-spin-slow opacity-60 blur-md"></div>
              <div className="absolute -inset-5 rounded-2xl bg-gradient-to-tr from-primary/40 via-transparent to-primary-foreground/40 animate-spin-slower opacity-50 blur-md"></div>
              
              {/* Pulsing glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-primary/30 to-primary-foreground/30 rounded-full blur-xl opacity-40 animate-pulse-slow"></div>
              
              {/* Shimmering particles */}
              <div className="absolute inset-0 -m-10 overflow-hidden">
                <div className="w-full h-full relative">
                  {/* Orbiting dots */}
                  {[...Array(16)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-2 h-2 rounded-full bg-primary/80 animate-orbit"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        transform: `rotate(${i * 22.5}deg) translateX(${Math.floor(Math.random() * 40) + 180}px)`
                      }}
                    />
                  ))}
                  
                  {/* Floating sparkles */}
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={`sparkle-${i}`} 
                      className="absolute w-1 h-1 bg-white animate-float"
                      style={{
                        top: `${Math.floor(Math.random() * 100)}%`,
                        left: `${Math.floor(Math.random() * 100)}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        opacity: Math.random() * 0.7 + 0.3
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Main image container with enhanced glass effect */}
              <div className="relative bg-background/70 backdrop-blur-md rounded-xl border-2 border-primary/30 shadow-[0_0_15px_rgba(0,0,0,0.2),0_0_25px_rgba(var(--primary),0.15)] overflow-hidden aspect-[4/3] z-10 group">
                {/* Inner border glow */}
                <div className="absolute inset-0 rounded-lg border-2 border-primary/10 m-2 opacity-70 z-10"></div>
                
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/90 to-primary-foreground/5 flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {/* Image with enhanced effects */}
                    <Image 
                      src="/ChatGPT Image May 18, 2025, 11_50_57 PM.png" 
                      alt="We Call Smart Communication" 
                      width={400} 
                      height={300}
                      className="object-cover rounded-lg shadow-lg transform transition-all duration-700 group-hover:scale-105 z-20 group-hover:shadow-primary/20 group-hover:shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How We Call Smart Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Our AI-powered platform streamlines your business communications in just a few simple steps
            </p>
          </div>
          
          {/* Step-by-step process */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 via-primary to-primary/30 hidden md:block"></div>
            
            <div className="space-y-12 md:space-y-24 relative">
              {/* Step 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:text-right order-2 md:order-1">
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 w-12 h-12 mb-4">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Set Up Your Business Profile</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your account and set up your business profile with services, pricing, and availability. Our intuitive dashboard makes it easy to manage your business information in one place.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Create your business profile</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Add your services and pricing</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Set your business hours and availability</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                  </ul>
                </div>
                <div className="relative order-1 md:order-2">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-foreground/20 rounded-lg blur-md opacity-70"></div>
                  <div className="relative bg-background rounded-lg border shadow-lg p-6 overflow-hidden">
                    <Image 
                      src="/Business Profile.png" 
                      alt="Business Profile Setup" 
                      width={500} 
                      height={300}
                      className="w-full h-auto rounded-md object-cover shadow-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-foreground/20 to-primary/20 rounded-lg blur-md opacity-70"></div>
                  <div className="relative bg-background rounded-lg border shadow-lg p-6 overflow-hidden">
                    <Image 
                      src="/AI Assistant.png" 
                      alt="AI Assistant Configuration" 
                      width={500} 
                      height={300}
                      className="w-full h-auto rounded-md object-cover shadow-md"
                    />
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 w-12 h-12 mb-4">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Configure Your AI Assistant</h3>
                  <p className="text-muted-foreground mb-6">
                    Customize your AI assistant's personality, voice, and responses to match your brand. Our intuitive interface makes it easy to create the perfect virtual representative for your business.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Choose your assistant's voice and personality</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Customize greeting messages and responses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Train your assistant with business-specific information</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:text-right order-2 md:order-1">
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 w-12 h-12 mb-4">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Get Your Virtual Phone Number</h3>
                  <p className="text-muted-foreground mb-6">
                    Select a dedicated phone number for your business that connects directly to your AI assistant. Your customers can call this number anytime, and your AI assistant will handle the conversation.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Choose a local or toll-free number</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Link it to your AI assistant</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Start receiving calls immediately</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                  </ul>
                </div>
                <div className="relative order-1 md:order-2">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-foreground/20 rounded-lg blur-md opacity-70"></div>
                  <div className="relative bg-background rounded-lg border shadow-lg p-6 overflow-hidden">
                    <Image 
                      src="/Phone number.png" 
                      alt="Virtual Phone Number Setup" 
                      width={500} 
                      height={300}
                      className="w-full h-auto rounded-md object-cover shadow-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-foreground/20 to-primary/20 rounded-lg blur-md opacity-70"></div>
                  <div className="relative bg-background rounded-lg border shadow-lg p-6 overflow-hidden">
                    <Image 
                      src="/Booking.png" 
                      alt="Booking and Appointment Management" 
                      width={500} 
                      height={300}
                      className="w-full h-auto rounded-md object-cover shadow-md"
                    />
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 w-12 h-12 mb-4">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Manage Bookings and Appointments</h3>
                  <p className="text-muted-foreground mb-6">
                    Your AI assistant handles appointment scheduling and automatically adds bookings to your calendar. You'll receive notifications for new appointments, and customers get confirmation emails.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Automated appointment scheduling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Calendar integration and management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Automated reminders and follow-ups</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Step 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:text-right order-2 md:order-1">
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 w-12 h-12 mb-4">
                    <span className="text-primary font-bold">5</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Monitor and Optimize</h3>
                  <p className="text-muted-foreground mb-6">
                    Track your AI assistant's performance through our comprehensive analytics dashboard. Review call transcripts, monitor booking rates, and continuously improve your customer experience.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Review call transcripts and summaries</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Track conversion metrics and performance</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 md:flex-row-reverse">
                      <span>Optimize your assistant based on data</span>
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    </li>
                  </ul>
                </div>
                <div className="relative order-1 md:order-2">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-foreground/20 rounded-lg blur-md opacity-70"></div>
                  <div className="relative bg-background rounded-lg border shadow-lg p-6 overflow-hidden">
                    <Image 
                      src="/Analytics.png" 
                      alt="Performance Analytics and Optimization" 
                      width={500} 
                      height={300}
                      className="w-full h-auto rounded-md object-cover shadow-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <Button size="lg" className="px-8 py-6 text-lg" asChild>
              <Link href="/signup">
                Get Started Today
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
              Powerful Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              We Call Smart combines powerful features to transform how your business communicates with customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="relative bg-background rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Automated Phone Calls</h3>
                <p className="text-muted-foreground">Let AI handle your outbound calls, follow-ups, and appointment reminders with natural-sounding conversations.</p>
                <div className="mt-4 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Personalized call scripts</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Call scheduling</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Detailed analytics</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="relative bg-background rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
                <p className="text-muted-foreground">Seamless booking integration with your business calendar to optimize your availability and reduce no-shows.</p>
                <div className="mt-4 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Calendar integration</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Automated reminders</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Online booking portal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="relative bg-background rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
                <p className="text-muted-foreground">Customizable AI assistant that learns your business and handles customer inquiries with human-like understanding.</p>
                <div className="mt-4 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Natural language processing</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>24/7 availability</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Custom knowledge base</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="relative bg-background rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Custom Assistants</h3>
                <p className="text-muted-foreground">Create multiple AI assistants tailored to different aspects of your business for specialized customer interactions.</p>
                <div className="mt-4 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Personality customization</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Role-specific training</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Multi-language support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="relative bg-background rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <Building className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Business Profile</h3>
                <p className="text-muted-foreground">Manage your business information, services, and availability in one centralized dashboard for consistent communication.</p>
                <div className="mt-4 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Service management</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Business hours</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Team management</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className="relative bg-background rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Phone Number Management</h3>
                <p className="text-muted-foreground">Provision and manage dedicated phone numbers for your business with easy setup and configuration.</p>
                <div className="mt-4 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Local numbers</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Call forwarding</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Call recording</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Join thousands of businesses already using We Call Smart to improve customer engagement and save time.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="px-8">Sign Up Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl font-bold mb-6">We Call Smart</h2>
          <p className="text-muted-foreground mb-8">
            Powering the future of business communication with AI
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            © {new Date().getFullYear()} We Call Smart. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-background rounded-lg p-6 shadow-sm border">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
