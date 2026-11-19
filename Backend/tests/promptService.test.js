import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemInstruction, buildConversationContents } from '../src/services/promptService.js';

describe('PromptService', () => {
  it('should generate professional tone instructions', () => {
    const instruction = buildSystemInstruction('professional');
    assert.match(instruction, /professional/i);
    assert.match(instruction, /clear/i);
  });

  it('should generate casual tone instructions', () => {
    const instruction = buildSystemInstruction('casual');
    assert.match(instruction, /friendly/i);
    assert.match(instruction, /casual/i);
  });

  it('should generate concise tone instructions', () => {
    const instruction = buildSystemInstruction('concise');
    assert.match(instruction, /direct/i);
    assert.match(instruction, /brief/i);
  });

  it('should default to professional tone for unknown or undefined tone', () => {
    const defaultInstruction = buildSystemInstruction();
    const unknownInstruction = buildSystemInstruction('unknown_tone');
    assert.equal(defaultInstruction, buildSystemInstruction('professional'));
    assert.equal(unknownInstruction, buildSystemInstruction('professional'));
  });

  it('should format message history correctly for @google/genai contents', () => {
    const messages = [
      { role: 'user', content: 'What is Node.js?' },
      { role: 'assistant', content: 'Node.js is a runtime environment.' },
    ];
    const contents = buildConversationContents(messages, 'What about Express?');

    assert.equal(contents.length, 3);
    assert.deepEqual(contents[0], { role: 'user', parts: [{ text: 'What is Node.js?' }] });
    assert.deepEqual(contents[1], { role: 'model', parts: [{ text: 'Node.js is a runtime environment.' }] });
    assert.deepEqual(contents[2], { role: 'user', parts: [{ text: 'What about Express?' }] });
  });

  it('should limit conversation history to maximum recent context turns', () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));
    const contents = buildConversationContents(messages, 'Latest question');
    // 20 history items + 1 current prompt = 21 items max
    assert.ok(contents.length <= 21);
    assert.equal(contents[contents.length - 1].parts[0].text, 'Latest question');
  });
});
