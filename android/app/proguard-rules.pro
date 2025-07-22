# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# React Native SVG
-keep class com.horcrux.svg.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native DateTime Picker
-keep class com.reactcommunity.rndatetimepicker.** { *; }

# 移除日誌輸出以減少 APK 大小
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}

# 保持 native 方法
-keepclasseswithmembernames class * {
    native <methods>;
}

# 保持 Parcelable 實現
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}

# 保持 Serializable 實現
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
