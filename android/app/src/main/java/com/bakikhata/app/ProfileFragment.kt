package com.bakikhata.app

import android.app.AlertDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.bakikhata.app.databinding.FragmentProfileBinding

class ProfileFragment : Fragment() {
    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

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
            }
        }

        // Support via WhatsApp
        binding.btnSupport.setOnClickListener {
            HapticUtil.tap(it)
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/?text=BakiKhata%20App%20Support"))
                startActivity(intent)
            } catch (_: Exception) {
                Toast.makeText(requireContext(), "সহায়তার জন্য যোগাযোগ করুন", Toast.LENGTH_SHORT).show()
            }
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
