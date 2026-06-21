"use server";

import { auth } from "@clerk/nextjs/server";

const ok = (data: { caption: string }) => ({ success: true as const, data });
const err = (error: string) => ({ success: false as const, error });

export async function generateCaption(prompt: string) {
  try {
    const { userId } = await auth();
    if (!userId) return err("Not authenticated");

    if (!prompt?.trim()) return err("Please describe what the post is about");

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return err("AI service not configured");

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You write short, engaging Telegram channel posts for a training center called Exceed in Addis Ababa, Ethiopia. Keep posts under 100 words, use 1-2 relevant emojis, and end with a clear call to action. Do not use hashtags. Return only the post text, nothing else.",
            },
            {
              role: "user",
              content: prompt.trim(),
            },
          ],
          temperature: 0.8,
          max_tokens: 300,
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Groq API error:", errBody);
      return err("AI generation failed. Please try again.");
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content?.trim();

    if (!caption) return err("AI returned an empty response");

    return ok({ caption });
  } catch (e) {
    console.error("generateCaption error:", e);
    return err("AI generation failed. Please try again.");
  }
}
