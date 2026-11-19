// Mock data and API service for frontend development
// Will be replaced with real API calls in Milestone 4

const MOCK_CONVERSATIONS = [
  {
    _id: '1',
    title: 'Understanding React Hooks',
    messages: [
      {
        _id: 'm1',
        role: 'user',
        content: 'Can you explain React hooks to me?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: 'm2',
        role: 'assistant',
        content: `## React Hooks

React Hooks are functions that let you use **state** and other React features in functional components.

### Common Hooks

1. **useState** - Manages local state
2. **useEffect** - Handles side effects
3. **useContext** - Accesses context values
4. **useRef** - Creates mutable references
5. **useMemo** - Memoizes expensive computations

### Example

\`\`\`javascript
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

> Hooks follow rules: only call them at the top level and only from React functions.`,
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    _id: '2',
    title: 'MongoDB Query Optimization',
    messages: [
      {
        _id: 'm3',
        role: 'user',
        content: 'How do I optimize MongoDB queries?',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: 'm4',
        role: 'assistant',
        content: `Here are key strategies for **MongoDB query optimization**:

- **Create proper indexes** for frequently queried fields
- Use \`explain()\` to analyze query execution plans
- **Limit returned fields** with projections
- Avoid \`$regex\` on unindexed fields
- Use **compound indexes** for multi-field queries

| Strategy | Impact |
|----------|--------|
| Indexing | High |
| Projections | Medium |
| Query restructuring | Medium |
| Aggregation pipeline | High |`,
        timestamp: new Date(Date.now() - 86300000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86300000).toISOString(),
  },
];

let conversations = [...MOCK_CONVERSATIONS];
let nextId = 3;
let nextMsgId = 10;

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async getConversations() {
    await delay(300);
    return conversations.map(({ _id, title, createdAt, updatedAt, messages }) => ({
      _id,
      title,
      createdAt,
      updatedAt,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 100) || '',
    }));
  },

  async getConversation(id) {
    await delay(200);
    const conv = conversations.find((c) => c._id === id);
    if (!conv) throw new Error('Conversation not found');
    return { ...conv };
  },

  async createConversation() {
    await delay(200);
    const newConv = {
      _id: String(nextId++),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations.unshift(newConv);
    return { ...newConv };
  },

  async renameConversation(id, title) {
    await delay(200);
    const conv = conversations.find((c) => c._id === id);
    if (!conv) throw new Error('Conversation not found');
    conv.title = title;
    conv.updatedAt = new Date().toISOString();
    return { ...conv };
  },

  async deleteConversation(id) {
    await delay(200);
    const idx = conversations.findIndex((c) => c._id === id);
    if (idx === -1) throw new Error('Conversation not found');
    conversations.splice(idx, 1);
    return { success: true };
  },

  async sendMessage(conversationId, content, tone) {
    await delay(300);
    const conv = conversations.find((c) => c._id === conversationId);
    if (!conv) throw new Error('Conversation not found');

    const userMsg = {
      _id: String(nextMsgId++),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);

    // Update title if first message
    if (conv.messages.length === 1) {
      conv.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    return { userMessage: userMsg, conversationId };
  },

  // Simulate streaming response
  simulateStream(conversationId, _tone, onToken, onDone, onError) {
    const toneResponses = {
      professional: `Thank you for your question. I'd be happy to provide a comprehensive analysis.

Based on current best practices, here are the key considerations:

1. **Architecture Design** — Ensure proper separation of concerns
2. **Performance** — Optimize for scalability from the start
3. **Security** — Implement authentication and authorization
4. **Testing** — Maintain high test coverage

This approach aligns with industry standards and will serve as a solid foundation for your project.`,

      casual: `Hey! Great question! 😊

So basically, here's the deal:

- **Keep it simple** — don't overcomplicate things
- **Test as you go** — catches bugs early
- **Have fun with it** — coding should be enjoyable!

Let me know if you want me to dive deeper into any of these! 🚀`,

      concise: `Key points:

- Modular architecture
- Proper error handling
- Input validation
- Clean code principles

Focus on these fundamentals for robust results.`,
    };

    const tone = _tone || 'professional';
    const responseText = toneResponses[tone] || toneResponses.professional;
    const words = responseText.split(' ');
    let index = 0;
    let cancelled = false;

    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval);
        return;
      }
      if (index < words.length) {
        const token = (index === 0 ? '' : ' ') + words[index];
        onToken(token);
        index++;
      } else {
        clearInterval(interval);
        // Save the assistant message
        const conv = conversations.find((c) => c._id === conversationId);
        if (conv) {
          conv.messages.push({
            _id: String(nextMsgId++),
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString(),
          });
          conv.updatedAt = new Date().toISOString();
        }
        onDone(responseText);
      }
    }, 50);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  },
};

export default mockApi;
