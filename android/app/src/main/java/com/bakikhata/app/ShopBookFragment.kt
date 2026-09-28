package com.bakikhata.app

import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bakikhata.app.databinding.FragmentShopBookBinding
import com.bakikhata.app.databinding.ItemShopBookCustomerBinding
import kotlinx.coroutines.launch

class ShopBookFragment : Fragment() {
    private var _binding: FragmentShopBookBinding? = null
    private val binding get() = _binding!!

    private var allCustomers = listOf<Pair<Profile, Double>>()
    private var activeFilter = FilterType.ALL
    private var searchQuery = ""

    enum class FilterType { ALL, DUE, CLEARED }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentShopBookBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.rvShopBook.layoutManager = LinearLayoutManager(requireContext())

        binding.swipeRefreshShopBook.setColorSchemeResources(
            android.R.color.holo_blue_bright,
            android.R.color.holo_purple
        )
        binding.swipeRefreshShopBook.setOnRefreshListener {
            HapticUtil.tap(binding.swipeRefreshShopBook)
            loadData()
        }

        // Search text watcher
        binding.etSearchCustomer.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                searchQuery = s?.toString()?.trim() ?: ""
                binding.btnClearSearch.visibility = if (searchQuery.isNotEmpty()) View.VISIBLE else View.GONE
                applyFilters()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        binding.btnClearSearch.setOnClickListener {
            HapticUtil.tap(it)
            binding.etSearchCustomer.setText("")
        }

        // Filter chips
        binding.chipFilterAll.setOnClickListener {
            HapticUtil.tap(it)
            setFilter(FilterType.ALL)
        }
        binding.chipFilterDue.setOnClickListener {
            HapticUtil.tap(it)
            setFilter(FilterType.DUE)
        }
        binding.chipFilterCleared.setOnClickListener {
            HapticUtil.tap(it)
            setFilter(FilterType.CLEARED)
        }

