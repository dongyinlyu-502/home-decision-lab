import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = "dongyinlyu@gmail.com";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { feedbackType, rating, feedbackText, ratingLabel } = body;

        if (!feedbackText?.trim()) {
            return NextResponse.json({ error: "Feedback text is required." }, { status: 400 });
        }

        const stars = "⭐".repeat(rating || 0) || "No rating";

        const { data, error } = await resend.emails.send({
            from: "Home Decision Lab <onboarding@resend.dev>",
            to: [TO_EMAIL],
            subject: `[Home Decision Lab] New ${feedbackType} Feedback — ${ratingLabel || stars}`,
            html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-top: 0;">📬 New Feedback Received</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                        <tr>
                            <td style="padding: 8px 12px; background: #f5f5f5; border-radius: 6px; font-weight: 600; width: 120px; color: #374151;">Category</td>
                            <td style="padding: 8px 12px; color: #111827;">${feedbackType}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 12px; font-weight: 600; width: 120px; color: #374151;">Rating</td>
                            <td style="padding: 8px 12px; color: #111827;">${stars} ${ratingLabel ? `— ${ratingLabel}` : ""}</td>
                        </tr>
                    </table>

                    <div style="background: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px; padding: 16px; margin-top: 8px;">
                        <p style="margin: 0; color: #374151; white-space: pre-wrap;">${feedbackText}</p>
                    </div>

                    <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; margin-bottom: 0;">
                        Sent from Home Decision Lab · ${new Date().toISOString()}
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data?.id });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("API route error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
