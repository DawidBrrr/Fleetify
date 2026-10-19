const isProduction =
  process.env.EAS_BUILD_PROFILE === 'production' ||
  process.env.APP_ENV === 'production';

module.exports = {
  name: 'Fleetify Driver',
  slug: 'fleetify-mobile',
  version: '1.0.0',
  android: {
    package: 'com.fleetify.driver',
  },
  extra: {
    eas: {
      projectId: '926f3c28-c7bf-44cb-a30d-4645ed4d89d0',
    },
  },
  plugins: [
    'expo-font',
    'expo-secure-store',
    'expo-status-bar',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: !isProduction,
        },
      },
    ],
  ],
};
