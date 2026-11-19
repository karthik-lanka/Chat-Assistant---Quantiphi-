import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MessageBubble from '../components/MessageBubble';

describe('MessageBubble Component', () => {
  it('renders user message content and role correctly', () => {
    const userMessage = {
      _id: 'msg-1',
      role: 'user',
      content: 'Explain recursion simply',
      timestamp: new Date().toISOString(),
    };

    render(<MessageBubble message={userMessage} isLastAssistant={false} onRegenerate={null} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Explain recursion simply')).toBeInTheDocument();
  });

  it('renders assistant message with markdown content', () => {
    const assistantMessage = {
      _id: 'msg-2',
      role: 'assistant',
      content: '**Recursion** is when a function calls itself.',
      timestamp: new Date().toISOString(),
      tone: 'concise',
    };

    render(<MessageBubble message={assistantMessage} isLastAssistant={false} onRegenerate={null} />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Recursion')).toBeInTheDocument();
  });

  it('shows regenerate button on the last assistant message and fires callback', () => {
    const regenerateMock = vi.fn();
    const assistantMessage = {
      _id: 'msg-3',
      role: 'assistant',
      content: 'Here is the response to regenerate.',
      timestamp: new Date().toISOString(),
    };

    render(
      <MessageBubble
        message={assistantMessage}
        isLastAssistant={true}
        onRegenerate={regenerateMock}
      />
    );

    const regenBtn = screen.getByRole('button', { name: /regenerate/i });
    expect(regenBtn).toBeInTheDocument();
    fireEvent.click(regenBtn);
    expect(regenerateMock).toHaveBeenCalledWith(assistantMessage);
  });

  it('copies message text to clipboard when copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const msg = {
      _id: 'msg-4',
      role: 'user',
      content: 'Copy this text please',
      timestamp: new Date().toISOString(),
    };

    render(<MessageBubble message={msg} isLastAssistant={false} onRegenerate={null} />);

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith('Copy this text please');
  });
});
