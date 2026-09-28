package com.bakikhata.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.bakikhata.app.databinding.FragmentJoinBinding
import kotlinx.coroutines.launch

class JoinFragment : Fragment() {
    private var _binding: FragmentJoinBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentJoinBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnSubmitJoin.setOnClickListener {
            HapticUtil.tap(it)
            val code = binding.etJoinShopCode.text.toString().trim()
            if (code.isEmpty()) {
                binding.tvJoinError.text = "দোকান আইডি দিন"
                binding.tvJoinError.visibility = View.VISIBLE
                return@setOnClickListener
            }
            joinShop(code)
        }
    }

    private fun joinShop(code: String) {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        binding.btnSubmitJoin.isEnabled = false
        binding.tvJoinError.visibility = View.GONE

        viewLifecycleOwner.lifecycleScope.launch {
            val result = SupabaseService.joinShopByCode(code, userId, token)
            result.onSuccess {
                try {
                    _binding?.root?.let { v -> HapticUtil.success(v) }
                } catch (_: Exception) {}
                Toast.makeText(requireContext(), "সফলভাবে যোগ দিয়েছেন!", Toast.LENGTH_SHORT).show()
                activity.onJoinComplete()
            }.onFailure { e ->
                binding.tvJoinError.text = "ব্যর্থ: ${e.message}"
                binding.tvJoinError.visibility = View.VISIBLE
                binding.btnSubmitJoin.isEnabled = true
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
