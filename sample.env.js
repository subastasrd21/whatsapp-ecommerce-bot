const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '4000',
    DB: 'mongodb+srv://secureapp:xwtjbuZGXRjYD1nf@cluster0.gahyus1.mongodb.net/',
    Meta_WA_VerifyToken: 'VERIFY',
    Meta_WA_accessToken:
        'EAADWGLZAMwMkBO4PRaq1EcSGxYtQ1YaKQfIhFo9jU0PmJLP0Llh7uQeuavZCXNf8ew4evVCq1HvzjxjZAV21SBISxuEwjdw8IZCmJ9exP8J1cHSS4vRy2dMZBGkZBv8Busiy0eh3CiwksWYiQAPP7PfB2N348ADhjcXZAqXbOMOTVWvlmGBqdem08GQ9xTrNVjlqaBjWPzB5Tfmyn0ZD',
    Meta_WA_SenderPhoneNumberId: '105976365901478',
    Meta_WA_wabaId: '109456812217101',
    AWS_KeyId: `AKIAQXQXO7HQ3SWU2LWE`,
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
