"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import axios from "axios";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you with your studies?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4",
        messages: newMessages.map((msg) => ({ role: msg.sender === "bot" ? "assistant" : "user", content: msg.text })),
      }, {
        headers: { Authorization: `Bearer YOUR_OPENAI_API_KEY` }
      });

      setMessages([...newMessages, { text: response.data.choices[0].message.content, sender: "bot" }]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 border rounded-xl shadow-lg bg-white">
      <Card className="h-96 overflow-y-auto p-2">
        <CardContent>
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 p-2 rounded ${msg.sender === "bot" ? "bg-gray-200" : "bg-blue-200 text-right"}`}>
              {msg.text}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex mt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 mr-2"
        />
        <Button onClick={sendMessage}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
