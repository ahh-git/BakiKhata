package com.bakikhata.app

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.animation.OvershootInterpolator
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val icon = findViewById<View>(android.R.id.content).rootView
            .findViewWithTag<View>(null) // We'll animate the whole content

        // Animate all children
        val contentView = findViewById<View>(android.R.id.content)
        contentView.alpha = 0f

        val fadeIn = ObjectAnimator.ofFloat(contentView, "alpha", 0f, 1f).apply {
            duration = 600
        }

        val scaleX = ObjectAnimator.ofFloat(contentView, "scaleX", 0.8f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(1.2f)
        }

        val scaleY = ObjectAnimator.ofFloat(contentView, "scaleY", 0.8f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(1.2f)
        }

        AnimatorSet().apply {
            playTogether(fadeIn, scaleX, scaleY)
            start()
        }

        // Navigate to main after delay
        contentView.postDelayed({
            startActivity(Intent(this, MainActivity::class.java).apply {
                // Forward any deep link
                intent?.data?.let { data = it }
            })
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }, 1500)
    }
}
