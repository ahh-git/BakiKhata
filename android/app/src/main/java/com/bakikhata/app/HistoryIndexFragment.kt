package com.bakikhata.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bakikhata.app.databinding.FragmentHistoryIndexBinding
import com.bakikhata.app.databinding.ItemHistoryShopBinding
import kotlinx.coroutines.launch

class HistoryIndexFragment : Fragment() {
    private var _binding: FragmentHistoryIndexBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoryIndexBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.rvHistoryShops.layoutManager = LinearLayoutManager(requireContext())
        loadShops()
    }

    private fun loadShops() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            val shopIds = SupabaseService.getCustomerShopLinks(userId, token)
            if (shopIds.isEmpty()) {
                binding.tvEmptyHistory.visibility = View.VISIBLE
                binding.rvHistoryShops.visibility = View.GONE
                return@launch
            }

            val shops = SupabaseService.getProfiles(shopIds, token)
            if (shops.isEmpty()) {
                binding.tvEmptyHistory.visibility = View.VISIBLE
                binding.rvHistoryShops.visibility = View.GONE
            } else {
                binding.tvEmptyHistory.visibility = View.GONE
                binding.rvHistoryShops.visibility = View.VISIBLE
                binding.rvHistoryShops.adapter = HistoryShopAdapter(shops) { shopId ->
                    (requireActivity() as? MainActivity)?.navigateToHistory(shopId)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class HistoryShopAdapter(
    private val items: List<Profile>,
    private val onClick: (String) -> Unit
) : RecyclerView.Adapter<HistoryShopAdapter.VH>() {

    class VH(val binding: ItemHistoryShopBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemHistoryShopBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val shop = items[position]
        holder.binding.tvShopCode.text = "আইডি ${shop.shop_code}"
        holder.binding.tvShopName.text = shop.shop_name ?: shop.full_name ?: "দোকান"
        holder.itemView.setOnClickListener {
            HapticUtil.tap(it)
            onClick(shop.id)
        }
    }
}
