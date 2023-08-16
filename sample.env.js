const production = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
};

const development = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: '7000',
    Meta_WA_VerifyToken: 'VERIFY',
    Meta_WA_accessToken: 'EAADWGLZAMwMkBO4vgkG8LRBo2tx0ux9R2ZC8mMhNqYGESb8xayZCuCF9ZC5QNOWUzjCLsy1nKx6t3kx9pSKFBUjdRt9gTW4TQSt15VkJsYv9lEK8fVAbnMsGw5ZCfmNZAkFe0CxLFpZCbdH6x6q49JSpD2aQnbwYGjgoODlqom6POOwOZCzy3k2UoGFz6IRhAhUzeUl9Nsr75kkeRJ4ZD',
    Meta_WA_SenderPhoneNumberId: '105976365901478',
    Meta_WA_wabaId: '109456812217101',
    AWS_KeyId: `AKIAQXQXO7HQ577VDP2K`,
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
