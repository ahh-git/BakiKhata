package com.bakikhata.app

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object SupabaseService {
    const val SUPABASE_URL = "https://kucaqezwenakrofppxgl.supabase.co"
    const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Y2FxZXp3ZW5ha3JvZnBweGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDQwMTcsImV4cCI6MjEwNjAyMDAxN30.qOI3LcP4-sM7k_TgAlXEAgjkZBEpsRG_89ezq6V1BF4"
    const val GOOGLE_CLIENT_ID = "213084449102-lgrbpo3p3763tl5vpbsj8hm2nckuc1q7.apps.googleusercontent.com"
    const val OAUTH_REDIRECT_URI = "onebaki://login-callback"

    fun getGoogleOAuthUrl(): String {
        val encodedRedirect = java.net.URLEncoder.encode(OAUTH_REDIRECT_URI, "UTF-8")
        return "$SUPABASE_URL/auth/v1/authorize?provider=google&redirect_to=$encodedRedirect"
    }

    private suspend fun request(
        method: String,
        path: String,
        body: String? = null,
        token: String? = null,
        extraHeaders: Map<String, String> = emptyMap()
    ): Pair<Int, String> = withContext(Dispatchers.IO) {
        val url = URL(if (path.startsWith("http")) path else "$SUPABASE_URL$path")
        val conn = url.openConnection() as HttpURLConnection
        try {
            conn.requestMethod = method
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
            conn.setRequestProperty("Authorization", "Bearer ${token ?: SUPABASE_ANON_KEY}")
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Accept", "application/json")

            for ((k, v) in extraHeaders) {
                conn.setRequestProperty(k, v)
            }

            if (body != null && (method == "POST" || method == "PUT" || method == "PATCH")) {
                conn.doOutput = true
                OutputStreamWriter(conn.outputStream, "UTF-8").use { writer ->
                    writer.write(body)
                    writer.flush()
                }
            }

            val statusCode = conn.responseCode
            val stream = if (statusCode in 200..299) conn.inputStream else conn.errorStream
            val resp = stream?.let {
                BufferedReader(InputStreamReader(it, "UTF-8")).use { reader -> reader.readText() }
            } ?: ""

            Pair(statusCode, resp)
        } finally {
            conn.disconnect()
        }
    }

    suspend fun getProfile(userId: String, token: String): Profile? {
        val (code, resp) = request("GET", "/rest/v1/profiles?id=eq.$userId", token = token)
        if (code !in 200..299) return null
        val arr = JSONArray(resp)
        if (arr.length() == 0) return null
        val obj = arr.getJSONObject(0)
        return parseProfile(obj)
    }

    suspend fun upsertProfile(
        id: String,
        fullName: String,
        phone: String,
        role: String,
        shopName: String? = null,
        avatarUrl: String? = null,
        token: String
    ): Result<Unit> {
        val json = JSONObject().apply {
            put("id", id)
            put("full_name", fullName)
            put("phone", phone)
            put("role", role)
            if (shopName != null) put("shop_name", shopName)
            if (!avatarUrl.isNullOrEmpty()) put("avatar_url", avatarUrl)
        }
        val (code, resp) = request(
            "POST",
            "/rest/v1/profiles",
            body = json.toString(),
            token = token,
            extraHeaders = mapOf("Prefer" to "resolution=merge-duplicates")
        )
        return if (code in 200..299) Result.success(Unit) else Result.failure(Exception("Failed to update profile: $resp"))
    }

    suspend fun updateProfileAvatar(userId: String, avatarUrl: String?, token: String): Result<Unit> {
        val json = JSONObject().apply {
            if (avatarUrl.isNullOrEmpty()) {
                put("avatar_url", JSONObject.NULL)
            } else {
                put("avatar_url", avatarUrl)
            }
        }
        val (code, resp) = request(
            "PATCH",
            "/rest/v1/profiles?id=eq.$userId",
            body = json.toString(),
            token = token
        )
        return if (code in 200..299) Result.success(Unit) else Result.failure(Exception("Failed to update avatar: $resp"))
    }

    suspend fun claimShopCode(token: String): Result<String> {
        val (code, resp) = request("POST", "/rest/v1/rpc/claim_shop_code", body = "{}", token = token)
        return if (code in 200..299) {
            val clean = resp.trim().replace("\"", "")
            Result.success(clean)
        } else {
            Result.failure(Exception("Failed to claim shop code: $resp"))
        }
    }

    suspend fun balanceFor(shopId: String, customerId: String, token: String): Double {
        val json = JSONObject().apply {
            put("p_shop", shopId)
            put("p_customer", customerId)
        }
        val (code, resp) = request("POST", "/rest/v1/rpc/balance_for", body = json.toString(), token = token)
        return if (code in 200..299) {
            resp.trim().toDoubleOrNull() ?: 0.0
        } else 0.0
    }

    suspend fun decidePayment(id: String, accept: Boolean, token: String): Result<Unit> {
        val json = JSONObject().apply {
            put("p_id", id)
            put("p_accept", accept)
        }
        val (code, resp) = request("POST", "/rest/v1/rpc/decide_payment", body = json.toString(), token = token)
        return if (code in 200..299) Result.success(Unit) else Result.failure(Exception(resp))
    }

    suspend fun getCustomerShopLinks(customerId: String, token: String): List<String> {
        val (code, resp) = request("GET", "/rest/v1/shop_links?customer_id=eq.$customerId", token = token)
        if (code !in 200..299) return emptyList()
        val arr = JSONArray(resp)
        val list = mutableListOf<String>()
        for (i in 0 until arr.length()) {
            list.add(arr.getJSONObject(i).getString("shopkeeper_id"))
        }
        return list
    }

    suspend fun getShopkeeperCustomerLinks(shopkeeperId: String, token: String): List<String> {
        val (code, resp) = request("GET", "/rest/v1/shop_links?shopkeeper_id=eq.$shopkeeperId", token = token)
        if (code !in 200..299) return emptyList()
        val arr = JSONArray(resp)
        val list = mutableListOf<String>()
        for (i in 0 until arr.length()) {
            list.add(arr.getJSONObject(i).getString("customer_id"))
        }
        return list
    }

    suspend fun getProfiles(ids: List<String>, token: String): List<Profile> {
        if (ids.isEmpty()) return emptyList()
        val filter = ids.joinToString(",")
        val (code, resp) = request("GET", "/rest/v1/profiles?id=in.($filter)", token = token)
        if (code !in 200..299) return emptyList()
        val arr = JSONArray(resp)
        val list = mutableListOf<Profile>()
        for (i in 0 until arr.length()) {
            list.add(parseProfile(arr.getJSONObject(i)))
        }
        return list
    }

    suspend fun findShopByCode(code: String, token: String): Profile? {
        val padded = code.trim().padStart(4, '0')
        val (c, resp) = request("GET", "/rest/v1/profiles?shop_code=eq.$padded&role=eq.shopkeeper", token = token)
        if (c !in 200..299) return null
        val arr = JSONArray(resp)
        if (arr.length() == 0) return null
        return parseProfile(arr.getJSONObject(0))
    }

    suspend fun joinShop(shopkeeperId: String, customerId: String, token: String): Result<Unit> {
        val json = JSONObject().apply {
            put("shopkeeper_id", shopkeeperId)
            put("customer_id", customerId)
        }
        val (code, resp) = request("POST", "/rest/v1/shop_links", body = json.toString(), token = token)
        return if (code in 200..299 || resp.contains("duplicate") || resp.contains("unique")) {
            Result.success(Unit)
        } else {
            Result.failure(Exception(resp))
        }
    }

    suspend fun addCredit(
        shopkeeperId: String,
        customerId: String,
        itemName: String,
        quantity: Double,
        amount: Double,
        expression: String,
        weekday: String,
        token: String
    ): Result<Unit> {
        val json = JSONObject().apply {
            put("shopkeeper_id", shopkeeperId)
            put("customer_id", customerId)
            put("kind", "credit")
            put("item_name", itemName)
            put("quantity", quantity)
            put("amount", amount)
            put("expression", expression)
            put("weekday", weekday)
            put("status", "confirmed")
        }
        val (code, resp) = request("POST", "/rest/v1/ledger", body = json.toString(), token = token)
        return if (code in 200..299) Result.success(Unit) else Result.failure(Exception(resp))
    }

    suspend fun requestPayment(
        shopkeeperId: String,
        customerId: String,
        amount: Double,
        expression: String,
        weekday: String,
        token: String
    ): Result<Unit> {
        val json = JSONObject().apply {
            put("shopkeeper_id", shopkeeperId)
            put("customer_id", customerId)
            put("kind", "payment")
            put("item_name", "à¦ªà¦°à¦¿à¦¶à§‹à¦§")
            put("amount", amount)
            put("expression", expression)
            put("weekday", weekday)
            put("status", "pending")
        }
        val (code, resp) = request("POST", "/rest/v1/ledger", body = json.toString(), token = token)
        return if (code in 200..299) Result.success(Unit) else Result.failure(Exception(resp))
    }

    suspend fun getLedger(shopkeeperId: String, customerId: String?, token: String): List<LedgerRow> {
        val path = if (customerId != null) {
            "/rest/v1/ledger?shopkeeper_id=eq.$shopkeeperId&customer_id=eq.$customerId&order=created_at.desc"
        } else {
            "/rest/v1/ledger?shopkeeper_id=eq.$shopkeeperId&order=created_at.desc"
        }
        val (code, resp) = request("GET", path, token = token)
        if (code !in 200..299) return emptyList()
        val arr = JSONArray(resp)
        val list = mutableListOf<LedgerRow>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            list.add(
                LedgerRow(
                    id = o.getString("id"),
                    shopkeeper_id = o.getString("shopkeeper_id"),
                    customer_id = o.getString("customer_id"),
                    kind = o.getString("kind"),
                    item_name = o.optString("item_name").takeIf { it.isNotEmpty() && it != "null" },
                    quantity = if (o.has("quantity") && !o.isNull("quantity")) o.optDouble("quantity") else null,
                    amount = o.getDouble("amount"),
                    expression = o.optString("expression").takeIf { it.isNotEmpty() && it != "null" },
                    weekday = o.optString("weekday").takeIf { it.isNotEmpty() && it != "null" },
                    status = o.getString("status"),
                    created_at = o.getString("created_at"),
                    decided_at = o.optString("decided_at").takeIf { it.isNotEmpty() && it != "null" }
                )
            )
        }
        return list
    }

    suspend fun getPendingPaymentsForShop(shopkeeperId: String, token: String): List<LedgerRow> {
        val path = "/rest/v1/ledger?shopkeeper_id=eq.$shopkeeperId&kind=eq.payment&status=eq.pending&order=created_at.desc"
        val (code, resp) = request("GET", path, token = token)
        if (code !in 200..299) return emptyList()
        val arr = JSONArray(resp)
        val list = mutableListOf<LedgerRow>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            list.add(
                LedgerRow(
                    id = o.getString("id"),
                    shopkeeper_id = o.getString("shopkeeper_id"),
                    customer_id = o.getString("customer_id"),
                    kind = o.getString("kind"),
                    item_name = o.optString("item_name").takeIf { it.isNotEmpty() && it != "null" },
                    quantity = if (o.has("quantity") && !o.isNull("quantity")) o.optDouble("quantity") else null,
                    amount = o.getDouble("amount"),
                    expression = o.optString("expression").takeIf { it.isNotEmpty() && it != "null" },
                    weekday = o.optString("weekday").takeIf { it.isNotEmpty() && it != "null" },
                    status = o.getString("status"),
                    created_at = o.getString("created_at"),
                    decided_at = o.optString("decided_at").takeIf { it.isNotEmpty() && it != "null" }
                )
            )
        }
        return list
    }

    suspend fun getPendingPaymentsAmount(shopkeeperId: String, customerId: String, token: String): Double {
        val path = "/rest/v1/ledger?shopkeeper_id=eq.$shopkeeperId&customer_id=eq.$customerId&kind=eq.payment&status=eq.pending"
        val (code, resp) = request("GET", path, token = token)
        if (code !in 200..299) return 0.0
        val arr = JSONArray(resp)
        var total = 0.0
        for (i in 0 until arr.length()) {
            total += arr.getJSONObject(i).optDouble("amount", 0.0)
        }
        return total
    }

    suspend fun getNotifications(userId: String, token: String): List<NotificationRow> {
        val (code, resp) = request("GET", "/rest/v1/notifications?user_id=eq.$userId&order=created_at.desc", token = token)
        if (code !in 200..299) return emptyList()
        val arr = JSONArray(resp)
        val list = mutableListOf<NotificationRow>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            list.add(
                NotificationRow(
                    id = o.getString("id"),
                    user_id = o.getString("user_id"),
                    title = o.getString("title"),
                    body = o.optString("body").takeIf { it.isNotEmpty() && it != "null" },
                    kind = o.optString("kind").takeIf { it.isNotEmpty() && it != "null" },
                    related_ledger_id = o.optString("related_ledger_id").takeIf { it.isNotEmpty() && it != "null" },
                    read_at = o.optString("read_at").takeIf { it.isNotEmpty() && it != "null" },
                    created_at = o.getString("created_at")
                )
            )
        }
        return list
    }

    // Direct Auth with email & password (useful for test accounts / offline demo login)
    suspend fun signInWithPassword(email: String, pass: String): Result<Pair<String, String>> {
        val json = JSONObject().apply {
            put("email", email)
            put("password", pass)
        }
        val (code, resp) = request("POST", "/auth/v1/token?grant_type=password", body = json.toString())
        return if (code in 200..299) {
            val obj = JSONObject(resp)
            val accessToken = obj.getString("access_token")
            val user = obj.getJSONObject("user")
            val userId = user.getString("id")
            Result.success(Pair(accessToken, userId))
        } else {
            Result.failure(Exception("Sign in failed: $resp"))
        }
    }

    suspend fun signUpWithPassword(email: String, pass: String, name: String): Result<Pair<String, String>> {
        val json = JSONObject().apply {
            put("email", email)
            put("password", pass)
            put("data", JSONObject().apply { put("full_name", name) })
        }
        val (code, resp) = request("POST", "/auth/v1/signup", body = json.toString())
        return if (code in 200..299) {
            val obj = JSONObject(resp)
            val accessToken = obj.optString("access_token")
            val user = obj.getJSONObject("user")
            val userId = user.getString("id")
            Result.success(Pair(accessToken, userId))
        } else {
            Result.failure(Exception("Sign up failed: $resp"))
        }
    }

    // Fetch actual user record using access token - captures email, Google avatar, and name
    suspend fun getCurrentUser(token: String): AuthUserInfo? {
        val (code, resp) = request("GET", "/auth/v1/user", token = token)
        if (code !in 200..299) return null
        return try {
            val obj = JSONObject(resp)
            val id = obj.getString("id")
            val email = obj.optString("email").takeIf { it.isNotEmpty() && it != "null" }

            var avatarUrl: String? = null
            var fullName: String? = null

            val meta = obj.optJSONObject("user_metadata")
            if (meta != null) {
                avatarUrl = meta.optString("avatar_url").takeIf { it.isNotEmpty() && it != "null" }
                    ?: meta.optString("picture").takeIf { it.isNotEmpty() && it != "null" }
                fullName = meta.optString("full_name").takeIf { it.isNotEmpty() && it != "null" }
                    ?: meta.optString("name").takeIf { it.isNotEmpty() && it != "null" }
            }

            if (avatarUrl == null) {
                val identities = obj.optJSONArray("identities")
                if (identities != null && identities.length() > 0) {
                    val idData = identities.getJSONObject(0).optJSONObject("identity_data")
                    if (idData != null) {
                        avatarUrl = idData.optString("avatar_url").takeIf { it.isNotEmpty() && it != "null" }
                            ?: idData.optString("picture").takeIf { it.isNotEmpty() && it != "null" }
                        if (fullName == null) {
                            fullName = idData.optString("full_name").takeIf { it.isNotEmpty() && it != "null" }
                                ?: idData.optString("name").takeIf { it.isNotEmpty() && it != "null" }
                        }
                    }
                }
            }

            AuthUserInfo(id = id, email = email, avatarUrl = avatarUrl, fullName = fullName)
        } catch (e: Exception) {
            null
        }
    }

    private fun parseProfile(obj: JSONObject): Profile {
        return Profile(
            id = obj.getString("id"),
            role = obj.optString("role").takeIf { it.isNotEmpty() && it != "null" },
            full_name = obj.optString("full_name").takeIf { it.isNotEmpty() && it != "null" },
            phone = obj.optString("phone").takeIf { it.isNotEmpty() && it != "null" },
            shop_code = obj.optString("shop_code").takeIf { it.isNotEmpty() && it != "null" },
            shop_name = obj.optString("shop_name").takeIf { it.isNotEmpty() && it != "null" },
            avatar_url = obj.optString("avatar_url").takeIf { it.isNotEmpty() && it != "null" },
            created_at = obj.optString("created_at").takeIf { it.isNotEmpty() && it != "null" }
        )
    }

    suspend fun joinShopByCode(code: String, customerId: String, token: String): Result<Unit> {
        val shop = findShopByCode(code, token)
            ?: return Result.failure(Exception("দোকান পাওয়া যায়নি। আইডি চেক করুন।"))
        return joinShop(shop.id, customerId, token)
    }

    suspend fun getAlerts(userId: String, token: String): List<Alert> {
        // Try notifications table first, fallback to empty list
        val (code, resp) = request("GET", "/rest/v1/notifications?user_id=eq.$userId&order=created_at.desc", token = token)
        if (code !in 200..299) return emptyList()
        return try {
            val arr = JSONArray(resp)
            val list = mutableListOf<Alert>()
            for (i in 0 until arr.length()) {
                val o = arr.getJSONObject(i)
                list.add(
                    Alert(
                        id = o.getString("id"),
                        user_id = o.getString("user_id"),
                        title = o.optString("title", "নোটিফিকেশন"),
                        body = o.optString("body", ""),
                        created_at = o.optString("created_at", "")
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getLatestAppVersion(): AppVersionInfo? {
        val (code, resp) = request("GET", "/rest/v1/app_version?select=*&order=version_code.desc&limit=1")
        if (code !in 200..299) return null
        return try {
            val arr = JSONArray(resp)
            if (arr.length() == 0) return null
            val o = arr.getJSONObject(0)
            AppVersionInfo(
                versionCode = o.getInt("version_code"),
                versionName = o.getString("version_name"),
                minSupportedVersion = o.optInt("min_supported_version", 1),
                downloadUrl = o.getString("download_url"),
                releaseNotes = o.optString("release_notes").takeIf { it.isNotEmpty() && it != "null" },
                isCritical = o.optBoolean("is_critical", false)
            )
        } catch (e: Exception) {
            null
        }
    }
}

