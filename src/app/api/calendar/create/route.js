export async function POST(req) {
  const { accessToken, title, description, startDateTime, endDateTime } = await req.json();

  if (!accessToken) {
    return Response.json({ error: "Missing Google access token. Please re-sign in with Google." }, { status: 401 });
  }

  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          summary: title,
          description: description || "",
          start: { dateTime: startDateTime },
          end: { dateTime: endDateTime },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.error?.message || "Google Calendar error" }, { status: 500 });
    }

    return Response.json({ success: true, eventLink: data.htmlLink });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}