import {
    icsCalendarToObject,
    generateIcsCalendar,
    type VEvent,
    type VCalendar,
} from "ts-ics";
export async function GET(request: Request) {
    const targetUrl =
        "https://calendar.google.com/calendar/ical/new.ocuaikido%40gmail.com/public/basic.ics";

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            return new Response(
                `Failed to fetch target URL: ${response.statusText}`,
                { status: response.status }
            );
        }

        const res = await response.text();
        const parsedData = icsCalendarToObject(res);
        const events: VEvent[] | undefined = parsedData.events;
        if (!events) {
            return new Response("No events found in the ICS data", {
                status: 404,
            });
        }
        const filteredEvents = events.filter((event) => {
            const startDate = new Date(new Date().setHours(0, 0, 0, 0));
            const endDate = new Date(
                new Date().setMonth(new Date().getMonth() + 2)
            );
            return (
                new Date(event.start.date) >= startDate &&
                (event.end
                    ? new Date(event.end.date) <= endDate
                    : new Date(event.start.date) <= endDate)
            );
        });
        const vCalendar: VCalendar = {
            version: "2.0",
            prodId: parsedData.prodId,
            method: parsedData.method,
            timezones: parsedData.timezones,
            events: filteredEvents,
        };
        const data = generateIcsCalendar(vCalendar);
        return new Response(data, {
            status: 200,
            headers: {
                "Cache-Control":
                    "max-age=0, s-maxage=14400, stale-while-revalidate=3600",
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            return new Response(`Error: ${error.message}`, { status: 500 });
        } else {
            return new Response(`An unknown error occurred`, { status: 500 });
        }
    }
}
