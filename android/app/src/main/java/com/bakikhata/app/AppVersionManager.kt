package com.bakikhata.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.net.Uri
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import androidx.core.content.FileProvider
import com.bakikhata.app.databinding.DialogAppUpdateBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

object AppVersionManager {

    val currentVersionCode: Int get() = BuildConfig.VERSION_CODE
    val currentVersionName: String get() = BuildConfig.VERSION_NAME

    fun checkForUpdates(
        activity: Activity,
        scope: CoroutineScope,
        isManualCheck: Boolean = false,
        onComplete: (() -> Unit)? = null
    ) {
        scope.launch {
            try {
                val latest = SupabaseService.getLatestAppVersion()
                withContext(Dispatchers.Main) {
                    if (activity.isFinishing || activity.isDestroyed) return@withContext

                    if (latest != null && latest.versionCode > currentVersionCode) {
                        showUpdateDialog(activity, latest, scope)
                    } else if (isManualCheck) {
                        Toast.makeText(
                            activity,
                            "আপনার অ্যাপটি আপ-টু-ডেট রয়েছে (ভার্সন $currentVersionName)",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    onComplete?.invoke()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    if (isManualCheck && !activity.isFinishing) {
                        Toast.makeText(
                            activity,
                            "আপডেট চেক করা সম্ভব হয়নি। ইন্টারনেট সংযোগ দেখুন।",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    onComplete?.invoke()
                }
            }
        }
    }

    private fun showUpdateDialog(activity: Activity, update: AppVersionInfo, scope: CoroutineScope) {
        val binding = DialogAppUpdateBinding.inflate(LayoutInflater.from(activity))
        val dialog = AlertDialog.Builder(activity)
            .setView(binding.root)
            .create()

        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))

        val isMandatory = update.isCritical || currentVersionCode < update.minSupportedVersion

        if (isMandatory) {
            dialog.setCancelable(false)
            dialog.setCanceledOnTouchOutside(false)
            binding.tvUpdateTag.text = "জরুরি আপডেট"
            binding.tvUpdateTitle.text = "জরুরি অ্যাপ আপডেট আবশ্যক"
            binding.btnSkipUpdate.visibility = View.GONE
        } else {
            dialog.setCancelable(true)
            binding.tvUpdateTag.text = "নতুন ভার্সন রিলিজ"
            binding.tvUpdateTitle.text = "বাকিখাতা অ্যাপের নতুন আপডেট এসেছে"
            binding.btnSkipUpdate.visibility = View.VISIBLE
        }

        binding.tvUpdateVersion.text = "ভার্সন ${update.versionName} (বিল্ড ${update.versionCode})"

        if (!update.releaseNotes.isNullOrBlank()) {
            binding.tvReleaseNotes.text = update.releaseNotes
        }

        // Cache file destination
        val targetApk = File(activity.cacheDir, "BakiKhata_v${update.versionName}.apk")

        // If already downloaded and valid size (> 2MB), allow direct install
        if (targetApk.exists() && targetApk.length() > 2_000_000) {
            binding.btnDownloadUpdate.text = "এখনই ইন্সটল করুন"
            binding.btnDownloadUpdate.setBackgroundResource(R.drawable.bg_install_action_button)
            binding.btnDownloadUpdate.setTextColor(android.graphics.Color.WHITE)
            binding.btnDownloadUpdate.setOnClickListener {
                HapticUtil.tap(it)
                installApk(activity, targetApk)
            }
        } else {
            binding.btnDownloadUpdate.setOnClickListener {
                HapticUtil.tap(it)
                startInAppDownload(activity, update, binding, targetApk, scope)
            }
        }

        binding.btnSkipUpdate.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun startInAppDownload(
        activity: Activity,
        update: AppVersionInfo,
        binding: DialogAppUpdateBinding,
        targetApk: File,
        scope: CoroutineScope
    ) {
        binding.layoutDownloadProgress.visibility = View.VISIBLE
        binding.btnDownloadUpdate.isEnabled = false
        binding.btnDownloadUpdate.text = "ডাউনলোড হচ্ছে..."
        binding.btnSkipUpdate.visibility = View.GONE

        scope.launch(Dispatchers.IO) {
            val tempFile = File(activity.cacheDir, "update_download.tmp")
            var outputStream: FileOutputStream? = null
            var conn: HttpURLConnection? = null

            try {
                conn = openConnectionWithRedirects(update.downloadUrl)
                val totalBytes = conn.contentLength.toLong().takeIf { it > 0 } ?: 8_500_000L
                val inputStream = conn.inputStream
                outputStream = FileOutputStream(tempFile)

                val buffer = ByteArray(8 * 1024)
                var bytesRead: Int
                var downloadedBytes = 0L
                var lastProgressUpdate = 0L

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    outputStream.write(buffer, 0, bytesRead)
                    downloadedBytes += bytesRead

                    val now = System.currentTimeMillis()
                    // Throttle UI updates to every 80ms for buttery-smooth 60fps rendering
                    if (now - lastProgressUpdate > 80 || downloadedBytes >= totalBytes) {
                        lastProgressUpdate = now
                        val progress = ((downloadedBytes * 100) / totalBytes).toInt().coerceIn(0, 100)
                        val dlMb = downloadedBytes / (1024.0 * 1024.0)
                        val totMb = totalBytes / (1024.0 * 1024.0)

                        withContext(Dispatchers.Main) {
                            if (!activity.isFinishing && !activity.isDestroyed) {
                                binding.pbDownloadProgress.progress = progress
                                binding.tvDownloadPercent.text = "${Calc.toBengaliNumerals(progress.toString())}%"
                                val sizeText = "${String.format(Locale.US, "%.1f", dlMb)} MB / ${String.format(Locale.US, "%.1f", totMb)} MB"
                                binding.tvDownloadSize.text = Calc.toBengaliNumerals(sizeText)
                            }
                        }
                    }
                }

                outputStream.flush()
                outputStream.close()
                outputStream = null

                // Rename temp to target APK file
                if (targetApk.exists()) targetApk.delete()
                tempFile.renameTo(targetApk)

                withContext(Dispatchers.Main) {
                    if (!activity.isFinishing && !activity.isDestroyed) {
                        HapticUtil.success(binding.root)
                        binding.pbDownloadProgress.progress = 100
                        binding.tvDownloadPercent.text = "১০০%"
                        binding.tvDownloadStatus.text = "ডাউনলোড সম্পন্ন! ইন্সটল করতে ট্যাপ করুন"
                        binding.btnDownloadUpdate.isEnabled = true
                        binding.btnDownloadUpdate.text = "এখনই ইন্সটল করুন"
                        binding.btnDownloadUpdate.setBackgroundResource(R.drawable.bg_install_action_button)
                        binding.btnDownloadUpdate.setTextColor(android.graphics.Color.WHITE)

                        // Trigger installation immediately
                        installApk(activity, targetApk)

                        binding.btnDownloadUpdate.setOnClickListener {
                            HapticUtil.tap(it)
                            installApk(activity, targetApk)
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    if (!activity.isFinishing && !activity.isDestroyed) {
                        binding.tvDownloadStatus.text = "ইন-অ্যাপ ডাউনলোডে ত্রুটি: ব্রাউজারে খোলা হচ্ছে..."
                        binding.btnDownloadUpdate.isEnabled = true
                        binding.btnDownloadUpdate.text = "ব্রাউজারে ডাউনলোড করুন"
                        binding.btnDownloadUpdate.setOnClickListener {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(update.downloadUrl))
                                activity.startActivity(intent)
                            } catch (_: Exception) {}
                        }
                        binding.btnSkipUpdate.visibility = View.VISIBLE
                    }
                }
            } finally {
                try { outputStream?.close() } catch (_: Exception) {}
                try { conn?.disconnect() } catch (_: Exception) {}
            }
        }
    }

    /**
     * Resolves HTTP 301/302/307 redirects (essential for GitHub Release asset links)
     */
    @Throws(IOException::class)
    private fun openConnectionWithRedirects(initialUrl: String): HttpURLConnection {
        var currentUrl = initialUrl
        var redirects = 0
        while (redirects < 8) {
            val u = URL(currentUrl)
            val conn = u.openConnection() as HttpURLConnection
            conn.connectTimeout = 15000
            conn.readTimeout = 20000
            conn.instanceFollowRedirects = true
            conn.setRequestProperty("User-Agent", "BakiKhata-Android-App/${BuildConfig.VERSION_NAME}")

            val code = conn.responseCode
            if (code in 300..399) {
                val location = conn.getHeaderField("Location")
                conn.disconnect()
                if (!location.isNullOrBlank()) {
                    currentUrl = location
                    redirects++
                    continue
                }
            }
            if (code in 200..299) {
                return conn
            } else {
                throw IOException("Server returned HTTP $code for $currentUrl")
            }
        }
        throw IOException("Too many redirects connecting to $initialUrl")
    }

    /**
     * Installs APK directly using Android's native package installer via FileProvider
     */
    fun installApk(activity: Activity, apkFile: File) {
        if (!apkFile.exists()) {
            Toast.makeText(activity, "ইন্সটল ফাইল পাওয়া যায়নি", Toast.LENGTH_SHORT).show()
            return
        }
        try {
            val apkUri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.provider",
                apkFile
            )
            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activity.startActivity(installIntent)
        } catch (e: Exception) {
            Toast.makeText(activity, "ইন্সটলার চালু করা যায়নি: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
