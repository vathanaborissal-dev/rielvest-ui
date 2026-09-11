# Deploying the RielVest UI to Vercel

This is the frontend only. It renders on the server and reads everything from the RielVest API — deploy that first.

**Full walkthrough, including the API and the CORS step that connects the two:**
[rielvest-api → DEPLOYMENT.md](https://github.com/vathanaborissal-dev/rielvest-api/blob/main/DEPLOYMENT.md)

---

## Quick version

1. Vercel → **Add New → Project** → import `rielvest-ui`.
2. Framework Preset: **Next.js** (auto-detected).
3. Set the three environment variables below.
4. Deploy.

| Variable | Value |
|---|---|
| `RIELVEST_API_URL` | `https://<your-api>.vercel.app/api` |
| `NEXT_PUBLIC_RIELVEST_API_URL` | same value |
| `NEXT_PUBLIC_CSX_STREAM_URL` | `wss://api.csx.com.kh/tradingview/raw_websockets?webSocketToken=AacCeEsStOk3n1` |

Both API URL variables are required and they are not redundant. Pages render on the server using `RIELVEST_API_URL`; the **price chart** and the **⌘K command palette** fetch from the browser using the `NEXT_PUBLIC_` one. Include `/api`, no trailing slash.

---

## After deploying

Add this UI's origin to the API's `CORS_ORIGINS`, then redeploy the API — otherwise the chart and the command palette fail with a CORS error while the rest of the site works:

```
CORS_ORIGINS=https://<your-ui>.vercel.app,*.vercel.app
```

---

## Notes

- `vercel.json` pins functions to `sin1` (Singapore) to sit near the API and its database. Vercel's default is `iad1` (Washington), which adds a Pacific round trip to every page render.
- Hobby allows one function region, so `sin1` is the whole budget — spend it next to the data.
- No database access and no secrets live here. Everything sensitive is in the API.
