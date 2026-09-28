package com.bakikhata.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bakikhata.app.databinding.FragmentCustomerHomeBinding
import com.bakikhata.app.databinding.ItemCustomerShopCardBinding
import kotlinx.coroutines.launch

class CustomerHomeFragment : Fragment() {
    private var _binding: FragmentCustomerHomeBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCustomerHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvShops.layoutManager = LinearLayoutManager(requireContext())
        binding.btnEmptyJoin.setOnClickListener {
            HapticUtil.tap(it)
            (requireActivity() as? MainActivity)?.navigateToJoin()
        }

        binding.fabJoinShop.setOnClickListener {
            HapticUtil.tap(it)
            (requireActivity() as? MainActivity)?.navigateToJoin()
        }

        // Pull-to-refresh
        binding.swipeRefresh.setColorSchemeResources(
            android.R.color.holo_blue_bright,
            android.R.color.holo_purple
        )
        binding.swipeRefresh.setOnRefreshListener {
            HapticUtil.tap(binding.swipeRefresh)
            loadData()
        }

        loadData()
    }

    fun loadData() {
        if (_binding == null) return
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        binding.progressShops.visibility = View.VISIBLE
        binding.layoutEmptyShops.visibility = View.GONE
        binding.rvShops.visibility = View.GONE
        binding.layoutSummary.visibility = View.GONE
        binding.fabJoinShop.visibility = View.GONE

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val shopIds = SupabaseService.getCustomerShopLinks(userId, token)
                if (shopIds.isEmpty()) {
                    if (_binding == null) return@launch
                    binding.progressShops.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    binding.layoutEmptyShops.visibility = View.VISIBLE
                    binding.fabJoinShop.visibility = View.GONE
                    return@launch
                }

                val shops = SupabaseService.getProfiles(shopIds, token)
                val cards = mutableListOf<ShopCard>()
                var totalDue = 0.0
                var totalPending = 0.0
                for (shop in shops) {
                    val due = SupabaseService.balanceFor(shop.id, userId, token)
                    val pending = SupabaseService.getPendingPaymentsAmount(shop.id, userId, token)
                    cards.add(ShopCard(shop, due, pending))
                    totalDue += due
                    totalPending += pending
                }

                if (_binding == null) return@launch
                binding.progressShops.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false

                // Show summary card with smooth animations
                binding.layoutSummary.visibility = View.VISIBLE
                NumberAnimUtil.animateMoney(binding.tvTotalDue, totalDue)
                NumberAnimUtil.animateCount(binding.tvShopCount, cards.size)
                NumberAnimUtil.animateMoney(binding.tvTotalPending, totalPending)

                if (cards.isEmpty()) {
                    binding.layoutEmptyShops.visibility = View.VISIBLE
                    binding.fabJoinShop.visibility = View.GONE
                } else {
                    binding.rvShops.visibility = View.VISIBLE
                    binding.fabJoinShop.visibility = View.VISIBLE
                    binding.rvShops.adapter = ShopCardAdapter(cards) { action, shopCard ->
                        when (action) {
                            "history" -> (requireActivity() as? MainActivity)?.navigateToHistory(shopCard.shop.id)
                            "add" -> (requireActivity() as? MainActivity)?.navigateToAddBaki(shopCard.shop.id)
                            "pay" -> (requireActivity() as? MainActivity)?.navigateToPay(shopCard.shop.id)
                        }
                    }
                }
            } catch (e: Exception) {
                if (_binding == null) return@launch
                binding.progressShops.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
                Toast.makeText(context, "ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class ShopCardAdapter(
    private val items: List<ShopCard>,
    private val onAction: (String, ShopCard) -> Unit
) : RecyclerView.Adapter<ShopCardAdapter.VH>() {

    class VH(val binding: ItemCustomerShopCardBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemCustomerShopCardBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val card = items[position]
        val b = holder.binding
        b.tvShopCode.text = "আইডি ${card.shop.shop_code}"
        b.tvShopName.text = card.shop.shop_name ?: card.shop.full_name ?: "দোকান"
        b.tvDueAmount.text = "৳${Calc.money(card.due)}"
        if (card.pending > 0) {
            b.tvPendingNotice.visibility = View.VISIBLE
            b.tvPendingNotice.text = "কনফার্মের অপেক্ষায় ৳${Calc.money(card.pending)}"
        } else {
            b.tvPendingNotice.visibility = View.GONE
        }
        b.btnCardHistory.setOnClickListener {
            HapticUtil.tap(it)
            onAction("history", card)
        }
        b.btnCardAddBaki.setOnClickListener {
            HapticUtil.tap(it)
            onAction("add", card)
        }
        b.btnCardPay.setOnClickListener {
            HapticUtil.tap(it)
            onAction("pay", card)
        }
    }
}
