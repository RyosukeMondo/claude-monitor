import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderComponent } from '../../../src/components/layout/HeaderComponent';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('HeaderComponent', () => {
  const mockNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <svg data-testid="dashboard-icon"><path d="test" /></svg>,
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: <svg data-testid="projects-icon"><path d="test" /></svg>,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <svg data-testid="settings-icon"><path d="test" /></svg>,
    },
  ];

  const defaultProps = {
    onMenuClick: jest.fn(),
    navigation: mockNavigation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Default successful auth response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          username: 'testuser',
          role: 'admin',
          authenticated: true,
        },
      }),
    });
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('click', jest.fn());
  });

  describe('Rendering', () => {
    it('should render menu button on mobile', () => {
      render(<HeaderComponent {...defaultProps} />);
      
      const menuButton = screen.getByRole('button');
      expect(menuButton).toHaveClass('lg:hidden');
    });

    it('should render page title based on current pathname', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/dashboard');

      render(<HeaderComponent {...defaultProps} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render default title when pathname does not match navigation', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/unknown');

      render(<HeaderComponent {...defaultProps} />);
      
      expect(screen.getByText('Claude Monitor')).toBeInTheDocument();
    });

    it('should render system status indicator', () => {
      render(<HeaderComponent {...defaultProps} />);
      
      expect(screen.getByText('System Online')).toBeInTheDocument();
    });

    it('should render theme toggle button', () => {
      render(<HeaderComponent {...defaultProps} />);
      
      const themeButton = screen.getByRole('button', { name: /theme/i });
      expect(themeButton).toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    it('should show loading state initially', async () => {
      // Make fetch hang to test loading state
      mockFetch.mockImplementation(() => new Promise(() => {}));
      
      render(<HeaderComponent {...defaultProps} />);
      
      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-pulse');
    });

    it('should render authenticated user info', async () => {
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });

    it('should render user avatar with first letter', async () => {
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument(); // First letter of 'testuser'
      });
    });

    it('should render sign in button when not authenticated', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false }),
      });

      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should render sign in button when user data is invalid', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, user: null }),
      });

      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch user info:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('User Interactions', () => {
    it('should call onMenuClick when menu button is clicked', async () => {
      const onMenuClick = jest.fn();
      const user = userEvent.setup();

      render(<HeaderComponent {...defaultProps} onMenuClick={onMenuClick} />);
      
      const menuButton = screen.getAllByRole('button')[0]; // First button is the menu
      await user.click(menuButton);
      
      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('should navigate to login when sign in button is clicked', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false }),
      });

      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);
      
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should toggle user dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Find the dropdown button (contains user avatar and info)
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      // Dropdown should be visible
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Open dropdown
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Click outside (on document body)
      fireEvent.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
      });
    });

    it('should navigate to settings when settings is clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Open dropdown
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      // Click settings
      const settingsButton = screen.getByText('Settings');
      await user.click(settingsButton);
      
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Logout Functionality', () => {
    it('should handle logout successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              username: 'testuser',
              role: 'admin',
              authenticated: true,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Open dropdown and click logout
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      const logoutButton = screen.getByText('Sign out');
      await user.click(logoutButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle logout failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              username: 'testuser',
              role: 'admin',
              authenticated: true,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false }),
        });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Open dropdown and click logout
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      const logoutButton = screen.getByText('Sign out');
      await user.click(logoutButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout failed');
      });

      consoleSpy.mockRestore();
    });

    it('should handle logout network error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            user: {
              username: 'testuser',
              role: 'admin',
              authenticated: true,
            },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Open dropdown and click logout
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      const logoutButton = screen.getByText('Sign out');
      await user.click(logoutButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide menu button on desktop', () => {
      render(<HeaderComponent {...defaultProps} />);
      
      const menuButton = screen.getAllByRole('button')[0];
      expect(menuButton).toHaveClass('lg:hidden');
    });

    it('should hide system status on mobile', () => {
      render(<HeaderComponent {...defaultProps} />);
      
      const statusElement = screen.getByText('System Online').parentElement;
      expect(statusElement).toHaveClass('hidden', 'sm:flex');
    });

    it('should hide detailed user info on mobile', async () => {
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        const userInfo = screen.getByText('testuser').parentElement;
        expect(userInfo).toHaveClass('hidden', 'sm:block');
      });
    });
  });

  describe('Dropdown Animation', () => {
    it('should rotate dropdown arrow when open', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Find and click user button
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      // Check if arrow is rotated
      const arrow = screen.getByRole('img', { hidden: true });
      expect(arrow).toHaveClass('rotate-180');
    });

    it('should not rotate arrow when closed', async () => {
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Arrow should not be rotated initially
      const arrow = screen.getByRole('img', { hidden: true });
      expect(arrow).not.toHaveClass('rotate-180');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes', () => {
      render(<HeaderComponent {...defaultProps} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('dark:bg-gray-800');
      expect(header).toHaveClass('dark:border-gray-700');
    });

    it('should apply dark mode text colors', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/dashboard');

      render(<HeaderComponent {...defaultProps} />);
      
      const title = screen.getByText('Dashboard');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<HeaderComponent {...defaultProps} />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      await waitFor(() => {
        const userButton = screen.getByRole('button', { name: /testuser/i });
        expect(userButton).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      // Tab through elements
      await user.tab();
      expect(screen.getAllByRole('button')[0]).toHaveFocus(); // Menu button
      
      await user.tab();
      expect(screen.getAllByRole('button')[1]).toHaveFocus(); // Theme button
    });

    it('should handle escape key in dropdown', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      // Open dropdown
      const userButton = screen.getByRole('button', { name: /testuser/i });
      await user.click(userButton);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Press escape
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty navigation array', () => {
      render(<HeaderComponent {...defaultProps} navigation={[]} />);
      
      expect(screen.getByText('Claude Monitor')).toBeInTheDocument();
    });

    it('should prevent event bubbling on dropdown button click', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const userButton = screen.getByRole('button', { name: /testuser/i });
      
      // Should not close immediately due to stopPropagation
      await user.click(userButton);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle rapid dropdown toggles', async () => {
      const user = userEvent.setup();
      render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const userButton = screen.getByRole('button', { name: /testuser/i });
      
      // Rapid clicks
      await user.click(userButton);
      await user.click(userButton);
      await user.click(userButton);
      
      // Should handle gracefully
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not refetch user info on re-renders', async () => {
      const { rerender } = render(<HeaderComponent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      const initialCallCount = mockFetch.mock.calls.length;
      
      // Re-render with same props
      rerender(<HeaderComponent {...defaultProps} />);
      
      // Should not trigger additional API calls
      expect(mockFetch.mock.calls.length).toBe(initialCallCount);
    });
  });
});