package com.bakikhata.app

import android.animation.ValueAnimator
import android.view.animation.DecelerateInterpolator
import android.widget.TextView

object NumberAnimUtil {
    fun animateMoney(textView: TextView, targetValue: Double, prefix: String = "৳") {
        if (targetValue <= 0.0) {
            textView.text = "${prefix}০"
            return
        }
        val animator = ValueAnimator.ofFloat(0f, targetValue.toFloat())
        animator.duration = 650
        animator.interpolator = DecelerateInterpolator()
        animator.addUpdateListener { anim ->
            val v = (anim.animatedValue as Float).toDouble()
            textView.text = "$prefix${Calc.money(v)}"
        }
        animator.start()
    }

    fun animateCount(textView: TextView, targetCount: Int) {
        if (targetCount <= 0) {
            textView.text = "০"
            return
        }
        val animator = ValueAnimator.ofInt(0, targetCount)
        animator.duration = 550
        animator.interpolator = DecelerateInterpolator()
        animator.addUpdateListener { anim ->
            val v = anim.animatedValue as Int
            textView.text = Calc.toBengaliNumerals(v.toString())
        }
        animator.start()
    }
}
