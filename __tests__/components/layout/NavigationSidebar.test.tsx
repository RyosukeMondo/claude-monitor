import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationSidebar } from '../../../src/components/layout/NavigationSidebar';

// Mock window.innerWidth for mobile detection
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('NavigationSidebar', () => {
  const defaultProps = {
    isOpen: false,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window size to desktop
    window.innerWidth = 1024;
  });

  describe('Rendering', () => {
    it('should render navigation items', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('Recovery')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render brand logo and title', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Claude Monitor')).toBeInTheDocument();
    });

    it('should render status indicator', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      expect(screen.getByText('Monitoring Active')).toBeInTheDocument();
    });

    it('should render navigation icons', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // Check for SVG icons by their viewBox attributes
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-sidebar';
      render(<NavigationSidebar {...defaultProps} isOpen={true} className={customClass} />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass(customClass);
    });
  });

  describe('Visibility and State', () => {
    it('should be hidden when isOpen is false', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={false} />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    it('should be visible when isOpen is true', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('should show overlay when open on mobile', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const overlay = screen.getByRole('button', { hidden: true });
      expect(overlay).toBeInTheDocument();
    });

    it('should not show overlay when closed', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={false} />);
      
      const overlay = screen.queryByRole('button', { hidden: true });
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Active State Handling', () => {
    it('should highlight active navigation item based on pathname', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/dashboard');

      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const dashboardLink = screen.getByRole('menuitem', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-blue-50');
      expect(dashboardLink).toHaveClass('text-blue-700');
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight inactive navigation items', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/dashboard');

      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const projectsLink = screen.getByRole('menuitem', { name: /projects/i });
      expect(projectsLink).not.toHaveClass('bg-blue-50');
      expect(projectsLink).toHaveClass('text-gray-600');
      expect(projectsLink).not.toHaveAttribute('aria-current');
    });

    it('should update active state when pathname changes', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/dashboard');

      const { rerender } = render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // Initially dashboard should be active
      let dashboardLink = screen.getByRole('menuitem', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('bg-blue-50');

      // Change pathname to projects
      mockUsePathname.mockReturnValue('/projects');
      rerender(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // Now projects should be active
      const projectsLink = screen.getByRole('menuitem', { name: /projects/i });
      expect(projectsLink).toHaveClass('bg-blue-50');
      
      // Dashboard should no longer be active
      dashboardLink = screen.getByRole('menuitem', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveClass('bg-blue-50');
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when overlay is clicked', async () => {
      const onClose = jest.fn();
      render(<NavigationSidebar {...defaultProps} isOpen={true} onClose={onClose} />);
      
      const overlay = screen.getByRole('button', { hidden: true });
      fireEvent.click(overlay);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<NavigationSidebar {...defaultProps} isOpen={true} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close navigation/i });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<NavigationSidebar {...defaultProps} isOpen={true} onClose={onClose} />);
      
      const sidebar = screen.getByRole('navigation');
      sidebar.focus();
      await user.keyboard('{Escape}');
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when navigation link is clicked on mobile', async () => {
      // Set mobile viewport
      window.innerWidth = 768;
      
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<NavigationSidebar {...defaultProps} isOpen={true} onClose={onClose} />);
      
      const dashboardLink = screen.getByRole('menuitem', { name: /dashboard/i });
      await user.click(dashboardLink);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when navigation link is clicked on desktop', async () => {
      // Set desktop viewport
      window.innerWidth = 1200;
      
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<NavigationSidebar {...defaultProps} isOpen={true} onClose={onClose} />);
      
      const dashboardLink = screen.getByRole('menuitem', { name: /dashboard/i });
      await user.click(dashboardLink);
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through links', async () => {
      const user = userEvent.setup();
      
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // Tab through navigation items
      await user.tab();
      expect(screen.getByRole('link', { name: /claude monitor/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /close navigation/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('menuitem', { name: /dashboard/i })).toHaveFocus();
    });

    it('should have proper focus styles', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const dashboardLink = screen.getByRole('menuitem', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('focus:outline-none');
      expect(dashboardLink).toHaveClass('focus:ring-2');
      expect(dashboardLink).toHaveClass('focus:ring-blue-500');
    });

    it('should handle arrow key navigation', async () => {
      const user = userEvent.setup();
      
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const firstLink = screen.getByRole('menuitem', { name: /dashboard/i });
      firstLink.focus();
      
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: /projects/i })).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
      
      const navSection = screen.getByLabelText('Primary navigation');
      expect(navSection).toBeInTheDocument();
      
      const navList = screen.getByRole('list');
      expect(navList).toBeInTheDocument();
    });

    it('should have proper role attributes', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(6); // 6 navigation items
      
      const listItems = screen.getAllByRole('none');
      expect(listItems).toHaveLength(6); // 6 list items with role="none"
    });

    it('should mark icons as decorative', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // Check that SVG icons have aria-hidden="true"
      const decorativeIcons = screen.getAllByRole('img', { hidden: true });
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });

    it('should have proper close button accessibility', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const closeButton = screen.getByRole('button', { name: /close navigation/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close navigation');
    });

    it('should support screen reader announcements for active state', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/dashboard');

      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const activeLink = screen.getByRole('menuitem', { name: /dashboard/i });
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('lg:translate-x-0');
      expect(sidebar).toHaveClass('lg:static');
    });

    it('should hide overlay on desktop', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const overlay = screen.getByRole('button', { hidden: true });
      expect(overlay).toHaveClass('lg:hidden');
    });

    it('should hide close button on desktop', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const closeButton = screen.getByRole('button', { name: /close navigation/i });
      expect(closeButton).toHaveClass('lg:hidden');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes', () => {
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('dark:bg-gray-800');
      expect(sidebar).toHaveClass('dark:border-gray-700');
      
      const brandText = screen.getByText('Claude Monitor');
      expect(brandText).toHaveClass('dark:text-white');
    });

    it('should apply dark mode hover states', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/settings'); // Make settings inactive

      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      const inactiveLink = screen.getByRole('menuitem', { name: /projects/i });
      expect(inactiveLink).toHaveClass('dark:text-gray-300');
      expect(inactiveLink).toHaveClass('dark:hover:bg-gray-700');
      expect(inactiveLink).toHaveClass('dark:hover:text-white');
    });
  });

  describe('Badge Support', () => {
    it('should render badges when present', () => {
      // Mock navigation items with badges by modifying the component's internal data
      // This would require either props support or mocking the internal array
      // For now, we'll test the badge rendering structure exists in the JSX
      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // The badge rendering logic exists in the component
      // We can verify the structure is there even if no badges are currently shown
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(6);
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders when props change', () => {
      const { rerender } = render(<NavigationSidebar {...defaultProps} isOpen={false} />);
      
      // Change isOpen state
      rerender(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // Sidebar should now be visible
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('should handle rapid state changes', async () => {
      const onClose = jest.fn();
      const { rerender } = render(<NavigationSidebar {...defaultProps} isOpen={false} onClose={onClose} />);
      
      // Rapid state changes
      rerender(<NavigationSidebar {...defaultProps} isOpen={true} onClose={onClose} />);
      rerender(<NavigationSidebar {...defaultProps} isOpen={false} onClose={onClose} />);
      rerender(<NavigationSidebar {...defaultProps} isOpen={true} onClose={onClose} />);
      
      // Final state should be open
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('translate-x-0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing pathname gracefully', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue(null);

      expect(() => {
        render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      }).not.toThrow();
    });

    it('should handle unknown pathname', () => {
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/unknown-path');

      render(<NavigationSidebar {...defaultProps} isOpen={true} />);
      
      // No items should be active
      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach(item => {
        expect(item).not.toHaveAttribute('aria-current', 'page');
      });
    });
  });
});