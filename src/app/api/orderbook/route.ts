import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.mexc.com/api/v3/depth?symbol=PHLUSDT&limit=20",
      { next: { revalidate: 30 } }
    );

    if (!response.ok) throw new Error("MEXC fetch failed");

    const data = await response.json();

    const bids = (data.bids || []).map((b: string[]) => ({
      price: parseFloat(b[0]),
      quantity: parseFloat(b[1]),
    }));

    const asks = (data.asks || []).map((a: string[]) => ({
      price: parseFloat(a[0]),
      quantity: parseFloat(a[1]),
    }));

    return NextResponse.json({ bids, asks });
  } catch (error) {
    console.error("Orderbook fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orderbook" },
      { status: 500 }
    );
  }
}
