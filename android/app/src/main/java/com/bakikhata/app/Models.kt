package com.bakikhata.app

data class Profile(
    val id: String,
    val role: String? = null, // "shopkeeper" | "customer"
    val full_name: String? = null,
    val phone: String? = null,
    val shop_code: String? = null,
    val shop_name: String? = null,
    val avatar_url: String? = null,
    val created_at: String? = null
)

data class LedgerRow(
    val id: String,
    val shopkeeper_id: String,
    val customer_id: String,
    val kind: String, // "credit" | "payment"
    val item_name: String? = null,
    val quantity: Double? = null,
    val amount: Double,
    val expression: String? = null,
    val weekday: String? = null,
    val status: String, // "pending" | "confirmed" | "rejected"
    val created_at: String,
    val decided_at: String? = null
)

data class NotificationRow(
    val id: String,
    val user_id: String,
    val title: String,
    val body: String? = null,
    val kind: String? = null,
    val related_ledger_id: String? = null,
    val read_at: String? = null,
    val created_at: String
)

data class ShopLink(
    val id: String,
    val shopkeeper_id: String,
    val customer_id: String,
    val created_at: String? = null
)

data class ShopCard(
    val shop: Profile,
    val due: Double,
    val pending: Double
)

data class CustomerCard(
    val customer: Profile,
    val due: Double
)

data class Alert(
    val id: String,
    val user_id: String,
    val title: String,
    val body: String,
    val created_at: String
)

data class AppVersionInfo(
    val versionCode: Int,
    val versionName: String,
    val minSupportedVersion: Int = 1,
    val downloadUrl: String,
    val releaseNotes: String? = null,
    val isCritical: Boolean = false
)
