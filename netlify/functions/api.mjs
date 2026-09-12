import { getStore } from "@netlify/blobs";

export default async (req, context) => {
    try {
        const store = getStore("copypaste");

        // Handle GET request
        if (req.method === "GET") {
            let data = [];
            try {
                data = await store.get("all_boxes", { type: "json" }) || [];
            } catch (e) {
                console.warn("Error reading json", e);
            }
            
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            });
        }

        // Handle PUT request
        if (req.method === "PUT") {
            const body = await req.json();
            const { id, content } = body;

            let data = [];
            try {
                data = await store.get("all_boxes", { type: "json" }) || [];
            } catch (e) {
                console.warn("Error reading json", e);
            }

            const existingIndex = data.findIndex(item => item.id === id);
            if (existingIndex >= 0) {
                data[existingIndex].content = content;
            } else {
                data.push({ id, content });
            }

            await store.setJSON("all_boxes", data);

            return new Response(JSON.stringify({ success: true, id }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }
            });
        }

        // Handle OPTIONS
        if (req.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                }
            });
        }

        return new Response("Method not allowed", { status: 405 });
    } catch (error) {
        console.error("V2 Blob Error:", error);
        return new Response(JSON.stringify({ 
            error: error.message, 
            stack: error.stack,
            name: error.name
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};

export const config = {
    path: "/api"
};

