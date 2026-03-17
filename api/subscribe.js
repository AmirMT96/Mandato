// Vercel serverless function — Brevo email signup proxy
// The BREVO_API_KEY environment variable is set in the Vercel dashboard,
// so the key is never exposed in the browser or source code.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'content-type': 'application/json',
        'api-key':      process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds:       [2],   // Brevo list ID — update if needed
        updateEnabled: true,
      }),
    });

    // 201 = created, 204 = already exists (both are success)
    if (response.status === 201 || response.status === 204) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json();
    // Brevo returns 400 with code "duplicate_parameter" when contact exists — treat as success
    if (data.code === 'duplicate_parameter') {
      return res.status(200).json({ success: true });
    }

    return res.status(response.status).json({ error: data.message || 'Brevo error' });
  } catch (err) {
    console.error('Brevo subscribe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
