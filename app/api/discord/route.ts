import { NextRequest, NextResponse } from "next/server";

type DiscordRequest = {
  type: "contact" | "access_request";
  name: string;
  email: string;
  message?: string;
  company?: string;
  useCase?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: DiscordRequest = await request.json();

    // Validate required fields
    if (!body.type || !body.name || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get Discord webhook URL from environment
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL environment variable not set");
      return NextResponse.json(
        { error: "Discord webhook not configured" },
        { status: 500 }
      );
    }

    let discordMessage: Record<string, any> = {
      embeds: [
        {
          color: 0x0066ff,
          footer: {
            text: "From: topaitoolrank.com",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Build message based on type
    if (body.type === "contact") {
      if (!body.message) {
        return NextResponse.json(
          { error: "Message field required for contact form" },
          { status: 400 }
        );
      }

      discordMessage.embeds[0].title = "📬 New Contact Form Submission";
      discordMessage.embeds[0].fields = [
        {
          name: "👤 Name",
          value: body.name,
          inline: false,
        },
        {
          name: "📧 Email",
          value: body.email,
          inline: false,
        },
        {
          name: "💬 Message",
          value: body.message,
          inline: false,
        },
      ];
    } else if (body.type === "access_request") {
      if (!body.company || !body.useCase) {
        return NextResponse.json(
          { error: "Company and useCase fields required for access_request" },
          { status: 400 }
        );
      }

      discordMessage.embeds[0].title = "🔐 WA Sender Access Request";
      discordMessage.embeds[0].fields = [
        {
          name: "👤 Name",
          value: body.name,
          inline: false,
        },
        {
          name: "📧 Email",
          value: body.email,
          inline: false,
        },
        {
          name: "🏢 Company",
          value: body.company,
          inline: false,
        },
        {
          name: "💡 Use Case",
          value: body.useCase,
          inline: false,
        },
      ];
    } else {
      return NextResponse.json(
        { error: "Invalid request type" },
        { status: 400 }
      );
    }

    // Send to Discord webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Discord webhook error: ${response.status}`,
        errorText
      );
      return NextResponse.json(
        { error: "Failed to send message to Discord" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Discord API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
