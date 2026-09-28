package com.bakikhata.app

import android.view.HapticFeedbackConstants
import android.view.View

object HapticUtil {
    fun tap(view: View) {
        try {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        } catch (_: Exception) {}
    }

    fun success(view: View) {
        try {
            view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
        } catch (_: Exception) {}
    }
}
