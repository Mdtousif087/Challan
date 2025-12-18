export default async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // Only allow /api/challan
    if (path !== '/api/challan') {
        // Optional: serve simple docs on root, or just 404
        if (path === '/') {
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(getMiniDocs());
        }
        return res.status(404).json({ error: 'Only /api/challan is supported' });
    }

    const vehicleNumber = url.searchParams.get('vehicle_number');
    if (!vehicleNumber) {
        return res.status(400).json({
            error: 'Missing required parameter: vehicle_number',
            example: `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/challan?vehicle_number=DL10AB1234`
        });
    }

    const challanUrl = `https://www.acko.com/vas/api/v1/challans/?registration-number=${encodeURIComponent(vehicleNumber)}&source=CHALLAN_PAGE`;

    const headers = {
        'Host': 'www.acko.com',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Sec-Ch-Ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Linux"',
        'Origin': 'https://www.acko.com',
        'Referer': 'https://www.acko.com/',
        'Cookie': 'trackerid=c7482668-0b20-43aa-b4e7-180211be4868; FPID=FPID2.2.vOOop48FBgBBHfz9DTTReXHKcB6XgHEEpdg1n988ZiI%3D.1756586825; FPAU=1.2.577647451.1756586828; _gtmeec=e30%3D; _fbp=fb.1.1756586827824.1865711757; user_id=xdwK3S6Qg0yZVOxOeFWWLg:1756587589955:6e9f1879506e024e198c438011da65b37afbe84c; _gcl_au=1.1.1799176003.1758281461; _hjSessionUser_3514615=eyJpZCI6ImFjNTczNDYzLWZiNzEtNTc0NS1hZjNkLTQ4MDI2ODYwZTIzMCIsImNyZGF0ZWQiOjE3NTgyODE0OTY5NDYsImV4aXN0aW5nIjp0cnVlfQ==; wisepops_props=%7B%22phoneNumber%22%3A%229900341874%22%2C%22trackerId%22%3A%22c7482668-0b20-43aa-b4e7-180211be4868%22%2C%22registrationNumber%22%3A%22MH01AB1234%22%2C%22proposalId%22%3A%22PcgC6ZOwyzj_v7K6ijdIGA%22%7D; ajs_anonymous_id=c7482668-0b20-43aa-b4e7-180211be4868; ajs_user_id=xdwK3S6Qg0yZVOxOeFWWLg; _ga=GA1.1.1660367126.1756586825; __cf_bm=6ZAxLsPPTZCT9LVrIJF1MFrTn9WjWYnJWVcntSPW.io-1763618863-1.0.1.1-4qIpzes2gSXo.XTnAw_E1WSYQ5a27k4Asdm9qTnJW1azmF_ijlCPTA3nS1Cs56iFYWuI1qG6SaRsKeN.YVAHgrURS5W2bZDhO6twB6_6xiw'
    };

    try {
        const response = await fetch(challanUrl, { headers });
        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { error: 'Invalid JSON from Acko', raw: text };
        }

        const result = {
            vehicle_number: vehicleNumber,
            fetched_at: new Date().toISOString(),
            status: response.status,
            data: data
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({
            error: 'Request failed',
            message: err.message,
            vehicle_number: vehicleNumber
        });
    }
}

function getMiniDocs() {
    return `<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 800px; margin: 40px auto;">
  <h1>Challan Info API</h1>
  <p><strong>Endpoint:</strong> <code>/api/challan?vehicle_number=DL10AB1234</code></p>
  <p>Example: <a href="/api/challan?vehicle_number=UP32QP0001">/api/challan?vehicle_number=UP32QP0001</a></p>
  <p>Status: <a href="/api/challan?vehicle_number=DL10AB1234">Test API</a></p>
  <hr>
  <small>Powered by Vercel • Only for educational use</small>
</body></html>`;
}