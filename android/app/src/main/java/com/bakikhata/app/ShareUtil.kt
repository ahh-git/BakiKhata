package com.bakikhata.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import java.net.URLEncoder

enum class ReminderType {
    GENTLE,
    URGENT,
    STATEMENT
}

object ShareUtil {

    /**
     * Strictly normalizes phone numbers for WhatsApp API and direct intents.
     * Ensures Bangladeshi numbers always start with '8801' and never have leading '0'
     * or non-digit characters that cause WhatsApp lookup failures.
     */
    fun normalizePhoneNumber(phone: String?): String? {
        if (phone.isNullOrBlank()) return null
        val digits = phone.filter { it.isDigit() }
        if (digits.isEmpty()) return null

        return when {
            // e.g. "8801885786369" (13 digits)
            digits.startsWith("880") && digits.length >= 13 -> digits

            // e.g. "01885786369" (11 digits, starts with 0) -> "8801885786369"
            digits.startsWith("0") && digits.length == 11 -> "88$digits"

            // e.g. "1885786369" (10 digits, starts with 1) -> "880$digits"
            digits.length == 10 && digits.startsWith("1") -> "880$digits"

            // Any other Bangladeshi number with leading 0
            digits.startsWith("0") -> "88$digits"

            // International number starting with 00 -> strip 00
            digits.startsWith("00") -> digits.substring(2)

            else -> digits
        }
    }

    /** Backward-compatible alias */
    fun formatPhoneForWhatsApp(phone: String?): String? = normalizePhoneNumber(phone)

    /**
     * Directly launches WhatsApp without redirect browser issues.
     * Supports both regular WhatsApp and WhatsApp Business.
     */
    fun openWhatsApp(context: Context, phone: String?, message: String) {
        val cleanPhone = normalizePhoneNumber(phone)
        val encodedText = try {
            URLEncoder.encode(message, "UTF-8")
        } catch (_: Exception) {
            message
        }

        if (!cleanPhone.isNullOrBlank()) {
            // 1. Try direct WhatsApp package intent (opens app directly with zero browser prompt)
            for (pkg in listOf("com.whatsapp", "com.whatsapp.w4b")) {
                try {
                    val directIntent = Intent(Intent.ACTION_VIEW).apply {
                        data = Uri.parse("whatsapp://send?phone=$cleanPhone&text=$encodedText")
                        setPackage(pkg)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(directIntent)
                    return
                } catch (_: Exception) {
                    // Try next package
                }
            }

            // 2. Try generic whatsapp:// scheme
            try {
                val genericIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("whatsapp://send?phone=$cleanPhone&text=$encodedText")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(genericIntent)
                return
            } catch (_: Exception) {}

            // 3. Try standard HTTPS web link
            try {
                val webUri = Uri.parse("https://api.whatsapp.com/send?phone=$cleanPhone&text=$encodedText")
                val webIntent = Intent(Intent.ACTION_VIEW, webUri).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(webIntent)
                return
            } catch (_: Exception) {}
        }

        // 4. Fallback: native Android share sheet
        shareText(context, message, "মেসেজ পাঠান")
    }

    /** Sends a customizable Bengali WhatsApp payment reminder to a customer */
    fun sendWhatsAppReminder(
        context: Context,
        phone: String?,
        customerName: String,
        shopName: String,
        dueAmount: Double,
        type: ReminderType = ReminderType.GENTLE
    ) {
        val formattedMoney = Calc.money(dueAmount)
        val text = when (type) {
            ReminderType.GENTLE -> """
আসসালামু আলাইকুম $customerName ভাই/আপু,
$shopName-এ আপনার বর্তমান বাকি ৳$formattedMoney।
সুবিধাজনক সময়ে বকেয়া পরিশোধ করার বিনীত অনুরোধ রইল।

- BakiKhata ডিজিটাল খাতা
            """.trimIndent()

            ReminderType.URGENT -> """
জরুরি তাগাদা:
আসসালামু আলাইকুম $customerName ভাই/আপু,
$shopName-এ আপনার বকেয়া ৳$formattedMoney পরিশোধের নির্ধারিত সময় অতিক্রম হয়েছে।
হিসাব হালনাগাদ রাখতে অতি দ্রুত বকেয়া পরিশোধের জন্য বিশেষ অনুরোধ করা হচ্ছে।

- BakiKhata ডিজিটাল খাতা
            """.trimIndent()

            ReminderType.STATEMENT -> """
হিসাবের বিবরণ:
দোকান: $shopName
কাস্টমার: $customerName
মোট বকেয়া: ৳$formattedMoney

BakiKhata অ্যাপে আপনার বিস্তারিত হিসাব যাচাই করতে পারেন।
- BakiKhata ডিজিটাল খাতা
            """.trimIndent()
        }

        openWhatsApp(context, phone, text)
    }

    /** Shares the shop invitation code with friends / customers */
    fun shareShopInvite(
        context: Context,
        shopCode: String,
        shopName: String
    ) {
        val text = """
আমার দোকান '$shopName'-এ বাকি হিসাব স্বচ্ছভাবে দেখতে BakiKhata অ্যাপ ব্যবহার করুন।

দোকান কোড: $shopCode

BakiKhata অ্যাপে 'দোকানে জয়েন করুন' অপশনে গিয়ে এই কোডটি লিখুন অথবা স্ক্যান করুন।
        """.trimIndent()
        shareText(context, text, "দোকানের কোড শেয়ার করুন")
    }

    /** Shares a digital ledger voucher / slip */
    fun shareVoucher(
        context: Context,
        shopName: String,
        shopCode: String?,
        customerName: String?,
        itemName: String?,
        quantity: Double?,
        amount: Double,
        dateFormatted: String,
        totalDue: Double?
    ) {
        val qtyText = if (quantity != null) "${Calc.toBengaliNumerals(quantity.toInt().toString())} টি" else "১ টি"
        val totalDueText = if (totalDue != null) "\nবর্তমান মোট বাকি: ৳${Calc.money(totalDue)}" else ""

        val text = """
BakiKhata ডিজিটাল ভাউচার
────────────────────────────
দোকান: $shopName ${if (!shopCode.isNullOrEmpty()) "(আইডি: $shopCode)" else ""}
কাস্টমার: ${customerName ?: "গ্রাহক"}
খরচ: ${itemName ?: "বাকি"} ($qtyText)
টাকার পরিমাণ: ৳${Calc.money(amount)}
তারিখ: $dateFormatted$totalDueText
────────────────────────────
BakiKhata · নিরাপদ ও স্বচ্ছ খাতা
        """.trimIndent()

        shareText(context, text, "ডিজিটাল ভাউচার শেয়ার করুন")
    }

    fun shareText(context: Context, message: String, title: String = "শেয়ার করুন") {
        try {
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, message)
                type = "text/plain"
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val shareIntent = Intent.createChooser(sendIntent, title)
            shareIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(shareIntent)
        } catch (_: Exception) {
            Toast.makeText(context, "শেয়ার করা সম্ভব হয়নি", Toast.LENGTH_SHORT).show()
        }
    }

    /** Direct phone dialer */
    fun makePhoneCall(context: Context, phone: String?) {
        if (phone.isNullOrBlank()) {
            Toast.makeText(context, "ফোন নম্বর পাওয়া যায়নি", Toast.LENGTH_SHORT).show()
            return
        }
        try {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "ডায়াল করা যায়নি", Toast.LENGTH_SHORT).show()
        }
    }
}
