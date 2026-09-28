package com.bakikhata.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.net.Uri
import android.util.Base64
import android.util.LruCache
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

object ImageLoader {

    // 1/8th of available runtime memory for bitmap cache
    private val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    private val cacheSize = maxMemory / 8

    private val memoryCache: LruCache<String, Bitmap> = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }

    /**
     * Loads a circular avatar into an ImageView.
     * Supports:
     * - Web URLs (e.g. Google profile picture: https://lh3.googleusercontent.com/...)
     * - Base64 Data URIs (e.g. data:image/jpeg;base64,...)
     * - Fallback to initials if url is null/empty or load fails.
     */
    fun loadCircular(
        imageView: ImageView,
        url: String?,
        fallbackView: TextView? = null,
        initials: String? = null
    ) {
        if (url.isNullOrBlank()) {
            showFallback(imageView, fallbackView, initials)
            return
        }

        val resolvedUrl = SupabaseService.toHighResAvatarUrl(url) ?: url

        // Check memory cache
        val cached = memoryCache.get(resolvedUrl)
        if (cached != null) {
            imageView.setImageBitmap(cached)
            imageView.visibility = View.VISIBLE
            fallbackView?.visibility = View.GONE
            return
        }

        // Tag view to avoid race conditions with recycled views in RecyclerView
        imageView.tag = resolvedUrl

        CoroutineScope(Dispatchers.IO).launch {
            val bitmap = try {
                when {
                    resolvedUrl.startsWith("data:image/") -> decodeBase64Image(resolvedUrl)
                    resolvedUrl.startsWith("http://") || resolvedUrl.startsWith("https://") -> fetchNetworkImage(resolvedUrl)
                    else -> null
                }
            } catch (_: Exception) {
                null
            }

            val circular = if (bitmap != null) getCircularBitmap(bitmap) else null

            withContext(Dispatchers.Main) {
                if (imageView.tag == resolvedUrl) {
                    if (circular != null) {
                        memoryCache.put(resolvedUrl, circular)
                        imageView.setImageBitmap(circular)
                        imageView.visibility = View.VISIBLE
                        fallbackView?.visibility = View.GONE
                    } else {
                        showFallback(imageView, fallbackView, initials)
                    }
                }
            }
        }
    }

    private fun showFallback(imageView: ImageView, fallbackView: TextView?, initials: String?) {
        imageView.setImageDrawable(null)
        imageView.visibility = View.GONE
        if (fallbackView != null) {
            fallbackView.visibility = View.VISIBLE
            if (!initials.isNullOrBlank()) {
                fallbackView.text = initials
            }
        }
    }

    private fun fetchNetworkImage(urlString: String): Bitmap? {
        var conn: HttpURLConnection? = null
        return try {
            val url = URL(urlString)
            conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            conn.instanceFollowRedirects = true
            conn.doInput = true
            conn.connect()
            if (conn.responseCode in 200..299) {
                val input = conn.inputStream
                BitmapFactory.decodeStream(input)
            } else {
                null
            }
        } catch (_: Exception) {
            null
        } finally {
            conn?.disconnect()
        }
    }

    private fun decodeBase64Image(dataUri: String): Bitmap? {
        val commaIndex = dataUri.indexOf(",")
        val base64Data = if (commaIndex != -1) dataUri.substring(commaIndex + 1) else dataUri
        val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
        return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
    }

    /**
     * Converts any rectangular bitmap to a smooth anti-aliased circular bitmap.
     */
    fun getCircularBitmap(bitmap: Bitmap): Bitmap {
        val size = Math.min(bitmap.width, bitmap.height)
        val x = (bitmap.width - size) / 2
        val y = (bitmap.height - size) / 2
        val squared = Bitmap.createBitmap(bitmap, x, y, size, size)

        val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val paint = Paint().apply {
            isAntiAlias = true
            isFilterBitmap = true
            isDither = true
        }

        val radius = size / 2f
        canvas.drawCircle(radius, radius, radius, paint)
        paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
        canvas.drawBitmap(squared, 0f, 0f, paint)

        return output
    }

    /**
     * Processes a gallery Uri: downsamples to 200x200 max, compresses to JPEG 75%,
     * and encodes to data:image/jpeg;base64,... data URI string for instant cloud persistence.
     */
    fun processGalleryImageToDataUri(context: Context, imageUri: Uri): String? {
        return try {
            val resolver = context.contentResolver
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(imageUri)?.use {
                BitmapFactory.decodeStream(it, null, options)
            }

            var inSampleSize = 1
            val maxDim = 800
            if (options.outHeight > maxDim || options.outWidth > maxDim) {
                val halfHeight = options.outHeight / 2
                val halfWidth = options.outWidth / 2
                while ((halfHeight / inSampleSize) >= maxDim && (halfWidth / inSampleSize) >= maxDim) {
                    inSampleSize *= 2
                }
            }

            val decodeOptions = BitmapFactory.Options().apply {
                this.inSampleSize = inSampleSize
            }

            val rawBitmap = resolver.openInputStream(imageUri)?.use {
                BitmapFactory.decodeStream(it, null, decodeOptions)
            } ?: return null

            // Scale precisely to max 800x800
            val aspect = rawBitmap.width.toFloat() / rawBitmap.height.toFloat()
            val targetW: Int
            val targetH: Int
            if (aspect > 1f) {
                targetW = maxDim
                targetH = (maxDim / aspect).toInt()
            } else {
                targetH = maxDim
                targetW = (maxDim * aspect).toInt()
            }

            val scaled = Bitmap.createScaledBitmap(rawBitmap, Math.max(1, targetW), Math.max(1, targetH), true)
            val stream = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 85, stream)
            val byteArray = stream.toByteArray()
            val base64 = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            "data:image/jpeg;base64,$base64"
        } catch (_: Exception) {
            null
        }
    }
}
