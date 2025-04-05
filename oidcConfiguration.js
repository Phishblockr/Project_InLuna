const oidcConfiguration = {
    // Define the clients that can use your provider.
    clients: [
      {
        client_id: process.env.OIDC_CLIENT_ID,
        client_secret: process.env.OIDC_CLIENT_SECRET,
        grant_types: ['authorization_code'],
        redirect_uris: [`${process.env.OIDC_REDIRECT_CALLBACK}`]
      }
    ],
  
    // Define the claims that should be included based on scopes.
    claims: {
      openid: ['sub'],
      profile: ['name', 'family_name', 'given_name', 'locale'],
      email: ['email', 'email_verified']
    },
  
    // Interaction configuration to control how login/consent screens are presented.
    interactions: {
      // This function returns the URL for a given interaction.
      // For instance, you could route interactions to a custom login page.
      url(ctx, interaction) {
        return `/interaction/${interaction.uid}`;
      }
    },
  
    // Optionally, add token lifetimes, subject types, and other options.
    ttl: {
      // For example, access token lifetime (in seconds).
      AccessToken: 3600
    },
    cookies: {
        keys: [`${process.env.OIDC_RAND_SECRET_1}`, `${process.env.OIDC_RAND_SECRET_2}`],
      },
  };
  
  export default oidcConfiguration;
  