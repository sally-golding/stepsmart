Mobile app directions

To run the app on an android emulator on Windows, download Android Studio at https://developer.android.com/studio. During installation, choose the standard setup. 
After installation, open Android Studio and click on Virtual Device Manager. Create a new Virtual Device, select Pixel 5, click Next, select the x86_64 option, and then click Finish.

To run the app on an Android mobile device or emulator, run the following commands after downloading Android Studio

  cd app-ui
  npm install
  npm install -g expo-cli
  npx expo install expo-dev-client
  eas build --profile development --platform android

For mobile devices, scan the QR code. Otherwise, when asked to install and run the Android build on an emulator, enter yes. Select Pixel 5 and Android Studio should launch. Run the following command:

  npx expo start

Click fetch development servers and then on the server found.
