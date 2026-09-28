package com.bakikhata.app

import android.app.AlertDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.bakikhata.app.databinding.FragmentProfileBinding
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {
    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    // Gallery Photo Picker Contract
    private val pickPhotoLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri != null) {
            uploadAvatarFromUri(uri)
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        bindProfileData()
        setupAvatarActions()
        setupSecurityLock()
        setupStatementShare()
        setupAppVersionChecker()
        setupSupportAndLogout()
    }

    private fun bindProfileData() {
        val activity = requireActivity() as? MainActivity ?: return
        val profile = activity.sessionManager.getProfile()
        val email = activity.sessionManager.getUserEmail()

        if (profile != null) {
            val name = profile.full_name ?: "ব্যবহারকারী"
            binding.tvProfileName.text = name
            binding.tvProfileEmail.text = email ?: "—"
            binding.tvProfilePhone.text = profile.phone ?: "—"

            val initial = if (name.isNotBlank()) name.first().toString() else "ব"
            binding.tvProfileAvatarInitials.text = initial

            // Load Circular Avatar
            ImageLoader.loadCircular(
                imageView = binding.ivProfileAvatar,
                url = profile.avatar_url,
                fallbackView = binding.tvProfileAvatarInitials,
                initials = initial
            )

            val roleText = when (profile.role) {
                "shopkeeper" -> "দোকানদার"
                "customer" -> "কাস্টমার"
                else -> profile.role ?: "—"
            }
            binding.tvProfileRoleBadge.text = roleText

            if (profile.role == "shopkeeper") {
                binding.layoutShopCodeField.visibility = View.VISIBLE
                binding.dividerShopCode.visibility = View.VISIBLE
                binding.tvProfileShopCode.text = profile.shop_code ?: "—"

                binding.btnProfileViewQr.setOnClickListener {
                    HapticUtil.tap(it)
                    showQrDialog(profile)
                }
            } else {
                binding.layoutShopCodeField.visibility = View.GONE
                binding.dividerShopCode.visibility = View.GONE
            }
        }
    }

    private fun setupAvatarActions() {
        val clickListener = View.OnClickListener {
            HapticUtil.tap(it)
            showAvatarPickerBottomSheet()
        }
        binding.layoutAvatarContainer.setOnClickListener(clickListener)
        binding.btnChangeAvatar.setOnClickListener(clickListener)
        binding.btnEditAvatarPhoto.setOnClickListener(clickListener)
    }

    private fun showAvatarPickerBottomSheet() {
        val dialog = BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.dialog_choose_avatar, null)
        dialog.setContentView(view)

        // 1. Pick from Gallery
        view.findViewById<View>(R.id.btnPickGallery).setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            pickPhotoLauncher.launch("image/*")
        }

        // 2. Sync from Google/Gmail
        view.findViewById<View>(R.id.btnSyncGooglePhoto).setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            syncGoogleAvatar()
        }

        // 3. Remove Avatar
        view.findViewById<View>(R.id.btnRemoveAvatar).setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            removeAvatar()
        }

        view.findViewById<View>(R.id.btnCancelAvatarDialog).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun uploadAvatarFromUri(uri: Uri) {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        Toast.makeText(requireContext(), "ছবি প্রসেস ও আপলোড হচ্ছে...", Toast.LENGTH_SHORT).show()

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val dataUri = ImageLoader.processGalleryImageToDataUri(requireContext(), uri)
                if (dataUri.isNullOrBlank()) {
                    Toast.makeText(requireContext(), "ছবি প্রসেস করা সম্ভব হয়নি", Toast.LENGTH_SHORT).show()
                    return@launch
                }

                val result = SupabaseService.updateProfileAvatar(userId, dataUri, token)
                if (result.isSuccess) {
                    val current = activity.sessionManager.getProfile()
                    if (current != null) {
                        val updated = current.copy(avatar_url = dataUri)
                        activity.sessionManager.saveProfile(updated)
                    }
                    bindProfileData()
                    HapticUtil.success(binding.root)
                    Toast.makeText(requireContext(), "প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "আপলোড ব্যর্থ: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun syncGoogleAvatar() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        Toast.makeText(requireContext(), "Google একাউন্ট থেকে ছবি খোঁজা হচ্ছে...", Toast.LENGTH_SHORT).show()

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val authUser = SupabaseService.getCurrentUser(token)
                val googlePhoto = authUser?.avatarUrl
                if (!googlePhoto.isNullOrBlank()) {
                    val result = SupabaseService.updateProfileAvatar(userId, googlePhoto, token)
                    if (result.isSuccess) {
                        val current = activity.sessionManager.getProfile()
                        if (current != null) {
                            val updated = current.copy(avatar_url = googlePhoto)
                            activity.sessionManager.saveProfile(updated)
                        }
                        bindProfileData()
                        HapticUtil.success(binding.root)
                        Toast.makeText(requireContext(), "Google ছবি সফলভাবে যুক্ত হয়েছে!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(requireContext(), "সিঙ্ক ব্যর্থ: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(requireContext(), "Google একাউন্টে কোনো ছবি পাওয়া যায়নি। গ্যালারি থেকে আপলোড করুন।", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun removeAvatar() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val result = SupabaseService.updateProfileAvatar(userId, null, token)
                if (result.isSuccess) {
                    val current = activity.sessionManager.getProfile()
                    if (current != null) {
                        val updated = current.copy(avatar_url = null)
                        activity.sessionManager.saveProfile(updated)
                    }
                    bindProfileData()
                    HapticUtil.tap(binding.root)
                    Toast.makeText(requireContext(), "ছবি সরিয়ে ফেলা হয়েছে", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "ব্যর্থ: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupSecurityLock() {
        val activity = requireActivity() as? MainActivity ?: return
        val isLocked = activity.sessionManager.isAppLockEnabled()
        binding.switchAppLock.isChecked = isLocked
        binding.btnChangePin.visibility = if (isLocked) View.VISIBLE else View.GONE

        binding.switchAppLock.setOnCheckedChangeListener { _, isChecked ->
            HapticUtil.tap(binding.switchAppLock)
            if (isChecked) {
                showSetPinDialog { pin ->
                    activity.sessionManager.setAppPin(pin)
                    activity.sessionManager.setAppLockEnabled(true)
                    binding.btnChangePin.visibility = View.VISIBLE
                    Toast.makeText(requireContext(), "নিরাপত্তা PIN সক্রিয় হয়েছে!", Toast.LENGTH_SHORT).show()
                }
            } else {
                activity.sessionManager.setAppLockEnabled(false)
                binding.btnChangePin.visibility = View.GONE
                Toast.makeText(requireContext(), "অ্যাপ লক নিষ্ক্রিয় করা হয়েছে", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnChangePin.setOnClickListener {
            HapticUtil.tap(it)
            showSetPinDialog { pin ->
                activity.sessionManager.setAppPin(pin)
                Toast.makeText(requireContext(), "নতুন PIN সফলভাবে সেট হয়েছে!", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showSetPinDialog(onPinSaved: (String) -> Unit) {
        val dialog = BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.dialog_pin_lock, null)
        dialog.setContentView(view)

        val etPin = view.findViewById<EditText>(R.id.etPinCode)
        val btnConfirm = view.findViewById<View>(R.id.btnConfirmPin)
        val btnCancel = view.findViewById<View>(R.id.btnCancelPin)

        btnConfirm.setOnClickListener {
            val pin = etPin.text.toString().trim()
            if (pin.length != 4) {
                Toast.makeText(requireContext(), "অনুগ্রহ করে ৪ সংখ্যার PIN লিখুন", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            HapticUtil.success(it)
            dialog.dismiss()
            onPinSaved(pin)
        }

        btnCancel.setOnClickListener {
            dialog.dismiss()
            val activity = requireActivity() as? MainActivity
            binding.switchAppLock.isChecked = activity?.sessionManager?.isAppLockEnabled() == true
        }

        dialog.show()
    }

    private fun setupStatementShare() {
        binding.btnShareStatement.setOnClickListener {
            HapticUtil.tap(it)
            val activity = requireActivity() as? MainActivity ?: return@setOnClickListener
            val profile = activity.sessionManager.getProfile() ?: return@setOnClickListener
            val role = if (profile.role == "shopkeeper") "দোকানদার" else "গ্রাহক"
            val text = """
BakiKhata ডিজিটাল খাতা একাউন্ট
────────────────────────────
নাম: ${profile.full_name ?: "ব্যবহারকারী"} ($role)
মোবাইল: ${profile.phone ?: "—"}
${if (!profile.shop_code.isNullOrEmpty()) "দোকান আইডি: ${profile.shop_code}\n" else ""}তারিখ: ${Format.currentWeekday()}
────────────────────────────
BakiKhata · নিরাপদ, স্বচ্ছ ও বিশ্বস্ত ডিজিটাল খাতা
            """.trimIndent()
            ShareUtil.shareText(requireContext(), text, "খাতা বিবরণী শেয়ার")
        }
    }

    private fun setupAppVersionChecker() {
        binding.tvAppVersion.text = "বাকিখাতা v${BuildConfig.VERSION_NAME} (বিল্ড ${BuildConfig.VERSION_CODE}) · সুরক্ষিত ক্লাউড খাতা"
        binding.btnCheckAppUpdate.setOnClickListener {
            HapticUtil.tap(it)
            AppVersionManager.checkForUpdates(
                activity = requireActivity(),
                scope = viewLifecycleOwner.lifecycleScope,
                isManualCheck = true
            )
        }
    }

    private fun setupSupportAndLogout() {
        val activity = requireActivity() as? MainActivity ?: return

        // Support via WhatsApp (guaranteed normalization)
        binding.btnSupport.setOnClickListener {
            HapticUtil.tap(it)
            ShareUtil.openWhatsApp(requireContext(), null, "আসসালামু আলাইকুম, BakiKhata অ্যাপ সহায়তা প্রয়োজন।")
        }

        // Logout with confirmation
        binding.btnLogout.setOnClickListener {
            HapticUtil.tap(it)
            AlertDialog.Builder(requireContext())
                .setTitle("লগ আউট")
                .setMessage("আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগ আউট করতে চান?")
                .setPositiveButton("লগ আউট") { _, _ ->
                    HapticUtil.success(it)
                    activity.sessionManager.clearSession()
                    activity.navigateToLogin()
                }
                .setNegativeButton("বাতিল", null)
                .show()
        }
    }

    private fun showQrDialog(profile: Profile) {
        val shopCode = profile.shop_code ?: return
        val shopName = profile.shop_name ?: profile.full_name ?: "আমার দোকান"

        val dialog = BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.dialog_qr_code, null)
        dialog.setContentView(view)

        val tvName = view.findViewById<TextView>(R.id.tvDialogShopName)
        val tvCode = view.findViewById<TextView>(R.id.tvDialogShopCode)
        val ivQr = view.findViewById<ImageView>(R.id.ivQrCode)
        val btnCopy = view.findViewById<View>(R.id.btnDialogCopy)
        val btnShare = view.findViewById<View>(R.id.btnDialogShare)
        val btnClose = view.findViewById<View>(R.id.btnDialogClose)

        tvName.text = shopName
        tvCode.text = shopCode

        val qrContent = "bakikhata://join?shop_code=$shopCode"
        val qrBitmap = QRCodeGenerator.generate(qrContent, 600)
        if (qrBitmap != null) {
            ivQr.setImageBitmap(qrBitmap)
        }

        btnCopy.setOnClickListener {
            HapticUtil.success(it)
            val clipboard = requireContext().getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Shop Code", shopCode)
            clipboard.setPrimaryClip(clip)
            Toast.makeText(requireContext(), "দোকান কোড কপি হয়েছে: $shopCode", Toast.LENGTH_SHORT).show()
        }

        btnShare.setOnClickListener {
            HapticUtil.tap(it)
            ShareUtil.shareShopInvite(requireContext(), shopCode, shopName)
        }

        btnClose.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
