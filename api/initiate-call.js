export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check / simple verification
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, message: 'initiate-call endpoint is reachable' });
  }

  // Only allow POST requests beyond this point
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { VAPI_PRIVATE_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID } = process.env;

    // Validate server configuration early
    if (!VAPI_PRIVATE_KEY || !VAPI_ASSISTANT_ID || !VAPI_PHONE_NUMBER_ID) {
      return res.status(500).json({
        success: false,
        message: 'Server misconfigured: missing Vapi credentials.'
      });
    }

    // Common mistake: using a public key (pk_) on server requests
    if (VAPI_PRIVATE_KEY.startsWith('pk_')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid key: detected a public key. Use your Vapi secret key that starts with sk_ for server calls.'
      });
    }

    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Please include country code.' 
      });
    }

    console.log('Initiating call to:', phoneNumber);

    // Make VAPI API call
    const vapiResponse = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'outboundPhoneCall',
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: phoneNumber
        },
        assistantId: VAPI_ASSISTANT_ID
      })
    });

    const vapiData = await vapiResponse.json();
    
    console.log('VAPI Response Status:', vapiResponse.status);
    console.log('VAPI Response Data:', vapiData);

    if (vapiResponse.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Call initiated successfully',
        callId: vapiData.id
      });
    } else {
      console.error('VAPI Error:', vapiData);
      return res.status(vapiResponse.status).json({ 
        success: false, 
        message: vapiData.message || 'Failed to initiate call with VAPI' 
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.' 
    });
  }
}


