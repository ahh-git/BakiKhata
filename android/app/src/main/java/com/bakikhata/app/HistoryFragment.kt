package com.bakikhata.app

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bakikhata.app.databinding.FragmentHistoryBinding
import com.bakikhata.app.databinding.ItemLedgerRowBinding
import kotlinx.coroutines.launch

class HistoryFragment : Fragment() {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!

    private var shopId: String = ""
    private var isShopkeeper: Boolean = false

    companion object {
        fun newInstance(shopId: String, isShopkeeper: Boolean = false): HistoryFragment {
            return HistoryFragment().apply {
                arguments = Bundle().apply {
                    putString("shopId", shopId)
                    putBoolean("isShopkeeper", isShopkeeper)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        shopId = arguments?.getString("shopId") ?: ""
        isShopkeeper = arguments?.getBoolean("isShopkeeper") ?: false
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvLedger.layoutManager = LinearLayoutManager(requireContext())

        if (isShopkeeper) {
            binding.layoutTotalDueCard.visibility = View.GONE
        }

        binding.btnHistoryAddMore.setOnClickListener {
            HapticUtil.tap(it)
            (requireActivity() as? MainActivity)?.navigateToAddBaki(shopId)
        }

        loadData()
    }

    private fun loadData() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return
        val userProfile = activity.sessionManager.getProfile()

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val profiles = SupabaseService.getProfiles(listOf(shopId), token)
                val shop = profiles.firstOrNull()
                val shopName = shop?.shop_name ?: "দোকান"
                val shopCode = shop?.shop_code ?: ""

                binding.tvHistoryShopName.text = shopName
                binding.tvHistoryShopDetails.text = "আইডি $shopCode · নম্বর ${shop?.phone ?: "—"}"

                var currentDue: Double? = null
                if (!isShopkeeper) {
                    val due = SupabaseService.balanceFor(shopId, userId, token)
                    currentDue = due
                    binding.tvHistoryTotalDue.text = "৳${Calc.money(due)}"
                    binding.layoutTotalDueCard.visibility = View.VISIBLE
                }

                val customerId = if (isShopkeeper) null else userId
                val rows = SupabaseService.getLedger(shopId, customerId, token)

                if (rows.isEmpty()) {
                    binding.tvEmptyLedger.visibility = View.VISIBLE
                    binding.rvLedger.visibility = View.GONE
                } else {
                    binding.tvEmptyLedger.visibility = View.GONE
                    binding.rvLedger.visibility = View.VISIBLE
                    binding.rvLedger.adapter = LedgerAdapter(
                        rows,
                        shopName = shopName,
                        shopCode = shopCode,
                        customerName = userProfile?.full_name,
                        currentDue = currentDue,
                        onShareSlip = { r, dateStr ->
                            ShareUtil.shareVoucher(
                                requireContext(),
                                shopName = shopName,
                                shopCode = shopCode,
                                customerName = userProfile?.full_name,
                                itemName = if (r.kind == "credit") r.item_name ?: "বাকি" else "পরিশোধ",
                                quantity = r.quantity,
                                amount = r.amount,
                                dateFormatted = dateStr,
                                totalDue = currentDue
                            )
                        }
                    )
                }
            } catch (e: Exception) {
                binding.tvEmptyLedger.visibility = View.VISIBLE
                binding.tvEmptyLedger.text = "ত্রুটি: ${e.message}"
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class LedgerAdapter(
    private val items: List<LedgerRow>,
    private val shopName: String,
    private val shopCode: String,
    private val customerName: String?,
    private val currentDue: Double?,
    private val onShareSlip: (LedgerRow, String) -> Unit
) : RecyclerView.Adapter<LedgerAdapter.VH>() {

    class VH(val binding: ItemLedgerRowBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemLedgerRowBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val r = items[position]
        val b = holder.binding
        val t = Format.banglaParts(r.created_at)
        val formattedDate = "${t.date} · ${t.weekday} ${t.hour}:${t.minute}"

        b.tvLedgerItemTitle.text = if (r.kind == "credit") r.item_name ?: "বাকি" else "পরিশোধ"

        val qtyPart = if (r.quantity != null) "${Calc.toBengaliNumerals(r.quantity.toInt().toString())}টি · " else ""
        val exprPart = if (!r.expression.isNullOrEmpty()) "হিসাব: ${r.expression}" else ""
        b.tvLedgerQtyExpr.text = "$qtyPart$exprPart"
        b.tvLedgerQtyExpr.visibility = if (qtyPart.isEmpty() && exprPart.isEmpty()) View.GONE else View.VISIBLE

        val prefix = if (r.kind == "payment") "−" else "+"
        b.tvLedgerAmount.text = "$prefix৳${Calc.money(r.amount)}"
        if (r.kind == "payment") {
            b.tvLedgerAmount.setTextColor(Color.parseColor("#047857"))
        } else {
            b.tvLedgerAmount.setTextColor(Color.parseColor("#0F172A"))
        }

        b.tvLedgerTimestamp.text = formattedDate

        when (r.status) {
            "pending" -> {
                b.tvLedgerStatusBadge.text = "অপেক্ষায়"
                b.tvLedgerStatusBadge.setBackgroundResource(R.drawable.bg_badge_amber)
                b.tvLedgerStatusBadge.setTextColor(Color.parseColor("#B45309"))
            }
            "rejected" -> {
                b.tvLedgerStatusBadge.text = "বাতিল"
                b.tvLedgerStatusBadge.setBackgroundResource(R.drawable.bg_badge_rose)
                b.tvLedgerStatusBadge.setTextColor(Color.parseColor("#E11D48"))
            }
            else -> {
                b.tvLedgerStatusBadge.text = "নিশ্চিত"
                b.tvLedgerStatusBadge.setBackgroundResource(R.drawable.bg_badge_emerald)
                b.tvLedgerStatusBadge.setTextColor(Color.parseColor("#047857"))
            }
        }

        b.btnShareLedgerRow.setOnClickListener {
            HapticUtil.tap(it)
            onShareSlip(r, formattedDate)
        }
    }
}
