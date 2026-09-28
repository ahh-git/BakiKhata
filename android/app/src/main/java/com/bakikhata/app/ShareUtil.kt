package com.bakikhata.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import java.net.URLEncoder

object ShareUtil {

    /** Formats a phone number for international WhatsApp linking (converts 017... to 88017...) */
    fun formatPhoneForWhatsApp(phone: String?): String? {
        if (phone.isNullOrBlank()) return null
        val digits = phone.filter { it.isDigit() }
        return when {
            digits.startsWith("880") -> digits
            digits.startsWith("0") -> "88$digits"
            digits.length == 10 && digits.startsWith("1") -> "880$digits"
            else -> digits
        }
    }

    /** Sends a professional Bengali WhatsApp payment reminder to a customer */
    fun sendWhatsAppReminder(
        context: Context,
        phone: String?,
        customerName: String,
        shopName: String,
        dueAmount: Double
    ) {
        val formattedMoney = Calc.money(dueAmount)
        val text = """
আসসালামু আলাইকুম $customerName ভাই/আপু,
$shopName-এ আপনার বর্তমান বকেয়া ৳$formattedMoney।
সুবিধাজনক সময়ে বকেয়া পরিশোধ করার বিনীত অনুরোধ রইল।

- BakiKhata ডিজিটাল খাতা
        """.trimIndent()

        val cleanPhone = formatPhoneForWhatsApp(phone)
        if (!cleanPhone.isNullOrBlank()) {
            try {
                val encodedText = URLEncoder.encode(text, "UTF-8")
                val uri = Uri.parse("https://api.whatsapp.com/send?phone=$cleanPhone&text=$encodedText")
                val intent = Intent(Intent.ACTION_VIEW, uri)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                return
            } catch (_: Exception) {}
        }

        // Fallback to general share sheet if phone not formatted or WhatsApp direct fails
        shareText(context, text, "বাকি পরিশোধের তাকিদা পাঠান")
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

BakiKhata অ্যাপে 'দোকানে জয়েন করুন' অপশনে গিয়ে এই কোডটি লিখুন।
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
