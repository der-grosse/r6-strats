import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "r6-strats",
      issuer: "https://r6-strats.com",
      jwks: "data:application/json;base64,ew0KICAia2V5cyI6IFsNCiAgICB7DQogICAgICAia3R5IjogIlJTQSIsDQogICAgICAiYWxnIjogIlJTMjU2IiwNCiAgICAgICJrZXlfb3BzIjogWyJ2ZXJpZnkiXSwNCiAgICAgICJraWQiOiAicjYtc3RyYXRzLWtleS0xIiwNCiAgICAgICJ1c2UiOiAic2lnIiwNCiAgICAgICJuIjogIm1ibk42QW03NVlhZlNrSmhzN2RpNGNlbXB2T1hCYXFHYlg3Vm1vX3ZuMGVzTThVQ2VkNVhYM19LU19LNUR5b0ZQeUxXZm1NSzhYYUxpNlJvaXh4UVBvTldTOUlTS2tTYVVoUE1wdmdLQUF2YjRpekhHVXg2QU1jRjA2WDc5aS1qUGtsU0JuSS1NMlk3c29hUE5NQ29MbzRHSnpzMjJCLUtEYk16cE5yY3NrMnJPNmVfWm5CNVVIVG5hbWpIRmlPY1NRbTN2Y0lDZUwtMDJfelB0NU1VX0VlbkpGdUNqMnpRTXNsSTZZcUJRazYzNFllVVY3WWswcEdlSlhRTUxqbWZHNDZMSTd2UlNkNWhUYzlocmVfMzJmT0FSMWRHaENoN1hzcThTVkZpNjctWDk2MHVZQUJHM21QbDN1Nkx4V2lQOG9NV1J3SWJ1UG1UZTZ5VkpVV3pTdyIsDQogICAgICAiZSI6ICJBUUFCIg0KICAgIH0NCiAgXQ0KfQ0K",
      algorithm: "RS256",
    },
  ],
} as AuthConfig;
