package com.bakikhata.app

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bakikhata.app.databinding.FragmentCustomerLedgerBinding
import com.google.android.material.bottomsheet.BottomSheetDialog
import kotlinx.coroutines.launch

class CustomerLedgerFragment : Fragment() {
    private var _binding: FragmentCustomerLedgerBinding? = null
    private val binding get() = _binding!!

    private var shopId: String = ""
    private var customerId: String = ""
    private var customerProfile: Profile? = null
    private var shopkeeperProfile: Profile? = null
    private var currentDue: Double = 0.0
    private var ledgerRows: List<LedgerRow> = emptyList()

    companion object {
        fun newInstance(shopId: String, customerId: String): CustomerLedgerFragment {
            return CustomerLedgerFragment().apply {
                arguments = Bundle().apply {
                    putString("shopId", shopId)
                    putString("customerId", customerId)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        shopId = arguments?.getString("shopId") ?: ""
        customerId = arguments?.getString("customerId") ?: ""
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCustomerLedgerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvCustomerLedger.layoutManager = LinearLayoutManager(requireContext())

        binding.swipeRefreshCustomerLedger.setColorSchemeResources(
            android.R.color.holo_blue_bright,
            android.R.color.holo_purple
        )
        binding.swipeRefreshCustomerLedger.setOnRefreshListener {
            HapticUtil.tap(binding.swipeRefreshCustomerLedger)
            loadData()
        }

        loadData()
    }

    private fun loadData() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        shopkeeperProfile = activity.sessionManager.getProfile()

        if (shopId.isEmpty() && shopkeeperProfile != null) {
            shopId = shopkeeperProfile!!.id
        }

        binding.swipeRefreshCustomerLedger.isRefreshing = true

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // 1. Fetch target customer profile
                val profiles = SupabaseService.getProfiles(listOf(customerId), token)
                val customer = profiles.firstOrNull()
                customerProfile = customer

                // 2. Fetch specific balance between this shopkeeper and customer
                val due = SupabaseService.balanceFor(shopId, customerId, token)
                currentDue = due

                // 3. Fetch specific ledger transactions for this customer
                val rows = SupabaseService.getLedger(shopId, customerId, token)
                ledgerRows = rows

                if (_binding == null) return@launch
                binding.swipeRefreshCustomerLedger.isRefreshing = false

                val shopName = shopkeeperProfile?.shop_name ?: shopkeeperProfile?.full_name ?: "দোকান"
                val shopCode = shopkeeperProfile?.shop_code ?: ""
                val customerName = customer?.full_name ?: "কাস্টমার"
                val customerPhone = customer?.phone ?: "নম্বর নেই"

                // 4. Bind Customer Profile Header
                binding.tvCustomerName.text = customerName
                binding.tvCustomerPhone.text = customerPhone

                val initial = if (customerName.isNotBlank()) customerName.first().toString() else "ক"
                binding.tvCustomerAvatarInitials.text = initial
                ImageLoader.loadCircular(
                    imageView = binding.ivCustomerAvatar,
                    url = customer?.avatar_url,
                    fallbackView = binding.tvCustomerAvatarInitials,
                    initials = initial
                )

                // Call Action
                binding.btnCallCustomer.setOnClickListener {
                    HapticUtil.tap(it)
                    ShareUtil.makePhoneCall(requireContext(), customer?.phone)
                }

                // WhatsApp Reminder Action
                binding.btnSendReminder.setOnClickListener {
                    HapticUtil.tap(it)
                    if (customer != null) {
                        showReminderOptions(customer, due, shopName)
                    }
                }

                // 5. Calculate and Bind Financial Summary
                val totalCredit = rows.filter { it.kind == "credit" && it.status == "confirmed" }.sumOf { it.amount }
                val totalPaid = rows.filter { it.kind == "payment" && it.status == "confirmed" }.sumOf { it.amount }

                binding.tvTotalCreditTaken.text = "৳${Calc.money(totalCredit)}"
                binding.tvTotalPaidAmount.text = "৳${Calc.money(totalPaid)}"

                if (due > 0) {
                    binding.tvDueStatusBadge.text = "মোট বাকি"
                    binding.tvDueStatusBadge.setBackgroundResource(R.drawable.bg_badge_rose)
                    binding.tvDueStatusBadge.setTextColor(Color.parseColor("#E11D48"))
                    binding.tvCurrentDueAmount.setTextColor(Color.parseColor("#E11D48"))
                    binding.tvCurrentDueAmount.text = "৳${Calc.money(due)}"
                } else {
                    binding.tvDueStatusBadge.text = "পরিশোধিত"
                    binding.tvDueStatusBadge.setBackgroundResource(R.drawable.bg_badge_emerald)
                    binding.tvDueStatusBadge.setTextColor(Color.parseColor("#047857"))
                    binding.tvCurrentDueAmount.setTextColor(Color.parseColor("#047857"))
                    binding.tvCurrentDueAmount.text = "৳০"
                }

                // 6. PDF Statement Export
                binding.btnExportPdf.setOnClickListener {
                    HapticUtil.tap(it)
                    PdfReceiptGenerator.generateAndShareStatement(
                        context = requireContext(),
                        shopName = shopName,
                        shopCode = shopCode,
                        shopPhone = shopkeeperProfile?.phone,
                        customerName = customerName,
                        customerPhone = customer?.phone,
                        records = rows,
                        currentDue = due
                    )
                }

                // 7. Bind Transactions RecyclerView
                binding.tvTransactionCount.text = "${Calc.toBengaliNumerals(rows.size.toString())}টি লেনদেন"

                if (rows.isEmpty()) {
                    binding.layoutEmptyLedger.visibility = View.VISIBLE
                    binding.rvCustomerLedger.visibility = View.GONE
                } else {
                    binding.layoutEmptyLedger.visibility = View.GONE
                    binding.rvCustomerLedger.visibility = View.VISIBLE
                    binding.rvCustomerLedger.adapter = LedgerAdapter(
                        items = rows,
                        shopName = shopName,
                        shopCode = shopCode,
                        customerName = customerName,
                        currentDue = due,
                        onShareSlip = { r, dateStr ->
                            ShareUtil.shareVoucher(
                                requireContext(),
                                shopName = shopName,
                                shopCode = shopCode,
                                customerName = customerName,
                                itemName = if (r.kind == "credit") r.item_name ?: "বাকি" else "পরিশোধ",
                                quantity = r.quantity,
                                amount = r.amount,
                                dateFormatted = dateStr,
                                totalDue = due
                            )
                        }
                    )
                }

            } catch (e: Exception) {
                if (_binding != null) {
                    binding.swipeRefreshCustomerLedger.isRefreshing = false
                    Toast.makeText(context, "ডাটা লোড ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun showReminderOptions(customer: Profile, due: Double, shopName: String) {
        val dialog = BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.dialog_reminder_options, null)
        dialog.setContentView(view)

        val customerName = customer.full_name ?: "কাস্টমার"
        view.findViewById<android.widget.TextView>(R.id.tvReminderCustomerTitle)?.text = "$customerName-কে তাগাদা পাঠান"
        view.findViewById<android.widget.TextView>(R.id.tvReminderCustomerSubtitle)?.text = "বর্তমান বকেয়া: ৳${Calc.money(due)}"

        view.findViewById<View>(R.id.btnReminderGentle)?.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            ShareUtil.sendWhatsAppReminder(requireContext(), customer.phone, customerName, shopName, due, ReminderType.GENTLE)
        }

        view.findViewById<View>(R.id.btnReminderUrgent)?.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            ShareUtil.sendWhatsAppReminder(requireContext(), customer.phone, customerName, shopName, due, ReminderType.URGENT)
        }

        view.findViewById<View>(R.id.btnReminderStatement)?.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            ShareUtil.sendWhatsAppReminder(requireContext(), customer.phone, customerName, shopName, due, ReminderType.STATEMENT)
        }

        view.findViewById<View>(R.id.btnCancelReminderDialog)?.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
