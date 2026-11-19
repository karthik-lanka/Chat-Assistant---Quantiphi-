import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToneSelector from '../components/ToneSelector';
import * as ChatContextModule from '../context/ChatContext';

describe('ToneSelector Component', () => {
  it('renders all three tone options: Professional, Casual, and Concise', () => {
    const setToneMock = vi.fn();
    vi.spyOn(ChatContextModule, 'useChat').mockReturnValue({
      tone: 'professional',
      setTone: setToneMock,
    });

    render(<ToneSelector />);

    expect(screen.getByRole('button', { name: /professional/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /casual/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /concise/i })).toBeInTheDocument();
  });

  it('marks current tone as active and calls setTone on click', () => {
    const setToneMock = vi.fn();
    vi.spyOn(ChatContextModule, 'useChat').mockReturnValue({
      tone: 'professional',
      setTone: setToneMock,
    });

    render(<ToneSelector />);

    const casualBtn = screen.getByRole('button', { name: /casual/i });
    fireEvent.click(casualBtn);

    expect(setToneMock).toHaveBeenCalledWith('casual');
  });
});
