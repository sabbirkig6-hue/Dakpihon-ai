import express from "express";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const warningMessage =
  "⚠️ এই প্রশ্নের উত্তর দেওয়া যাচ্ছে না। " +
  "অনুগ্রহ করে শালীনতা ও ইসলামী আদব বজায় রাখুন। " +
  "আল্লাহ আমাদের সবাইকে সঠিক পথে পরিচালিত করুন।";

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "Dak Peyon AI" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 3000
    ) {
      return res.status(400).json({
        reply: "অনুগ্রহ করে সঠিক প্রশ্ন লিখুন।"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        reply: "AI সার্ভার এখনো সেটআপ করা হয়নি।"
      });
    }

    const moderation = await client.moderations.create({
      model: "omni-moderation-latest",
      input: message
    });

    if (moderation.results?.[0]?.flagged) {
      return res.json({
        reply: warningMessage,
        warning: true
      });
    }

    const result = await client.responses.create({
      model: "gpt-5.5",
      instructions: `
তুমি ডাক পিয়ন AI, একটি ইসলামিক প্রশ্নোত্তর সহায়ক।
বাংলায় সহজ, ভদ্র ও উপকারী উত্তর দেবে।
কুরআন, হাদিস, নামাজ, রোজা, অজু ও ইসলামী জ্ঞান
সম্পর্কে যথাসম্ভব নির্ভরযোগ্য তথ্য দেবে।
অশ্লীল বা যৌনভাবে স্পষ্ট অনুরোধে সহযোগিতা করবে না।
এমন অনুরোধে সতর্কতা ও হেদায়েতের বার্তা দেবে।
কুরআন-হাদিসের সূত্র বা ফতোয়া বানিয়ে বলবে না।
নিশ্চিত না হলে তা স্পষ্ট করে বলবে এবং প্রয়োজনে
যোগ্য আলেমের পরামর্শ নিতে বলবে।
`,
      input: message
    });

    return res.json({
      reply: result.output_text?.trim() ||
        "দুঃখিত, এই মুহূর্তে উত্তর তৈরি করা যায়নি।"
    });

  } catch (error) {
    console.error("AI error:", error.status || "server error");

    return res.status(500).json({
      reply: "সার্ভারে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Dak Peyon AI server started on port " + PORT);
});
                  
