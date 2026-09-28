package com.bakikhata.app

import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class BanglaDateParts(
    val weekday: String,
    val date: String,
    val hour: String,
    val minute: String,
    val second: String,
    val clock: String
)

object Format {
    val DAYS = arrayOf("রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার")
    val MONTHS = arrayOf(
        "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
        "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    )

    fun banglaParts(iso: String): BanglaDateParts {
        val cal = Calendar.getInstance()
        try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            sdf.timeZone = TimeZone.getTimeZone("UTC")
            val cleanIso = iso.split(".")[0].replace("Z", "")
            val parsed = sdf.parse(cleanIso)
            if (parsed != null) {
                cal.timeZone = TimeZone.getDefault()
                cal.time = parsed
            }
        } catch (_: Exception) {
            // fallback to current time
        }

        val dayOfWeekIndex = cal.get(Calendar.DAY_OF_WEEK) - 1 // Calendar Sunday is 1
        val weekday = DAYS[dayOfWeekIndex.coerceIn(0, 6)]

        val day = cal.get(Calendar.DAY_OF_MONTH)
        val month = MONTHS[cal.get(Calendar.MONTH).coerceIn(0, 11)]
        val year = cal.get(Calendar.YEAR)
        val dateStr = "${Calc.toBengaliNumerals(day.toString())} $month, ${Calc.toBengaliNumerals(year.toString())}"

        val hh = cal.get(Calendar.HOUR_OF_DAY)
        val mm = cal.get(Calendar.MINUTE)
        val ss = cal.get(Calendar.SECOND)

        val hhStr = String.format(Locale.US, "%02d", hh)
        val mmStr = String.format(Locale.US, "%02d", mm)
        val ssStr = String.format(Locale.US, "%02d", ss)

        return BanglaDateParts(
            weekday = weekday,
            date = dateStr,
            hour = Calc.toBengaliNumerals(hhStr),
            minute = Calc.toBengaliNumerals(mmStr),
            second = Calc.toBengaliNumerals(ssStr),
            clock = "${Calc.toBengaliNumerals(hhStr)}:${Calc.toBengaliNumerals(mmStr)}"
        )
    }

    fun currentWeekday(): String {
        val cal = Calendar.getInstance()
        val dayOfWeekIndex = cal.get(Calendar.DAY_OF_WEEK) - 1
        return DAYS[dayOfWeekIndex.coerceIn(0, 6)]
    }

    fun waLink(phone: String?, text: String): String {
        if (phone.isNullOrEmpty()) return "#"
        val cleanPhone = phone.replace(Regex("[^0-9]"), "")
        val encodedText = try {
            URLEncoder.encode(text, "UTF-8")
        } catch (_: Exception) {
            text
        }
        return "https://wa.me/$cleanPhone?text=$encodedText"
    }
}
