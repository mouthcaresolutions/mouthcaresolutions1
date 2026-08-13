const ZAI = require('z-ai-web-dev-sdk').default;

async function test() {
  try {
    console.log('Creating ZAI instance...');
    const zai = await ZAI.create();
    console.log('ZAI created successfully');
    console.log('Available methods:', Object.keys(zai).filter(k => typeof zai[k] === 'function').join(', '));
    
    const result = await zai.createChatCompletion({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: 'Say hello in 10 words about dentistry' }],
      max_tokens: 100,
      temperature: 0.5,
    });
    console.log('Success! Content:', result?.choices?.[0]?.message?.content?.substring(0, 200));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

test();
