// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuccessToast from './SuccessToast';

describe('SuccessToast', () => {
  const mockOnClose = jest.fn();
  const successMessage = 'Tarefa concluída com sucesso';
  const offensiveMessage = 'completou porra';

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('renders the success message correctly', () => {
    render(<SuccessToast message={successMessage} onClose={mockOnClose} />);
    expect(screen.getByText(successMessage)).toBeInTheDocument();
  });

  test('applies correct accessibility attributes', () => {
    render(<SuccessToast message={successMessage} onClose={mockOnClose} />);
    const toastElement = screen.getByRole('status');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveAttribute('aria-live', 'polite');
  });

  test('calls onClose when the close button is clicked', () => {
    render(<SuccessToast message={successMessage} onClose={mockOnClose} />);
    const closeButton = screen.getByRole('button', { name: /Fechar/i }); // Assuming the X icon is accessible as a close button
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not render the offensive message', () => {
    render(<SuccessToast message={successMessage} onClose={mockOnClose} />);
    expect(screen.queryByText(offensiveMessage)).not.toBeInTheDocument();
  });

  test('renders the checkmark icon', () => {
    render(<SuccessToast message={successMessage} onClose={mockOnClose} />);
    // Assuming CircleCheck renders an SVG or has an accessible name
    expect(screen.getByTestId('circle-check-icon')).toBeInTheDocument(); // Add data-testid="circle-check-icon" to CircleCheck
  });
});
