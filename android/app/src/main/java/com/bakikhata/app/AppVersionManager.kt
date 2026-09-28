package com.bakikhata.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.net.Uri
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import com.bakikhata.app.databinding.DialogAppUpdateBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

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
                        showUpdateDialog(activity, latest)
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

    private fun showUpdateDialog(activity: Activity, update: AppVersionInfo) {
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

        binding.btnDownloadUpdate.setOnClickListener {
            HapticUtil.tap(it)
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(update.downloadUrl))
                activity.startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(activity, "ব্রাউজার খোলা সম্ভব হয়নি: ${e.message}", Toast.LENGTH_SHORT).show()
            }
            if (!isMandatory) {
                dialog.dismiss()
            }
        }

        binding.btnSkipUpdate.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
        }

        dialog.show()
    }
}
