export async function createEvolutionInstance(instanceData, apiKey) {
    const options = {
        method: 'POST',
        headers: {
            apikey: apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(instanceData)
    };
    const response = await fetch('https://webhook.bkcrm.devsible.com.br/instance/create', options);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }
    return response.json();
}
