export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL,
    schema: process.env.DATABASE_SCHEMA || 'public',
  },

  firebase: {
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    webApiKey: process.env.WEB_API_KEY,
  },
});
