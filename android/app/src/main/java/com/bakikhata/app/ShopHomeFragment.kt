package com.bakikhata.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.bakikhata.app.databinding.FragmentShopHomeBinding
import com.bakikhata.app.databinding.ItemPendingApprovalBinding
import kotlinx.coroutines.launch

data class PendingPaymentItem(
    val row: LedgerRow,
    val customer: Profile?
)

class ShopHomeFragment : Fragment() {
    private var _binding: FragmentShopHomeBinding? = null
    private val binding get() = _binding!!
    private val pendingList = mutableListOf<PendingPaymentItem>()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentShopHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.rvPendingApprovals.layoutManager = LinearLayoutManager(requireContext())

        binding.swipeRefresh.setColorSchemeResources(
            android.R.color.holo_blue_bright,
            android.R.color.holo_purple
        )
        binding.swipeRefresh.setOnRefreshListener {
            HapticUtil.tap(binding.swipeRefresh)
            loadData()
        }

        val activity = requireActivity() as? MainActivity
        val profile = activity?.sessionManager?.getProfile()

        // Setup Shopkeeper Code, QR & Share buttons
        binding.btnViewQr.setOnClickListener {
            HapticUtil.tap(it)
            showQrDialog()
        }

        binding.btnCopyCode.setOnClickListener {
            HapticUtil.success(it)
            val code = profile?.shop_code ?: binding.tvShopkeeperCode.text.toString()
            copyToClipboard(code)
        }

        binding.btnShareInvite.setOnClickListener {
            HapticUtil.tap(it)
            val code = profile?.shop_code ?: ""
            val shopName = profile?.shop_name ?: profile?.full_name ?: "দোকান"
            ShareUtil.shareShopInvite(requireContext(), code, shopName)
        }

        binding.btnQuickKhata.setOnClickListener {
            HapticUtil.tap(it)
            (activity?.findViewById<View>(R.id.bottomNav) as? com.google.android.material.bottomnavigation.BottomNavigationView)?.selectedItemId = R.id.nav_book
        }

        binding.btnQuickReminder.setOnClickListener {
            HapticUtil.tap(it)
            (activity?.findViewById<View>(R.id.bottomNav) as? com.google.android.material.bottomnavigation.BottomNavigationView)?.selectedItemId = R.id.nav_book
        }

        loadData()
    }

    private fun showQrDialog() {
        val activity = requireActivity() as? MainActivity ?: return
        val profile = activity.sessionManager.getProfile() ?: return
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
            copyToClipboard(shopCode)
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

    private fun copyToClipboard(text: String) {
        val clipboard = requireContext().getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText("Shop Code", text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(requireContext(), "দোকান কোড কপি হয়েছে: $text", Toast.LENGTH_SHORT).show()
    }

    fun loadData() {
        if (_binding == null) return
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val profile = activity.sessionManager.getProfile() ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val customerIds = SupabaseService.getShopkeeperCustomerLinks(profile.id, token)
                var totalDue = 0.0
                for (cid in customerIds) {
                    totalDue += SupabaseService.balanceFor(profile.id, cid, token)
                }

                val pendingRows = SupabaseService.getPendingPaymentsForShop(profile.id, token)
                val pendingTotal = pendingRows.sumOf { it.amount }

                // Fetch customer profiles for who requested payment!
                val pendingCustomerIds = pendingRows.map { it.customer_id }.distinct()
                val customerMap = if (pendingCustomerIds.isNotEmpty()) {
                    SupabaseService.getProfiles(pendingCustomerIds, token).associateBy { it.id }
                } else {
                    emptyMap()
                }

                if (_binding == null) return@launch
                binding.swipeRefresh.isRefreshing = false

                // Animate numbers smoothly
                NumberAnimUtil.animateMoney(binding.tvStatDue, totalDue)
                NumberAnimUtil.animateCount(binding.tvStatCustomers, customerIds.size)
                NumberAnimUtil.animateMoney(binding.tvStatPending, pendingTotal)

                binding.tvShopWelcome.text = profile.shop_name ?: "দোকানের ড্যাশবোর্ড"
                binding.tvShopkeeperCode.text = profile.shop_code ?: "—"
                binding.tvShopkeeperPhoneNotice.text = "কাস্টমারদের এই কোড দিন। আপনার নম্বর: ${profile.phone ?: "—"}"

                pendingList.clear()
                for (row in pendingRows) {
                    pendingList.add(PendingPaymentItem(row, customerMap[row.customer_id]))
                }
                updatePendingList()
            } catch (e: Exception) {
                if (_binding != null) {
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(context, "ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun updatePendingList() {
        if (_binding == null) return
        if (pendingList.isEmpty()) {
            binding.tvEmptyPending.visibility = View.VISIBLE
            binding.rvPendingApprovals.visibility = View.GONE
            binding.tvPendingCountBadge.visibility = View.GONE
        } else {
            binding.tvEmptyPending.visibility = View.GONE
            binding.rvPendingApprovals.visibility = View.VISIBLE
            binding.tvPendingCountBadge.visibility = View.VISIBLE
            binding.tvPendingCountBadge.text = "${Calc.toBengaliNumerals(pendingList.size.toString())} টি নতুন"
            binding.rvPendingApprovals.adapter = PendingApprovalAdapter(pendingList.toList()) { id, accept ->
                decidePayment(id, accept)
            }
        }
    }

    private fun decidePayment(id: String, accept: Boolean) {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                SupabaseService.decidePayment(id, accept, token)
                pendingList.removeAll { it.row.id == id }
                updatePendingList()
                Toast.makeText(
                    context,
                    if (accept) "পেমেন্ট অনুমোদন করা হয়েছে" else "অনুরোধ বাতিল করা হয়েছে",
                    Toast.LENGTH_SHORT
                ).show()
            } catch (e: Exception) {
                Toast.makeText(context, "ব্যর্থ: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class PendingApprovalAdapter(
    private val items: List<PendingPaymentItem>,
    private val onDecide: (String, Boolean) -> Unit
) : RecyclerView.Adapter<PendingApprovalAdapter.VH>() {

    class VH(val binding: ItemPendingApprovalBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemPendingApprovalBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        val b = holder.binding

        val name = item.customer?.full_name ?: "কাস্টমার"
        b.tvPendingCustomerName.text = name
        b.tvPendingCustomerPhone.text = item.customer?.phone ?: "ফোন নম্বর নেই"

        val initial = if (name.isNotBlank()) name.first().toString() else "ক"
        b.tvPendingCustomerInitial.text = initial

        b.tvPendingAmount.text = "৳${Calc.money(item.row.amount)}"

        val t = Format.banglaParts(item.row.created_at)
        b.tvPendingTime.text = "${t.date} · ${t.weekday} ${t.clock}"
        b.tvPendingNoticeText.text = "$name ৳${Calc.money(item.row.amount)} টাকা বাকি পরিশোধের অনুরোধ পাঠিয়েছেন।"

        b.btnConfirmPayment.setOnClickListener {
            HapticUtil.success(it)
            onDecide(item.row.id, true)
        }
        b.btnRejectPayment.setOnClickListener {
            HapticUtil.tap(it)
            onDecide(item.row.id, false)
        }
    }
}
