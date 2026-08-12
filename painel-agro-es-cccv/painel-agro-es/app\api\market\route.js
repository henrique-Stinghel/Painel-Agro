import { getMarketSnapshot } from '../../../lib/market';
export async function GET() { return Response.json(await getMarketSnapshot()); }
