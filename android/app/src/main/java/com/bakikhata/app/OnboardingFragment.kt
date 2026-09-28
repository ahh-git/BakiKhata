package com.bakikhata.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.bakikhata.app.databinding.FragmentOnboardingBinding
import kotlinx.coroutines.launch

class OnboardingFragment : Fragment() {
    private var _binding: FragmentOnboardingBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentOnboardingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        showRoleChoose()

        binding.btnChooseShop.setOnClickListener {
            HapticUtil.tap(it)
            showShopForm()
        }
        binding.btnChooseCustomer.setOnClickListener {
            HapticUtil.tap(it)
            showCustomerForm()
        }
        binding.btnBackFromShop.setOnClickListener {
            HapticUtil.tap(it)
            showRoleChoose()
        }
        binding.btnBackFromCustomer.setOnClickListener {
            HapticUtil.tap(it)
            showRoleChoose()
        }

        binding.btnSubmitShop.setOnClickListener {
            HapticUtil.tap(it)
            val name = binding.etShopOwnerName.text.toString().trim()
            val shopName = binding.etShopName.text.toString().trim()
            val phone = binding.etShopPhone.text.toString().trim()
            if (name.isEmpty() || shopName.isEmpty() || phone.isEmpty()) {
                showError("সব তথ্য দিন")
                return@setOnClickListener
            }
            submitShop(name, shopName, phone)
        }

        binding.btnSubmitCustomer.setOnClickListener {
            HapticUtil.tap(it)
            val name = binding.etCustomerName.text.toString().trim()
            val phone = binding.etCustomerPhone.text.toString().trim()
            if (name.isEmpty() || phone.isEmpty()) {
                showError("সব তথ্য দিন")
                return@setOnClickListener
            }
            submitCustomer(name, phone)
        }
    }

    private fun showRoleChoose() {
        binding.layoutRoleChoose.visibility = View.VISIBLE
        binding.layoutShopForm.visibility = View.GONE
        binding.layoutCustomerForm.visibility = View.GONE
        hideError()
    }

    private fun showShopForm() {
        binding.layoutRoleChoose.visibility = View.GONE
        binding.layoutShopForm.visibility = View.VISIBLE
        binding.layoutCustomerForm.visibility = View.GONE
        hideError()
    }

    private fun showCustomerForm() {
        binding.layoutRoleChoose.visibility = View.GONE
        binding.layoutShopForm.visibility = View.GONE
        binding.layoutCustomerForm.visibility = View.VISIBLE
        hideError()
    }

    private fun showError(msg: String) {
        binding.tvOnboardingError.text = msg
        binding.tvOnboardingError.visibility = View.VISIBLE
    }

    private fun hideError() {
        binding.tvOnboardingError.visibility = View.GONE
    }

    private fun submitShop(name: String, shopName: String, phone: String) {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        binding.btnSubmitShop.isEnabled = false
        hideError()

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val pendingAvatar = activity.sessionManager.getPendingAvatarUrl()
                val upsertResult = SupabaseService.upsertProfile(
                    id = userId,
                    fullName = name,
                    phone = phone,
                    role = "shopkeeper",
                    shopName = shopName,
                    avatarUrl = pendingAvatar,
                    token = token
                )
                if (upsertResult.isFailure) {
                    showError("ব্যর্থ: ${upsertResult.exceptionOrNull()?.message}")
                    binding.btnSubmitShop.isEnabled = true
                    return@launch
                }

                // Claim unique shop code if not assigned
                SupabaseService.claimShopCode(token)

                // Fetch updated profile
                val profile = SupabaseService.getProfile(userId, token)
                if (profile != null) {
                    activity.sessionManager.saveProfile(profile)
                    activity.onOnboardingComplete()
                } else {
                    showError("প্রোফাইল লোড করা যায়নি, আবার চেষ্টা করুন")
                    binding.btnSubmitShop.isEnabled = true
                }
            } catch (e: Exception) {
                showError("ত্রুটি: ${e.message}")
                binding.btnSubmitShop.isEnabled = true
            }
        }
    }

    private fun submitCustomer(name: String, phone: String) {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        binding.btnSubmitCustomer.isEnabled = false
        hideError()

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val pendingAvatar = activity.sessionManager.getPendingAvatarUrl()
                val upsertResult = SupabaseService.upsertProfile(
                    id = userId,
                    fullName = name,
                    phone = phone,
                    role = "customer",
                    shopName = null,
                    avatarUrl = pendingAvatar,
                    token = token
                )
                if (upsertResult.isFailure) {
                    showError("ব্যর্থ: ${upsertResult.exceptionOrNull()?.message}")
                    binding.btnSubmitCustomer.isEnabled = true
                    return@launch
                }

                val profile = SupabaseService.getProfile(userId, token)
                if (profile != null) {
                    activity.sessionManager.saveProfile(profile)
                    activity.onOnboardingComplete()
                } else {
                    showError("প্রোফাইল লোড করা যায়নি, আবার চেষ্টা করুন")
                    binding.btnSubmitCustomer.isEnabled = true
                }
            } catch (e: Exception) {
                showError("ত্রুটি: ${e.message}")
                binding.btnSubmitCustomer.isEnabled = true
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
