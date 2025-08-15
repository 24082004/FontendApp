// app.config.js
export default {
  expo: {
    name: "Cinema App",
    slug: "cinema-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.cinemaapp"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourcompany.cinemaapp"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    // ✅ Stripe configuration for Expo
    plugins: [
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.yourcompany.cinemaapp",
          enableGooglePay: true
        }
      ]
    ],
    // ✅ URL scheme for payment redirects
    scheme: "cinemaapp"
  }
};