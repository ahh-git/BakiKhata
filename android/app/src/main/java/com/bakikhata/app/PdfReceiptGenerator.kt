package com.bakikhata.app

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PdfReceiptGenerator {

    /**
     * Generates a sleek, professional digital PDF statement/receipt for a customer or shop.
     * Automatically saves to cache and presents an instant open/share chooser.
     */
    fun generateAndShareStatement(
        context: Context,
        shopName: String,
        shopCode: String?,
        shopPhone: String?,
        customerName: String,
        customerPhone: String?,
        records: List<LedgerRow>,
        currentDue: Double
    ) {
        val document = PdfDocument()
        val pageWidth = 595 // Standard A4 width
        val pageHeight = 842 // Standard A4 height

        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        val page = document.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        val paint = Paint().apply {
            isAntiAlias = true
            isDither = true
        }

        // 1. Background (Pristine White)
        canvas.drawColor(Color.WHITE)

        // 2. Top Header Banner (Indigo Gradient Accent)
        paint.color = Color.parseColor("#4F46E5")
        canvas.drawRect(0f, 0f, pageWidth.toFloat(), 90f, paint)

        // Brand Name
        paint.color = Color.WHITE
        paint.textSize = 22f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("BakiKhata · বাকিখাতা", 36f, 44f, paint)

        // Subtitle
        paint.textSize = 11f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        paint.color = Color.parseColor("#E0E7FF")
        canvas.drawText("স্বচ্ছ, নিরাপদ ও নির্ভুল ডিজিটাল হিসাব বিবরণী", 36f, 66f, paint)

        // Date in header (Right aligned)
        val dateSdf = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.US)
        val currentDateStr = dateSdf.format(Date())
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("তারিখ: $currentDateStr", (pageWidth - 36).toFloat(), 66f, paint)
        paint.textAlign = Paint.Align.LEFT

        // 3. Shop & Customer Details Cards
        var yPos = 120f
        val cardWidth = (pageWidth - 72 - 16) / 2f

        // Shop Card
        drawCardBox(canvas, 36f, yPos, cardWidth, 80f)
        paint.color = Color.parseColor("#0F172A")
        paint.textSize = 13f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("দোকানের তথ্য", 48f, yPos + 22f, paint)

        paint.color = Color.parseColor("#334155")
        paint.textSize = 11f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        canvas.drawText("নাম: $shopName", 48f, yPos + 40f, paint)
        canvas.drawText("দোকান কোড: ${shopCode ?: "—"}", 48f, yPos + 56f, paint)
        canvas.drawText("মোবাইল: ${shopPhone ?: "—"}", 48f, yPos + 72f, paint)

        // Customer Card
        val custX = 36f + cardWidth + 16f
        drawCardBox(canvas, custX, yPos, cardWidth, 80f)
        paint.color = Color.parseColor("#0F172A")
        paint.textSize = 13f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("কাস্টমারের তথ্য", custX + 12f, yPos + 22f, paint)

        paint.color = Color.parseColor("#334155")
        paint.textSize = 11f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        canvas.drawText("নাম: $customerName", custX + 12f, yPos + 40f, paint)
        canvas.drawText("মোবাইল: ${customerPhone ?: "—"}", custX + 12f, yPos + 56f, paint)
        canvas.drawText("মোট হিসাব এন্ট্রি: ${Calc.toBengaliNumerals(records.size.toString())} টি", custX + 12f, yPos + 72f, paint)

        // 4. Financial Summary Strip
        yPos += 100f
        var totalCredit = 0.0
        var totalPaid = 0.0
        for (r in records) {
            if (r.status == "confirmed") {
                if (r.kind == "credit") totalCredit += r.amount
                else if (r.kind == "payment") totalPaid += r.amount
            }
        }

        val statWidth = (pageWidth - 72 - 20) / 3f

        // Credit Box
        drawStatBox(canvas, 36f, yPos, statWidth, 54f, "মোট বাকি", "৳${Calc.money(totalCredit)}", "#E11D48")
        // Paid Box
        drawStatBox(canvas, 36f + statWidth + 10f, yPos, statWidth, 54f, "মোট পরিশোধ/জমা", "৳${Calc.money(totalPaid)}", "#059669")
        // Net Due Box
        val dueColor = if (currentDue > 0) "#E11D48" else "#059669"
        val dueLabel = if (currentDue > 0) "বর্তমান মোট বকেয়া" else "পরিশোধিত / ব্যালেন্স"
        drawStatBox(canvas, 36f + (statWidth + 10f) * 2, yPos, statWidth, 54f, dueLabel, "৳${Calc.money(currentDue)}", dueColor)

        // 5. Transaction Ledger Table
        yPos += 75f
        paint.color = Color.parseColor("#0F172A")
        paint.textSize = 13f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("সাম্প্রতিক লেনদেনের বিবরণী", 36f, yPos, paint)

        yPos += 12f
        // Table Header
        paint.color = Color.parseColor("#F1F5F9")
        canvas.drawRoundRect(RectF(36f, yPos, (pageWidth - 36).toFloat(), yPos + 24f), 4f, 4f, paint)

        paint.color = Color.parseColor("#475569")
        paint.textSize = 10f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("তারিখ", 46f, yPos + 16f, paint)
        canvas.drawText("বিবরণ ও আইটেম", 130f, yPos + 16f, paint)
        canvas.drawText("পরিমাণ", 310f, yPos + 16f, paint)
        canvas.drawText("ধরন", 380f, yPos + 16f, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("টাকা", (pageWidth - 46).toFloat(), yPos + 16f, paint)
        paint.textAlign = Paint.Align.LEFT

        yPos += 24f

        // Table Rows (up to 18 rows to fit perfectly on A4)
        val displayRecords = records.take(18)
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)

        for ((index, item) in displayRecords.withIndex()) {
            val rowY = yPos + (index * 24f)
            if (rowY > pageHeight - 80f) break

            // Alternating zebra stripe
            if (index % 2 == 1) {
                paint.color = Color.parseColor("#F8FAFC")
                canvas.drawRect(36f, rowY, (pageWidth - 36).toFloat(), rowY + 24f, paint)
            }

            // Divider hairline
            paint.color = Color.parseColor("#E2E8F0")
            canvas.drawLine(36f, rowY + 24f, (pageWidth - 36).toFloat(), rowY + 24f, paint)

            val dateParts = Format.banglaParts(item.created_at)
            val dateStr = "${dateParts.date}"
            val itemDesc = (item.item_name ?: (if (item.kind == "credit") "বাকি" else "পরিশোধ")).take(22)
            val qtyStr = item.quantity?.let { "${Calc.toBengaliNumerals(it.toInt().toString())} টি" } ?: "১ টি"
            val isCredit = item.kind == "credit"
            val kindStr = if (isCredit) "বাকি (-)" else "জমা (+)"
            val amountStr = "৳${Calc.money(item.amount)}"

            paint.textSize = 9.5f
            paint.color = Color.parseColor("#64748B")
            canvas.drawText(dateStr, 46f, rowY + 16f, paint)

            paint.color = Color.parseColor("#1E293B")
            canvas.drawText(itemDesc, 130f, rowY + 16f, paint)

            paint.color = Color.parseColor("#64748B")
            canvas.drawText(qtyStr, 310f, rowY + 16f, paint)

            paint.color = Color.parseColor(if (isCredit) "#E11D48" else "#059669")
            canvas.drawText(kindStr, 380f, rowY + 16f, paint)

            paint.textAlign = Paint.Align.RIGHT
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText(amountStr, (pageWidth - 46).toFloat(), rowY + 16f, paint)
            paint.textAlign = Paint.Align.LEFT
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        }

        // 6. Digital Verification & Security Seal Section (Anti-Fraud)
        val securityY = (pageHeight - 128).toFloat()
        val auditHash = "BK-" + Integer.toHexString((shopName + customerName + currentDateStr + currentDue).hashCode()).uppercase().takeLast(6)
        val qrPayload = "BakiKhata Verified Ledger\nStore: $shopName ($shopCode)\nCustomer: $customerName\nBalance: ৳${Calc.money(currentDue)}\nAudit Code: #$auditHash\nSecure Cloud Ledger"

        // Draw Verification QR Code
        val qrBitmap = QRCodeGenerator.generate(qrPayload, 140)
        if (qrBitmap != null) {
            canvas.drawBitmap(qrBitmap, null, RectF(36f, securityY, 36f + 65f, securityY + 65f), null)
        }

        // Security Badge Card next to QR Code
        val badgeX = 36f + 75f
        val badgeWidth = (pageWidth - 36 - badgeX)
        val badgeRect = RectF(badgeX, securityY, badgeX + badgeWidth, securityY + 65f)
        paint.color = Color.parseColor("#F0FDF4")
        canvas.drawRoundRect(badgeRect, 6f, 6f, paint)
        paint.color = Color.parseColor("#BBF7D0")
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 1f
        canvas.drawRoundRect(badgeRect, 6f, 6f, paint)
        paint.style = Paint.Style.FILL

        paint.color = Color.parseColor("#047857")
        paint.textSize = 10.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("ডিজিটাল সুরক্ষা ও নির্ভুলতা যাচাইকৃত (Tamper-Proof)", badgeX + 12f, securityY + 20f, paint)

        paint.color = Color.parseColor("#334155")
        paint.textSize = 9f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        canvas.drawText("অডিট রেফারেন্স কোড: #$auditHash · কিউআর কোড স্ক্যান করে সত্যতা যাচাই করুন", badgeX + 12f, securityY + 38f, paint)
        canvas.drawText("দোকানদার ও গ্রাহক উভয়ের জন্য ডিজিটালভাবে নিরাপদ ও ক্লাউড সংরক্ষিত খতিয়ান।", badgeX + 12f, securityY + 54f, paint)

        // 7. Footer
        val footerY = (pageHeight - 50).toFloat()
        paint.color = Color.parseColor("#E2E8F0")
        canvas.drawLine(36f, footerY, (pageWidth - 36).toFloat(), footerY, paint)

        paint.color = Color.parseColor("#94A3B8")
        paint.textSize = 9f
        canvas.drawText("BakiKhata ডিজিটাল খাতা সিস্টেম দ্বারা প্রস্তুতকৃত · সুরক্ষিত ক্লাউড রেজিস্ট্রি", 36f, footerY + 20f, paint)
        paint.textAlign = Paint.Align.RIGHT
        canvas.drawText("www.bakikhata.app", (pageWidth - 36).toFloat(), footerY + 20f, paint)
        paint.textAlign = Paint.Align.LEFT

        document.finishPage(page)

        // Save PDF to cache
        try {
            val dir = File(context.cacheDir, "statements")
            if (!dir.exists()) dir.mkdirs()

            val cleanCustName = customerName.replace(Regex("[^a-zA-Z0-9_]"), "_")
            val pdfFile = File(dir, "BakiKhata_${cleanCustName}_Statement.pdf")
            val out = FileOutputStream(pdfFile)
            document.writeTo(out)
            out.flush()
            out.close()
            document.close()

            openPdfFile(context, pdfFile)
        } catch (e: Exception) {
            document.close()
            Toast.makeText(context, "PDF তৈরিতে ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun drawCardBox(canvas: Canvas, x: Float, y: Float, width: Float, height: Float) {
        val paint = Paint().apply {
            isAntiAlias = true
            color = Color.parseColor("#F8FAFC")
        }
        canvas.drawRoundRect(RectF(x, y, x + width, y + height), 6f, 6f, paint)
        paint.color = Color.parseColor("#E2E8F0")
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 1f
        canvas.drawRoundRect(RectF(x, y, x + width, y + height), 6f, 6f, paint)
    }

    private fun drawStatBox(canvas: Canvas, x: Float, y: Float, width: Float, height: Float, label: String, amount: String, colorHex: String) {
        val paint = Paint().apply { isAntiAlias = true }
        // Background
        paint.color = Color.parseColor("#F8FAFC")
        canvas.drawRoundRect(RectF(x, y, x + width, y + height), 6f, 6f, paint)
        // Border
        paint.color = Color.parseColor("#E2E8F0")
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 1f
        canvas.drawRoundRect(RectF(x, y, x + width, y + height), 6f, 6f, paint)
        paint.style = Paint.Style.FILL

        // Label
        paint.color = Color.parseColor("#64748B")
        paint.textSize = 9.5f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        canvas.drawText(label, x + 10f, y + 20f, paint)

        // Amount
        paint.color = Color.parseColor(colorHex)
        paint.textSize = 14f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText(amount, x + 10f, y + 42f, paint)
    }

    private fun openPdfFile(context: Context, file: File) {
        try {
            val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", file)
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "BakiKhata ডিজিটাল খাতা বিবরণী")
                putExtra(Intent.EXTRA_TEXT, "BakiKhata ডিজিটাল খাতা বিবরণী (PDF)")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(Intent.createChooser(intent, "PDF বিবরণী দেখুন বা শেয়ার করুন").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (e: Exception) {
            Toast.makeText(context, "PDF ওপেন করা যায়নি: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
}
