const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '7000',
    Meta_WA_VerifyToken: 'VERIFY',
    Meta_WA_accessToken: 'EAADWGLZAMwMkBOzZCvuDKHSZCXIZCwF3kZBEJFmBncZACT0ywrNqrZCS6I1rXTd0omNqnYSmuZCakS1pYImCwrkc1wEpqkZBTEOZBqxz435LkxAb6SktahsKsu0mhAndaOUmabZAfifkvL6eiZALZAhfZAFZBQz9ZC0UeUEJjhpV1uYqd7nphFizJLHqscdb0Ymi6Y0LwbZBZBkKvrNpF7UlAdt54ZD',
    Meta_WA_SenderPhoneNumberId: '105976365901478',
    Meta_WA_wabaId: '109456812217101',
    AWS_KeyId: `AKIAQXQXO7HQT3HHUP6Y`,
    AWS_secretAccessKey: `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`,
    MapboxApiKey: `pk.eyJ1Ijoic2VjdXJlYXBwIiwiYSI6ImNsaXo4MWtmMjA0eHQzZ3FiZDRwNTh5OTMifQ.NAKC3bDfGRKqN55TVqnHug`,
};

const fallback = {
    ...process.env,
    NODE_ENV: undefined,
};

module.exports = (environment) => {
    console.log(`Execution environment selected is: "${environment}"`);
    if (environment === 'production') {
        return production;
    } else if (environment === 'development') {
        return development;
    } else {
        return fallback;
    }
};