        loadData()
    }

    private fun setFilter(filter: FilterType) {
        activeFilter = filter
        val ctx = requireContext()

        // Update chips UI
        binding.chipFilterAll.background = ContextCompat.getDrawable(
            ctx,
            if (filter == FilterType.ALL) R.drawable.bg_pill_filter_active else R.drawable.bg_pill_filter_inactive
        )
        binding.chipFilterAll.setTextColor(if (filter == FilterType.ALL) Color.WHITE else Color.parseColor("#64748B"))

        binding.chipFilterDue.background = ContextCompat.getDrawable(
            ctx,
            if (filter == FilterType.DUE) R.drawable.bg_pill_filter_active else R.drawable.bg_pill_filter_inactive
        )
        binding.chipFilterDue.setTextColor(if (filter == FilterType.DUE) Color.WHITE else Color.parseColor("#64748B"))

        binding.chipFilterCleared.background = ContextCompat.getDrawable(
            ctx,
            if (filter == FilterType.CLEARED) R.drawable.bg_pill_filter_active else R.drawable.bg_pill_filter_inactive
        )
        binding.chipFilterCleared.setTextColor(if (filter == FilterType.CLEARED) Color.WHITE else Color.parseColor("#64748B"))

        applyFilters()
    }

    private fun applyFilters() {
        if (_binding == null) return

        var filtered = allCustomers

        // Apply tab filter
        filtered = when (activeFilter) {
            FilterType.ALL -> filtered
            FilterType.DUE -> filtered.filter { it.second > 0 }
            FilterType.CLEARED -> filtered.filter { it.second <= 0 }
        }

        // Apply text search
        if (searchQuery.isNotEmpty()) {
            val q = searchQuery.lowercase()
            filtered = filtered.filter { pair ->
                val name = pair.first.full_name?.lowercase() ?: ""
                val phone = pair.first.phone?.lowercase() ?: ""
                name.contains(q) || phone.contains(q)
            }
        }

        // Update UI
        if (filtered.isEmpty()) {
            binding.rvShopBook.visibility = View.GONE
            binding.layoutEmptyShopBook.visibility = View.VISIBLE
            if (searchQuery.isNotEmpty()) {
                binding.tvEmptyShopBookTitle.text = "কোনো ফলাফল পাওয়া যায়নি"
                binding.tvEmptyShopBookMsg.text = "'$searchQuery'-এর সাথে কোনো কাস্টমারের নাম বা নম্বর মেলেনি।"
            } else {
                binding.tvEmptyShopBookTitle.text = "এখনো কোনো কাস্টমার নেই"
                binding.tvEmptyShopBookMsg.text = "আপনার দোকানের কোডটি কাস্টমারদের সাথে শেয়ার করুন।"
            }
        } else {
            binding.layoutEmptyShopBook.visibility = View.GONE
            binding.rvShopBook.visibility = View.VISIBLE

            val shopName = (requireActivity() as? MainActivity)?.sessionManager?.getProfile()?.shop_name ?: "দোকান"
            binding.rvShopBook.adapter = ShopBookAdapter(filtered, shopName,
                onItemClick = { customerId ->
                    val profile = (requireActivity() as? MainActivity)?.sessionManager?.getProfile()
                    if (profile != null) {
                        (requireActivity() as? MainActivity)?.navigateToShopCustomerHistory(profile.id, customerId)
                    }
                },
                onSendReminder = { profile, due ->
                    showReminderOptions(profile, due, shopName)
                },
                onCall = { phone ->
                    ShareUtil.makePhoneCall(requireContext(), phone)
                }
            )
        }
    }

    private fun showReminderOptions(profile: Profile, due: Double, shopName: String) {
        val dialog = com.google.android.material.bottomsheet.BottomSheetDialog(requireContext())
        val view = layoutInflater.inflate(R.layout.dialog_reminder_options, null)
        dialog.setContentView(view)

        val customerName = profile.full_name ?: "কাস্টমার"
        view.findViewById<android.widget.TextView>(R.id.tvReminderCustomerTitle)?.text = "$customerName-কে তাগাদা পাঠান"
        view.findViewById<android.widget.TextView>(R.id.tvReminderCustomerSubtitle)?.text = "বর্তমান বকেয়া: ৳${Calc.money(due)}"

        view.findViewById<View>(R.id.btnReminderGentle)?.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            ShareUtil.sendWhatsAppReminder(requireContext(), profile.phone, customerName, shopName, due, ReminderType.GENTLE)
        }

        view.findViewById<View>(R.id.btnReminderUrgent)?.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            ShareUtil.sendWhatsAppReminder(requireContext(), profile.phone, customerName, shopName, due, ReminderType.URGENT)
        }

        view.findViewById<View>(R.id.btnReminderStatement)?.setOnClickListener {
            HapticUtil.tap(it)
            dialog.dismiss()
            ShareUtil.sendWhatsAppReminder(requireContext(), profile.phone, customerName, shopName, due, ReminderType.STATEMENT)
        }

        view.findViewById<View>(R.id.btnCancelReminderDialog)?.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    fun loadData() {
        if (_binding == null) return
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val profile = activity.sessionManager.getProfile() ?: return

        binding.progressShopBook.visibility = View.VISIBLE
        binding.layoutEmptyShopBook.visibility = View.GONE
        binding.rvShopBook.visibility = View.GONE

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val customerIds = SupabaseService.getShopkeeperCustomerLinks(profile.id, token)

                if (_binding == null) return@launch
                binding.progressShopBook.visibility = View.GONE
                binding.swipeRefreshShopBook.isRefreshing = false

                if (customerIds.isEmpty()) {
                    allCustomers = emptyList()
                    binding.layoutBookSummary.visibility = View.GONE
                    binding.layoutEmptyShopBook.visibility = View.VISIBLE
                    return@launch
                }

                val customers = SupabaseService.getProfiles(customerIds, token)
                val cards = mutableListOf<Pair<Profile, Double>>()
                var totalDue = 0.0
                for (c in customers) {
                    val due = SupabaseService.balanceFor(profile.id, c.id, token)
                    cards.add(c to due)
                    totalDue += due
                }

                allCustomers = cards

                // Summary pill
                binding.layoutBookSummary.visibility = View.VISIBLE
                binding.tvBookSummaryCustomerCount.text = "মোট ${Calc.toBengaliNumerals(cards.size.toString())} জন কাস্টমার"
                binding.tvBookSummaryTotalDue.text = "মোট বাকি ৳${Calc.money(totalDue)}"

                applyFilters()
            } catch (e: Exception) {
                if (_binding != null) {
                    binding.progressShopBook.visibility = View.GONE
                    binding.swipeRefreshShopBook.isRefreshing = false
                    Toast.makeText(context, "ত্রুটি: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class ShopBookAdapter(
    private val items: List<Pair<Profile, Double>>,
    private val shopName: String,
    private val onItemClick: (String) -> Unit,
    private val onSendReminder: (Profile, Double) -> Unit,
    private val onCall: (String?) -> Unit
) : RecyclerView.Adapter<ShopBookAdapter.VH>() {

    class VH(val binding: ItemShopBookCustomerBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemShopBookCustomerBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val (profile, due) = items[position]
        val b = holder.binding

        // Name and Phone
        val name = profile.full_name ?: "কাস্টমার"
        b.tvCustomerName.text = name
        b.tvCustomerPhone.text = profile.phone ?: "নম্বর নেই"

        // Customer Avatar Photo / Initials
        val initial = if (name.isNotBlank()) name.first().toString() else "ক"
        b.tvAvatarInitials.text = initial
        ImageLoader.loadCircular(
            imageView = b.ivCustomerAvatar,
            url = profile.avatar_url,
            fallbackView = b.tvAvatarInitials,
            initials = initial
        )

        // Due amount & styling
        b.tvCustomerDue.text = "৳${Calc.money(due)}"
        if (due > 0) {
            b.layoutDueBadge.setBackgroundResource(R.drawable.bg_badge_rose)
            b.tvDueLabel.text = "মোট বাকি"
            b.tvDueLabel.setTextColor(Color.parseColor("#E11D48"))
            b.tvCustomerDue.setTextColor(Color.parseColor("#E11D48"))
            b.btnSendReminder.visibility = View.VISIBLE
        } else {
            b.layoutDueBadge.setBackgroundResource(R.drawable.bg_badge_emerald)
            b.tvDueLabel.text = "পরিশোধিত"
            b.tvDueLabel.setTextColor(Color.parseColor("#047857"))
            b.tvCustomerDue.setTextColor(Color.parseColor("#047857"))
            b.btnSendReminder.visibility = View.GONE
        }

        // WhatsApp Reminder Button
        b.btnSendReminder.setOnClickListener {
            HapticUtil.tap(it)
            onSendReminder(profile, due)
        }

        // Call Button
        b.btnCallCustomer.setOnClickListener {
            HapticUtil.tap(it)
            onCall(profile.phone)
        }

        // Item root click or "হিসাব দেখুন" click -> View detailed customer ledger
        holder.itemView.setOnClickListener {
            HapticUtil.tap(it)
            onItemClick(profile.id)
        }
        b.btnViewLedger.setOnClickListener {
            HapticUtil.tap(it)
            onItemClick(profile.id)
        }
    }
}
