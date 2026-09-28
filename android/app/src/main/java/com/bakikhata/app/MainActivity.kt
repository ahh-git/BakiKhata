package com.bakikhata.app

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.bakikhata.app.databinding.ActivityMainBinding
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    lateinit var sessionManager: SessionManager
    private lateinit var binding: ActivityMainBinding
    private var isHandlingDeepLink = false
    private var isAppUnlocked = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        sessionManager = SessionManager(this)

        // Automatic backstack listener to show/hide bottom nav and back toolbar
        supportFragmentManager.addOnBackStackChangedListener {
            val isTopLevel = supportFragmentManager.backStackEntryCount == 0
            val sessionProfile = sessionManager.getProfile()
            if (sessionProfile != null && isTopLevel) {
                binding.bottomNav.visibility = View.VISIBLE
                binding.toolbarBack.visibility = View.GONE
            } else if (!isTopLevel) {
                binding.bottomNav.visibility = View.GONE
                binding.toolbarBack.visibility = View.VISIBLE
            }
        }

        // Back button handler
        binding.btnBack.setOnClickListener {
            HapticUtil.tap(it)
            onBackPressedDispatcher.onBackPressed()
        }

        // Check if launching from OAuth deep link
        val scheme = intent?.data?.scheme
        val hasDeepLink = scheme == "onebaki" || scheme == "bakikhata"
        if (hasDeepLink) {
            isHandlingDeepLink = true
            handleDeepLink(intent)
        } else {
            routeUser()
        }

        // In-App Version Control check
        AppVersionManager.checkForUpdates(
            activity = this,
            scope = lifecycleScope,
            isManualCheck = false
        )
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val scheme = intent.data?.scheme
        if (scheme == "onebaki" || scheme == "bakikhata") {
            handleDeepLink(intent)
        }
    }

    override fun onResume() {
        super.onResume()
        checkAppSecurityLock()
    }

    private fun checkAppSecurityLock() {
        if (!sessionManager.isLoggedIn()) return
        if (!sessionManager.isAppLockEnabled()) return
        val savedPin = sessionManager.getAppPin() ?: return
        if (isAppUnlocked) return

        showPinVerificationDialog(savedPin)
    }

    private fun showPinVerificationDialog(savedPin: String) {
        val dialog = com.google.android.material.bottomsheet.BottomSheetDialog(this)
        val view = layoutInflater.inflate(R.layout.dialog_pin_lock, null)
        dialog.setContentView(view)
        dialog.setCancelable(false)
        dialog.setCanceledOnTouchOutside(false)

        view.findViewById<TextView>(R.id.tvPinDialogTitle)?.text = "অ্যাপ আনলক করুন"
        view.findViewById<TextView>(R.id.tvPinDialogSubtitle)?.text = "আপনার ৪ সংখ্যার গোপন PIN লিখুন"
        val etPin = view.findViewById<EditText>(R.id.etPinCode)
        val btnConfirm = view.findViewById<View>(R.id.btnConfirmPin)
        val btnCancel = view.findViewById<View>(R.id.btnCancelPin)

        btnConfirm?.setOnClickListener {
            val entered = etPin?.text?.toString()?.trim()
            if (entered == savedPin) {
                HapticUtil.success(it)
                isAppUnlocked = true
                dialog.dismiss()
            } else {
                HapticUtil.tap(it)
                Toast.makeText(this, "ভুল PIN কোড! আবার চেষ্টা করুন।", Toast.LENGTH_SHORT).show()
                etPin?.text?.clear()
            }
        }

        btnCancel?.setOnClickListener {
            dialog.dismiss()
            finishAffinity()
        }

        dialog.show()
    }

    /** Sets up the bottom nav with the correct menu for the user's role */
    private fun setupBottomNav() {
        val profile = sessionManager.getProfile()
        val isShopkeeper = profile?.role == "shopkeeper"

        binding.bottomNav.menu.clear()
        binding.bottomNav.inflateMenu(
            if (isShopkeeper) R.menu.bottom_nav_shop else R.menu.bottom_nav_menu
        )

        binding.bottomNav.setOnItemSelectedListener { item ->
            HapticUtil.tap(binding.bottomNav)
            when (item.itemId) {
                R.id.nav_home -> {
                    showMainHome()
                    true
                }
                // Customer: হিস্টোরি tab
                R.id.nav_history -> {
                    showFragment(HistoryIndexFragment(), addToBackStack = false)
                    binding.toolbarBack.visibility = View.GONE
                    true
                }
                // Customer: দোকান tab (join new shops)
                R.id.nav_dokan -> {
                    showFragment(JoinFragment(), addToBackStack = false)
                    binding.toolbarBack.visibility = View.GONE
                    true
                }
                // Shopkeeper: খাতা tab
                R.id.nav_book -> {
                    val frag = ShopBookFragment()
                    showFragment(frag, addToBackStack = false)
                    binding.toolbarBack.visibility = View.GONE
                    true
                }
                // Shopkeeper: অ্যালার্ট tab
                R.id.nav_alerts -> {
                    showFragment(AlertsFragment(), addToBackStack = false)
                    binding.toolbarBack.visibility = View.GONE
                    true
                }
                // Both: প্রোফাইল tab
                R.id.nav_profile -> {
                    showFragment(ProfileFragment(), addToBackStack = false)
                    binding.toolbarBack.visibility = View.GONE
                    true
                }
                else -> false
            }
        }

        binding.bottomNav.visibility = View.VISIBLE
    }

    private fun handleDeepLink(intent: Intent) {
        try {
            val data: Uri = intent.data ?: return
            val fragment = data.fragment ?: ""
            if (fragment.isEmpty()) {
                routeUser()
                return
            }

            val params = fragment.split("&").associate {
                val kv = it.split("=", limit = 2)
                if (kv.size == 2) kv[0] to kv[1] else kv[0] to ""
            }
            val accessToken = params["access_token"]
            val refreshToken = params["refresh_token"]

            if (accessToken.isNullOrEmpty()) {
                routeUser()
                return
            }

            binding.bottomNav.visibility = View.GONE
            binding.toolbarBack.visibility = View.GONE

            lifecycleScope.launch {
                try {
                    val user = SupabaseService.getCurrentUser(accessToken)
                    if (user != null) {
                        val userId = user.id
                        val email = user.email
                        sessionManager.saveSession(accessToken, refreshToken, userId, email)
                        sessionManager.savePendingAvatarUrl(user.avatarUrl)

                        var profile = SupabaseService.getProfile(userId, accessToken)
                        if (profile != null) {
                            if (profile.avatar_url.isNullOrBlank() && !user.avatarUrl.isNullOrBlank()) {
                                SupabaseService.updateProfileAvatar(userId, user.avatarUrl, accessToken)
                                profile = profile.copy(avatar_url = user.avatarUrl)
                            }
                            sessionManager.saveProfile(profile)
                        }
                        onLoginComplete()
                    } else {
                        sessionManager.clearSession()
                        navigateToLogin()
                        Toast.makeText(this@MainActivity, "লগইন ব্যর্থ হয়েছে", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Log.e("BakiKhata", "Deep link error: ${e.message}", e)
                    sessionManager.clearSession()
                    navigateToLogin()
                }
                isHandlingDeepLink = false
            }
        } catch (e: Exception) {
            Log.e("BakiKhata", "Deep link parse error: ${e.message}", e)
            isHandlingDeepLink = false
            routeUser()
        }
    }

    private fun routeUser() {
        if (isHandlingDeepLink) return

        val token = sessionManager.getAccessToken()
        val userId = sessionManager.getUserId()
        if (token.isNullOrEmpty() || userId.isNullOrEmpty()) {
            sessionManager.clearSession()
            navigateToLogin()
        } else {
            onLoginComplete()
        }
    }

    fun onLoginComplete() {
        val token = sessionManager.getAccessToken()
        val userId = sessionManager.getUserId()

        if (token.isNullOrEmpty() || userId.isNullOrEmpty()) {
            sessionManager.clearSession()
            navigateToLogin()
            return
        }

        lifecycleScope.launch {
            try {
                var profile = sessionManager.getProfile()
                if (profile == null) {
                    profile = SupabaseService.getProfile(userId, token)
                    if (profile != null) {
                        val pendingAvatar = sessionManager.getPendingAvatarUrl()
                        if (profile.avatar_url.isNullOrBlank() && !pendingAvatar.isNullOrBlank()) {
                            SupabaseService.updateProfileAvatar(userId, pendingAvatar, token)
                            profile = profile.copy(avatar_url = pendingAvatar)
                        }
                        sessionManager.saveProfile(profile)
                    }
                }

                if (profile == null || profile.role == null) {
                    showFragment(OnboardingFragment(), addToBackStack = false)
                    binding.bottomNav.visibility = View.GONE
                    binding.toolbarBack.visibility = View.GONE
                } else {
                    setupBottomNav()
                    showMainHome()
                }
            } catch (e: Exception) {
                Log.e("BakiKhata", "Login complete error: ${e.message}", e)
                showFragment(OnboardingFragment(), addToBackStack = false)
                binding.bottomNav.visibility = View.GONE
                binding.toolbarBack.visibility = View.GONE
            }
        }
    }

    fun onOnboardingComplete() {
        setupBottomNav()
        showMainHome()
    }

    fun onJoinComplete() {
        setupBottomNav()
        showMainHome()
        binding.bottomNav.selectedItemId = R.id.nav_home
    }

    fun navigateToLogin() {
        binding.bottomNav.visibility = View.GONE
        binding.toolbarBack.visibility = View.GONE
        showFragment(LoginFragment(), addToBackStack = false)
    }

    fun navigateToJoin() {
        binding.bottomNav.visibility = View.GONE
        binding.toolbarBack.visibility = View.VISIBLE
        showFragment(JoinFragment(), addToBackStack = true)
    }

    fun navigateToAddBaki(shopId: String) {
        binding.bottomNav.visibility = View.GONE
        binding.toolbarBack.visibility = View.VISIBLE
        showFragment(AddBakiFragment.newInstance(shopId), addToBackStack = true)
    }

    fun navigateToPay(shopId: String) {
        binding.bottomNav.visibility = View.GONE
        binding.toolbarBack.visibility = View.VISIBLE
        showFragment(PayFragment.newInstance(shopId), addToBackStack = true)
    }

    fun navigateToHistory(shopId: String) {
        binding.bottomNav.visibility = View.GONE
        binding.toolbarBack.visibility = View.VISIBLE
        showFragment(HistoryFragment.newInstance(shopId, isShopkeeper = false), addToBackStack = true)
    }

    fun navigateToShopCustomerHistory(shopId: String, customerId: String) {
        binding.bottomNav.visibility = View.GONE
        binding.toolbarBack.visibility = View.VISIBLE
        showFragment(CustomerLedgerFragment.newInstance(shopId, customerId), addToBackStack = true)
    }

    fun openGoogleLogin() {
        try {
            val url = SupabaseService.getGoogleOAuthUrl()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "ব্রাউজার পাওয়া যায়নি", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showMainHome() {
        binding.toolbarBack.visibility = View.GONE
        val profile = sessionManager.getProfile()
        if (profile?.role == "shopkeeper") {
            val frag = ShopHomeFragment()
            showFragment(frag, addToBackStack = false)
        } else {
            val frag = CustomerHomeFragment()
            showFragment(frag, addToBackStack = false)
        }
    }

    private fun showFragment(fragment: Fragment, addToBackStack: Boolean) {
        try {
            val tx = supportFragmentManager.beginTransaction()
            if (addToBackStack) {
                tx.setCustomAnimations(
                    R.anim.slide_in_right, R.anim.slide_out_left,
                    R.anim.fade_in, R.anim.fade_out
                )
            } else {
                tx.setCustomAnimations(R.anim.fade_in, R.anim.fade_out)
            }
            tx.replace(R.id.fragmentContainer, fragment)
            if (addToBackStack) tx.addToBackStack(null)
            tx.commitAllowingStateLoss()
        } catch (e: Exception) {
            Log.e("BakiKhata", "Fragment transaction error: ${e.message}", e)
        }
    }
}
