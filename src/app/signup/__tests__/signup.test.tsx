import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '../page';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Mock the necessary dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
    })),
  })),
}));

describe('SignupPage', () => {
  const mockPush = jest.fn();
  const mockToast = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
  });
  
  it('renders the signup form correctly', () => {
    render(<SignupPage />);
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Bio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
  });
  
  it('shows error when passwords do not match', async () => {
    render(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password456' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
    });
  });
}); 