
import { useState, type FormEvent } from "react";
import {
  askKnowledgeBase,
  type KnowledgeSource,
} from "../services/api";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: KnowledgeSource[];
}

function AIChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I'm your IntelliSupport AI assistant. Ask me anything about your support policies and uploaded knowledge documents.",
    },
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userQuestion = question.trim();

    if (!userQuestion || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const result = await askKnowledgeBase(userQuestion, 3);

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the AI assistant."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-chat-section" id="ai-assistant">
      <div className="section-heading">
        <p className="eyebrow">INTELLIGENT CUSTOMER SUPPORT</p>
        <h2>
          ASK YOUR <span>AI ASSISTANT</span>
        </h2>
        <p>
          Get answers from your uploaded support documents using local
          artificial intelligence.
        </p>
      </div>

      <div className="ai-chat-container">
        <div className="ai-chat-header">
          <div className="ai-chat-avatar">✧</div>

          <div>
            <h3>IntelliSupport AI</h3>
            <p>
              <span className="ai-online-dot"></span>
              Local AI · RAG Knowledge Assistant
            </p>
          </div>

          <span className="ai-model-badge">LLAMA 3.2</span>
        </div>

        <div className="ai-chat-messages" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-message ${
                message.role === "user"
                  ? "user-message"
                  : "assistant-message"
              }`}
            >
              <div className="message-avatar">
                {message.role === "user" ? "U" : "✧"}
              </div>

              <div className="message-content">
                <span className="message-role">
                  {message.role === "user" ? "YOU" : "AI ASSISTANT"}
                </span>

                <p>{message.content}</p>

                {message.sources && message.sources.length > 0 && (
                  <div className="ai-sources">
                    <strong>Knowledge sources</strong>

                    {message.sources.map((source, index) => (
                      <div
                        className="ai-source-item"
                        key={`${source.document_id}-${source.chunk_index}-${index}`}
                      >
                        <span>▤</span>
                        <div>
                          <strong>{source.filename}</strong>
                          <small>
                            Document reference · Chunk {source.chunk_index}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-message assistant-message">
              <div className="message-avatar">✧</div>
              <div className="message-content">
                <span className="message-role">AI ASSISTANT</span>
                <p className="ai-typing">
                  Searching knowledge base and generating an answer
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="ai-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <form className="ai-chat-input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask something about your support policies..."
            disabled={loading}
            aria-label="Ask the AI assistant a question"
          />

          <button
            type="submit"
            className="ai-send-button"
            disabled={loading || !question.trim()}
          >
            {loading ? "Thinking..." : "Ask AI ↗"}
          </button>
        </form>

        <div className="ai-chat-footer">
          Powered by ChromaDB · Sentence Transformers · Ollama
        </div>
      </div>
    </section>
  );
}

export default AIChatAssistant;
