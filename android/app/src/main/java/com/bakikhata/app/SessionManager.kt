package com.bakikhata.app

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("onebaki_session", Context.MODE_PRIVATE)

    fun saveSession(accessToken: String, refreshToken: String?, userId: String, email: String?) {
        prefs.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)
            .putString("user_id", userId)
            .putString("user_email", email)
            .apply()
    }

    fun getAccessToken(): String? = prefs.getString("access_token", null)
    fun getRefreshToken(): String? = prefs.getString("refresh_token", null)
    fun getUserId(): String? = prefs.getString("user_id", null)
    fun getUserEmail(): String? = prefs.getString("user_email", null)

    fun isLoggedIn(): Boolean = !getAccessToken().isNullOrEmpty() && !getUserId().isNullOrEmpty()

    fun savePendingAvatarUrl(url: String?) {
        prefs.edit().putString("pending_avatar_url", url).apply()
    }
    fun getPendingAvatarUrl(): String? = prefs.getString("pending_avatar_url", null)

    fun isAppLockEnabled(): Boolean = prefs.getBoolean("app_lock_enabled", false)
    fun setAppLockEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("app_lock_enabled", enabled).apply()
    }

    fun getAppPin(): String? = prefs.getString("app_pin", null)
    fun setAppPin(pin: String?) {
        prefs.edit().putString("app_pin", pin).apply()
    }

    fun saveProfile(profile: Profile) {
        val json = JSONObject().apply {
            put("id", profile.id)
            put("role", profile.role)
            put("full_name", profile.full_name)
            put("phone", profile.phone)
            put("shop_code", profile.shop_code)
            put("shop_name", profile.shop_name)
            put("avatar_url", profile.avatar_url)
            put("created_at", profile.created_at)
        }
        prefs.edit().putString("cached_profile", json.toString()).apply()
    }

    fun getProfile(): Profile? {
        val str = prefs.getString("cached_profile", null) ?: return null
        return try {
            val json = JSONObject(str)
            Profile(
                id = json.optString("id"),
                role = json.optString("role").takeIf { it.isNotEmpty() && it != "null" },
                full_name = json.optString("full_name").takeIf { it.isNotEmpty() && it != "null" },
                phone = json.optString("phone").takeIf { it.isNotEmpty() && it != "null" },
                shop_code = json.optString("shop_code").takeIf { it.isNotEmpty() && it != "null" },
                shop_name = json.optString("shop_name").takeIf { it.isNotEmpty() && it != "null" },
                avatar_url = json.optString("avatar_url").takeIf { it.isNotEmpty() && it != "null" },
                created_at = json.optString("created_at").takeIf { it.isNotEmpty() && it != "null" }
            )
        } catch (_: Exception) {
            null
        }
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
