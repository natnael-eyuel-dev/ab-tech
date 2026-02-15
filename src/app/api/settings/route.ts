import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/settings → fetch the first settings row
export async function GET() {
  try {
    const settings = await db.setting.findFirst();
    return NextResponse.json(settings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings → update the settings row
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // make sure settings row exists
    let settings = await db.setting.findFirst();
    
    if (!settings) {
      // create one if not exists
      settings = await db.setting.create({
        data: {
          siteName: body.siteName || "My Blog",
        },
      });
    }

    const updated = await db.setting.update({
      where: { id: settings.id },
      data: {
        siteName: body.siteName,
        tagline: body.tagline,
        logo: body.logo,
        favicon: body.favicon,
        defaultPostStatus: body.defaultPostStatus,
        postsPerPage: body.postsPerPage,
        allowComments: body.allowComments,
        defaultMetaDescription: body.defaultMetaDescription,
        defaultMetaKeywords: body.defaultMetaKeywords,
        defaultOgImage: body.defaultOgImage,
        twitterHandle: body.twitterHandle,
        themeMode: body.themeMode,
        homepageLayout: body.homepageLayout,
        analyticsId: body.analyticsId,
        smtpHost: body.smtpHost,
        smtpPort: body.smtpPort,
        smtpUser: body.smtpUser,
        smtpPassword: body.smtpPassword,
        senderEmail: body.senderEmail,
        maintenanceMode: body.maintenanceMode,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
