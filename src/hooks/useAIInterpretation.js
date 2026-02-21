import { useState, useCallback } from 'react';

export function useAIInterpretation() {
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const fetchReading = useCallback(async ({ cards, spread, question, lang }) => {
    setLoading(true);
    setError(null);
    setReading('');
    // Reset chat when fetching a new reading
    setChatMessages([]);
    setChatError(null);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards, spread, question, lang }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setReading(data.reading);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendChat = useCallback(async ({ message, cards, spread, question, reading: readingText, lang }) => {
    const userMsg = { role: 'user', content: message };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    setChatError(null);

    try {
      const allMessages = [...chatMessages, userMsg];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards,
          spread,
          question,
          reading: readingText,
          messages: allMessages,
          lang,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatError(err.message);
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages]);

  const clearReading = useCallback(() => {
    setReading('');
    setError(null);
    setChatMessages([]);
    setChatError(null);
  }, []);

  return {
    reading, loading, error, fetchReading, clearReading,
    chatMessages, chatLoading, chatError, sendChat,
  };
}
