import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomeScreen from '../components/WelcomeScreen';

describe('WelcomeScreen Component', () => {
  it('renders welcome branding and suggested prompt cards', () => {
    const onSendPromptMock = vi.fn();
    render(<WelcomeScreen onSendPrompt={onSendPromptMock} />);

    expect(screen.getByText('Quantiphi AI Chat Assistant')).toBeInTheDocument();
    expect(screen.getByText('Explain a concept')).toBeInTheDocument();
    expect(screen.getByText('Write code')).toBeInTheDocument();
    expect(screen.getByText('Debug help')).toBeInTheDocument();
    expect(screen.getByText('Architecture advice')).toBeInTheDocument();
  });

  it('triggers onSendPrompt when a suggested card is clicked', () => {
    const onSendPromptMock = vi.fn();
    render(<WelcomeScreen onSendPrompt={onSendPromptMock} />);

    const card = screen.getByText('What is the difference between REST and GraphQL APIs?');
    fireEvent.click(card);

    expect(onSendPromptMock).toHaveBeenCalledWith('What is the difference between REST and GraphQL APIs?');
  });
});
