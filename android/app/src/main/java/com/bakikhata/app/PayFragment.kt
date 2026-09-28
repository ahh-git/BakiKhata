package com.bakikhata.app

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.bakikhata.app.databinding.FragmentPayBinding
import kotlinx.coroutines.launch

class PayFragment : Fragment() {
    private var _binding: FragmentPayBinding? = null
    private val binding get() = _binding!!

    private var shopId: String = ""

    companion object {
        fun newInstance(shopId: String): PayFragment {
            return PayFragment().apply {
                arguments = Bundle().apply { putString("shopId", shopId) }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        shopId = arguments?.getString("shopId") ?: ""
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentPayBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        loadShop()

        binding.etPayExpression.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                val result = Calc.liveEval(s?.toString() ?: "")
                binding.tvPayLiveAmount.text = if (result != null) "৳${Calc.money(result)}" else "৳—"
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        binding.btnSubmitPayment.setOnClickListener {
            HapticUtil.tap(it)
            submitPayment()
        }
    }

    private fun loadShop() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            val profiles = SupabaseService.getProfiles(listOf(shopId), token)
            val shop = profiles.firstOrNull()
            val due = SupabaseService.balanceFor(shopId, userId, token)
            binding.tvPayShopDue.text = "${shop?.shop_name ?: "দোকান"} · এখন বাকি ৳${Calc.money(due)}"
        }
    }

    private fun submitPayment() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        val expr = binding.etPayExpression.text.toString().trim()
        val amount = Calc.liveEval(expr)

        if (amount == null || amount <= 0) {
            binding.tvPayErrorMsg.text = "সঠিক টাকা লিখুন"
            binding.tvPayErrorMsg.visibility = View.VISIBLE
            return
        }

        binding.btnSubmitPayment.isEnabled = false
        binding.tvPaySuccessMsg.visibility = View.GONE
        binding.tvPayErrorMsg.visibility = View.GONE

        viewLifecycleOwner.lifecycleScope.launch {
            val result = SupabaseService.requestPayment(
                shopkeeperId = shopId,
                customerId = userId,
                amount = amount,
                expression = expr,
                weekday = Format.currentWeekday(),
                token = token
            )
            result.onSuccess {
                try {
                    _binding?.root?.let { v -> HapticUtil.success(v) }
                } catch (_: Exception) {}
                binding.tvPaySuccessMsg.text = "অনুরোধ পাঠানো হয়েছে। দোকানদার অনুমোদন করার আগে বাকি কমবে না।"
                binding.tvPaySuccessMsg.visibility = View.VISIBLE
                binding.etPayExpression.text?.clear()
                binding.tvPayLiveAmount.text = "৳—"
            }.onFailure { e ->
                binding.tvPayErrorMsg.text = "ব্যর্থ: ${e.message}"
                binding.tvPayErrorMsg.visibility = View.VISIBLE
                binding.btnSubmitPayment.isEnabled = true
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
