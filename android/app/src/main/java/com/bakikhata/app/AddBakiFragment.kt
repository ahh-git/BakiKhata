package com.bakikhata.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.bakikhata.app.databinding.FragmentAddBakiBinding
import kotlinx.coroutines.launch

class AddBakiFragment : Fragment() {
    private var _binding: FragmentAddBakiBinding? = null
    private val binding get() = _binding!!

    private var shopId: String = ""
    private var shopProfile: Profile? = null
    private var doneAmount: Double = 0.0
    private var doneTotal: Double = 0.0
    private var doneItem: String = ""
    private var doneAt: String = ""

    companion object {
        fun newInstance(shopId: String): AddBakiFragment {
            return AddBakiFragment().apply {
                arguments = Bundle().apply { putString("shopId", shopId) }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        shopId = arguments?.getString("shopId") ?: ""
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAddBakiBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        loadShop()

        // Live expression evaluator
        binding.etExpression.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                val result = Calc.liveEval(s?.toString() ?: "")
                binding.tvLiveAmount.text = if (result != null) "৳${Calc.money(result)}" else "৳—"
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        binding.btnSubmitBaki.setOnClickListener {
            HapticUtil.tap(it)
            submitBaki()
        }

        binding.btnAddMore.setOnClickListener {
            HapticUtil.tap(it)
            binding.layoutDoneConfirmation.visibility = View.GONE
            binding.layoutAddForm.visibility = View.VISIBLE
            binding.etItemName.text?.clear()
            binding.etQuantity.setText("1")
            binding.etExpression.text?.clear()
            binding.etNote.text?.clear()
            binding.tvLiveAmount.text = "৳—"
        }

        binding.btnSendWhatsApp.setOnClickListener {
            val shop = shopProfile ?: return@setOnClickListener
            if (shop.phone.isNullOrEmpty()) return@setOnClickListener

            val activity = requireActivity() as? MainActivity ?: return@setOnClickListener
            val profile = activity.sessionManager.getProfile() ?: return@setOnClickListener
            val customerName = profile.full_name ?: "কাস্টমার"
            val t = Format.banglaParts(doneAt)

            val text = listOf(
                "আসসালামু আলাইকুম ${shop.shop_name ?: shop.full_name ?: "দোকানদার"},",
                "আমি $customerName। এইমাত্র বাকি নিয়েছি।",
                "কী কিনেছি: ${doneItem.ifEmpty { "আইটেম" }}",
                "এই মুহূর্তের বাকি: ৳${Calc.money(doneAmount)}",
                "আপনার কাছে আমার মোট বাকি: ৳${Calc.money(doneTotal)}",
                "সময়: ${t.date}, ${t.weekday}, ${t.clock}"
            ).joinToString("\n")

            ShareUtil.openWhatsApp(requireContext(), shop.phone, text)
        }
    }

    private fun loadShop() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            val profiles = SupabaseService.getProfiles(listOf(shopId), token)
            shopProfile = profiles.firstOrNull()
            val shop = shopProfile
            if (shop != null) {
                binding.tvAddShopSubtitle.text = "${shop.shop_name} · আইডি ${shop.shop_code}"
            }
        }
    }

    private fun submitBaki() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        val item = binding.etItemName.text.toString().trim()
        val qtyExpr = binding.etQuantity.text.toString().trim()
        val expr = binding.etExpression.text.toString().trim()
        val note = binding.etNote.text.toString().trim()

        val amount = Calc.liveEval(expr)
        if (item.isEmpty()) {
            binding.tvAddError.text = "আইটেমের নাম লিখুন"
            binding.tvAddError.visibility = View.VISIBLE
            return
        }
        if (amount == null || amount <= 0) {
            binding.tvAddError.text = "সঠিক টাকার হিসাব লিখুন, যেমন ১০+১০"
            binding.tvAddError.visibility = View.VISIBLE
            return
        }

        val qty = Calc.liveEval(qtyExpr) ?: 1.0
        val fullItemName = item + if (note.isNotEmpty()) " ($note)" else ""

        binding.btnSubmitBaki.isEnabled = false
        binding.tvAddError.visibility = View.GONE

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val result = SupabaseService.addCredit(
                    shopkeeperId = shopId,
                    customerId = userId,
                    itemName = fullItemName,
                    quantity = qty,
                    amount = amount,
                    expression = expr,
                    weekday = Format.currentWeekday(),
                    token = token
                )
                result.onSuccess {
                    try {
                        _binding?.root?.let { v -> HapticUtil.success(v) }
                    } catch (_: Exception) {}
                    val totalDue = SupabaseService.balanceFor(shopId, userId, token)
                    doneAmount = amount
                    doneTotal = totalDue
                    doneItem = item
                    doneAt = java.util.Date().let {
                        java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).format(it)
                    }

                    val t = Format.banglaParts(doneAt)
                    binding.tvDoneItemSummary.text = "${item} · ৳${Calc.money(amount)} · ${t.weekday} ${t.clock}"
                    binding.tvDoneTotalDue.text = "এখন মোট বাকি: ৳${Calc.money(totalDue)}"

                    val shop = shopProfile
                    if (shop?.phone.isNullOrEmpty()) {
                        binding.btnSendWhatsApp.visibility = View.GONE
                        binding.tvNoPhoneNotice.visibility = View.VISIBLE
                    } else {
                        binding.btnSendWhatsApp.visibility = View.VISIBLE
                        binding.tvNoPhoneNotice.visibility = View.GONE
                    }

                    binding.layoutAddForm.visibility = View.GONE
                    binding.layoutDoneConfirmation.visibility = View.VISIBLE
                }.onFailure { e ->
                    binding.tvAddError.text = "ব্যর্থ: ${e.message}"
                    binding.tvAddError.visibility = View.VISIBLE
                    binding.btnSubmitBaki.isEnabled = true
                }
            } catch (e: Exception) {
                binding.tvAddError.text = "ত্রুটি: ${e.message}"
                binding.tvAddError.visibility = View.VISIBLE
                binding.btnSubmitBaki.isEnabled = true
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
