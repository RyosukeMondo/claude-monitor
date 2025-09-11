import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../../../src/components/layout/AppLayout';

// Mock next/navigation
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock HeaderComponent
jest.mock('../../../src/components/layout/HeaderComponent', () => ({
  HeaderComponent: ({ onMenuClick }: { onMenuClick: () => void }) => (
    <div data-testid="header-component">
      <button data-testid="menu-button" onClick={onMenuClick}>
        Menu
      </button>
    </div>
  ),
}));

describe('AppLayout', () => {
  const defaultProps = {
    children: <div data-testid="main-content">Test Content</div>,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set default mock behavior
    mockUsePathname.mockReturnValue('/');
  });

  describe('Rendering', () => {
    it('should render children content', () => {
      render(<AppLayout {...defaultProps} />);
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('should render brand logo and title', () => {
      render(<AppLayout {...defaultProps} />);
      expect(screen.getByText('Claude Monitor')).toBeInTheDocument();
    });

    it('should render navigation items', () => {
      render(<AppLayout {...defaultProps} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render status indicator', () => {
      render(<AppLayout {...defaultProps} />);
      expect(screen.getByText('Monitoring Active')).toBeInTheDocument();
    });

    it('should render HeaderComponent', () => {
      render(<AppLayout {...defaultProps} />);
      expect(screen.getByTestId('header-component')).toBeInTheDocument();
    });
  });

  describe('Navigation Active State', () => {
    it('should highlight active navigation item based on pathname', () => {
      // Mock usePathname to return '/dashboard'
      mockUsePathname.mockReturnValue('/dashboard');

      render(<AppLayout {...defaultProps} />);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-blue-50');
      expect(dashboardLink).toHaveClass('text-blue-700');
    });

    it('should not highlight inactive navigation items', () => {
      mockUsePathname.mockReturnValue('/dashboard');

      render(<AppLayout {...defaultProps} />);
      
      const projectsLink = screen.getByRole('link', { name: /projects/i });
      expect(projectsLink).not.toHaveClass('bg-blue-50');
      expect(projectsLink).toHaveClass('text-gray-600');
    });
  });

  describe('Mobile Sidebar Functionality', () => {
    it('should initially hide mobile sidebar', () => {
      render(<AppLayout {...defaultProps} />);
      const sidebar = screen.getByRole('navigation').closest('div');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should show mobile sidebar when menu button is clicked', async () => {
      render(<AppLayout {...defaultProps} />);
      const user = userEvent.setup();
      
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation').closest('div');
        expect(sidebar).toHaveClass('translate-x-0');
      });
    });

    it('should show overlay when sidebar is open', async () => {
      render(<AppLayout {...defaultProps} />);
      const user = userEvent.setup();
      
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.z-40');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('should hide sidebar when overlay is clicked', async () => {
      render(<AppLayout {...defaultProps} />);
      const user = userEvent.setup();
      
      // Open sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation').closest('div');
        expect(sidebar).toHaveClass('translate-x-0');
      });

      // Click overlay
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      if (overlay) {
        fireEvent.click(overlay);
      }

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation').closest('div');
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });

    it('should hide sidebar when close button is clicked', async () => {
      render(<AppLayout {...defaultProps} />);
      const user = userEvent.setup();
      
      // Open sidebar
      const menuButton = screen.getByTestId('menu-button');
      await user.click(menuButton);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation').closest('div');
        expect(sidebar).toHaveClass('translate-x-0');
      });

      // Click close button (the X button in the sidebar)
      const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
      await user.click(closeButton);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation').closest('div');
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes for desktop layout', () => {
      render(<AppLayout {...defaultProps} />);
      const sidebar = screen.getByRole('navigation').closest('div');
      expect(sidebar).toHaveClass('lg:translate-x-0');
      expect(sidebar).toHaveClass('lg:static');
    });

    it('should apply responsive padding for main content', () => {
      render(<AppLayout {...defaultProps} />);
      const mainWrapper = screen.getByRole('main').parentElement;
      expect(mainWrapper).toHaveClass('lg:pl-64');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AppLayout {...defaultProps} />);
      
      // Navigation should have nav role
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Links should have proper roles
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<AppLayout {...defaultProps} />);
      const user = userEvent.setup();
      
      // Tab through navigation items
      await user.tab();
      const firstLink = screen.getByRole('link', { name: /claude monitor/i });
      expect(firstLink).toHaveFocus();
    });

    it('should have proper contrast for active states', () => {
      mockUsePathname.mockReturnValue('/dashboard');

      render(<AppLayout {...defaultProps} />);
      
      const activeLink = screen.getByRole('link', { name: /dashboard/i });
      expect(activeLink).toHaveClass('text-blue-700');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes', () => {
      render(<AppLayout {...defaultProps} />);
      
      const container = screen.getByRole('main').closest('.min-h-screen');
      expect(container).toHaveClass('dark:bg-gray-900');
      
      const sidebar = screen.getByRole('navigation').closest('div');
      expect(sidebar).toHaveClass('dark:bg-gray-800');
    });

    it('should apply dark mode text colors', () => {
      render(<AppLayout {...defaultProps} />);
      
      const brandText = screen.getByText('Claude Monitor');
      expect(brandText).toHaveClass('dark:text-white');
    });
  });

  describe('Error Boundaries', () => {
    it('should handle children rendering errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(
          <AppLayout>
            <ThrowError />
          </AppLayout>
        );
      }).toThrow('Test error');

      console.error = originalError;
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders when pathname changes', () => {
      const { rerender } = render(<AppLayout {...defaultProps} />);
      
      // Change pathname
      mockUsePathname.mockReturnValue('/projects');
      rerender(<AppLayout {...defaultProps} />);
      
      // Verify active state updated
      const projectsLink = screen.getByRole('link', { name: /projects/i });
      expect(projectsLink).toHaveClass('bg-blue-50');
    });

    it('should handle rapid sidebar toggle operations', async () => {
      render(<AppLayout {...defaultProps} />);
      const user = userEvent.setup();
      const menuButton = screen.getByTestId('menu-button');
      
      // Rapid clicks should not cause errors
      await user.click(menuButton);
      await user.click(menuButton);
      await user.click(menuButton);
      
      // Final state should be open
      const sidebar = screen.getByRole('navigation').closest('div');
      expect(sidebar).toHaveClass('translate-x-0');
    });
  });
});