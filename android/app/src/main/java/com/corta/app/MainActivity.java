package com.corta.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setApplicationId("1:1234567890:android:corta")
                        .setProjectId("corta-app")
                        .setApiKey("AIzaSyDummyKeyForFallbackInit12345")
                        .build();
                FirebaseApp.initializeApp(this, options);
            }
        } catch (Exception e) {
            // Log but don't crash
            e.printStackTrace();
        }
        super.onCreate(savedInstanceState);
    }
}
