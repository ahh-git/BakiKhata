package com.bakikhata.app

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bakikhata.app.databinding.FragmentAlertsBinding
import com.bakikhata.app.databinding.ItemAlertBinding
import kotlinx.coroutines.launch

class AlertsFragment : Fragment() {
    private var _binding: FragmentAlertsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentAlertsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.rvAlerts.layoutManager = LinearLayoutManager(requireContext())
        loadAlerts()
    }

    private fun loadAlerts() {
        val activity = requireActivity() as? MainActivity ?: return
        val token = activity.sessionManager.getAccessToken() ?: return
        val userId = activity.sessionManager.getUserId() ?: return

        viewLifecycleOwner.lifecycleScope.launch {
            val alerts = SupabaseService.getAlerts(userId, token)
            if (alerts.isEmpty()) {
                binding.tvEmptyAlerts.visibility = View.VISIBLE
                binding.rvAlerts.visibility = View.GONE
            } else {
                binding.tvEmptyAlerts.visibility = View.GONE
                binding.rvAlerts.visibility = View.VISIBLE
                binding.rvAlerts.adapter = AlertsAdapter(alerts)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class AlertsAdapter(private val items: List<Alert>) :
    RecyclerView.Adapter<AlertsAdapter.VH>() {

    class VH(val binding: ItemAlertBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(ItemAlertBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val alert = items[position]
        holder.binding.tvAlertTitle.text = alert.title
        holder.binding.tvAlertBody.text = alert.body
        val t = Format.banglaParts(alert.created_at)
        holder.binding.tvAlertTime.text = "${t.date} · ${t.weekday} · ${t.clock}"
    }
}
